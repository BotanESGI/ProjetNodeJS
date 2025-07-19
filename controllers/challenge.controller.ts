import Challenge from '../services/mongoose/schema/challenge.schema';
import User from '../services/mongoose/schema/user.schema';
import Badge from '../services/mongoose/schema/badge.schema';
import {Router,Request, Response } from 'express';
import { UserRole } from '../models';
import GymRoom from '../services/mongoose/schema/gym-room.schema';
import { SessionService } from '../services/mongoose';
import { sessionMiddleware, isAdmin } from '../middlewares';
import { isOwner } from '../middlewares/isOwner.middleware';

export class ChallengeController {
    constructor(public readonly sessionService: SessionService) {}

    async getAllChallenges (req: Request, res: Response){   
        const user = req.user!;
        const challenges = await Challenge.find();
        if(user.role === UserRole.OWNER){
            const hasApprovedRoom = await GymRoom.exists({ ownerId: user._id, approved: true });
                if (hasApprovedRoom) {
                    return res.json(challenges);
                } 
                else 
                    return res.status(404).json({ message: "Accès refusé! Vous n'avez aucune salle approuvée." });        
        }
        return res.json(challenges);
    };


    //get challenges created by users only
    async getUsersChallenge(req: Request, res: Response){
    try {
        const challenges = await Challenge.find();
        const creatorIds = challenges.map(challenge => challenge.creatorId);
        const users = await User.find({ _id: { $in: creatorIds }, role: "user" });
        const userIdsSet = new Set(users.map(user => user._id.toString()));
        const filteredChallenges = challenges.filter(challenge =>
        userIdsSet.has(challenge.creatorId.toString())
        );
        return res.json(filteredChallenges);
    } catch (err) {
        return res.status(500).json({ message: "Erreur lors de la récupération des challenges." });
    }
    }

    async getChallengesByCreatorId( req: Request, res: Response){
        try {
            const id = req.params.id;
            const challenges = await Challenge.find({creatorId: id});
            if(!challenges){
                return res.status(404).json({ message: "Cet utilisateur n'a aucun challenge enregistré." });
            }
            res.json(challenges);
        }catch(err){
            res.status(500).json({message : "Erreur lors de la récupération du challenge."});
        }
    }

   async createChallenge(req: Request, res: Response){
        const user = req.user!;
        if (!user){
            res.status(500).json({message : "veuillez vous authentifier"});
        }
        if (user.role === UserRole.USER) {
            if(req.body.creatorId !== user._id.toString()){
                return res.status(403).json({ message: "Vous ne pouvez assigné un challenge à un autre user en tant qu'utilisateur." });
            } else if (req.body.participantIds && req.body.participantIds.length > 0 ) {
                return res.status(403).json({ message: "Vous ne pouvez pas assigner un challenge à d'autres participants en tant qu'utilisateur." });
            } else if (req.body.badgeRewardIds && req.body.badgeRewardIds.length > 0) {
                return res.status(403).json({ message: "Vous ne pouvez pas assigner des badges en tant qu'utilisateur." });
            } else if (req.body.gymRoomId) {
                return res.status(403).json({ message: "Vous ne pouvez pas assigner une salle de sport en tant qu'utilisateur." });
            }
            const challenge = new Challenge(req.body);
            await challenge.save();
            res.status(201).json(challenge);   
        } else if ( user.role === UserRole.ADMIN){
                const challenge = new Challenge(req.body);
                await challenge.save();
                res.status(201).json(challenge);
        } else if (user.role === UserRole.OWNER) {  
            const hasApprovedRoom = await GymRoom.exists({ ownerId: user._id, approved: true });
                if (hasApprovedRoom) {
                    const challenge = new Challenge(req.body);
                    await challenge.save();
                    res.status(201).json(challenge);
                } 
                else {
                    return res.status(404).json({ message: "Accès refusé : vous n'avez pas le droit pour le moment de créer des challenges." });
                }
            }
        return res.status(403).json({ message: "Accès refusé : vous n'avez pas le droit pour le moment de créer des challenges." });       
    };

    async updateChallenge(req: Request, res: Response){
        try {
        const { id } = req.params;
        const challenge = await Challenge.findById(id);
        if (!challenge) {
        return res.status(404).json({ message: "Challenge non trouvé" });
        }
        const user = req.user;
        const creator = await User.findById(challenge.creatorId);
        if(!creator){
            return res.status(403).json({ message: "créateur inconnu." });
        }
        if(!user){
            return res.status(403).json({ message: "Veuillez vous authentifier." });
        } else if ( user.role === UserRole.USER && creator._id.equals(user._id) ){
            const updated = await Challenge.findByIdAndUpdate(id, req.body, { new: true });
            if (updated && updated.status === 'completed' && updated.creatorId) {
            await this.checkAndAwardBadges(updated.creatorId.toString());
            }
            res.json(updated);
        } else if (user.role === UserRole.ADMIN) {
            const updated = await Challenge.findByIdAndUpdate(id, req.body, { new: true });
            if (updated && updated.status === 'completed' && updated.creatorId) {
            await this.checkAndAwardBadges(updated.creatorId.toString());
            }
            res.json(updated);
        } else {
            return res.status(403).json({ message: "Vous n'etes pas autorisé à modifier ce challenge." });
        }
    } catch (err) {
        res.status(500).json({ message: "Erreur lors de la mise à jour du challenge." });
    }
    };

    async deleteChallenge(req: Request, res: Response){
        try{
            const user =req.user!;
            const id = req.params.id;
            const challenge = await Challenge.findById(id);
            if (!challenge) {
                return res.status(404).json({ message: "Challenge non trouvé" });
            }
            if (user.role !== UserRole.ADMIN && challenge.creatorId.toString() !== user._id.toString()) {
                return res.status(403).json({ message: "Accès refusé : vous n'êtes pas autorisé à supprimer ce challenge." });
            }   
            await Challenge.findByIdAndDelete(req.params.id);
            res.status(204).end();
        }catch (err) {
            res.status(500).json({ message: "Erreur lors de la suppression du challenge." });
        }
    };

    //  Vérifie les règles et ajoute les badges si nécessaire
    async checkAndAwardBadges(userId: string): Promise<void> {
        const user = await User.findById(userId).populate("badges");
        if (!user) return;

        const allBadges = await Badge.find();
        const earnedBadgeIds = user.badges.map((b: any) => b._id.toString());

        for (const badge of allBadges) {
            if (earnedBadgeIds.includes(badge._id.toString())) continue;

            if (badge.rule.startsWith("challenges_completed_")) {
                const target = parseInt(badge.rule.split("_").pop() || "0");
                const completedCount = await Challenge.countDocuments({ userId, status: "completed" });

                if (completedCount >= target) {
                    user.badges.push(badge._id);
                    console.log(`Badge attribué : ${badge.name}`);
                }
            }
        }

        await user.save();
    }

    buildRouter(): Router {
        const router = Router();

        router.get(
                '/',
                sessionMiddleware(this.sessionService),
                this.getAllChallenges.bind(this)
        );

        router.get(
                '/:id',
                sessionMiddleware(this.sessionService),
                this.getChallengesByCreatorId.bind(this)
        );

        router.get(
                '/users',
                sessionMiddleware(this.sessionService),
                this.getUsersChallenge.bind(this)
        );

        router.post(
                '/',
                sessionMiddleware(this.sessionService),
                this.createChallenge.bind(this)
        );

        router.put(
                '/:id',
                sessionMiddleware(this.sessionService),
                this.updateChallenge.bind(this)
        );

        router.delete(
                '/:id',
                sessionMiddleware(this.sessionService),
                this.deleteChallenge.bind(this)
        );
     return router;
    }
}
