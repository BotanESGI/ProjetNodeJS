import {UserService} from "../services/mongoose";
import {Router, Request, Response, json} from "express";
import {SessionService} from "../services/mongoose";
import {sessionMiddleware} from "../middlewares";

export class AuthController {

    constructor(public readonly userService: UserService,
                public readonly sessionService: SessionService) {
    }

    async login(req: Request, res: Response) {
        if(!req.body || !req.body.email || !req.body.password) {
            res.status(400).end();
            return;
        }
        const user = await this.userService.findUser(req.body.email, req.body.password);
        if(!user) {
            res.status(401).end();
            return;
        }
        const session = await this.sessionService.createSession({
            user: user,
            expirationDate: new Date(Date.now() + 1_296_000_000) // eq NOW + 15 jours en millis 15 * 86_400 * 1000
        });
        res.status(201).json(session);
    }

    async me(req: Request, res: Response) {
        res.json(req.user);
    }

    buildRouter(): Router {
        const router = Router();
        router.post('/login', json(), this.login.bind(this));
        router.get('/me',
            sessionMiddleware(this.sessionService),
            this.me.bind(this));
        return router;
    }
}