import mongoose from 'mongoose';

const RewardSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  condition: {
    type: String,
    required: true // Ex: "completed_challenges >= 3"
  },
  iconUrl: {
    type: String
  }
}, {
  timestamps: true
});

export default mongoose.model("Reward", RewardSchema);
