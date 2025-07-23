import GymRoom from '../services/mongoose/schema/gym-room.schema';
import { Router, Request, Response } from 'express';
import { sessionMiddleware, isAdmin } from '../middlewares';
import { isOwner } from '../middlewares/isOwner.middleware';
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
            } 
            else {
                return res.status(404).json({ message: "Accès refusé! Vous n'avez aucune salle approuvée." });
            }
        } else if (user.role === UserRole.USER){  
            rooms = await GymRoom.find({ approved: true});
        }
        return res.json(rooms);
    }

    async getGymRoomByOwnerID(req: Request, res:Response){
        const user = req.user!;
        let rooms;
        if(user.role === UserRole.ADMIN) {
            rooms = await GymRoom.find({ ownerId: req.params.id, approved: true });
            if(!rooms || rooms.length === 0) {
                return res.status(404).json({ message: "Aucune salle trouvée pour cet owner." });
            }
            return res.json(rooms);
        } else if (user.role === UserRole.OWNER && user._id.toString() === req.params.id) {
            rooms = await GymRoom.find({ ownerId: user._id});
            if(!rooms || rooms.length === 0) {
                return res.status(404).json({ message: "Vous n'avez encore aucune salle à votre nom." });
            }
            return res.json(rooms);
        } else if (user.role === UserRole.USER) {
            rooms = await GymRoom.find({ownerId: req.params.id, approved: true});
            if(!rooms || rooms.length === 0) {
                return res.status(404).json({ message: "Aucune salle trouvée pour cet owner." });
            }
            return res.json(rooms);
        } else {
            return res.status(403).json({ message: "Accès refusé : Seuls les propriétaires ou administrateurs peuvent accéder aux salles." });
        }
    }

    async createGymRoom(req: Request, res: Response) {
        const requiredFields = ['name', 'capacity', 'equipments', 'address', 'contact', 'ownerId'];
        const data = { ...req.body };
        const user = req.user!;
        if (user.role === UserRole.OWNER) {
            data.ownerId = user._id;
            data.approved = false;
            const missingFields = requiredFields.filter(field => !data[field]);
            if (missingFields.length > 0) {
                return res.status(400).json({
                    message: 'Champs manquants',
                    missingFields
                });
            }
            let room = new GymRoom(data);
            await room.save();
            return res.status(201).json(room);
        } else if (user.role === UserRole.ADMIN) {
            if (!data.ownerId) {
                data.ownerId = user._id;
            }
            if (typeof data.approved === "undefined") {
                data.approved = true;
            }
            const missingFields = requiredFields.filter(field => !data[field]);
            if (missingFields.length > 0) {
                return res.status(400).json({
                    message: 'Champs manquants',
                    missingFields
                });
            }
            let room = new GymRoom(data);
                await room.save();
               return res.status(201).json(room);
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
                return res.json(room);
            }
        } else if (user.role === UserRole.OWNER) {
            room = await GymRoom.findOne({ownerId: user._id, _id: req.params.id});
            if (!room) {
                return res.status(403).json({ message: "Accès refusé : Vous ne pouvez modifier que vos propres salles." });
            } else if (room && (req.body.approved === false || req.body.approved === true)) {
                return res.status(403).json({ message: "Accès refusé : Veuillez envoyer une demande à l'administrateur." });
            } else if ( room && req.body.ownerId){
                return res.status(403).json({message:"Accès refusé: vous ne pouvez pas modifier l'owner de cette salle, veuillez envoyer une demande à l'administrateur."})
            }
            else if (room){
                 room = await GymRoom.findByIdAndUpdate(req.params.id, req.body, { new: true });
                 return res.json(room);
            }
        } else {
            return res.status(403).json({ message: "Accès refusé : Seuls les propriétaires ou administrateurs peuvent modifier une salle." });
        }
    }

    async disapproveGymRoom (req:Request, res: Response){
        let room;
        if(!req.params.id){
            return res.status(400).json({message: "ID de salle requis pour la désapprobation."});
        }
        room = await GymRoom.findByIdAndUpdate(req.params.id, { approved: false }, { new: true });
        if (!room) return res.status(404).json({ message: "Salle introuvable" });
        return res.json(room);
    }

    async deleteGymRoom(req: Request, res: Response) {
        const user = req.user!;
        let room;
        if (!req.params.id) {
            return res.status(400).json({ message: "ID de salle requis pour la suppression." });
        }
        room = await GymRoom.findById(req.params.id);
        if (!room) return res.status(404).json({ message: "Salle introuvable." });

        if(user.role === UserRole.ADMIN) { 
            if (!room.approved) {
                return res.status(403).json({ message: "Accès refusé : Cette salle de sport ne vous appartient pas." });
            } else {
               room = await GymRoom.findByIdAndUpdate(req.params.id, { approved: false }, { new: true });
               return res.status(204).json({message : "Cette salle ne fait plus partie de votre chaine."});
            }
        } else if (user.role == UserRole.OWNER && room.ownerId.toString() === user._id.toString() && room.approved === true){
            return res.status(403).json({message : "Accès refusé : veuillez demander à l'admin de la désapprouver avant de la supprimer."});
        } else if ( user.role == UserRole.OWNER && room.ownerId.toString() !== user._id.toString() ){
            return res.status(403).json({message : "Accès refusé : Cette salle de sport ne vous appartient pas."});
        }
        await GymRoom.findByIdAndDelete(req.params.id);
        return res.status(204).end();
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
        return res.json(room);
    }

    async getFilteredGymRooms(req: Request, res:Response) {   
        try {
            const { exerciseId, difficultyLevel } = req.query;
                if (!exerciseId && !difficultyLevel) {
                    return res.status(400).json({ message: "Veuillez fournir au moins un critère de filtrage." });
                }
             const roomsByExercise = await GymRoom.find({ approved: true, exerciseTypes: { $exists: true, $ne: [], $in:[exerciseId]} });
             const roomsByDifficulty = await GymRoom.find({ approved: true, difficultyLevels: { $exists: true, $ne: [], $in:[difficultyLevel]} });

            if(exerciseId) {
                if (roomsByExercise.length === 0) {
                    return res.status(404).json({ message: "Aucune salle trouvée pour cet exercice." });
                }
                return res.json(roomsByExercise);
            }

            if(difficultyLevel) {
                if (roomsByDifficulty.length === 0) {
                    return res.status(404).json({ message: "Aucune salle trouvée pour ce niveau de difficulté." });
                }
                return res.json(roomsByDifficulty);
            }
            
        } catch (err) {
            return res.status(500).json({ message: "Erreur lors du filtrage des salles." });
        }
    }

    async requestGymApproval(req: Request, res: Response) {
        const user = req.user!;
        const gymRoomId = req.params.id;
        if (!gymRoomId) {
            return res.status(400).json({ message: "ID de salle invalide." });
        }
        const room = await GymRoom.findById(gymRoomId);
        if (!room) {
            return res.status(404).json({ message: "Salle introuvable." });
        }
        if (user.role === UserRole.OWNER && room.ownerId.toString() !== user._id.toString()) {
            return res.status(403).json({ message: "Accès refusé : Vous ne pouvez envoyer la demande que pour vos propres salles." });
        }
        if (room.approved) {
            return res.status(400).json({ message: "Cette salle est déjà approuvée." });
        }
        room.approvalRequested = true;
        await room.save();
        return res.status(200).json({ message: "Demande d'approbation envoyée.", room });
    }

    async getAllGymApprovalRequests(req: Request, res: Response) {
        const rooms = await GymRoom.find({ approved: false, approvalRequested: true });
        if (!rooms) {
            return res.status(404).json({ message: "Aucune demande d'approbation de salle trouvée." });
        }
        return res.json(rooms);
    }

    async approveGymRoomRequest(req: Request, res: Response) {
        const gymRoomId = req.params.id;
        if (!gymRoomId) {
            return res.status(400).json({ message: "ID de salle invalide." });
        }
        const room = await GymRoom.findById(gymRoomId);
        if (!room) {
            return res.status(404).json({ message: "Salle introuvable." });
        }
        if(room.approved) {
            return res.status(400).json({ message: "Cette salle est déjà approuvée." });
        }
        if( room.approvalRequested === false || room.approvalRequested === undefined) {
            return res.status(400).json({ message: "Aucune demande d'approbation en attente pour cette salle." });
        }
        room.approved = true;
        room.approvalRequested = false;
        await room.save();
        return res.status(200).json({ message: "Salle approuvée avec succès.", room });
    }

    async disapproveGymRoomRequest(req: Request, res: Response) {
        const gymRoomId = req.params.id;
        if (!gymRoomId) {
            return res.status(400).json({ message: "ID de salle invalide." });
        }
        const room = await GymRoom.findById(gymRoomId);
        if (!room) {
            return res.status(404).json({ message: "Salle introuvable." });
        }
        if (room.approved) {
            return res.status(400).json({ message: "Cette salle est déjà approuvée." });
        }
        if (room.approvalRequested === false) {
            return res.status(400).json({ message: "Aucune demande d'approbation en attente pour cette salle." });
        }
        room.approvalRequested = false;
        await room.save();
        return res.status(200).json({ message: "Demande d'approbation annulée.", room });
    }

    buildRouter(): Router {
        const router = Router();

        router.get(
            '/',
            sessionMiddleware(this.sessionService),
            this.getAllGymRooms.bind(this)
        );

        router.get(
        '/filter',
        sessionMiddleware(this.sessionService),
        this.getFilteredGymRooms.bind(this)
        );

        router.get(
            '/:id',
            sessionMiddleware(this.sessionService),
            this.getGymRoomById.bind(this)
        );

        router.get('/owners/:id', 
            sessionMiddleware(this.sessionService),
            isOwner, 
            this.getGymRoomByOwnerID.bind(this)
        );

        router.get('/admin/request-approval',
            sessionMiddleware(this.sessionService),
            isAdmin,
            this.getAllGymApprovalRequests.bind(this)
        );

        router.patch(
            '/request-approval/:id',
            sessionMiddleware(this.sessionService),
            isOwner,
            this.requestGymApproval.bind(this)
        );

        router.patch(
        '/approve/:id',
        sessionMiddleware(this.sessionService),
        isAdmin,
        this.approveGymRoom.bind(this)
    );

    router.patch(
        '/disapprove/:id',
        sessionMiddleware(this.sessionService),
        isAdmin,
        this.disapproveGymRoom.bind(this)
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
            this.updateGymRoom.bind(this)
        );

        router.delete(
            '/:id',
            sessionMiddleware(this.sessionService),
            isOwner,
            this.deleteGymRoom.bind(this)
        );

        router.patch(
            '/:id/approve',
            sessionMiddleware(this.sessionService),
            isAdmin,
            this.approveGymRoom.bind(this)
        );

        router.patch(
            '/:id/disapprove',
            sessionMiddleware(this.sessionService),
            isAdmin,
            this.disapproveGymRoom.bind(this)
        );

        return router;
    }
}