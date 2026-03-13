import { type TipAspect } from "../components/StyleSelector";

interface AspectSelectorProps {
  value: TipAspect;
  onChange: (value: TipAspect) => void;
}

const options: { label: string; key: TipAspect }[] = [
  { label: "Memory Boost", key: "memory_boost" },
  { label: "Structured Thinking", key: "structured_thinking" },
  { label: "Active Learning", key: "active_learning" },
  { label: "Visual Anchor", key: "visual_anchor" },
];

const AspectRatioSelector = ({ value, onChange }: AspectSelectorProps) => {
  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-zinc-200">
        Tip Aspects
      </label>

      <div className="flex flex-wrap gap-3">
        {options.map((option) => {
          const selected = value === option.key;

          return (
            <button
              key={option.key}
              type="button"
              onClick={() => onChange(option.key)}
              className={`
                px-6 py-3 rounded-xl text-sm font-medium
                transition-all duration-300 ease-in-out
                border border-white/10
                ${
                  selected
                    ? "bg-white/15 shadow-lg scale-105"
                    : "bg-white/5 hover:bg-white/10"
                }
              `}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AspectRatioSelector;
