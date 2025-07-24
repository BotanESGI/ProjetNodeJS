import mongoose from 'mongoose';

const ChallengeSchema = new mongoose.Schema({
    title:           { type: String, required: true },
    description:     { type: String, required: true },
    objectives:      [{ type: String, required: true }],
    duration:        { type: Number, required: true },
    difficulty:      [{ type: String }],
    exerciseTypeIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'ExerciseType' }],
    gymRoomId:       { type: mongoose.Schema.Types.ObjectId, ref: 'GymRoom' },
    creatorId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    participantIds:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    badgeRewardIds:  [{ type: mongoose.Schema.Types.ObjectId, ref: 'Badge' }],
    status:          { type: String, enum: ["pending", "in_progress", "completed"], default: "pending" },
    completedBy:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    gymRoom: { type: mongoose.Schema.Types.ObjectId,ref: 'GymRoom',required: true},
    owner: {type: mongoose.Schema.Types.ObjectId,ref: 'User',required: true
}
}, { timestamps: true });

export default mongoose.model('Challenge', ChallengeSchema);
