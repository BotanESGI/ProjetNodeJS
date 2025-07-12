import {Mongoose, Model, isValidObjectId} from "mongoose";
import {Session} from "../../../models";
import {sessionSchema} from "../schema";

export type CreateSession = Omit<Session, '_id' | 'createdAt' | 'updatedAt'>;

export class SessionService {

    readonly sessionModel: Model<Session>;

    constructor(public readonly connection: Mongoose) {
        this.sessionModel = connection.model('Session', sessionSchema());
    }

    async createSession(session: CreateSession): Promise<Session> {
        return this.sessionModel.create(session);
    }

    async findActiveSession(sessionId: string): Promise<Session | null> {
        if(!isValidObjectId(sessionId)) {
            return null;
        }
        return this.sessionModel.findOne({
            _id: sessionId,
            expirationDate: { $gt: new Date() }
        }).populate('user').exec();
    }
}