import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../models';

export function isAdmin(req: Request, res: Response, next: NextFunction) {
    if (!req.user || req.user.role !== UserRole.ADMIN) {
        return res.status(403).json({ message: 'Accès refusé: droits administrateur requis' });
    }
    next();
}