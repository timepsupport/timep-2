import { useState } from "react";
import { CheckCircle, XCircle, RotateCcw, AlertTriangle, MousePointer } from "lucide-react";

interface ErrorCase {
  text: string;
  error: string;
  correction: string;
  explanation: string;
}

const parseErrorCases = (raw: string): ErrorCase[] => {
  const cases: ErrorCase[] = [];
  const blocks = raw.split(/\n---\n/).filter(b => b.trim());
  for (const block of blocks) {
    const text        = block.match(/CASE\s*:\s*([\s\S]*?)(?=ERROR\s*:|$)/i)?.[1]?.trim() ?? "";
    const error       = block.match(/ERROR\s*:\s*([\s\S]*?)(?=CORRECTION\s*:|$)/i)?.[1]?.trim() ?? "";
    const correction  = block.match(/CORRECTION\s*:\s*([\s\S]*?)(?=EXPLANATION\s*:|$)/i)?.[1]?.trim() ?? "";
    const explanation = block.match(/EXPLANATION\s*:\s*([\s\S]*?)$/i)?.[1]?.trim() ?? "";
    if (text && error) cases.push({ text, error, correction, explanation });
  }
  return cases;
};

const ClickableText = ({
  text, error, onSelect, selected, revealed
}: {
  text: string;
  error: string;
  onSelect: (word: string) => void;
  selected: string | null;
  revealed: boolean;
}) => {
  const words = text.split(/(\s+)/);
  const errorLower = error.toLowerCase();

  return (
    <span className="leading-relaxed">
      {words.map((word, i) => {
        const wordClean = word.replace(/[.,;:!?()]/g, "").toLowerCase();
        const isError = revealed && errorLower.includes(wordClean) && wordClean.length > 2;
        const isSelected = selected && word.toLowerCase().includes(selected.toLowerCase().slice(0, 6));

        if (word.match(/^\s+$/)) return <span key={i}>{word}</span>;

        return (
          <span
            key={i}
            onClick={() => !revealed && onSelect(word)}
            className={`cursor-pointer rounded px-0.5 transition-all duration-200 ${
              isError
                ? "bg-red-500/30 border-b-2 border-red-400 text-red-300"
                : isSelected && !revealed
                ? "bg-yellow-500/30 border-b-2 border-yellow-400 text-yellow-200"
                : "hover:bg-white/10 hover:text-white"
            }`}
          >
            {word}
          </span>
        );
      })}
    </span>
  );
};

export const ErrorDetection = ({ content }: { content: string }) => {
  const cases = parseErrorCases(content);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  if (cases.length === 0) {
    return <div className="text-zinc-400 text-sm whitespace-pre-wrap">{content}</div>;
  }

  const current = cases[index];

  const handleReveal = () => {
    const isCorrect = selected &&
      current.error.toLowerCase().includes(selected.replace(/[.,;:!?()]/g, "").toLowerCase().slice(0, 6));
    if (isCorrect) setScore(s => s + 1);
    setRevealed(true);
  };

  const handleNext = () => {
    if (index + 1 >= cases.length) setDone(true);
    else {
      setIndex(i => i + 1);
      setSelected(null);
      setRevealed(false);
    }
  };

  const reset = () => {
    setIndex(0); setSelected(null);
    setRevealed(false); setScore(0); setDone(false);
  };

  if (done) {
    return (
      <div className="flex flex-col items-center gap-4 py-10 text-center">
        <div className="text-5xl">{score === cases.length ? "🏆" : score >= cases.length / 2 ? "👍" : "📚"}</div>
        <p className="text-zinc-100 font-bold text-xl">{score} / {cases.length}</p>
        <p className="text-zinc-500 text-sm">
          {score === cases.length ? "Parfait, aucune erreur ne t'échappe !" : "Continue à t'entraîner !"}
        </p>
        <button onClick={reset}
          className="mt-2 px-6 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-sm font-medium transition flex items-center gap-2">
          <RotateCcw size={14} /> Recommencer
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-pink-400 font-semibold uppercase tracking-wide">
          <AlertTriangle size={12} /> Cas {index + 1} / {cases.length}
        </div>
        <span className="text-xs text-zinc-500">Score : {score}</span>
      </div>

      {/* Progress dots */}
      <div className="flex gap-1.5">
        {cases.map((_, i) => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-all ${
            i < index ? "bg-green-500/60" : i === index ? "bg-pink-500" : "bg-white/15"
          }`} />
        ))}
      </div>

      {/* Instruction */}
      <div className="flex items-center gap-2 bg-pink-600/10 border border-pink-500/20 rounded-xl px-4 py-2.5">
        <MousePointer size={13} className="text-pink-400 shrink-0" />
        <p className="text-pink-300 text-xs font-medium">Clique sur le mot ou la phrase qui contient l'erreur</p>
      </div>

      {/* Texte cliquable */}
      <div className="bg-white/5 border border-white/10 rounded-xl p-5 text-sm text-zinc-200 leading-7 select-none">
        <ClickableText
          text={current.text}
          error={current.error}
          onSelect={setSelected}
          selected={selected}
          revealed={revealed}
        />
      </div>

      {/* Selected preview */}
      {selected && !revealed && (
        <div className="text-xs text-zinc-400 px-1">
          Sélectionné : <span className="text-yellow-300 font-medium">"{selected}"</span>
        </div>
      )}

      {/* Bouton vérifier */}
      {!revealed && (
        <button
          onClick={handleReveal}
          disabled={!selected}
          className="w-full py-3 rounded-xl bg-pink-600 hover:bg-pink-700 disabled:opacity-30 text-white text-sm font-medium transition"
        >
          Vérifier ma réponse
        </button>
      )}

      {/* Résultat */}
      {revealed && (
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-red-600/15 border border-red-500/30">
            <XCircle size={15} className="text-red-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-red-400 font-semibold mb-0.5">Erreur détectée</p>
              <p className="text-red-300 text-sm">"{current.error}"</p>
            </div>
          </div>

          <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-green-600/15 border border-green-500/30">
            <CheckCircle size={15} className="text-green-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-green-400 font-semibold mb-0.5">Correction</p>
              <p className="text-zinc-200 text-sm">{current.correction}</p>
            </div>
          </div>

          {current.explanation && (
            <div className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-xs text-zinc-400 leading-relaxed">
              💡 {current.explanation}
            </div>
          )}

          <button onClick={handleNext}
            className="w-full py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-sm font-medium transition">
            {index + 1 >= cases.length ? "Voir mon score →" : "Cas suivant →"}
          </button>
        </div>
      )}
    </div>
  );
};