import mongoose, { Document } from "mongoose";

export interface ITip extends Document {
  userId: string;
  title: string;
  content: string;
  type: string;
  interests?: string[];
  aspect?: string;
  isGenerating?: boolean;
  createdAt: Date;
  image_url?: string;
  nextReviewDate?: Date;
  reviewCount?: number;
  specialty?: string;
  group?: string;
}

const TipSchema = new mongoose.Schema<ITip>(
  {
    userId: { type: String, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    content: { type: String, trim: true },
    type: { type: String, required: true },
    interests: [{ type: String }],
    aspect: { type: String },
    isGenerating: { type: Boolean, default: false },
    image_url: { type: String },
    nextReviewDate: { type: Date, default: () => {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      return d;
    }},
    reviewCount: { type: Number, default: 0 },
    specialty: { type: String, default: "General" },
    group: { type: String, default: null },
  },
  {
    timestamps: true,
  }
);

const Tip = mongoose.models.Tip || mongoose.model<ITip>("Tip", TipSchema);

export default Tip;

