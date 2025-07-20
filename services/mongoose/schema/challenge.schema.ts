import mongoose from 'mongoose';

const ChallengeSchema = new mongoose.Schema({
    title:           { type: String, required: true },
    description:     { type: String, required: true },
    objectives:      [{ type: String, required: true }],
    duration:        { type: Number, required: true },
    exerciseTypeIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ExerciseType' }],
    gymRoomId:       { type: mongoose.Schema.Types.ObjectId, ref: 'GymRoom' },
    creatorId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    participantIds:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    badgeRewardIds:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Badge' }],
    status:          { type: String, enum: ["pending", "in_progress", "completed"], default: "pending" },
        completedBy:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]

}, { timestamps: true });

export default mongoose.model('Challenge', ChallengeSchema);
