import { useState } from "react";
import { Eye } from "lucide-react";

// Le contenu généré a ce format :
// QUESTION: Explique la démarche diagnostique de l'insuffisance aortique
// ---
// [réponse complète]

const parseTeachBack = (raw: string) => {
  const lines = raw.split("\n");
  let question = "";
  let answerLines: string[] = [];
  let pastSep = false;

  for (const line of lines) {
    if (line.startsWith("QUESTION:")) {
      question = line.replace("QUESTION:", "").trim();
    } else if (line.trim() === "---") {
      pastSep = true;
    } else if (pastSep || (!question && !line.startsWith("QUESTION:"))) {
      answerLines.push(line);
    }
  }

  // fallback si pas de format QUESTION:
  if (!question) question = "Explique ce concept dans tes propres mots";
  const answer = answerLines.join("\n").trim() || raw.trim();
  return { question, answer };
};

export const TeachBack = ({ content }: { content: string }) => {
  const { question, answer } = parseTeachBack(content);
  const [userText, setUserText] = useState("");
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="flex flex-col gap-4">

      {/* Question précise */}
      <div className="bg-pink-600/10 border border-pink-500/30 rounded-xl px-4 py-4">
        <p className="text-xs text-pink-400 font-semibold uppercase tracking-wide mb-1">🧠 Ta mission</p>
        <p className="text-zinc-100 text-sm font-medium leading-relaxed">{question}</p>
      </div>

      {/* Zone de texte user */}
      <textarea
        value={userText}
        onChange={e => setUserText(e.target.value)}
        placeholder="Écris ta réponse ici..."
        rows={5}
        className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none text-sm"
      />

      {/* Bouton révéler */}
      {!revealed ? (
        <button
          onClick={() => setRevealed(true)}
          className="w-full py-3 rounded-xl bg-pink-600 hover:bg-pink-700 text-white text-sm font-medium transition flex items-center justify-center gap-2"
        >
          <Eye size={15} /> Voir la bonne réponse
        </button>
      ) : (
        <div className="bg-white/5 border border-white/10 rounded-xl p-5">
          <div className="text-xs text-green-400 font-semibold mb-3 uppercase tracking-wide">✅ Réponse</div>
          <div className="text-zinc-200 text-sm leading-relaxed whitespace-pre-wrap">{answer}</div>
        </div>
      )}

    </div>
  );
};