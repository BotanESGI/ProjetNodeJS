import { Timestamps } from './timestamps';

export interface Challenge extends Timestamps {
    _id: string;
    title: string;
    description: string;
    objectives: string[];
    duration: number;
    exerciseTypeIds: string[];
    gymRoomId?: string;
    creatorId: string;
    participantIds: string[];
    badgeRewardIds: string[];
}