import { Router, Request, Response, json } from 'express';
import User from '../services/mongoose/schema/user.model';
import { sessionMiddleware, isAdmin } from '../middlewares';
import { UserService, SessionService } from "../services/mongoose";
import mongoose from 'mongoose';

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

    buildRouter(): Router {
        const router = Router();

        router.get('/',
            sessionMiddleware(this.sessionService),
            isAdmin,
            this.getAllUsers.bind(this)
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

        return router;
    }
}