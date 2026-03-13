import { useState } from "react";
import { ChevronLeft, ChevronRight, Eye, EyeOff, RotateCcw } from "lucide-react";

interface FlashCard { question: string; answer: string; }

const parseFlashCards = (raw: string): FlashCard[] => {
  const cards: FlashCard[] = [];
  // Match Q1: ... A1: ... pattern
  const regex = /\*{0,2}Q(\d+)[:\.\*]{1,3}\*{0,2}\s*([\s\S]*?)\s*\*{0,2}A\1[:\.\*]{1,3}\*{0,2}\s*([\s\S]*?)(?=\*{0,2}Q\d+[:\.\*]|$)/gi;
  let match;
  while ((match = regex.exec(raw)) !== null) {
    const q = match[2].trim().replace(/\*\*/g, "");
    const a = match[3].trim().replace(/\*\*/g, "");
    if (q && a) cards.push({ question: q, answer: a });
  }
  return cards;
};

export const ExamFlashCard = ({ content }: { content: string }) => {
  const cards = parseFlashCards(content);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [done, setDone] = useState<Set<number>>(new Set());

  if (cards.length === 0) {
    return <p className="text-zinc-400 text-sm">{content}</p>;
  }

  const card = cards[index];
  const progress = ((index) / cards.length) * 100;

  const goNext = () => {
    setDone(prev => new Set([...prev, index]));
    setRevealed(false);
    setIndex(i => Math.min(i + 1, cards.length - 1));
  };

  const goPrev = () => {
    setRevealed(false);
    setIndex(i => Math.max(i - 1, 0));
  };

  const reset = () => {
    setIndex(0);
    setRevealed(false);
    setDone(new Set());
  };

  const isLast = index === cards.length - 1;
  const allDone = done.size === cards.length;

  return (
    <div className="flex flex-col gap-4 w-full">

      {/* Progress */}
      <div className="flex items-center justify-between text-xs text-zinc-500 mb-1">
        <span>Question {index + 1} / {cards.length}</span>
        <span>{done.size} répondues</span>
      </div>
      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div className="h-full bg-pink-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      {/* Card */}
      {!allDone ? (
        <div className="flex flex-col gap-3">
          {/* Question */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
            <div className="text-xs text-pink-400 font-semibold mb-2 uppercase tracking-wide">Question {index + 1}</div>
            <p className="text-zinc-100 text-sm leading-relaxed">{card.question}</p>
          </div>

          {/* Reveal button */}
          {!revealed ? (
            <button
              onClick={() => setRevealed(true)}
              className="w-full py-3 rounded-xl border border-pink-500/40 bg-pink-600/10 text-pink-400 text-sm font-medium hover:bg-pink-600/20 transition flex items-center justify-center gap-2"
            >
              <Eye size={15} /> Voir la réponse
            </button>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-5 animate-in fade-in duration-300">
              <div className="text-xs text-green-400 font-semibold mb-2 uppercase tracking-wide">Réponse</div>
              <p className="text-zinc-200 text-sm leading-relaxed">{card.answer}</p>
            </div>
          )}

          {/* Navigation */}
          {revealed && (
            <div className="flex gap-2 mt-1">
              <button onClick={goPrev} disabled={index === 0}
                className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-white text-xs font-medium transition flex items-center justify-center gap-1.5 disabled:opacity-30">
                <ChevronLeft size={14} /> Précédent
              </button>
              <button onClick={goNext}
                className="flex-1 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-xs font-medium transition flex items-center justify-center gap-1.5">
                {isLast ? "Terminer ✓" : <>Suivant <ChevronRight size={14} /></>}
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Fin */
        <div className="flex flex-col items-center gap-4 py-8 text-center">
          <div className="text-4xl">🎉</div>
          <p className="text-zinc-100 font-semibold">Toutes les questions complétées !</p>
          <p className="text-zinc-500 text-xs">{cards.length} questions sur {cards.length}</p>
          <button onClick={reset}
            className="mt-2 px-6 py-2.5 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-sm font-medium transition flex items-center gap-2">
            <RotateCcw size={14} /> Recommencer
          </button>
        </div>
      )}

      {/* Dots */}
      <div className="flex gap-1.5 justify-center mt-2">
        {cards.map((_, i) => (
          <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${
            i === index ? "w-5 bg-pink-500" :
            done.has(i) ? "w-1.5 bg-green-500/60" :
            "w-1.5 bg-white/20"
          }`} />
        ))}
      </div>
    </div>
  );
};