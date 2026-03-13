import { useState, useEffect } from 'react';
import { TrendingUp, Clock, BookOpen, Zap, CheckCircle, Bell } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import api from '../configs/api';
import { useCredits } from '../context/CreditsContext';

const COLORS = ['#ec4899', '#8b5cf6', '#06b6d4', '#f59e0b', '#6366f1'];

const Analytics = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const { refreshReviews } = useCredits();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewCount, setReviewCount] = useState(0);
  const [reviewedIds, setReviewedIds] = useState<string[]>([]);

  const fetchAll = async () => {
    try {
      const token = await getToken();
      const headers = { Authorization: `Bearer ${token}` };
      const [analyticsRes, reviewsRes] = await Promise.all([
        api.get('/api/user/analytics', { headers }),
        api.get('/api/user/reviews', { headers }),
      ]);
      setData(analyticsRes.data);
      setReviews(reviewsRes.data.reviews);
      setReviewCount(reviewsRes.data.count);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkReviewed = async (tipId: string) => {
    try {
      const token = await getToken();
      await api.post(`/api/user/review/${tipId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReviewedIds(prev => [...prev, tipId]);
      setReviewCount(prev => Math.max(0, prev - 1));
      refreshReviews();
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const maxTips = data ? Math.max(...data.byDay.map((d: any) => d.tips), 1) : 1;

  const stats = data ? [
    { icon: BookOpen, label: 'Total Tips Generated', value: data.totalTips, trend: '📚' },
    { icon: Zap, label: 'Learning Streak', value: `${data.streak} days`, trend: '🔥' },
    { icon: TrendingUp, label: 'Most Used Type', value: data.topTypes?.[0]?.name || 'N/A', trend: '⭐' },
    { icon: Bell, label: 'To Review Today', value: reviewCount, trend: reviewCount > 0 ? '🔔' : '✅' },
  ] : [];

  return (
    <>
      <div className="fixed inset-0 -z-1 pointer-events-none">
        <div className="absolute left-1/2 top-20 -translate-x-1/2 w-245 h-115 bg-linear-to-tr from-pink-800/35 to-transparent rounded-full blur-3xl"></div>
        <div className="absolute right-12 bottom-10 w-105 h-55 bg-linear-to-bl from-red-700/35 to-transparent rounded-full blur-2xl"></div>
      </div>

      <div className="min-h-screen pt-32 lg:pt-40 pb-20 px-4 md:px-8 max-w-7xl mx-auto">
        <div className="bg-white/5 backdrop-blur-md rounded-2xl p-8 md:p-12 border border-white/10 text-gray-300">

          <h1 className="text-3xl md:text-5xl font-semibold mb-8">
            Your <br />
            <span className="bg-linear-to-r md:text-4xl from-pink-400 to-pink-600 bg-clip-text text-transparent">
              Analytics
            </span>
          </h1>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-white/4 border border-white/8 rounded-xl p-6 animate-pulse h-32" />
              ))}
            </div>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                {stats.map((stat, idx) => {
                  const Icon = stat.icon;
                  return (
                    <div key={idx} className="bg-white/4 border border-white/8 rounded-xl p-6 hover:bg-white/6 transition-all">
                      <div className="flex items-start justify-between mb-4">
                        <Icon size={24} className="text-pink-400" />
                        <span className="text-sm font-semibold text-pink-400">{stat.trend}</span>
                      </div>
                      <p className="text-gray-400 text-xs mb-2">{stat.label}</p>
                      <p className="text-3xl font-semibold text-white">{stat.value}</p>
                    </div>
                  );
                })}
              </div>

              {/* Review Today — Duolingo style */}
              {reviews.length > 0 && (
                <div className="mb-10">
                  <div className="flex items-center gap-3 mb-4">
                    <Bell size={20} className="text-pink-400" />
                    <h2 className="text-xl font-semibold text-white">Review Today</h2>
                    <span className="bg-pink-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                      {reviewCount} pending
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {reviews.map((tip: any) => {
                      const isDone = reviewedIds.includes(tip._id);
                      return (
                        <div
                          key={tip._id}
                          className={`relative rounded-xl border p-5 transition-all ${
                            isDone
                              ? 'bg-green-500/10 border-green-500/30 opacity-60'
                              : 'bg-white/4 border-white/10 hover:border-pink-500'
                          }`}
                        >
                          <p className="text-xs uppercase text-pink-400 mb-1">{tip.type}</p>
                          <h3 className="text-sm font-semibold text-white mb-3 line-clamp-2">{tip.title}</h3>
                          <div className="flex gap-2">
                            <button
                              onClick={() => navigate(`/generate/${tip._id}`)}
                              className="flex-1 py-1.5 rounded-lg text-xs font-medium bg-white/10 hover:bg-white/20 transition text-white"
                            >
                              Review 👁️
                            </button>
                            <button
                              onClick={() => handleMarkReviewed(tip._id)}
                              disabled={isDone}
                              className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition flex items-center justify-center gap-1 ${
                                isDone
                                  ? 'bg-green-500/20 text-green-400'
                                  : 'bg-pink-600 hover:bg-pink-700 text-white'
                              }`}
                            >
                              {isDone ? <><CheckCircle size={12} /> Done</> : '✅ Mark as reviewed'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {reviews.length === 0 && (
                <div className="mb-10 bg-green-500/10 border border-green-500/20 rounded-xl p-6 flex items-center gap-4">
                  <CheckCircle size={32} className="text-green-400 shrink-0" />
                  <div>
                    <h3 className="text-white font-semibold">All caught up! 🎉</h3>
                    <p className="text-gray-400 text-sm">No tips to review today. Keep generating to build your review queue.</p>
                  </div>
                </div>
              )}

              {/* Tabs */}
              <div className="flex gap-3 mb-8 border-b border-white/10 pb-4">
                {['overview', 'subjects', 'performance'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-6 py-2 rounded-lg font-medium transition-all capitalize text-sm ${
                      activeTab === tab
                        ? 'bg-linear-to-r from-pink-400 to-pink-600 text-white'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Overview */}
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 bg-white/4 border border-white/8 rounded-xl p-8">
                    <h2 className="text-xl font-semibold text-white mb-6">This Week's Activity</h2>
                    <div className="space-y-4">
                      {data.byDay.map((item: any, idx: number) => (
                        <div key={idx} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium text-gray-400">{item.day}</span>
                            <span className="text-xs text-gray-500">{item.tips} tips</span>
                          </div>
                          <div className="h-8 bg-white/5 rounded-lg overflow-hidden border border-white/10">
                            <div
                              className="h-full bg-linear-to-r from-pink-400 to-pink-600 transition-all duration-500 rounded-lg"
                              style={{ width: `${(item.tips / maxTips) * 100}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white/4 border border-white/8 rounded-xl p-8">
                    <h2 className="text-xl font-semibold text-white mb-6">Type Distribution</h2>
                    {data.topTypes?.length === 0 ? (
                      <p className="text-gray-400 text-sm">No tips generated yet.</p>
                    ) : (
                      <div className="space-y-3">
                        {data.topTypes?.map((type: any, idx: number) => (
                          <div key={idx} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx] }} />
                              <span className="text-gray-400 text-xs capitalize">{type.name}</span>
                            </div>
                            <span className="text-white font-medium text-sm">{type.value}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Subjects */}
              {activeTab === 'subjects' && (
                <div className="bg-white/4 border border-white/8 rounded-xl p-8">
                  <h2 className="text-xl font-semibold text-white mb-6">Tips by Type</h2>
                  {data.topTypes?.length === 0 ? (
                    <p className="text-gray-400 text-sm">No tips generated yet.</p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-white/10">
                            <th className="text-left py-4 px-4 text-gray-400 font-medium text-sm">Type</th>
                            <th className="text-left py-4 px-4 text-gray-400 font-medium text-sm">Tips</th>
                            <th className="text-left py-4 px-4 text-gray-400 font-medium text-sm">Progress</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.topTypes?.map((type: any, idx: number) => (
                            <tr key={idx} className="border-b border-white/5 hover:bg-white/3 transition">
                              <td className="py-4 px-4 font-medium text-white capitalize">{type.name}</td>
                              <td className="py-4 px-4 text-gray-400">{type.value} tips</td>
                              <td className="py-4 px-4">
                                <div className="w-32 bg-white/10 rounded-full h-2 overflow-hidden">
                                  <div
                                    className="h-full bg-linear-to-r from-pink-400 to-pink-600"
                                    style={{ width: `${(type.value / data.totalTips) * 100}%` }}
                                  />
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Performance */}
              {activeTab === 'performance' && (
                <div className="space-y-8">
                  <div className="bg-white/4 border border-white/8 rounded-xl p-8">
                    <h2 className="text-xl font-semibold text-white mb-6">Performance This Week</h2>
                    <div className="h-32 bg-white/5 rounded-lg p-4 border border-white/10 relative overflow-hidden">
                      <svg className="w-full h-full absolute inset-0" preserveAspectRatio="none">
                        <polyline
                          points={data.byDay.map((d: any, i: number) =>
                            `${(i / (data.byDay.length - 1)) * 100}% ${100 - (d.tips / maxTips) * 100}%`
                          ).join(' ')}
                          fill="none"
                          stroke="url(#gradientPink)"
                          strokeWidth="2"
                          vectorEffect="non-scaling-stroke"
                        />
                        <defs>
                          <linearGradient id="gradientPink" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#ec4899" />
                            <stop offset="100%" stopColor="#db2777" />
                          </linearGradient>
                        </defs>
                      </svg>
                      <div className="absolute inset-0 flex items-end justify-between px-4 pb-2 z-10">
                        {data.byDay.map((d: any, i: number) => (
                          <div key={i} className="flex flex-col items-center">
                            <div className="text-xs text-gray-500">{d.day}</div>
                            <div className="text-xs text-pink-400 font-bold">{d.tips}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white/4 border border-white/8 rounded-xl p-8">
                      <h3 className="text-lg font-semibold text-white mb-2">🔥 Current Streak</h3>
                      <p className="text-gray-400 text-sm">
                        {data.streak > 0
                          ? `You've been active for ${data.streak} consecutive day(s). Keep it up!`
                          : "Generate a tip today to start your streak!"}
                      </p>
                    </div>
                    <div className="bg-white/4 border border-white/8 rounded-xl p-8">
                      <h3 className="text-lg font-semibold text-white mb-2">📈 Best Day This Week</h3>
                      <p className="text-gray-400 text-sm">
                        {data.byDay.reduce((best: any, d: any) => d.tips > best.tips ? d : best, data.byDay[0])?.day} with {Math.max(...data.byDay.map((d: any) => d.tips))} tips generated.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default Analytics;