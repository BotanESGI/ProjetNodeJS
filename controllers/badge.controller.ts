import Badge from '../services/mongoose/schema/badge.schema';
import { Request, Response } from 'express';

export const getAllBadges = async (req: Request, res: Response) => {
    const badges = await Badge.find();
    res.json(badges);
};

export const createBadge = async (req: Request, res: Response) => {
    const badge = new Badge(req.body);
    await badge.save();
    res.status(201).json(badge);
};

export const updateBadge = async (req: Request, res: Response) => {
    const badge = await Badge.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(badge);
};

export const deleteBadge = async (req: Request, res: Response) => {
    await Badge.findByIdAndDelete(req.params.id);
    res.status(204).end();
};