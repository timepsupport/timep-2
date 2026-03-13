import { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { type ITip } from "../assets/assets";
import SoftBackdrop from "../components/SoftBackdrop";
import AspectRatioSelector from "../components/AspectRatioSelector";
import StyleSelector, { type Tip, type TipAspect } from "../components/StyleSelector";
import PreviewPanel from "../components/PreviewPanel";
import { useAuth } from "@clerk/clerk-react";
import toast from "react-hot-toast";
import api from "../configs/api";
import NoCreditsModal from "../components/NoCreditsModal";
import { useCredits } from "../context/CreditsContext";

const Generate = () => {
  const { id } = useParams();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { isSignedIn, getToken } = useAuth();
  const { refreshCredits } = useCredits();

  const [title, setTitle] = useState("");
  const [interestsText, setInterestsText] = useState("");
  const [tip, setTip] = useState<ITip | null>(null);
  const [loading, setLoading] = useState(false);
  const [isGenerating, setIsGenerating ] = useState(false);

  const [selectedAspect, setSelectedAspect] = useState<TipAspect>("memory_boost");
  const [selectedTip, setSelectedTip] = useState<Tip>("Mnemonic");
  const [styleDropdownOpen, setStyleDropdownOpen] = useState(false);
  const [showNoCredits, setShowNoCredits] = useState(false);

  useEffect(() => {
    console.log("isSignedIn:", isSignedIn);
    getToken().then(t => console.log("TOKEN:", t));
  }, [isSignedIn]);

  const handleGenerate = async () => {
    if (!isSignedIn) return toast.error("Please login to generate tips");
    if (!title.trim()) return toast.error("Title is required");

    try {
      setLoading(true);
      setIsGenerating(true);
      setTip(null);

      const token = await getToken();

      const api_payload = {
        title,
        type: selectedTip,
        aspect: selectedAspect,
        interests: interestsText.split(",").map(i => i.trim()).filter(Boolean),
        consice: true,
        text_overlay: true,
      };

      const { data } = await api.post("/api/tip/generate", api_payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (data && data.data) {
        setTip({
          _id: data.data._id,
          userId: data.data.userId,
          title: data.data.title,
          content: data.data.content,
          type: data.data.type,
          aspect: data.data.aspect,
          interests: data.data.interests || [],
          isGenerating: false,
          createdAt: new Date(data.data.createdAt),
        });

        toast.success("Tip generated successfully!");
        setIsGenerating(false);
        await refreshCredits();
        navigate(`/generate/${data.data._id}`);
      }

    } catch (error: any) {
      console.log(error);
      if (error?.response?.status === 403) {
        setShowNoCredits(true);
      } else {
        toast.error(error?.response?.data?.message || error.message);
      }
    } finally {
      setLoading(false);
      setIsGenerating(false)
    }
  };

  const fetchTip = async () => {
    try {
      const token = await getToken();

      const { data } = await api.get(`/api/user/tip/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setTip(data?.tip as ITip);
      setLoading(!data.tip);
      setInterestsText(Array.isArray(data?.tip?.interests) ? data.tip.interests.join(", ") : "");
      setTitle(data?.tip?.title || "");
      setSelectedAspect(data?.tip?.aspect || "memory_boost");

    } catch (error: any) {
      console.log(error);
      toast.error(error?.response?.data?.message || error.message);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isSignedIn && id) {
      fetchTip();
    }

    if (id && loading && isSignedIn) {
      const interval = setInterval(() => {
        fetchTip();
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [id, loading, isSignedIn]);

  useEffect(() => {
    if (!id && tip) {
      setTip(null);
    }
  }, [pathname]);

  useEffect(() => {
    const defaults: Record<TipAspect, Tip> = {
      memory_boost: "Mnemonic",
      structured_thinking: "Clinical Algorithm",
      active_learning: "Socratic Questioning",
      visual_anchor: "Timeline Anchor",
    };

    if (!tip) setSelectedTip(defaults[selectedAspect]);
    setStyleDropdownOpen(false);
  }, [selectedAspect, tip]);

  return (
    <>
      <SoftBackdrop />

      <div className="pt-24 min-h-screen">
        <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-28 lg:pb-8">
          <div className="flex gap-8 items-start">

            {/* LEFT PANEL */}
            <div className="flex-1 p-6 rounded-2xl bg-white/10 border border-white/20 shadow-xl space-y-6">
              <div>
                <h2 className="text-xl font-bold text-zinc-100 mb-1">
                  Create Your Tip
                </h2>
                <p className="text-sm text-zinc-400">
                  Describe your topic and generate a smart learning tip
                </p>
                <p className="text-xs text-zinc-400 mt-1">
  🇫🇷 Supports French and English medical terms
</p>
              </div>

              <div className="space-y-5">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Cranial Nerves Functions"
                  maxLength={200}
                  className="w-full px-4 py-3 rounded-lg border border-white/10 bg-white/6 text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-pink-500"
                />

                <div className="text-right text-xs text-zinc-400">
                  {title.length}/200
                </div>

                <AspectRatioSelector
                  value={selectedAspect}
                  onChange={(aspect: TipAspect) => setSelectedAspect(aspect)}
                />

                <StyleSelector
                  selectedAspect={selectedAspect}
                  value={selectedTip}
                  onChange={setSelectedTip}
                  isOpen={styleDropdownOpen}
                  setIsOpen={setStyleDropdownOpen}
                />

                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    Your hobbies or interests
                  </label>
                  <textarea
                    value={interestsText}
                    onChange={(e) => setInterestsText(e.target.value)}
                    rows={3}
                    placeholder="e.g., Football, Cinema, Video Games…"
                    className="w-full px-4 py-3 rounded-lg border border-white/10 bg-white/6 text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-pink-500 resize-none"
                  />
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full py-3 rounded-xl font-medium bg-pink-600 hover:bg-pink-700 transition"
              >
                {isGenerating ? (
  <span className="flex items-center justify-center gap-2">
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
    </svg>
    Generating... (~15s)
  </span>
) : "Generate Tip"}
              </button>
            </div>

            {/* RIGHT PANEL */}
            <div className="flex-[2] p-6 rounded-2xl bg-white/10 border border-white/20 shadow-xl">
              <h2 className="text-xl font-bold text-zinc-100 mb-4">Preview</h2>

              <div style={{ minHeight: "400px" }}>
                <PreviewPanel tip={tip} isLoading={isGenerating} />
              </div>
            </div>

          </div>
        </main>
      </div>
      <NoCreditsModal isOpen={showNoCredits} onClose={() => setShowNoCredits(false)} />
    </>
  );
};

export default Generate;