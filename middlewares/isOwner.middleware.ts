import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../models';

export async function isOwner(req: Request, res: Response, next: NextFunction) {
   const user = req.user;

    if (!user) {
        return res.status(401).json({ message: 'Authentification requise' });
    }
    
    if (user.role === UserRole.OWNER || user.role === UserRole.ADMIN) {
        return next();
    }
    return res.status(403).json({ message: "Accès refusé : seul le propriétaire est autorisé" });
}