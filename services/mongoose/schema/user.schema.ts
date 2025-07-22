import mongoose from 'mongoose';
import { UserRole } from "../../../models";

export const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    email:    { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role:     { type: String, enum: Object.values(UserRole), required: true },
    isActive: { type: Boolean, default: true },
    badges:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'Badge' }],
    rewards:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Reward' }],
    invitations: [{
        challengeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Challenge', required: true },
        status: { type: String, enum: ["pending", "accepted", "declined"], default: "pending" },
        invitedAt: { type: Date, default: Date.now }
    }]

}, { timestamps: true });

export default mongoose.model("User", userSchema);
