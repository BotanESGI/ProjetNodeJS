import GymRoom from '../services/mongoose/schema/gym-room.schema';
import { Router, Request, Response } from 'express';
import { sessionMiddleware, isAdmin } from '../middlewares';
import { isOwner } from '../middlewares/isOwner.middleware';
import { SessionService } from "../services/mongoose";
import { UserRole } from '../models';
import Exercise from '../services/mongoose/schema/exercise-type.schema';
import User from '../services/mongoose/schema/user.schema';


export class GymRoomController {
    constructor(public readonly sessionService: SessionService) {}

    async getAllGymRooms(req: Request, res: Response) {
        const user = req.user!;
        let rooms;
        if (user.role === UserRole.ADMIN) {
            rooms = await GymRoom.find();
            if(!rooms || rooms.length === 0) {
                return res.status(404).json({ message: "Aucune salle trouvée." });
            }
            return res.json(rooms);
        } else if (user.role === UserRole.OWNER) {
            const hasApprovedRoom = await GymRoom.exists({ ownerId: user._id, approved: true });
            if (hasApprovedRoom) {
                rooms = await GymRoom.find({ approved: true });
                if(!rooms || rooms.length === 0) {
                    return res.status(404).json({ message: "Aucune salle approuvée trouvée." });
                }
                return res.json(rooms);
            } 
            else {
                return res.status(404).json({ message: "Accès refusé! Vous n'avez aucune salle approuvée." });
            }
        } else if (user.role === UserRole.USER){  
            rooms = await GymRoom.find({ approved: true});
            if(!rooms || rooms.length === 0) {
                return res.status(404).json({ message: "Aucune salle approuvée trouvée." });    
            }
            return res.json(rooms);
        }
    }

    async getApprovedGymRoom(req: Request, res:Response){
        let rooms;
            rooms = await GymRoom.find({ approved: true });
            if(!rooms || rooms.length === 0) {
                return res.status(404).json({ message: "Aucune salle approuvée trouvé." });
            }
            return res.json(rooms);
    }

    async getGymRoomByOwner(req: Request, res: Response) {
        const user = req.user!;
        if(user.role === UserRole.OWNER) {
            if(user._id.toString() !== req.params.id ) {
                return res.status(403).json({ message: "Accès refusé : Vous ne pouvez pas accéder aux salles d'autres owners." });
            }
            const rooms = await GymRoom.find({ ownerId: user._id });
            if(!rooms || rooms.length === 0) {
                return res.status(404).json({ message: "Aucune salle trouvée pour cet owner." });
            }
            return res.json(rooms);
        }
        if( user.role === UserRole.ADMIN) {
            const rooms = await GymRoom.find({ ownerId: req.params.id });
            if(!rooms || rooms.length === 0) {
                return res.status(404).json({ message: "Aucune salle trouvée pour cet owner." });
            }
            return res.json(rooms);
        }
        return res.status(403).json({ message: "Accès refusé : Vous ne pouvez pas accéder aux salles d'autres owners." });
    }

    async createGymRoom(req: Request, res: Response) {
        const requiredFields = ['name', 'capacity', 'equipments', 'address', 'contact', 'ownerId'];
        const data = { ...req.body };
        const user = req.user!;
        const gymRoomExists = await GymRoom.exists({ name: data.name, ownerId: user._id });
        if (gymRoomExists) {
            return res.status(400).json({ message: "Une salle avec ce nom existe déjà pour cet owner." });
        }
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
            if (data.exerciseTypes && (data.exerciseTypes.length > 0 || data.difficultyLevels.length > 0  )) {
                return res.status(400).json({ message: "Vous n'avez pas le droit de spécifier les champs : Type d'exercice et Niveau de difficulté." });
            }
            let room = new GymRoom(data);
            await room.save();
            return res.status(201).json(room);

        } else if (user.role === UserRole.ADMIN) {
            if (!data.ownerId) {
                data.ownerId = user._id;
            } else {
                const ownerExists = await User.exists({ id: data.ownerId });
                if (!ownerExists) {
                    return res.status(404).json({ message: "Owner non trouvé." });
                }
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
           if (Array.isArray(data.exerciseTypes) && data.exerciseTypes.length > 0) {
                const exerciseTypes = await Exercise.find({ _id: { $in: data.exerciseTypes } });

                if (exerciseTypes.length !== data.exerciseTypes.length) {
                    return res.status(400).json({ message: "Un ou plusieurs exercices sont invalides." });
                }
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
            } 
           if (room && req.body.name) {
            const gymRoomExists = await GymRoom.exists({ 
                name: req.body.name, 
                _id: { $ne: req.params.id } 
            });
            if (gymRoomExists) {
                return res.status(400).json({ message: "Une salle avec ce nom existe déjà." });
            }
        }
        if(room && (Array.isArray(req.body.exerciseTypes) && req.body.exerciseTypes.length > 0)) {
                const exerciseTypes = await Exercise.find({ _id: { $in: req.body.exerciseTypes } });

                if (exerciseTypes.length !== req.body.exerciseTypes.length) {
                    return res.status(400).json({ message: "Un ou plusieurs exercices sont invalides." });
                }
            }
            room = await GymRoom.findByIdAndUpdate(req.params.id, req.body, { new: true });
            return res.json(room);
            
        } else if (user.role === UserRole.OWNER) {
            room = await GymRoom.findOne({ownerId: user._id, _id: req.params.id});
            if (!room) {
                return res.status(403).json({ message: "Accès refusé : Vous ne pouvez modifier que vos propres salles." });
            } else if (room && (req.body.approved === false || req.body.approved === true)) {
                return res.status(403).json({ message: "Accès refusé : Veuillez envoyer une demande à l'administrateur." });
            } else if ( room && req.body.ownerId){
                return res.status(403).json({message:"Accès refusé: vous ne pouvez pas modifier l'owner de cette salle, veuillez envoyer une demande à l'administrateur."})
            } else if (room && ( req.body.exercisesTypes || req.body.difficultyLevels) ) {
                return res.status(403).json({ message: "Accès refusé : Vous ne pouvez pas modifier les types d'exercice ou les niveaux de difficulté." });
            } else if (room && req.body.name){
                const gymRoomExists = await GymRoom.exists({ name: req.body.name});
                if (gymRoomExists) {
                    return res.status(400).json({ message: "Une salle avec ce nom existe déjà" });
                }
            }
            room = await GymRoom.findByIdAndUpdate(req.params.id, req.body, { new: true });
            return res.json(room);
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
            if (room.ownerId.toString() === user._id.toString()) {
                await GymRoom.findByIdAndDelete(req.params.id);
                return res.status(204).json({message :"Salle supprimée avec succès."});
            }
            else if (!room.approved && room.ownerId.toString() !== user._id.toString()) {
                return res.status(403).json({ message: "Accès refusé : Cette salle de sport ne vous appartient pas." });
            } 
               room = await GymRoom.findByIdAndUpdate(req.params.id, { approved: false }, { new: true });
               return res.status(204).json({message : "Cette salle ne fait plus partie de votre chaine."});
            
        } else if (user.role == UserRole.OWNER){
                if (room.ownerId.toString() === user._id.toString() && room.approved === true){
                    return res.status(403).json({message : "Accès refusé : veuillez demander à l'admin de la désapprouver avant de la supprimer."});
                } else if (room.ownerId.toString() !== user._id.toString()){
                    return res.status(403).json({message : "Accès refusé : Cette salle de sport ne vous appartient pas."});
                }
            await GymRoom.findByIdAndDelete(req.params.id);
            return res.status(204).json({message :"Salle supprimée avec succès."});
        }
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
        if (room.approvalRequested) {
            return res.status(400).json({ message: "Une demande d'approbation a déjà été envoyée pour cette salle." });
        }
        room.approvalRequested = true;
        await room.save();
        return res.status(200).json({ message: "Demande d'approbation envoyée.", room });
    }

    async getAllGymApprovalRequests(req: Request, res: Response) {
        const rooms = await GymRoom.find({ approved: false, approvalRequested: true });
        if (!rooms || rooms.length === 0) {
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
        if(room.approved === true) {
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
        room.approved = false;
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

    
        router.get('/approved', 
            sessionMiddleware(this.sessionService),
            isAdmin, 
            this.getApprovedGymRoom.bind(this)
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

        router.get('/:id/owner',
            sessionMiddleware(this.sessionService),
            isOwner,
            this.getGymRoomByOwner.bind(this)
        );
        
        router.patch(
            '/:id/approve',
            sessionMiddleware(this.sessionService),
            isAdmin,
            this.approveGymRoomRequest.bind(this)
        );

        return router;
    }
}