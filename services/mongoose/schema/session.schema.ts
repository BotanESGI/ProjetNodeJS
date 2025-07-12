import {Schema} from "mongoose";
import {Session} from "../../../models";

export function sessionSchema(): Schema<Session> {
    return new Schema<Session>({
        expirationDate: {
            type: Date,
        },
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User', // nom du model à charger
            required: true
        }
    }, {
        timestamps: true, // createdAt + updatedAt
        collection: "sessions",
        versionKey: false, // désactive le versionning de model
    });
}