import {Timestamps} from "./timestamps";

export enum UserRole {
    ADMIN = 'ADMIN',
    EMPLOYEE = 'EMPLOYEE',
    USER = 'USER'
}

export interface User extends Timestamps {
    _id: string;
    lastName: string;
    firstName: string;
    email: string;
    password: string;
    role: UserRole;
}