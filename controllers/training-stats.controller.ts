import { Router, Request, Response } from 'express';
import TrainingStats from '../services/mongoose/schema/training-stats.schema';
import { sessionMiddleware } from '../middlewares';
import { SessionService } from '../services/mongoose';

export class TrainingStatsController {
    constructor(public readonly sessionService: SessionService) {}

    async getAll(req: Request, res: Response) {
        const user = req.user!;
        const { challengeId } = req.query;
        const filter: any = { userId: user._id };
        if (challengeId) filter.challengeId = challengeId;
        const stats = await TrainingStats.find(filter);
        res.json(stats);
    }

    async create(req: Request, res: Response) {
        const user = req.user!;
        const data = { ...req.body, userId: user._id };
        const stat = new TrainingStats(data);
        await stat.save();
        res.status(201).json(stat);
    }

    async update(req: Request, res: Response) {
        const user = req.user!;
        const { id } = req.params;
        const stat = await TrainingStats.findOneAndUpdate(
            { _id: id, userId: user._id },
            req.body,
            { new: true }
        );
        if (!stat) return res.status(404).json({ message: "Statistique non trouvée" });
        res.json(stat);
    }

    async delete(req: Request, res: Response) {
        const user = req.user!;
        const { id } = req.params;
        const stat = await TrainingStats.findOneAndDelete({ _id: id, userId: user._id });
        if (!stat) return res.status(404).json({ message: "Statistique non trouvée" });
        res.status(204).end();
    }

    buildRouter(): Router {
        const router = Router();
        router.get(
            '/',
            sessionMiddleware(this.sessionService),
            this.getAll.bind(this)
        );
        router.post(
            '/',
            sessionMiddleware(this.sessionService),
            this.create.bind(this)
        );
        router.put(
            '/:id',
            sessionMiddleware(this.sessionService),
            this.update.bind(this)
        );
        router.delete(
            '/:id',
            sessionMiddleware(this.sessionService),
            this.delete.bind(this)
        );
        return router;
    }
}