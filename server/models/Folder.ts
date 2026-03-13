import mongoose, { Document } from "mongoose";

export interface IFolder extends Document {
  userId: string;
  name: string;
  specialty: string;
  createdAt: Date;
}

const FolderSchema = new mongoose.Schema<IFolder>(
  {
    userId: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    specialty: { type: String, required: true },
  },
  { timestamps: true }
);

const Folder = mongoose.models.Folder || mongoose.model<IFolder>("Folder", FolderSchema);
export default Folder;