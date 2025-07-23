import { Timestamps } from './timestamps';

export interface GymRoom extends Timestamps {
    _id: string;
    name: string;
    capacity: number;
    equipments: string[];
    description?: string;
    address: string;
    contact: string;
    approved: boolean;
    ownerId: string;
    exerciseTypes: string[];
    difficultyLevels: string[];
    approvalRequested: boolean;
}