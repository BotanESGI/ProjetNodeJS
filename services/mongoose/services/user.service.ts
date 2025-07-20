import { Mongoose, Model, FilterQuery, ObjectId, Document } from "mongoose";
import { User } from "../../../models";
import { userSchema } from "../schema";
import { sha256 } from "../../../utils";

// omit permet d'enlever des clés d'un type pour en créer un nouveau
export type CreateUser = Omit<User, '_id' | 'createdAt' | 'updatedAt'>;

export class UserService {

    readonly userModel: Model<User & Document>;

    constructor(public readonly connection: Mongoose) {
        this.userModel = connection.model<User & Document>('User', userSchema);
    }

    async findUser(email: string, password?: string): Promise<User | null> {
        const filter: FilterQuery<User> = {email: email};
        if(password) {
            filter.password = sha256(password);
        }
        return this.userModel.findOne(filter);
    }

    async createUser(user: CreateUser): Promise<User> {
        return this.userModel.create({...user, password: sha256(user.password)});
    }
async findByIdWithRewardsAndBadges(id: string): Promise<User | null> {
    return this.userModel.findById(id).populate(['badges', 'rewards']);
}

}