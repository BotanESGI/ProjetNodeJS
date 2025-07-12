import GymRoom from '../services/mongoose/schema/gym-room.schema';
import { Request, Response } from 'express';

export const getAllGymRooms = async (req: Request, res: Response) => {
    const rooms = await GymRoom.find();
    res.json(rooms);
};

export const createGymRoom = async (req: Request, res: Response) => {
    const room = new GymRoom(req.body);
    await room.save();
    res.status(201).json(room);
};

export const updateGymRoom = async (req: Request, res: Response) => {
    const room = await GymRoom.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(room);
};

export const deleteGymRoom = async (req: Request, res: Response) => {
    await GymRoom.findByIdAndDelete(req.params.id);
    res.status(204).end();
};