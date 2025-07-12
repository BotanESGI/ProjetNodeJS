import User from '../services/mongoose/schema/user.model';
import { Request, Response } from 'express';
import { sha256 } from '../utils';

export const getAllUsers = async (req: Request, res: Response) => {
    const users = await User.find();
    res.json(users);
};

export const createUser = async (req: Request, res: Response) => {
    const userData = { ...req.body, password: sha256(req.body.password) };
    const user = new User(userData);
    await user.save();
    res.status(201).json(user);
};

export const updateUser = async (req: Request, res: Response) => {
    const updateData = { ...req.body };
    if (updateData.password) {
        updateData.password = sha256(updateData.password);
    }
    const user = await User.findByIdAndUpdate(req.params.id, updateData, { new: true });
    res.json(user);
};

export const deleteUser = async (req: Request, res: Response) => {
    await User.findByIdAndDelete(req.params.id);
    res.status(204).end();
};