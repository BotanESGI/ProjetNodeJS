import mongoose from 'mongoose';

const ExerciseTypeSchema = new mongoose.Schema({
    name:         { type: String, required: true },
    description:  { type: String, required: true },
    targetMuscles:[{ type: String, required: true }]
}, { timestamps: true });

export default mongoose.model('ExerciseType', ExerciseTypeSchema);