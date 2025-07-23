import mongoose from 'mongoose';

const TrainingStatsSchema = new mongoose.Schema({
    userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    challengeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Challenge', required: true },
    date:        { type: Date, default: Date.now },
    duration:    { type: Number, required: true },
    calories:    { type: Number, required: true },
    notes:       { type: String },
}, { timestamps: true });

export default mongoose.model('TrainingStats', TrainingStatsSchema);