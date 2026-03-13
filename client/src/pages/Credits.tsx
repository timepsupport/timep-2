import { useCredits } from "../context/CreditsContext";
import { Zap, Flame, BookOpen, Crown, RefreshCw, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Credits = () => {
  const { credits, streak, completedToday, reviewCount, refreshCredits } = useCredits();
  const navigate = useNavigate();

  const maxCredits = 20;
  const percent = credits != null ? Math.min((credits / maxCredits) * 100, 100) : 0;

  const getCreditsColor = () => {
    if (credits == null) return "#6366f1";
    if (credits > 10) return "#10b981";
    if (credits > 5) return "#f59e0b";
    return "#ef4444";
  };

  const getCreditsMessage = () => {
    if (credits == null) return "";
    if (credits === 0) return "No credits left today — resets at midnight 🌙";
    if (credits <= 3) return "Almost out — use them wisely!";
    if (credits <= 10) return "You're halfway through 💪";
    return "You're all set — start generating! 🚀";
  };

  return (
    <>
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute left-1/2 top-20 -translate-x-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-pink-800/20 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="min-h-screen pt-28 pb-20 px-4 max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-zinc-100 mb-2">My Credits</h1>
          <p className="text-zinc-500 text-sm">Your Timep resources at a glance</p>
        </div>

        {/* Credits Card */}
        <div className="bg-white/4 border border-white/10 rounded-2xl p-6 mb-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-pink-600/20 flex items-center justify-center">
                <Zap size={16} className="text-pink-400" />
              </div>
              <span className="text-zinc-200 font-semibold">Available Credits</span>
            </div>
            <button onClick={refreshCredits} className="text-zinc-500 hover:text-zinc-300 transition">
              <RefreshCw size={15} />
            </button>
          </div>

          <div className="flex items-end gap-2 mb-3">
            <span className="text-5xl font-bold" style={{ color: getCreditsColor() }}>
              {credits ?? "—"}
            </span>
            <span className="text-zinc-500 text-lg mb-1">/ {maxCredits}</span>
          </div>

          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-3">
            <div className="h-full rounded-full transition-all duration-700"
              style={{ width: `${percent}%`, background: getCreditsColor() }} />
          </div>

          <p className="text-sm text-zinc-400">{getCreditsMessage()}</p>

          <div className="mt-4 pt-4 border-t border-white/8 flex items-center gap-2 text-xs text-zinc-500">
            <RefreshCw size={11} />
            Credits reset automatically every day at midnight
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-white/4 border border-white/10 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-orange-600/20 flex items-center justify-center">
                <Flame size={16} className="text-orange-400" />
              </div>
              <span className="text-zinc-400 text-sm">Streak</span>
            </div>
            <p className="text-3xl font-bold text-zinc-100">{streak} <span className="text-lg">🔥</span></p>
            <p className="text-xs text-zinc-500 mt-1">
              {completedToday ? "✅ Today's goal reached!" : "⏳ Generate a tip today"}
            </p>
          </div>

          <div className="bg-white/4 border border-white/10 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center">
                <BookOpen size={16} className="text-blue-400" />
              </div>
              <span className="text-zinc-400 text-sm">Tips Generated</span>
            </div>
            <p className="text-3xl font-bold text-zinc-100">{reviewCount}</p>
            <p className="text-xs text-zinc-500 mt-1">total</p>
          </div>
        </div>

        {/* Free plan info */}
        <div className="bg-white/4 border border-white/10 rounded-2xl p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Crown size={15} className="text-yellow-400" />
            <span className="text-zinc-200 font-semibold text-sm">Free Plan</span>
          </div>
          <ul className="space-y-2 text-sm text-zinc-400">
            <li className="flex items-center gap-2"><span className="text-green-400">✓</span> 20 generations per day</li>
            <li className="flex items-center gap-2"><span className="text-green-400">✓</span> All tip types available</li>
            <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Unlimited saves</li>
            <li className="flex items-center gap-2"><span className="text-green-400">✓</span> Community access</li>
          </ul>
        </div>

        {/* CTA */}
        <button
          onClick={() => navigate("/generate")}
          className="w-full py-3.5 rounded-2xl bg-pink-600 hover:bg-pink-700 transition text-white font-semibold flex items-center justify-center gap-2"
        >
          <Zap size={16} /> Generate a tip now
          <ArrowRight size={15} />
        </button>

      </div>
    </>
  );
};

export default Credits;