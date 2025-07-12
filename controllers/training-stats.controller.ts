import TrainingStats from '../models/training-stats.schema';
import { Request, Response } from 'express';

export const getAllTrainingStats = async (req: Request, res: Response) => {
    const stats = await TrainingStats.find();
    res.json(stats);
};

export const createTrainingStats = async (req: Request, res: Response) => {
    const stats = new TrainingStats(req.body);
    await stats.save();
    res.status(201).json(stats);
};

export const updateTrainingStats = async (req: Request, res: Response) => {
    const stats = await TrainingStats.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(stats);
};

export const deleteTrainingStats = async (req: Request, res: Response) => {
    await TrainingStats.findByIdAndDelete(req.params.id);
    res.status(204).end();
};