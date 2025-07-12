import mongoose from 'mongoose';

const BadgeSchema = new mongoose.Schema({
    name:        { type: String, required: true },
    description: { type: String, required: true },
    rule:        { type: String, required: true },
    iconUrl:     { type: String }
}, { timestamps: true });

export default mongoose.model('Badge', BadgeSchema);