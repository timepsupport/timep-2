import mongoose, { Document } from "mongoose";

export interface IQuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface IDailyBoost extends Document {
  date: string; // format YYYY-MM-DD
  specialty: string;
  title: string;
  content: string;
  quiz: IQuizQuestion[];
  createdAt: Date;
}

const QuizQuestionSchema = new mongoose.Schema<IQuizQuestion>({
  question: { type: String, required: true },
  options: [{ type: String, required: true }],
  correctIndex: { type: Number, required: true },
  explanation: { type: String, required: true },
});

const DailyBoostSchema = new mongoose.Schema<IDailyBoost>(
  {
    date: { type: String, required: true, unique: true },
    specialty: { type: String, required: true },
    title: { type: String, required: true },
    content: { type: String, required: true },
    quiz: [QuizQuestionSchema],
  },
  { timestamps: true }
);

const DailyBoost = mongoose.models.DailyBoost || mongoose.model<IDailyBoost>("DailyBoost", DailyBoostSchema);
export default DailyBoost;