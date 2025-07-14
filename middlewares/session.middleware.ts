import {Request, RequestHandler} from "express";
import {SessionService} from "../services/mongoose";
import {User, Session} from "../models";

declare module 'express' {
    interface Request {
        session?: Session;
        user?: User;
    }
}

export function sessionMiddleware(sessionService: SessionService): RequestHandler {
    return async (req: Request, res, next) => {
        const authorization = req.headers.authorization;
        if(!authorization) {
            return res.status(401).json({ message: "Authentification requise" });
            return;
        }
        // Authorization: Bearer XXX
        const parts = authorization.split(' ');
        if(parts.length !== 2 || parts[0] !== 'Bearer') {
            return res.status(401).json({ message: "Jeton Berarer manquant, merci de vous connecter" });
            return;
        }
        const token = parts[1];
        const session = await sessionService.findActiveSession(token);
        if(!session) {
            return res.status(401).json({ message: "Session invalide ou expirée" });
            return;
        }
        req.session = session;
        req.user = session.user as User;
        next(); // permet d'aller au middleware OU à la route
    }
}