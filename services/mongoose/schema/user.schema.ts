import {Schema} from "mongoose";
import {User, UserRole} from "../../../models";

export function userSchema(): Schema<User> {
    return new Schema<User>({
        lastName: {
            type: String,
            required: true
        },
        firstName: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true,
            unique: true
        },
        password: {
            type: String,
            required: true
        },
        role: {
            type: String,
            required: true,
            enum: Object.values(UserRole)
        }
    }, {
        timestamps: true, // createdAt + updatedAt
        collection: "users",
        versionKey: false, // désactive le versionning de model
    });
}