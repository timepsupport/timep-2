import { useState } from "react";
import { SparklesIcon, XIcon, ChevronDownIcon } from "lucide-react";
import { useAuth } from "@clerk/clerk-react";

const FAQS = [
  {
    q: "How do I generate a tip?",
    a: "Go to the Generate page, enter a medical topic (e.g. 'Beta Blockers'), choose a type (Mnemonic, Clinical Algorithm...) and click Generate. Your tip will be ready in seconds!"
  },
  {
    q: "How does spaced repetition work?",
    a: "Every tip you generate is automatically scheduled for review. You'll find tips to review in the Analytics page under 'Review Today'. Reviews are spaced at day +1, +3, +7, +14, +30 for optimal memory retention."
  },
  {
    q: "What is the Daily Brain Boost?",
    a: "Every day a new medical concept is available with a short explanation and a 3-question quiz. Complete it daily to build your streak 🔥 and reinforce your knowledge consistently."
  },
  {
    q: "How are my tips organized?",
    a: "Your tips are automatically classified by medical specialty (Cardiology, Neurology...) in My Generations. You can also create folders inside each specialty to organize your tips your way."
  },
];

const CoachWidget = () => {
  const { isSignedIn } = useAuth();
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);

  if (!isSignedIn) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">

      {open && (
        <div className="w-80 md:w-96 bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl flex flex-col">

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-pink-600/20 border border-pink-500/30 flex items-center justify-center">
                <SparklesIcon size={14} className="text-pink-400" />
              </div>
              <div>
                <p className="text-white font-semibold text-sm">Help Center</p>
                <p className="text-xs text-zinc-500">Quick answers</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="p-1.5 hover:bg-white/10 rounded-lg transition text-zinc-400">
              <XIcon size={14} />
            </button>
          </div>

          {/* FAQs */}
          <div className="p-3 space-y-2">
            {FAQS.map((faq, idx) => (
              <div key={idx} className="rounded-xl border border-white/10 overflow-hidden">
                <button
                  onClick={() => setExpanded(expanded === idx ? null : idx)}
                  className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/5 transition"
                >
                  <span className="text-xs font-medium text-zinc-200">{faq.q}</span>
                  <ChevronDownIcon
                    size={14}
                    className={`text-zinc-400 shrink-0 ml-2 transition-transform ${expanded === idx ? 'rotate-180' : ''}`}
                  />
                </button>
                {expanded === idx && (
                  <div className="px-4 pb-3 text-xs text-zinc-400 leading-relaxed border-t border-white/10 pt-2">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bouton flottant */}
      <button
        onClick={() => setOpen(!open)}
        className="w-14 h-14 rounded-full bg-pink-600 hover:bg-pink-700 shadow-lg hover:shadow-pink-600/30 transition-all hover:scale-105 flex items-center justify-center"
      >
        {open ? <XIcon size={22} /> : <SparklesIcon size={22} />}
      </button>
    </div>
  );
};

export default CoachWidget;