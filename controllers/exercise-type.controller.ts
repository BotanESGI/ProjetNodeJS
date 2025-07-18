import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import { sessionMiddleware, isAdmin } from '../middlewares';
import { SessionService } from "../services/mongoose";
import Exercise from '../services/mongoose/schema/exercise-type.schema';

export class ExerciseController {
    constructor(
        public readonly sessionService: SessionService
    ) {}

    async getAll(req: Request, res: Response) {
        const exercises = await Exercise.find();
        res.json(exercises);
    }

    async create(req: Request, res: Response) {
        const { name, description, muscles } = req.body;

        if (!name) {
            return res.status(400).json({ message: "Nom d'exercice requis" });
        }
        if (!description) {
            return res.status(400).json({ message: "Description requise" });
        }
        if (!muscles || !Array.isArray(muscles) || muscles.length === 0) {
            return res.status(400).json({ message: "Muscles ciblés requis" });
        }

        const exercise = new Exercise({
            name,
            description,
            targetMuscles: muscles
        });

        await exercise.save();
        res.status(201).json(exercise);
    }

    async update(req: Request, res: Response) {
        const { id } = req.params;
        const { name, description, muscles } = req.body;

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Identifiant invalide" });
        }

        const updateFields: any = {};
        if (name) updateFields.name = name;
        if (description) updateFields.description = description;
        if (muscles) updateFields.targetMuscles = muscles;

        const exercise = await Exercise.findByIdAndUpdate(
            id,
            updateFields,
            { new: true }
        );

        if (!exercise) {
            return res.status(404).json({ message: "Exercice non trouvé" });
        }

        res.json(exercise);
    }

    async delete(req: Request, res: Response) {
        const { id } = req.params;

        if (!id || !mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ message: "Identifiant invalide" });
        }

        await Exercise.findByIdAndDelete(id);
        res.status(204).end();
    }

    buildRouter(): Router {
        const router = Router();

        router.get('/', this.getAll.bind(this));

        router.post('/',
            sessionMiddleware(this.sessionService),
            isAdmin,
            this.create.bind(this)
        );

        router.put('/:id',
            sessionMiddleware(this.sessionService),
            isAdmin,
            this.update.bind(this)
        );

        router.delete('/:id',
            sessionMiddleware(this.sessionService),
            isAdmin,
            this.delete.bind(this)
        );

        return router;
    }
}