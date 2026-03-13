import { useNavigate } from "react-router-dom";
import { useAuth } from "@clerk/clerk-react";
import { useCredits } from "../context/CreditsContext";
import { FlameIcon, ZapIcon } from "lucide-react";

const DailyBoostBanner = () => {
  const { isSignedIn } = useAuth();
  const { streak, completedToday } = useCredits();
  const navigate = useNavigate();

  if (!isSignedIn) return null;

  return (
    <div
      onClick={() => navigate('/daily-boost')}
      className="cursor-pointer mx-6 md:mx-16 lg:mx-24 xl:mx-32 mb-8 rounded-2xl border border-pink-500/30 bg-pink-500/10 backdrop-blur px-6 py-4 flex items-center justify-between hover:border-pink-500/60 transition group"
    >
      <div className="flex items-center gap-4">
        <div className="text-3xl">{completedToday ? '✅' : '⚡'}</div>
        <div>
          <p className="text-white font-semibold text-sm">
            {completedToday ? "Daily Boost completed!" : "Your Daily Boost is ready!"}
          </p>
          <p className="text-zinc-400 text-xs mt-0.5">
            {completedToday
              ? "Come back tomorrow for a new concept 🎯"
              : "A new medical concept + quiz is waiting for you"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1.5 bg-orange-500/20 border border-orange-500/30 rounded-full px-3 py-1">
          <FlameIcon size={14} className="text-orange-400" />
          <span className="text-orange-400 font-bold text-sm">{streak} day{streak !== 1 ? 's' : ''}</span>
        </div>
        <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-pink-600 hover:bg-pink-700 transition text-sm font-medium text-white group-hover:scale-105">
          <ZapIcon size={14} /> {completedToday ? 'Review' : 'Start'}
        </button>
      </div>
    </div>
  );
};

export default DailyBoostBanner;