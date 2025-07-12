import ExerciseType from '../services/mongoose/schema/exercise-type.schema';
import { Request, Response } from 'express';

export const getAllExerciseTypes = async (req: Request, res: Response) => {
    const types = await ExerciseType.find();
    res.json(types);
};

export const createExerciseType = async (req: Request, res: Response) => {
    const type = new ExerciseType(req.body);
    await type.save();
    res.status(201).json(type);
};

export const updateExerciseType = async (req: Request, res: Response) => {
    const type = await ExerciseType.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(type);
};

export const deleteExerciseType = async (req: Request, res: Response) => {
    await ExerciseType.findByIdAndDelete(req.params.id);
    res.status(204).end();
};