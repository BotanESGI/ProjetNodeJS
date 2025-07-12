import { Timestamps } from './timestamps';

export interface ExerciseType extends Timestamps {
    _id: string;
    name: string;
    description: string;
    targetMuscles: string[];
}