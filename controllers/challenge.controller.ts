import Challenge from '../services/mongoose/schema/challenge.schema';
import { Request, Response } from 'express';

export const getAllChallenges = async (req: Request, res: Response) => {
    const challenges = await Challenge.find();
    res.json(challenges);
};

export const createChallenge = async (req: Request, res: Response) => {
    const challenge = new Challenge(req.body);
    await challenge.save();
    res.status(201).json(challenge);
};

export const updateChallenge = async (req: Request, res: Response) => {
    const challenge = await Challenge.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(challenge);
};

export const deleteChallenge = async (req: Request, res: Response) => {
    await Challenge.findByIdAndDelete(req.params.id);
    res.status(204).end();
};