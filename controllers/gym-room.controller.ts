import GymRoom from '../services/mongoose/schema/gym-room.schema';
import { Router, Request, Response } from 'express';
import { sessionMiddleware, isAdmin } from '../middlewares';
import { isOwner } from '../middlewares/isOwner.middleware';
import { SessionService } from "../services/mongoose";
import { UserRole } from '../models';
import User from '../services/mongoose/schema/user.model';

export class GymRoomController {
    constructor(public readonly sessionService: SessionService) {}

    async getAllGymRooms(req: Request, res: Response) {
        const user = req.user!;
        let rooms;

        if (user.role === UserRole.ADMIN) {
            rooms = await GymRoom.find({ approved: true});
        } else if (user.role === UserRole.OWNER) {
            const hasApprovedRoom = await GymRoom.exists({ ownerId: user._id, approved: true });
            if (hasApprovedRoom) {
                rooms = await GymRoom.find({ approved: true });
            } 
            else {
                return res.status(404).json({ message: "Accès refusé! Vous n'avez aucune salle approuvée." });
            }
        } else if (user.role === UserRole.USER){  
            rooms = await GymRoom.find();
        }
        res.json(rooms);
    }

    async createGymRoom(req: Request, res: Response) {
        const data = { ...req.body };
        const user = req.user!;
        if (user.role === UserRole.OWNER) {
            data.ownerId = user._id;
            data.approved = false;
            let room = new GymRoom(data);
            await room.save();
            res.status(201).json(room);
        } else if (user.role === UserRole.ADMIN) {
            if (!data.ownerId) {
                data.ownerId = user._id;
            }
            if (typeof data.approved === "undefined") {
                data.approved = true;
            }
            let room = new GymRoom(data);
                await room.save();
                res.status(201).json(room);
        }
        else {
            return res.status(403).json({ message: "Seuls les propriétaires ou admin peuvent créer une salle." });
        }
        
    }

    async updateGymRoom(req: Request, res: Response) {
        const user = req.user!;
        let room;
        if (!req.params.id) {
            return res.status(400).json({ message: "ID de salle requis pour la modification." });
        }
        room = await GymRoom.findById(req.params.id);
        if (!room) {
            return res.status(404).json({ message: "Salle introuvable" });
        }
        if(user.role === UserRole.ADMIN) { 
             room = await GymRoom.find({ _id: req.params.id, approved: true});
            if (!room || room.length === 0) {
                return res.status(403).json({ message: "Accès refusé : Cette salle de sport ne vous appartient pas." });
            } else {
                room = await GymRoom.findByIdAndUpdate(req.params.id, req.body, { new: true });
                res.json(room);
            }
        } else if (user.role === UserRole.OWNER) {
            room = await GymRoom.findOne({ownerId: user._id, _id: req.params.id, approved: true});
            if (!room) {
                return res.status(403).json({ message: "Accès refusé : Vous ne pouvez modifier que vos propres salles." });
            } else if (room && req.body.approved === false) {
                return res.status(403).json({ message: "Accès refusé : Veuillez envoyer une demande à l'administrateur." });
            } else if (room ){
                 room = await GymRoom.findByIdAndUpdate(req.params.id, req.body, { new: true });
                 res.json(room);
            }
        } else {
            return res.status(403).json({ message: "Accès refusé : Seuls les propriétaires ou administrateurs peuvent modifier une salle." });
        }
    }

    async deleteGymRoom(req: Request, res: Response) {
        const user = req.user!;
        let room;
        if (!req.params.id) {
            return res.status(400).json({ message: "ID de salle requis pour la suppression." });
        }
         if(user.role === UserRole.ADMIN) { 
             room = await GymRoom.find({ _id: req.params.id, approved: true});
            if (!room || room.length === 0) {
                return res.status(403).json({ message: "Accès refusé : Cette salle de sport ne vous appartient pas." });
            }
        }
        room = await GymRoom.findByIdAndDelete(req.params.id);
        if (!room) return res.status(404).json({ message: "Salle introuvable" });
        res.status(204).end();
    }

    async getGymRoomById(req: Request, res: Response) {
        const user = req.user!;
        const room = await GymRoom.findById(req.params.id);
        if (!room) {
            return res.status(404).json({ message: "Salle introuvable" });
        }
       if (user.role === UserRole.ADMIN){
          if (room.approved === false) {
              return res.status(403).json({ message: "Accès refusé : Cette salle de sport ne vous appartient pas." });
            } else {
                return res.json(room);
            }
        }        
        if (user.role === UserRole.OWNER) {
            const myApprovedRoom = await GymRoom.exists({ ownerId: user._id, approved: true });
            if (myApprovedRoom && room.approved === true) {
                return res.json(room);
            }
            return res.status(403).json({ message: "Accès refusé à cette salle." });
        } if (user.role === UserRole.USER) {
              return res.json(room); 
            }
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
            isOwner,          
            this.createGymRoom.bind(this)
        );

        router.put(
            '/:id',
            sessionMiddleware(this.sessionService),
            isOwner,
            isAdmin,
            this.updateGymRoom.bind(this)
        );

        router.delete(
            '/:id',
            sessionMiddleware(this.sessionService),
            isOwner,
            isAdmin,
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
