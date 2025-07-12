import { Timestamps } from './timestamps';

export enum UserRole {
    ADMIN = 'admin',
    OWNER = 'owner',
    USER = 'user'
}

export interface User extends Timestamps {
    _id: string;
    username?: string;
    firstName?: string;
    lastName?: string;
    email: string;
    password: string;
    role: UserRole;
    isActive: boolean;
    badges: string[];
}