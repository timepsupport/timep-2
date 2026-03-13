import { Loader2Icon, Volume2, VolumeX } from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { ITip } from "../assets/assets";
import remarkGfm from "remark-gfm";
import DOMPurify from "dompurify";
import { ExamFlashCard } from "./ExamFlashCard";
import { TeachBack } from "./TeachBack";
import { ErrorDetection } from "./ErrorDetection";
import { useState, useRef } from "react";

const PreviewPanel = ({
  tip,
  isLoading,
}: {
  tip: ITip | null;
  isLoading: boolean;
}) => {

  const [isSpeaking, setIsSpeaking] = useState(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const getPlainText = (content: string): string => {
    // Strip HTML tags
    const stripped = content.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    // Strip markdown
    return stripped.replace(/[#*_`~>\[\]]/g, "").trim();
  };

  const handleSpeak = () => {
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const rawContent = Array.isArray(tip?.content)
      ? tip!.content.join("\n")
      : tip?.content ?? "";

    const text = `${tip?.title}. ${getPlainText(rawContent)}`;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "fr-FR";
    utterance.rate = 0.95;
    utterance.pitch = 1;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const rawContent = Array.isArray(tip?.content)
    ? tip!.content.join("\n")
    : tip?.content ?? "";

  const isSvg          = rawContent.trimStart().startsWith("<svg");
  const isHtml         = !isSvg && rawContent.trimStart().startsWith("<");
  const isFlash        = (tip?.type as string) === "exam_simulation_flash";
  const isTeachBack    = (tip?.type as string) === "teach_back_method";
  const isErrorDetect  = (tip?.type as string) === "error_detection_mode";
  const isInteractive  = isFlash || isTeachBack || isErrorDetect;

  return (
    <div className="relative h-[560px] overflow-auto rounded-2xl bg-gradient-to-br from-[#1c0f16] via-[#1a0c14] to-[#12070e] p-8">

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 rounded-2xl z-10"
          style={{ background: "linear-gradient(to bottom right, #1c0f16, #1a0c14, #12070e)" }}>
          <Loader2Icon className="size-8 animate-spin text-pink-500" />
          <p className="text-sm text-zinc-300 font-medium">Generating your smart tip...</p>
          <p className="text-xs text-zinc-500">~15 seconds, please wait ⏳</p>
        </div>
      )}

      {/* Tip Content */}
      {!isLoading && tip && (
        <div className="flex flex-col pr-2">

          {/* Type + Audio button */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs uppercase tracking-wider text-pink-400">
              {tip.type}
            </p>
            <button
              onClick={handleSpeak}
              title={isSpeaking ? "Stop audio" : "Listen"}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
                isSpeaking
                  ? "bg-pink-600/20 border-pink-500/40 text-pink-400"
                  : "bg-white/5 border-white/10 text-zinc-400 hover:text-pink-400 hover:border-pink-500/30"
              }`}
            >
              {isSpeaking ? <><VolumeX size={13} /> Stop</> : <><Volume2 size={13} /> Listen</>}
            </button>
          </div>

          <h2 className="text-2xl font-bold text-white mb-6">
            {tip.title}
          </h2>

          <div className="text-zinc-200 text-sm leading-relaxed space-y-4 text-left">

            {isFlash && <ExamFlashCard content={rawContent} />}
            {isTeachBack && <TeachBack content={rawContent} />}
            {isErrorDetect && <ErrorDetection content={rawContent} />}

            {!isInteractive && isSvg && (
              <div className="w-full overflow-x-auto" style={{ cursor: "grab" }}
                dangerouslySetInnerHTML={{ __html: rawContent }} />
            )}

            {!isInteractive && isHtml && (
              <div dangerouslySetInnerHTML={{
                __html: DOMPurify.sanitize(rawContent, {
                  ADD_TAGS: ["svg","path","circle","ellipse","rect","line","polygon","polyline","text","defs","marker","g"],
                  ADD_ATTR: ["viewBox","xmlns","fill","stroke","stroke-width","stroke-dasharray","d","cx","cy","r","rx","ry",
                    "x","y","x1","y1","x2","y2","width","height","font-size","font-family","font-weight","text-anchor",
                    "markerWidth","markerHeight","refX","refY","orient","marker-end","points","opacity","transform"],
                }),
              }} />
            )}

            {!isInteractive && !isSvg && !isHtml && (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h1: ({ node, ...props }) => <h1 className="text-xl font-bold text-white mb-4" {...props} />,
                  h2: ({ node, ...props }) => <h2 className="text-lg font-semibold text-white mb-3" {...props} />,
                  h3: ({ node, ...props }) => <h3 className="text-base font-semibold text-pink-400 mb-2" {...props} />,
                  p:  ({ node, ...props }) => <p className="mb-3 text-zinc-200" {...props} />,
                  li: ({ node, ...props }) => <li className="ml-4 list-disc mb-1 text-zinc-200" {...props} />,
                  strong: ({ node, ...props }) => <strong className="text-white font-semibold" {...props} />,
                  table: ({ node, ...props }) => (
                    <div className="overflow-x-auto my-4">
                      <table className="table-auto border-collapse w-full text-xs" {...props} />
                    </div>
                  ),
                  th: ({ node, ...props }) => <th className="border border-zinc-700 px-2 py-1 bg-zinc-800 text-white" {...props} />,
                  td: ({ node, ...props }) => <td className="border border-zinc-700 px-2 py-1 text-zinc-200" {...props} />,
                }}
              >
                {DOMPurify.sanitize(rawContent)}
              </ReactMarkdown>
            )}

          </div>

          {tip.interests && (
            <p className="text-xs text-zinc-500 mt-6">
              Based on: {Array.isArray(tip.interests) ? tip.interests.join(", ") : tip.interests}
            </p>
          )}

        </div>
      )}

      {/* Empty State */}
      {!isLoading && !tip && (
        <div className="absolute inset-0 flex flex-col items-center justify-center px-8 text-center">
          <h3 className="text-xl font-semibold text-white">Generate your first Tip</h3>
          <p className="mt-3 text-sm text-zinc-400 max-w-md">Fill out the form and click Generate</p>
        </div>
      )}

    </div>
  );
};

export default PreviewPanel;








