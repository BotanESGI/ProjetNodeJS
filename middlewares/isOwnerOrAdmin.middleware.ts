import { Request, Response, NextFunction } from 'express';
import GymRoom from '../services/mongoose/schema/gym-room.schema';
import mongoose from 'mongoose';
import { UserRole } from '../models';

export async function isOwnerOrAdmin(req: Request, res: Response, next: NextFunction) {
   const user = req.user;
    const gymRoomId = req.params.id;

    if (!user) {
        return res.status(401).json({ message: 'Authentification requise' });
    }

    if (!mongoose.Types.ObjectId.isValid(gymRoomId)) {
        return res.status(400).json({ message: "ID de salle invalide" });
    }

    const gymRoom = await GymRoom.findById(gymRoomId);
    if (!gymRoom) {
        return res.status(404).json({ message: "Salle introuvable" });
    }
    if (user.role === UserRole.OWNER && gymRoom.ownerId.toString() === user._id.toString()) {
        return next();
    }
    if (user.role === UserRole.ADMIN && gymRoom.approved === true) {
        return next();
    }
    return res.status(403).json({ message: "Accès refusé : seuls le propriétaire ou l’admin (si salle approuvée) peuvent modifier/supprimer." });
}