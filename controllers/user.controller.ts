import { Router, Request, Response, json } from 'express';
import User from '../services/mongoose/schema/user.model';
import { sessionMiddleware, isAdmin } from '../middlewares';
import { UserService, SessionService } from "../services/mongoose";
import mongoose from 'mongoose';
import Challenge from '../services/mongoose/schema/challenge.schema';

export class UserController {

    constructor(
        public readonly userService: UserService,
        public readonly sessionService: SessionService
    ) {}

    async getAllUsers(req: Request, res: Response) {
        const users = await User.find();
        res.json(users);
    }

    async disableUser(req: Request, res: Response) {
        const { id } = req.params;
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Identifiant invalide" });
        }
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }
        user.isActive = false;
        await user.save();
        res.json(user);
    }

    async deleteUser(req: Request, res: Response) {
        const { id } = req.params;
        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Identifiant invalide" });
        }
        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }
        await User.findByIdAndDelete(id);
        res.status(204).end();
    }

    async getUserById(req: Request, res: Response) {
        const { id } = req.params;

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Identifiant invalide" });
        }

        try {
            const user = await User.findById(id).populate(['badges', 'rewards']);
            if (!user) {
                return res.status(404).json({ message: "Utilisateur non trouvé" });
            }
            return res.status(200).json(user);
        } catch (err) {
            return res.status(500).json({ message: "Erreur lors de la récupération de l'utilisateur" });
        }
    }

    async assignReward(req: Request, res: Response) {
        const { id } = req.params; // ID utilisateur
        const { rewardId } = req.body;

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "ID utilisateur invalide" });
        }

        if (!rewardId || !mongoose.Types.ObjectId.isValid(rewardId)) {
            return res.status(400).json({ message: "ID récompense invalide" });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé" });
        }

        // Si la récompense est déjà attribuée
        if (user.rewards.includes(rewardId)) {
            return res.status(409).json({ message: "Récompense déjà attribuée" });
        }

        user.rewards.push(rewardId);
        await user.save();

        res.status(200).json({ message: "Récompense ajoutée à l'utilisateur", user });
    }

    async getInvitations(req: Request, res: Response) {
       
        const user = await User.findById(req.user?._id);
        if (!user) {
            return res.status(404).json({ message: "Utilisateur non trouvé." });
        }
        const invitations = user.invitations;
        if (!invitations || invitations.length === 0) {
            return res.status(404).json({ message: "Aucune invitation trouvée." });
        }
        return res.json(invitations);
    }

    async acceptInvitation(req: Request, res: Response) {
        const challengeId = req.params.id;
        if(!req.user){
            return res.status(401).json({ message: "Utilisateur non authentifié." });
        }
        const user = await User.findById(req.user._id);
        if( !user) {
            return res.status(404).json({ message: "Utilisateur non trouvé." });
        }
        const invitation = user?.invitations.find(inv => inv.challengeId.toString() === challengeId);
        if (!invitation) {
            return res.status(404).json({ message: "Vous n'etes pas invité à ce challenge." });
        }
        invitation.status = "accepted";
        await user?.save();
        const challenge = await Challenge.findById(challengeId);
        if (!challenge) {
            return res.status(404).json({ message: "Challenge non trouvé." });
        }
        if (!challenge.participantIds.includes(user._id)) {
            challenge.participantIds.push(user._id); 
        }
        await challenge.save();
        return res.status(200).json({ message: "Invitation acceptée.", challenge });
    }
    


    buildRouter(): Router {
        const router = Router();

        router.get('/',
            sessionMiddleware(this.sessionService),
            isAdmin,
            this.getAllUsers.bind(this)
        );
        router.get(
            '/invitations',
            sessionMiddleware(this.sessionService),
            this.getInvitations.bind(this)
        );

        router.patch(
            '/invitations/accept/:id',
            sessionMiddleware(this.sessionService),
            this.acceptInvitation.bind(this)
        );

        router.patch(['/disable', '/'],
            sessionMiddleware(this.sessionService),
            isAdmin,
            (req, res) => res.status(400).json({ message: "Identifiant obligatoire" })
        );

        router.patch('/disable/:id',
            sessionMiddleware(this.sessionService),
            isAdmin,
            this.disableUser.bind(this)
        );

        router.delete(['/', ''],
            sessionMiddleware(this.sessionService),
            isAdmin,
            (req, res) => res.status(400).json({ message: "Identifiant obligatoire" })
        );

        router.delete('/:id',
            sessionMiddleware(this.sessionService),
            isAdmin,
            this.deleteUser.bind(this)
        );
router.post('/:id/rewards',
    sessionMiddleware(this.sessionService),
    isAdmin,
    this.assignReward.bind(this)
);
router.get('/:id',
    sessionMiddleware(this.sessionService),
    isAdmin,
    this.getUserById.bind(this)
);
        return router;
    }
}