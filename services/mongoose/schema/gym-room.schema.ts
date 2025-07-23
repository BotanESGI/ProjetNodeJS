import mongoose from 'mongoose';

const GymRoomSchema = new mongoose.Schema({
    name:         { type: String, required: true },
    capacity:     { type: Number, required: true },
    equipments:   [{ type: String, required: true }],
    description:  { type: String },
    address:      { type: String, required: true },
    contact:      { type: String, required: true },
    approved:     { type: Boolean, default: false },
    approvalRequested: { type: Boolean, default: false },
    ownerId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    exerciseTypes:[{ type: mongoose.Schema.Types.ObjectId, ref: 'ExerciseType' }],
    difficultyLevels: [{ type: String }]
}, { timestamps: true });

export default mongoose.model('GymRoom', GymRoomSchema);
