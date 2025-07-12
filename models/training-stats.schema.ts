import mongoose from 'mongoose';

const SessionSchema = new mongoose.Schema({
    date:           { type: Date, required: true },
    duration:       { type: Number, required: true },
    caloriesBurned: { type: Number, required: true },
    notes:          { type: String }
}, { _id: false });

const TrainingStatsSchema = new mongoose.Schema({
    userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    challengeId:{ type: mongoose.Schema.Types.ObjectId, ref: 'Challenge', required: true },
    sessions:   [SessionSchema],
    totalCalories: { type: Number, required: true },
    progress:      { type: Number, required: true }
}, { timestamps: true });

export default mongoose.model('TrainingStats', TrainingStatsSchema);