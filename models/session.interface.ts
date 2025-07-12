import {User} from "./user.interface";
import {Timestamps} from "./timestamps";

export interface Session extends Timestamps {
    _id: string;
    expirationDate?: Date;
    user: string | User;
}