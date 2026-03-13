import { useState } from "react";
import { Share2, Eye, Copy, Check, Heart, Trophy, Clock } from "lucide-react";

const TYPE_LABELS: Record<string, string> = {
  mnemonic: "Mnemonic", mindmap: "Mindmap", clinical_algorithm: "Algorithm",
  chunking_strategy: "Chunking", mini_case_challenge: "Case",
  disease_poster: "Disease Poster", timeline_anchor: "Timeline", analogy: "Analogy",
};

const TIPS = [
  { _id: "1", title: "Myocardial Infarction", type: "mnemonic", specialty: "Cardiology", content: "PATCH Vital:\n- P = Platelets\n- A = Anticoagulants\n- T = Troponin\n- C = Coronaries\n- H = Hospitalization", likes: 214, views: 892, daysAgo: 1 },
  { _id: "2", title: "Bacterial Meningitis", type: "clinical_algorithm", specialty: "Neurology", content: "1. Fever + neck stiffness + photophobia\n2. CT scan if focal signs\n3. LP if CT normal\n4. Empirical antibiotics immediately\n5. Dexamethasone", likes: 187, views: 1204, daysAgo: 3 },
  { _id: "3", title: "Spontaneous Pneumothorax", type: "mindmap", specialty: "Pulmonology", content: "Causes: Bleb rupture, trauma\nSymptoms: Dyspnea, pleuritic pain\nTreatment: Drainage, aspiration", likes: 98, views: 543, daysAgo: 5 },
  { _id: "4", title: "Heart Failure", type: "chunking_strategy", specialty: "Cardiology", content: "Chunk 1: Inability of heart to maintain output\nChunk 2: HTN, MI, valvular\nChunk 3: Dyspnea, edema, fatigue\nChunk 4: ACE inhibitors, beta-blockers", likes: 143, views: 978, daysAgo: 4 },
  { _id: "5", title: "Type 2 Diabetes", type: "disease_poster", specialty: "Pharmacology", content: "Insulin resistance + relative deficiency\nCauses: Obesity, sedentary, genetics\nTreatment: Metformin, GLP-1, insulin", likes: 162, views: 1102, daysAgo: 6 },
  { _id: "6", title: "Acute Appendicitis", type: "mini_case_challenge", specialty: "Surgery", content: "Case: 22yo male, RLQ pain, fever 38.5°C\nQuestion: Pathognomonic sign?\nAnswer: McBurney's sign", likes: 76, views: 672, daysAgo: 7 },
];

const formatDate = (d: number) => d === 0 ? "Today" : d === 1 ? "Yesterday" : `${d}d ago`;

export default function Community() {
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [previewId, setPreviewId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [tips, setTips] = useState(TIPS);

  const topTip = [...tips].sort((a, b) => b.likes - a.likes)[0];

  const handleLike = (id: string) => {
    if (likedIds.has(id)) return;
    setLikedIds(prev => new Set([...prev, id]));
    setTips(prev => prev.map(t => t._id === id ? { ...t, likes: t.likes + 1 } : t));
  };

  const handleCopy = (id: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/generate/${id}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleWA = (tip: typeof TIPS[0]) => {
    window.open(`https://wa.me/?text=${encodeURIComponent(`🩺 "${tip.title}" — Timep AI\n${window.location.origin}`)}`, "_blank");
  };

  return (
    <>
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute left-1/2 top-20 -translate-x-1/2 w-[900px] h-[400px] bg-gradient-to-tr from-pink-800/25 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="min-h-screen pt-28 pb-20 px-4 md:px-8 max-w-6xl mx-auto">

        {/* HEADER */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold mb-3" style={{ background: "linear-gradient(135deg, #f9a8d4, #ec4899)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            Community Tips
          </h1>
          <p className="text-zinc-500 text-sm max-w-md mx-auto">
            Les meilleurs tips médicaux partagés par la communauté Timep.{" "}
            <a href="/generate" className="text-pink-500 hover:text-pink-400 transition">Génère le tien →</a>
          </p>
        </div>

        {/* TIP OF THE WEEK */}
        <div className="mb-10 rounded-2xl p-px" style={{ background: "linear-gradient(135deg, rgba(236,72,153,0.5), rgba(255,255,255,0.05))" }}>
          <div className="rounded-2xl bg-[#0d0d18] p-6">
            <div className="flex items-center gap-2 mb-4">
              <Trophy size={14} className="text-pink-400" />
              <span className="text-pink-400 font-semibold text-sm">Tip of the Week</span>
              <span className="text-zinc-600 text-xs">· most liked</span>
            </div>
            <p className="text-zinc-100 font-bold text-xl mb-1">{topTip.title}</p>
            <p className="text-zinc-500 text-xs mb-4">{topTip.specialty} · {TYPE_LABELS[topTip.type]}</p>
            <div className="bg-black/30 rounded-xl p-3 text-xs text-zinc-400 leading-relaxed whitespace-pre-wrap border border-white/8 mb-4 max-h-24 overflow-y-auto">
              {topTip.content}
            </div>
            <div className="flex gap-2">
              <button onClick={() => handleLike(topTip._id)} disabled={likedIds.has(topTip._id)}
                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition flex items-center justify-center gap-2 border ${likedIds.has(topTip._id) ? "bg-pink-600/25 border-pink-500/50 text-pink-400" : "bg-white/5 border-white/10 text-zinc-400 hover:text-pink-400 hover:border-pink-500/40"}`}>
                <Heart size={14} fill={likedIds.has(topTip._id) ? "currentColor" : "none"} />
                {topTip.likes + (likedIds.has(topTip._id) ? 1 : 0)} likes
              </button>
              <button onClick={() => handleWA(topTip)}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium bg-white/5 border border-white/10 text-zinc-400 hover:text-pink-400 hover:border-pink-500/40 transition flex items-center justify-center gap-2">
                <Share2 size={14} /> Partager
              </button>
            </div>
          </div>
        </div>

        {/* GRID */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tips.map(tip => (
            <div key={tip._id} className="bg-white/4 border border-white/8 rounded-2xl p-5 flex flex-col gap-3 hover:border-pink-500/30 transition-all">
              <div>
                <span className="text-xs text-pink-500 font-semibold">{TYPE_LABELS[tip.type]}</span>
                <h3 className="text-zinc-100 font-semibold text-base mt-1 leading-snug">{tip.title}</h3>
                <p className="text-xs text-zinc-500 mt-0.5">{tip.specialty}</p>
              </div>

              <button onClick={() => setPreviewId(previewId === tip._id ? null : tip._id)}
                className="text-xs text-zinc-500 hover:text-pink-400 flex items-center gap-1.5 transition w-fit">
                <Eye size={12} /> {previewId === tip._id ? "Fermer" : "Aperçu"}
              </button>

              {previewId === tip._id && (
                <div className="bg-black/30 rounded-xl p-3 text-xs text-zinc-400 leading-relaxed max-h-32 overflow-y-auto whitespace-pre-wrap border border-white/8">
                  {tip.content}
                </div>
              )}

              <div className="flex items-center gap-3 text-xs text-zinc-500">
                <span className="flex items-center gap-1"><Heart size={11} /> {tip.likes + (likedIds.has(tip._id) ? 1 : 0)}</span>
                <span className="flex items-center gap-1"><Eye size={11} /> {tip.views}</span>
                <span className="flex items-center gap-1 ml-auto"><Clock size={11} /> {formatDate(tip.daysAgo)}</span>
              </div>

              <div className="border-t border-white/8" />

              <div className="flex gap-2">
                <button onClick={() => handleLike(tip._id)} disabled={likedIds.has(tip._id)}
                  className={`py-1.5 px-3 rounded-lg text-xs font-medium transition flex items-center gap-1.5 border ${likedIds.has(tip._id) ? "bg-pink-600/20 border-pink-500/40 text-pink-400" : "bg-white/5 border-white/10 text-zinc-400 hover:text-pink-400 hover:border-pink-500/30"}`}>
                  <Heart size={12} fill={likedIds.has(tip._id) ? "currentColor" : "none"} />
                  {likedIds.has(tip._id) ? "Liked" : "Like"}
                </button>
                <button onClick={() => handleCopy(tip._id)}
                  className="flex-1 py-1.5 rounded-lg text-xs bg-white/5 border border-white/10 text-zinc-400 hover:text-pink-400 hover:border-pink-500/30 transition flex items-center justify-center gap-1.5">
                  {copiedId === tip._id ? <><Check size={12} className="text-green-400" /> Copié</> : <><Copy size={12} /> Lien</>}
                </button>
                <button onClick={() => handleWA(tip)}
                  className="px-3 py-1.5 rounded-lg text-xs bg-white/5 border border-white/10 text-zinc-400 hover:text-pink-400 hover:border-pink-500/30 transition flex items-center gap-1.5">
                  <Share2 size={12} /> WA
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-14 rounded-2xl p-px" style={{ background: "linear-gradient(135deg, rgba(236,72,153,0.3), rgba(255,255,255,0.05))" }}>
          <div className="rounded-2xl bg-[#0d0d18] p-8 text-center">
            <h2 className="text-lg font-bold text-zinc-100 mb-2">Génère ton propre tip</h2>
            <p className="text-zinc-500 text-sm mb-5 max-w-sm mx-auto">
              Crée un tip sur n'importe quel sujet médical et partage-le avec tes collègues.
            </p>
            <a href="/generate" className="inline-block bg-pink-600 hover:bg-pink-700 transition px-6 py-2.5 rounded-xl text-white font-semibold text-sm">
              Générer un tip →
            </a>
          </div>
        </div>

      </div>
    </>
  );
}