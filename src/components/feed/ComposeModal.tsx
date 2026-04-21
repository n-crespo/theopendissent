/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Post } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { useModal } from "../../context/ModalContext";
import { createPost } from "../../lib/firebase";
import { pinPostToTop } from "../../hooks/usePosts";
import { getInterpolatedColor, DEFAULT_STOPS } from "../../color-utils";

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentPost?: Post | null;
}

export const ComposeModal = ({
  isOpen,
  onClose,
  parentPost,
}: ComposeModalProps) => {
  const { user } = useAuth();
  const { openModal, closeModal } = useModal();

  const [content, setContent] = useState("");
  const [score, setScore] = useState(0);
  const [isPosting, setIsPosting] = useState(false);

  const limit = 600;
  const charsLeft = limit - content.length;
  const isReply = !!parentPost;

  useEffect(() => {
    if (isOpen) {
      setContent("");
      setScore(0);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    // prevent state update if limit is exceeded
    if (val.length <= limit) {
      setContent(val);
    }
  };

  const handleSubmit = () => {
    if (!content.trim() || !user) return;

    openModal("confirmPost", {
      content: content.trim(),
      onConfirm: async () => {
        setIsPosting(true);
        try {
          const newKey = await createPost(
            user.uid,
            content.trim(),
            parentPost?.id,
            isReply ? score : undefined,
          );

          if (newKey) pinPostToTop(newKey);
          onClose();
          closeModal();
        } catch (error) {
          console.error("failed to submit:", error);
        } finally {
          setIsPosting(false);
        }
      },
    });
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex flex-col sm:items-center sm:justify-center sm:px-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/20 backdrop-blur-md hidden sm:block"
          />

          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="relative w-full h-[100dvh] sm:h-auto sm:max-h-[85vh] sm:max-w-xl bg-white sm:rounded-3xl sm:shadow-2xl flex flex-col overflow-hidden sm:border sm:border-slate-200"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5">
              <button
                onClick={onClose}
                className="p-2 -ml-2 text-slate-400 hover:text-slate-900 transition-colors"
              >
                <i className="bi bi-x-lg text-xl"></i>
              </button>

              <span className="text-sm font-bold text-logo-blue opacity-30">
                {isReply ? "Your thoughts?" : "What's on your mind?"}
              </span>

              <button
                onClick={handleSubmit}
                disabled={!content.trim() || isPosting}
                className="text-sm font-bold text-logo-blue disabled:opacity-30 transition-opacity"
              >
                {isReply ? "Reply" : "Post"}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
              {/* Context area for replies */}
              {isReply && (
                <div className="border-l-2 border-slate-100 pl-4 py-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                      Replying to {parentPost?.userId.substring(0, 8)}...
                    </span>
                  </div>
                  <p className="text-sm text-slate-500 line-clamp-2 italic leading-relaxed">
                    "{parentPost?.postContent}"
                  </p>
                </div>
              )}

              {/* Stance Selector: Only for replies */}
              {isReply && (
                <div className="space-y-4">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Your Stance
                  </label>
                  <div className="flex justify-between gap-2 my-2">
                    {[-3, -2, -1, 0, 1, 2, 3].map((val) => {
                      const bgColor = getInterpolatedColor(val, DEFAULT_STOPS);
                      const isSelected = score === val;
                      return (
                        <button
                          key={val}
                          onClick={() => setScore(val)}
                          style={{ backgroundColor: bgColor }}
                          className={`flex-1 py-3 rounded-xl text-md font-bold text-white transition-all duration-200
                            ${isSelected ? "shadow-xl scale-110 z-10" : "opacity-40 hover:opacity-100 scale-100"}`}
                        >
                          {val > 0 ? `+${val}` : val}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Input Area */}
              <div className="relative">
                <textarea
                  maxLength={limit}
                  placeholder={
                    isReply
                      ? "What's your counter-point?"
                      : "Speak your mind..."
                  }
                  value={content}
                  onChange={handleTextChange}
                  className="w-full min-h-50 text-lg text-slate-800 placeholder:text-slate-200 outline-none resize-none leading-relaxed"
                />
                <div
                  className={`text-[10px] font-bold text-right pt-4 border-t border-slate-50 ${charsLeft < 50 ? "text-logo-red" : "text-slate-200"}`}
                >
                  {charsLeft} / {limit}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
