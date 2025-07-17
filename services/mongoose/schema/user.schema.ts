import mongoose from 'mongoose';
import { UserRole } from "../../../models";

export const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email:    { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role:     { type: String, enum: Object.values(UserRole), required: true },
    isActive: { type: Boolean, default: true },
    badges:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'Badge' }]
}, { timestamps: true });

export default mongoose.model("User", userSchema);
