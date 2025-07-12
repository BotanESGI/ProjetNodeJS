import { Timestamps } from './timestamps';

export interface TrainingStats extends Timestamps {
    _id: string;
    userId: string;
    challengeId: string;
    sessions: {
        date: Date;
        duration: number;
        caloriesBurned: number;
        notes?: string;
    }[];
    totalCalories: number;
    progress: number;
}