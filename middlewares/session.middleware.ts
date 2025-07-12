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
            res.status(401).end();
            return;
        }
        // Authorization: Bearer XXX
        const parts = authorization.split(' ');
        if(parts.length !== 2 || parts[0] !== 'Bearer') {
            res.status(401).end();
            return;
        }
        const token = parts[1];
        const session = await sessionService.findActiveSession(token);
        if(!session) {
            res.status(401).end();
            return;
        }
        req.session = session;
        req.user = session.user as User;
        next(); // permet d'aller au middleware OU à la route
    }
}