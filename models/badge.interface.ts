import { Timestamps } from './timestamps';

export interface Badge extends Timestamps {
    _id: string;
    name: string;
    description: string;
    rule: string;
    iconUrl?: string;
}