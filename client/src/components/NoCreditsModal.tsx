import { motion, AnimatePresence } from "motion/react";
import { SparklesIcon, XIcon } from "lucide-react";

interface NoCreditsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const NoCreditsModal = ({ isOpen, onClose }: NoCreditsModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed z-50 inset-0 flex items-center justify-center px-4"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <div className="relative w-full max-w-md bg-[#0f172a] border border-white/10 rounded-2xl p-8 shadow-2xl text-center">
              
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-zinc-400 hover:text-white transition"
              >
                <XIcon size={20} />
              </button>

              {/* Icon */}
              <div className="flex justify-center mb-5">
                <div className="bg-pink-600/20 border border-pink-500/30 rounded-full p-4">
                  <SparklesIcon className="text-pink-400" size={32} />
                </div>
              </div>

              {/* Title */}
              <h2 className="text-2xl font-bold text-white mb-3">
                You're out of credits! 🚀
              </h2>

              {/* Message */}
              <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                You've used all your free credits for today. <br />
                Don't worry — <span className="text-white font-medium">your credits reset every 24 hours</span>. 
                Come back tomorrow and keep learning!
              </p>

              {/* Tag */}
              <div className="inline-block bg-pink-600/10 border border-pink-500/20 text-pink-400 text-xs font-medium px-4 py-1.5 rounded-full mb-6">
                💡 New credits every day — see you tomorrow!
              </div>

              {/* CTA */}
              <button
                onClick={onClose}
                className="w-full py-3 rounded-xl font-medium bg-pink-600 hover:bg-pink-700 transition text-white"
              >
                Got it, see you tomorrow! 👋
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default NoCreditsModal;