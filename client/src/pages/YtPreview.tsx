import { useSearchParams, useNavigate } from "react-router-dom";

const TimepPreview = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const title = searchParams.get("title") || "";
  const content = searchParams.get("content") || "";
  const type = searchParams.get("type") || "";
  const interests = searchParams.get("interests") || "";

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-6">
      <div className="relative w-full max-w-3xl bg-zinc-900 rounded-2xl p-8 shadow-2xl border border-zinc-700">

        {/* Close button */}
        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white text-xl"
        >
          ✕
        </button>

        {/* Type */}
        <p className="text-xs uppercase text-pink-400 mb-2">
          {type}
        </p>

        {/* Title */}
        <h1 className="text-2xl font-bold text-white mb-4">
          {title}
        </h1>

        {/* Content */}
        <p className="text-zinc-300 leading-relaxed mb-6">
          {content}
        </p>

        {/* Interests */}
        {interests && (
          <p className="text-sm text-zinc-500">
            Based on: {interests}
          </p>
        )}
      </div>
    </div>
  );
};

export default TimepPreview;


