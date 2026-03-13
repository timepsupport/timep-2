import mongoose, { Document } from "mongoose";

export interface IUserStreak extends Document {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string; // YYYY-MM-DD
  completedDates: string[];
  createdAt: Date;
}

const UserStreakSchema = new mongoose.Schema<IUserStreak>(
  {
    userId: { type: String, required: true, unique: true },
    currentStreak: { type: Number, default: 0 },
    longestStreak: { type: Number, default: 0 },
    lastCompletedDate: { type: String, default: '' },
    completedDates: [{ type: String }],
  },
  { timestamps: true }
);

const UserStreak = mongoose.models.UserStreak || mongoose.model<IUserStreak>("UserStreak", UserStreakSchema);
export default UserStreak;