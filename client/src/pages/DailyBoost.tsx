import { useEffect, useState } from "react";
import { useAuth } from "@clerk/clerk-react";
import { ZapIcon, CheckCircleIcon, XCircleIcon, FlameIcon, TrophyIcon } from "lucide-react";
import api from "../configs/api";
import { useCredits } from "../context/CreditsContext";
import toast from "react-hot-toast";

interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface Boost {
  date: string;
  specialty: string;
  title: string;
  content: string;
  quiz: QuizQuestion[];
}

type Step = 'concept' | 'quiz' | 'result';

const DailyBoost = () => {
  const { getToken, isSignedIn } = useAuth();
  const { refreshStreak } = useCredits();
  const [boost, setBoost] = useState<Boost | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>('concept');
  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<boolean[]>([]);
  const [streak, setStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [completedToday, setCompletedToday] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const getHeaders = async () => {
    const token = await getToken();
    return { Authorization: `Bearer ${token}` };
  };

  const fetchBoost = async () => {
    try {
      setLoading(true);
      const headers = await getHeaders();
      const [boostRes, streakRes] = await Promise.all([
        api.get('/api/boost/today'),
        isSignedIn ? api.get('/api/boost/streak', { headers }) : Promise.resolve({ data: { currentStreak: 0, longestStreak: 0, completedToday: false } }),
      ]);
      setBoost(boostRes.data.boost);
      setStreak(streakRes.data.currentStreak);
      setLongestStreak(streakRes.data.longestStreak);
      setCompletedToday(streakRes.data.completedToday);
      if (streakRes.data.completedToday) setStep('result');
    } catch (error: any) {
      toast.error('Failed to load daily boost');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
  };

  const handleNext = () => {
    if (selected === null || !boost) return;
    const isCorrect = selected === boost.quiz[currentQ].correctIndex;
    const newAnswers = [...answers, isCorrect];
    setAnswers(newAnswers);

    if (currentQ < boost.quiz.length - 1) {
      setTimeout(() => {
        setCurrentQ(currentQ + 1);
        setSelected(null);
      }, 800);
    } else {
      setTimeout(async () => {
        setStep('result');
        if (isSignedIn) {
          try {
            setSubmitting(true);
            const headers = await getHeaders();
            const { data } = await api.post('/api/boost/complete', {}, { headers });
            setStreak(data.streak);
            setLongestStreak(data.longestStreak);
            setCompletedToday(true);
            refreshStreak();
          } catch (error) {
            console.error(error);
          } finally {
            setSubmitting(false);
          }
        }
      }, 800);
    }
  };

  useEffect(() => {
    fetchBoost();
  }, [isSignedIn]);

  const score = answers.filter(Boolean).length;
  const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <ZapIcon size={40} className="text-pink-400 mx-auto mb-4 animate-pulse" />
        <p className="text-zinc-400">Generating today's boost...</p>
      </div>
    </div>
  );

  if (!boost) return null;

  return (
    <>
      <div className="fixed inset-0 -z-1 pointer-events-none">
        <div className="absolute left-1/2 top-20 -translate-x-1/2 w-245 h-115 bg-linear-to-tr from-pink-800/35 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="min-h-screen pt-32 pb-20 px-4 flex flex-col items-center">
        <div className="w-full max-w-2xl">

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-xs text-zinc-400 capitalize">{today}</p>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                <ZapIcon size={22} className="text-pink-400" /> Daily Brain Boost
              </h1>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="flex items-center gap-1 text-orange-400 font-bold text-lg">
                  <FlameIcon size={20} /> {streak}
                </div>
                <p className="text-xs text-zinc-500">streak</p>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-1 text-yellow-400 font-bold text-lg">
                  <TrophyIcon size={18} /> {longestStreak}
                </div>
                <p className="text-xs text-zinc-500">best</p>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          {step === 'quiz' && (
            <div className="flex gap-2 mb-8">
              {boost.quiz.map((_, i) => (
                <div key={i} className={`flex-1 h-1.5 rounded-full transition-all ${
                  i < currentQ ? 'bg-pink-500' : i === currentQ ? 'bg-pink-400' : 'bg-white/10'
                }`} />
              ))}
            </div>
          )}

          {/* ÉTAPE 1 — CONCEPT */}
          {step === 'concept' && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur">
              <span className="text-xs text-pink-400 font-medium uppercase tracking-wide">{boost.specialty}</span>
              <h2 className="text-2xl font-bold text-white mt-2 mb-6">{boost.title}</h2>
              <p className="text-zinc-300 leading-relaxed text-base mb-8">{boost.content}</p>
              <button
                onClick={() => setStep('quiz')}
                className="w-full py-3 rounded-xl bg-pink-600 hover:bg-pink-700 transition font-semibold text-white flex items-center justify-center gap-2"
              >
                Start Quiz 🎯
              </button>
            </div>
          )}

          {/* ÉTAPE 2 — QUIZ */}
          {step === 'quiz' && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur">
              <p className="text-xs text-zinc-400 mb-4">Question {currentQ + 1} / {boost.quiz.length}</p>
              <h3 className="text-lg font-semibold text-white mb-6">{boost.quiz[currentQ].question}</h3>

              <div className="space-y-3 mb-6">
                {boost.quiz[currentQ].options.map((option, idx) => {
                  const isCorrect = idx === boost.quiz[currentQ].correctIndex;
                  const isSelected = idx === selected;
                  let style = 'bg-white/5 border-white/10 text-zinc-200 hover:border-pink-400';
                  if (selected !== null) {
                    if (isCorrect) style = 'bg-green-500/20 border-green-500 text-green-300';
                    else if (isSelected) style = 'bg-red-500/20 border-red-500 text-red-300';
                    else style = 'bg-white/5 border-white/10 text-zinc-500';
                  }
                  return (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(idx)}
                      className={`w-full text-left px-5 py-3.5 rounded-xl border transition font-medium flex items-center justify-between ${style}`}
                    >
                      <span>{option}</span>
                      {selected !== null && isCorrect && <CheckCircleIcon size={18} className="text-green-400 shrink-0" />}
                      {selected !== null && isSelected && !isCorrect && <XCircleIcon size={18} className="text-red-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Explication */}
              {selected !== null && (
                <div className={`rounded-xl p-4 mb-6 text-sm ${
                  selected === boost.quiz[currentQ].correctIndex
                    ? 'bg-green-500/10 border border-green-500/30 text-green-300'
                    : 'bg-red-500/10 border border-red-500/30 text-red-300'
                }`}>
                  {boost.quiz[currentQ].explanation}
                </div>
              )}

              <button
                onClick={handleNext}
                disabled={selected === null}
                className="w-full py-3 rounded-xl bg-pink-600 hover:bg-pink-700 disabled:opacity-30 transition font-semibold text-white"
              >
                {currentQ < boost.quiz.length - 1 ? 'Next →' : 'See Results 🏆'}
              </button>
            </div>
          )}

          {/* ÉTAPE 3 — RÉSULTAT */}
          {step === 'result' && (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur text-center">
              <div className="text-6xl mb-4">
                {completedToday && answers.length === 0 ? '✅' : score === boost.quiz.length ? '🏆' : score >= 2 ? '🎯' : '💪'}
              </div>

              {completedToday && answers.length === 0 ? (
                <>
                  <h2 className="text-2xl font-bold text-white mb-2">Already done today!</h2>
                  <p className="text-zinc-400 mb-6">Come back tomorrow for a new boost.</p>
                </>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-white mb-2">
                    {score}/{boost.quiz.length} correct
                  </h2>
                  <p className="text-zinc-400 mb-2">
                    {score === boost.quiz.length ? 'Perfect score! 🔥' : score >= 2 ? 'Great job!' : 'Keep practicing!'}
                  </p>
                </>
              )}

              {/* Streak */}
              <div className="flex items-center justify-center gap-6 my-8">
                <div className="text-center">
                  <div className="text-4xl font-bold text-orange-400 flex items-center gap-1 justify-center">
                    <FlameIcon size={32} /> {streak}
                  </div>
                  <p className="text-sm text-zinc-400 mt-1">day streak 🔥</p>
                </div>
                <div className="w-px h-12 bg-white/10" />
                <div className="text-center">
                  <div className="text-4xl font-bold text-yellow-400 flex items-center gap-1 justify-center">
                    <TrophyIcon size={28} /> {longestStreak}
                  </div>
                  <p className="text-sm text-zinc-400 mt-1">best streak</p>
                </div>
              </div>

              {/* Badges */}
              {streak >= 5 && (
                <div className="inline-block bg-orange-500/20 border border-orange-500/30 rounded-full px-4 py-2 text-sm text-orange-300 font-medium mb-6">
                  🔥 On Fire — {streak} days streak!
                </div>
              )}

              <p className="text-zinc-500 text-sm">New boost available tomorrow</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default DailyBoost;