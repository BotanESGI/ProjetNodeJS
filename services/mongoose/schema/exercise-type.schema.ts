import { Schema, model } from 'mongoose';

const ExerciseSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    description: String,
    targetMuscles: [String]
}, { timestamps: true });

export default model('Exercise', ExerciseSchema);