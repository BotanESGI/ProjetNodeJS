import GymRoom from '../services/mongoose/schema/gym-room.schema';
import { Router, Request, Response } from 'express';
import { sessionMiddleware, isAdmin } from '../middlewares';
import { isOwnerOrAdmin } from '../middlewares/isOwnerOrAdmin.middleware';
import { SessionService } from "../services/mongoose";
import { UserRole } from '../models';

export class GymRoomController {
    constructor(public readonly sessionService: SessionService) {}

    async getAllGymRooms(req: Request, res: Response) {
        const user = req.user!;
        let rooms;

        if (user.role === UserRole.ADMIN) {
            rooms = await GymRoom.find();
        } else if (user.role === UserRole.OWNER) {
            const hasApprovedRoom = await GymRoom.exists({ ownerId: user._id, approved: true });
            if (hasApprovedRoom) {
                rooms = await GymRoom.find({ approved: true });
            } else {
                return res.status(404).json({ message: "Accès refusé." });
            }
        } 
        res.json(rooms);
    }

    async createGymRoom(req: Request, res: Response) {
        const data = { ...req.body };
        const user = req.user!;

        if (user.role === UserRole.OWNER) {
            data.ownerId = user._id;
            data.approved = false;
        } else if (user.role === UserRole.ADMIN) {
            if (!data.ownerId) {
                data.ownerId = user._id;
            }
            if (typeof data.approved === "undefined") {
                data.approved = true;
            }
        }
        else {
            return res.status(403).json({ message: "Seuls les propriétaires ou admin peuvent créer une salle." });
        }

        const room = new GymRoom(data);
        await room.save();
        res.status(201).json(room);
    }

    async updateGymRoom(req: Request, res: Response) {
        if (!req.params.id) {
            return res.status(400).json({ message: "ID de salle requis pour la modification." });
        }
        const room = await GymRoom.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!room) return res.status(404).json({ message: "Salle introuvable" });
        res.json(room);
    }

    async deleteGymRoom(req: Request, res: Response) {
        if (!req.params.id) {
            return res.status(400).json({ message: "ID de salle requis pour la suppression." });
        }
        const room = await GymRoom.findByIdAndDelete(req.params.id);
        if (!room) return res.status(404).json({ message: "Salle introuvable" });
        res.status(204).end();
    }

    async getGymRoomById(req: Request, res: Response) {
        const user = req.user!;
        const room = await GymRoom.findById(req.params.id);
        if (!room) {
            return res.status(404).json({ message: "Salle introuvable" });
        }

        if (user.role === UserRole.ADMIN) {
            return res.json(room);
        }

        if (user.role === UserRole.OWNER) {
            const myApprovedRoom = await GymRoom.exists({ ownerId: user._id, approved: true });
            if (myApprovedRoom && room.approved === true) {
                return res.json(room);
            }
            return res.status(403).json({ message: "Accès refusé à cette salle." });
        }

        return res.json(room);
    }


    async approveGymRoom(req: Request, res: Response) {
        if (!req.params.id) {
            return res.status(400).json({ message: "ID de salle requis pour l’approbation." });
        }
        const room = await GymRoom.findByIdAndUpdate(req.params.id, { approved: true }, { new: true });
        if (!room) return res.status(404).json({ message: "Salle introuvable" });
        res.json(room);
    }

    buildRouter(): Router {
        const router = Router();

        router.get(
            '/',
            sessionMiddleware(this.sessionService),
            this.getAllGymRooms.bind(this)
        );

        router.get(
            '/:id',
            sessionMiddleware(this.sessionService),
            this.getGymRoomById.bind(this)
        );

        router.post(
            '/',
            sessionMiddleware(this.sessionService),
            isOwnerOrAdmin,
            this.createGymRoom.bind(this)
        );

        router.put(
            '/:id',
            sessionMiddleware(this.sessionService),
            isOwnerOrAdmin,
            this.updateGymRoom.bind(this)
        );

        router.delete(
            '/:id',
            sessionMiddleware(this.sessionService),
            isOwnerOrAdmin,
            this.deleteGymRoom.bind(this)
        );

        router.patch(
            '/:id/approve',
            sessionMiddleware(this.sessionService),
            isAdmin,
            this.approveGymRoom.bind(this)
        );

        return router;
    }
}
