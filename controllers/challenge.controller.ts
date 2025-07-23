import Challenge from '../services/mongoose/schema/challenge.schema';
import User from '../services/mongoose/schema/user.schema';
import Badge from '../services/mongoose/schema/badge.schema';
import {Router,Request, Response } from 'express';
import { UserRole } from '../models';
import GymRoom from '../services/mongoose/schema/gym-room.schema';
import { SessionService } from '../services/mongoose';
import { sessionMiddleware, isAdmin } from '../middlewares';
import Reward from '../services/mongoose/schema/reward.schema';
import mongoose from "mongoose";

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
        const user = req.user!;
        try {
            const users = await User.find({ role: "user" }, { _id: 1 });
            const userIds = users.map(u => u._id);
            const challenges = await Challenge.find({ creatorId: { $in: userIds } });
            if(user.role === UserRole.OWNER){
            const hasApprovedRoom = await GymRoom.exists({ ownerId: user._id, approved: true });
                if (hasApprovedRoom) {
                    return res.json(challenges);
                } 
                else 
                    return res.status(404).json({ message: "Accès refusé! Vous n'avez aucune salle approuvée." });        
                }
            return res.json(challenges);
            } catch (err) {
            return res.status(500).json({ message: "Erreur lors de la récupération des challenges créés par les utilisateurs." });
        }   
    } 

    async getChallengesByCreatorId( req: Request, res: Response){
        try {
            const id = req.params.id;
            const challenges = await Challenge.find({creatorId: id});
            if(!challenges){
                return res.status(404).json({ message: "Cet utilisateur n'a aucun challenge enregistré." });
            }
            return res.json(challenges);
        }catch(err){
            return res.status(500).json({message : "Erreur lors de la récupération du challenge."});
        }
    }

   async createChallenge(req: Request, res: Response){
        const user = req.user!;
        if (!user){
            res.status(500).json({message : "veuillez vous authentifier"});
        }
        if (user.role === UserRole.USER) {
            if (req.body.participantIds && req.body.participantIds.length > 0 ) {
                return res.status(403).json({ message: "Vous ne pouvez pas assigner un challenge à d'autres participants en tant qu'utilisateur." });
            } else if (req.body.badgeRewardIds && req.body.badgeRewardIds.length > 0) {
                return res.status(403).json({ message: "Vous ne pouvez pas assigner des badges en tant qu'utilisateur." });
            } else if (req.body.gymRoomId) {
                return res.status(403).json({ message: "Vous ne pouvez pas assigner une salle de sport en tant qu'utilisateur." });
            }

            if(!req.body.creatorId){
                req.body.creatorId = user._id;
                const challenge = new Challenge(req.body);
                await challenge.save();
                return res.status(201).json(challenge);  
            } 
        } else if ( user.role === UserRole.ADMIN){
                const challenge = new Challenge(req.body);
                await challenge.save();
                return res.status(201).json(challenge);
        } else if (user.role === UserRole.OWNER) {  
            const hasApprovedRoom = await GymRoom.exists({ ownerId: user._id, approved: true });
                if (hasApprovedRoom) {
                    const { title, description, duration, gymRoomId } = req.body;

if (!gymRoomId || !mongoose.Types.ObjectId.isValid(gymRoomId)) {
    return res.status(400).json({ message: "ID de salle invalide ou manquant." });
}

// Vérifie si la salle appartient bien à ce propriétaire
const gymRoom = await GymRoom.findOne({ _id: gymRoomId, ownerId: user._id, approved: true });
if (!gymRoom) {
    return res.status(403).json({ message: "Salle non trouvée ou non approuvée pour ce propriétaire." });
}

const challenge = new Challenge({
    title,
    description,
    duration,
    gymRoom: gymRoomId,
    owner: user._id,
    creatorId: user._id
});

await challenge.save();
return res.status(201).json(challenge);

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
            const user = req.user!;
            const creator = await User.findById(challenge.creatorId);
            if(!creator){
                return res.status(403).json({ message: "créateur inconnu." });
            }
            if ( user.role === UserRole.USER && creator._id.equals(user._id) ){
                if(
                    (req.body.creatorId && req.body.creatorId !== user._id.toString()) ||
                    (req.body.badgeRewardIds && req.body.badgeRewardIds.length > 0) ||
                    (req.body.participantIds && req.body.participantIds.length > 0) ||
                    (req.body.gymRoomId)
                ){
                    return res.status(403).json({message:"Autorisation requise pour modifier ce champs."});
                }
                const updated = await Challenge.findByIdAndUpdate(id, req.body, { new: true });
                if (updated && updated.status === 'completed' && updated.creatorId) {
                        //await this.checkAndAwardRewards(updated.creatorId.toString()); // 

                await this.checkAndAwardBadges(updated.creatorId.toString());
                }
                return res.json(updated);
            } else if (user.role === UserRole.ADMIN) {
                const updated = await Challenge.findByIdAndUpdate(id, req.body, { new: true });
                if (updated && updated.status === 'completed' && updated.creatorId) {
                      //  await this.checkAndAwardRewards(updated.creatorId.toString()); // 

                await this.checkAndAwardBadges(updated.creatorId.toString());
                }
                return res.json(updated);
            } else {
                return res.status(403).json({ message: "Vous n'etes pas autorisé à modifier ce challenge." });
            }
        } catch (err) {
            return res.status(500).json({ message: "Erreur lors de la mise à jour du challenge." });
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
            return res.status(204).end();
        }catch (err) {
            return res.status(500).json({ message: "Erreur lors de la suppression du challenge." });
        }
    };

    async filterChallengesByDuration(req: Request, res: Response) {
        try {
            const min = parseInt(req.query.min as string, 10) || 0;
            const max = parseInt(req.query.max as string, 10) || Number.MAX_SAFE_INTEGER;
            const challenges = await Challenge.find({
                duration: { $gte: min, $lte: max }
            });
            return res.json(challenges);
        } catch (err) {
            return res.status(500).json({ message: "Erreur lors du filtrage par durée." });
        }
    }

    async filterChallengesByExerciseType(req: Request, res: Response) {
        try {
            const exerciseTypeId = req.params.exerciseTypeId;
            const challenges = await Challenge.find({
                exerciseTypeIds: exerciseTypeId
            });
            return res.json(challenges);
        } catch (err) {
            return res.status(500).json({ message: "Erreur lors du filtrage par type d'exercice." });
        }
    }

    async filterChallengesByDifficulty(req: Request, res: Response) {
        try {
            const difficulty = req.query.difficulty as string;
            const challenges = await Challenge.find({ difficulty });
            if( challenges.length === 0) {
                return res.status(404).json({ message: "Aucun challenge trouvé pour cette difficulté." });
            }
            return res.json(challenges);
        } catch (err) {
            return res.status(500).json({ message: "Erreur lors du filtrage par difficulté." });
        }
    }

    async inviteParticipants(req: Request, res: Response) {
        const challengeId = req.params.id;
        if(!challengeId){
            return res.status(400).json({ message: "ID de challenge manquant." });
        }
        const participantIds = req.body.participantIds;
        if (!participantIds || !Array.isArray(participantIds) || participantIds.length === 0) {
            return res.status(400).json({ message: "Liste des participants requise." });
        }
        const user = req.user!;
        const challenge = await Challenge.findById(challengeId);
        if (!challenge) {
            return res.status(404).json({ message: "Challenge non trouvé." });
        }
        const creator = await User.findById(challenge.creatorId);
        if (!creator) {
            return res.status(404).json({ message: "Créateur du challenge non trouvé." });
        }
        if (user.role === UserRole.USER && ( creator._id.toString() !== user._id.toString() || ( challenge.participantIds.length > 0 && !challenge.participantIds.includes(new mongoose.Types.ObjectId(user._id))))) {
            return res.status(403).json({ message: "Vous n'êtes pas autorisé à inviter des participants." });
        }
        const validObjectIds = participantIds.filter(id => mongoose.Types.ObjectId.isValid(id));

        if (validObjectIds.length === 0) {
            return res.status(400).json({ message: "Aucun participantId n'est un ObjectId valide." });
        }

        const validParticipants = await User.find({ _id: { $in: validObjectIds } });

        if (validParticipants.length === 0) {
            return res.status(404).json({ message: "Aucun participant valide trouvé." });
        }

        let invitationsEnvoyees = 0;

        for (const participant of validParticipants) {
            const dejaInvite = participant.invitations?.some(inv => inv.challengeId.toString() === challengeId && inv.status === "pending");
            if (dejaInvite) continue;

            participant.invitations = participant.invitations || [];
            participant.invitations.push({
                challengeId,
                status: "pending",
                invitedAt: new Date()
            });

            await participant.save();
            invitationsEnvoyees++;
        }
        return res.status(200).json({ message: `${invitationsEnvoyees} invitation(s) envoyée(s) !` });
    }

    async markAsCompleted(req: Request, res: Response) {
        const challengeId = req.params.id;
        const userId = req.user?._id;

        if (!challengeId || !userId) {
            return res.status(400).json({ message: "Challenge ID ou utilisateur non valide" });
        }

        const challenge = await Challenge.findById(challengeId);
        if (!challenge) {
            return res.status(404).json({ message: "Challenge non trouvé" });
        }

        // Vérifie si l'utilisateur est déjà dans completedBy
        if (challenge.completedBy.includes(new mongoose.Types.ObjectId(userId))) {
            return res.status(409).json({ message: "Challenge déjà marqué comme terminé" });
        }

        challenge.completedBy.push(new mongoose.Types.ObjectId(userId));
        challenge.status = 'completed'; 
            await challenge.save();
       // await this.checkAndAwardRewards(userId.toString());//

            return res.status(200).json({ message: "Challenge marqué comme terminé", challenge });
    }


  /*  async checkAndAwardRewards(userId: string): Promise<void> {
        const user = await User.findById(userId).populate("rewards");
        if (!user) return;

        const allRewards = await Reward.find();
        const earnedRewardIds = user.rewards.map((r: any) => r._id.toString());

        const completedCount = await Challenge.countDocuments({ creatorId: userId, status: "completed" });

        for (const reward of allRewards) {
            if (earnedRewardIds.includes(reward._id.toString())) continue;

            const match = reward.condition.match(/^completed_challenges\s*>=\s*(\d+)$/);
            if (match) {
            const target = parseInt(match[1]);
            if (completedCount >= target) {
                user.rewards.push(reward._id);
                console.log(` Récompense attribuée automatiquement : ${reward.title}`);
            }
            }
        }

        await user.save();
    }*/

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
                '/users',
                sessionMiddleware(this.sessionService),
                this.getUsersChallenge.bind(this)
        );

         router.get(
            '/filter/duration', 
            sessionMiddleware(this.sessionService), 
            this.filterChallengesByDuration.bind(this)
        );

        router.get(
            '/filter/difficulty', 
            sessionMiddleware(this.sessionService), 
            this.filterChallengesByDifficulty.bind(this)
        );
        
        router.get(
            '/filter/exercisetype/:exerciseTypeId', 
            sessionMiddleware(this.sessionService), 
            this.filterChallengesByExerciseType.bind(this)
        );

         router.post(
            '/complete/:id',
            sessionMiddleware(this.sessionService),
            this.markAsCompleted.bind(this)
        );

        router.patch(
            '/invite/:id',
            sessionMiddleware(this.sessionService),
            this.inviteParticipants.bind(this)
        );

         router.get(
                '/:id',
                sessionMiddleware(this.sessionService),
                this.getChallengesByCreatorId.bind(this)
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
