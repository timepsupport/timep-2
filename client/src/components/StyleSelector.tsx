import {
  ChevronDownIcon,
  SparkleIcon,
  SquareIcon,
  ImageIcon,
  PenToolIcon,
  CpuIcon,
} from "lucide-react";
import React from "react";

export type TipAspect =
  | "memory_boost"
  | "structured_thinking"
  | "active_learning"
  | "visual_anchor";

export type Tip =
  | "Acronym"
  | "Mnemonic"
  | "Analogy"
  | "Story Encoding"
  | "Chunking Strategy"
  | "Clinical Algorithm"
  | "Comparative Table"
  | "Mindmap"
  | "Cause Mechanism Consequence"
  | "Step-by-Step Breakdown"
  | "Socratic Questioning"
  | "Teach-Back Method"
  | "Exam Simulation Flash"
  | "Mini Case Challenge"
  | "Error Detection Mode"
  | "Timeline Anchor"
  | "Icon-Based Mapping"
  | "Disease Poster"
  | "Simplified Flowchart"
  | "High-Yield Snapshot Table";

const tipsByAspect: Record<TipAspect, Tip[]> = {
  memory_boost: [
    "Acronym",
    "Mnemonic",
    "Analogy",
    "Story Encoding",
    "Chunking Strategy",
  ],
  structured_thinking: [
    "Clinical Algorithm",
    "Comparative Table",
    "Mindmap",
    "Cause Mechanism Consequence",
    "Step-by-Step Breakdown",
  ],
  active_learning: [
    "Socratic Questioning",
    "Teach-Back Method",
    "Exam Simulation Flash",
    "Mini Case Challenge",
    "Error Detection Mode",
  ],
  visual_anchor: [
    "Timeline Anchor",
    "Icon-Based Mapping",
    "Disease Poster",
    "Simplified Flowchart",
    "High-Yield Snapshot Table",
  ],
};

const tipDescriptions: Record<Tip, string> = {
  Acronym: "Compress key elements into a memorable word.",
  Mnemonic: "Create an easy-to-recall memory phrase.",
  Analogy: "Explain the concept using a relatable comparison.",
  "Story Encoding": "Turn the lesson into a memorable story.",
  "Chunking Strategy": "Break information into structured blocks.",

  "Clinical Algorithm": "Decision-based step-by-step reasoning.",
  "Comparative Table": "Side-by-side differentiation structure.",
  "Mindmap": "Hierarchical concept visualization.",
  "Cause Mechanism Consequence": "Logical physiopathology structure.",
  "Step-by-Step Breakdown": "Definition → Mechanism → Application.",

  "Socratic Questioning": "Guided progressive thinking.",
  "Teach-Back Method": "Explain it as if teaching someone else.",
  "Exam Simulation Flash": "High-yield exam-style question.",
  "Mini Case Challenge": "Short clinical decision case.",
  "Error Detection Mode": "Find and correct the mistake.",

  "Timeline Anchor": "Chronological visual progression.",
  "Icon-Based Mapping": "Symbols linked to key ideas.",
  "Disease Poster": "Visual infographic summary of the disease.",
  "Simplified Flowchart": "Logical visual pathway.",
  "High-Yield Snapshot Table": "Ultra-condensed exam table.",
};

const tipIcons: Record<Tip, React.ReactNode> = {
  Acronym: <SparkleIcon className="h-4 w-4" />,
  Mnemonic: <SquareIcon className="h-4 w-4" />,
  Analogy: <CpuIcon className="h-4 w-4" />,
  "Story Encoding": <PenToolIcon className="h-4 w-4" />,
  "Chunking Strategy": <ImageIcon className="h-4 w-4" />,

  "Clinical Algorithm": <CpuIcon className="h-4 w-4" />,
  "Comparative Table": <SquareIcon className="h-4 w-4" />,
  "Mindmap": <SparkleIcon className="h-4 w-4" />,
  "Cause Mechanism Consequence": <PenToolIcon className="h-4 w-4" />,
  "Step-by-Step Breakdown": <ImageIcon className="h-4 w-4" />,

  "Socratic Questioning": <SparkleIcon className="h-4 w-4" />,
  "Teach-Back Method": <SquareIcon className="h-4 w-4" />,
  "Exam Simulation Flash": <CpuIcon className="h-4 w-4" />,
  "Mini Case Challenge": <PenToolIcon className="h-4 w-4" />,
  "Error Detection Mode": <ImageIcon className="h-4 w-4" />,

  "Timeline Anchor": <SparkleIcon className="h-4 w-4" />,
  "Icon-Based Mapping": <SquareIcon className="h-4 w-4" />,
  "Disease Poster": <PenToolIcon className="h-4 w-4" />,
  "Simplified Flowchart": <CpuIcon className="h-4 w-4" />,
  "High-Yield Snapshot Table": <ImageIcon className="h-4 w-4" />,
};

interface Props {
  selectedAspect: TipAspect;
  value: Tip;
  isOpen: boolean;
  onChange: (tip: Tip) => void;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const StyleSelector = ({
  selectedAspect,
  value,
  isOpen,
  onChange,
  setIsOpen,
}: Props) => {
  const availableTips = tipsByAspect[selectedAspect];

  return (
    <div className="relative space-y-3">
      <label className="block text-sm font-medium text-zinc-200">
        Combined Tips
      </label>

      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-md border px-4 py-3 text-left transition bg-white/8 border-white/10 text-zinc-200 hover:bg-white/12"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-2 font-medium">
            {tipIcons[value]}
            <span>{value}</span>
          </div>
          <p className="text-xs text-zinc-400">
            {tipDescriptions[value]}
          </p>
        </div>

        <ChevronDownIcon
          className={`h-5 w-5 text-zinc-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full z-50 mt-1 w-full rounded-md border border-white/12 bg-zinc-900 shadow-lg">
          {availableTips.map((tip) => (
            <button
              key={tip}
              type="button"
              onClick={() => {
                onChange(tip);
                setIsOpen(false);
              }}
              className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-zinc-800"
            >
              <div className="mt-0.5">{tipIcons[tip]}</div>
              <div>
                <p className="font-medium text-white">{tip}</p>
                <p className="text-xs text-zinc-400">
                  {tipDescriptions[tip]}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default StyleSelector;
