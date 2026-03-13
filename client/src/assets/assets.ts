// assets.ts
export type TipAspect = 
  | "memory_boost"
  | "structured_thinking"
  | "active_learning"
  | "visual_anchor";

export type Tip = 
  // Memory Boost
  | "Mnemonic"
  | "Acronym"
  | "Analogy"
  | "Story Encoding"
  | "Chunking Strategy"
  // Structured Thinking
  | "Clinical Algorithm"
  | "Comparative Table"
  | "Mindmap"
  | "Cause-Mechanism-Consequence"
  | "Step by Step Breakdown"
  // Active Learning
  | "Socratic Questioning"
  | "Teach Back Method"
  | "Exam Simulation Flash"
  | "Mini-Case Challenge"
  | "Error Detection Mode"
  // Visual Anchor
  | "Timeline Anchor"
  | "Icon-Based Mapping"
  | "Illustration"
  | "Simplified Flowchart"
  | "High-Yield Snapshot Table";

export interface ITip {
  _id: string;
  userId: string;
  title: string;
  content: string;
  type: Tip;
  interests?: string[]; // ✅ tableau de hobbies / centres d’intérêt
  aspect?: TipAspect;
  isGenerating?: boolean;
  createdAt: Date;
  image_url?: string;
}

export interface IUser {
  name: string;
  email: string;
  password?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// Exemples de thumbnails/tips simulés
export const dummyThumbnails: ITip[] = [
  {
    _id: "1",
    userId: "user_1",
    title: "Heart Sounds",
    content: "Acronym for S1/S2: 'LUB-DUB' to remember mitral/tricuspid closure",
    type: "Acronym",
    aspect: "memory_boost",
    interests: ["Cinema"],
    createdAt: new Date(),
    image_url: "https://via.placeholder.com/400x225?text=Heart+Sounds"
  },
  {
    _id: "2",
    userId: "user_1",
    title: "ECG Interpretation",
    content: "Step by Step Breakdown for normal vs abnormal ECG waves",
    type: "Step by Step Breakdown",
    aspect: "structured_thinking",
    interests: ["Football"],
    createdAt: new Date(),
    image_url: "https://via.placeholder.com/400x225?text=ECG"
  },
  {
    _id: "3",
    userId: "user_2",
    title: "Drug Mechanism",
    content: "Cause-Mechanism-Consequence table for beta-blockers",
    type: "Cause-Mechanism-Consequence",
    aspect: "structured_thinking",
    interests: ["Reading"],
    createdAt: new Date(),
    image_url: "https://via.placeholder.com/400x225?text=Drugs"
  },
  {
    _id: "4",
    userId: "user_2",
    title: "Diabetes Pathophysiology",
    content: "Mindmap showing insulin resistance, beta-cell failure",
    type: "Mindmap",
    aspect: "structured_thinking",
    interests: ["Painting"],
    createdAt: new Date(),
    image_url: "https://via.placeholder.com/400x225?text=Diabetes"
  },
];
