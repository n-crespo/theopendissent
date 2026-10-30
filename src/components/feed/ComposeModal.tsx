import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Post } from "../../types";
import { useAuth } from "../../context/AuthContext";
import { useOwnedPosts } from "../../context/OwnedPostsContext";
import { createPost, getPostById } from "../../lib/firebase";
import { pinPostToTop } from "../../hooks/usePosts";
import { getInterpolatedColor, DEFAULT_STOPS } from "../../color-utils";
import {
  EDIT_WINDOW_MS,
  STANCE_VALUES,
  formatStance,
  getStanceLabel,
} from "../../utils";
import { Badge } from "../ui/Badge";

interface ComposeModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentPost?: Post | null;
  /** set when composing a sub-reply — the direct reply being responded to */
  parentReply?: Post | null;
  /** called when the Post is successfully created */
  onSuccess?: (newId: string, parentId?: string) => void;
}

export const ComposeModal = ({
  isOpen,
  onClose,
  parentPost,
  parentReply,
  onSuccess,
}: ComposeModalProps) => {
  const { user } = useAuth();
  const ownedPosts = useOwnedPosts();
  const navigate = useNavigate();
  const location = useLocation();

  const [content, setContent] = useState("");
  // no default stance — direct replies must pick one explicitly
  const [score, setScore] = useState<number | null>(null);
  const [isPosting, setIsPosting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const isThreadAuthor = Boolean(
    parentPost?.id && ownedPosts.has(parentPost.id),
  );
  const isSubReply = !!parentReply;
  const isReply = !!parentPost || isSubReply;
  const isParentReplyAuthor = Boolean(
    parentReply?.id && ownedPosts.has(parentReply.id),
  );

  // lock anonymity to match the user's identity on the thread (post) or,
  // failing that, on the reply they're responding to
  const lockedTo = isThreadAuthor
    ? parentPost
    : isParentReplyAuthor
      ? parentReply
      : null;
  const isIdentityLocked = !!lockedTo;
  const [isAnonymousState, setIsAnonymous] = useState(true);
  const isAnonymous = lockedTo
    ? !lockedTo.authorDisplay || lockedTo.authorDisplay === "Anonymous User"
    : isAnonymousState;

  const authorDisplay =
    isAnonymous || !user?.displayName ? "Anonymous User" : user.displayName;

  const limit = 600;
  const charsLeft = limit - content.length;

  // only direct replies carry a stance (not sub-replies or top-level posts)
  const needsStance = isReply && !isSubReply;
  const isMissingStance = needsStance && score === null;

  useEffect(() => {
    if (isOpen) {
      setContent("");
      setScore(null);
      setIsAnonymous(true);
      setSubmitError(null);
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

  const handleSubmit = async () => {
    if (!content.trim() || !user || isMissingStance || isPosting) return;

    setIsPosting(true);
    setSubmitError(null);
    try {
      const newKey = await createPost({
        userId: user.uid,
        content: content.trim(),
        authorDisplay,
        parentPostId: parentPost?.id,
        parentReplyId: parentReply?.id,
        // handleSubmit bails when a direct reply has no stance, so this is a number
        score: needsStance && score !== null ? score : undefined,
        isThreadAuthor,
      });

      if (newKey) {
        // Fetch the full post object so we can pin it
        // We pass the parent IDs so we fetch from the correct path
        const newPost = await getPostById(
          newKey,
          parentPost?.id,
          parentReply?.id,
        );
        if (newPost) {
          pinPostToTop(newPost);
        }

        // Pass the new ID and Parent ID (if any) to trigger auto-scrolling
        if (onSuccess) {
          onSuccess(newKey, parentReply?.id || parentPost?.id);
        }
        // Navigate to root feed if a top-level post was created from elsewhere (e.g. profile page)
        if (!isReply && location.pathname !== "/") {
          navigate("/");
        }
      }

      onClose();
    } catch (error) {
      console.error("failed to submit:", error);
      setSubmitError(
        `Couldn't ${isReply ? "send your reply" : "publish your post"}. Please try again.`,
      );
    } finally {
      setIsPosting(false);
    }
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
            className="absolute inset-0 bg-stone-900/20 backdrop-blur-md hidden sm:block"
          />

          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 220 }}
            className="relative w-full h-[100dvh] sm:h-auto sm:max-h-[85vh] sm:max-w-xl bg-white sm:rounded-card sm:shadow-2xl flex flex-col overflow-hidden sm:border sm:border-stone-200"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5">
              <button
                onClick={onClose}
                className="p-2 -ml-2 text-stone-400 hover:text-stone-900 transition-colors"
              >
                <i className="bi bi-x-lg text-xl"></i>
              </button>

              <span className="text-sm font-bold text-logo-blue opacity-30">
                {isReply ? "Your thoughts?" : "What's on your mind?"}
              </span>

              <button
                onClick={handleSubmit}
                disabled={!content.trim() || isMissingStance || isPosting}
                title={isMissingStance ? "Pick your stance to reply" : undefined}
                aria-busy={isPosting}
                className={`inline-flex items-center gap-x-1.5 text-sm font-bold text-logo-blue transition-opacity ${isPosting ? "" : "disabled:opacity-30"}`}
              >
                {isPosting && (
                  <i className="bi bi-arrow-repeat animate-spin"></i>
                )}
                {isPosting
                  ? isReply
                    ? "Replying..."
                    : "Posting..."
                  : isReply
                    ? "Reply"
                    : "Post"}
              </button>
            </div>

            {/* Submit context: who this posts as + edit window / errors */}
            <div className="px-6 pb-3 -mt-2 flex flex-col items-end gap-y-0.5 text-right">
              <span className="text-xs font-semibold text-stone-600 flex items-center gap-x-1">
                <i
                  className={`bi ${isAnonymous ? "bi-incognito" : "bi-person-fill"}`}
                ></i>
                Posting as {authorDisplay}
              </span>
              <span className="text-2xs text-stone-400">
                You can edit for {EDIT_WINDOW_MS / 60000} minutes after posting,
                and delete any time.
              </span>
              {submitError && (
                <span
                  role="alert"
                  className="text-xs font-semibold text-logo-red"
                >
                  {submitError}
                </span>
              )}
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8">
              {/* Post As Toggle */}
              <div className="flex items-center justify-between bg-stone-50 border border-stone-200 rounded-control p-4">
                <div className="flex flex-col gap-y-1">
                  <span className="text-sm font-bold text-stone-900 flex items-center gap-x-1.5">
                    <span>Post Anonymously?</span>
                    {isIdentityLocked && (
                      <Badge label="Locked (Author)" variant="slate" />
                    )}
                  </span>
                  <span className="text-xs  text-stone-500">
                    {isIdentityLocked
                      ? `Posting as ${authorDisplay}.`
                      : isAnonymous
                        ? "Your identity will be hidden from everyone."
                        : `Posting publicly as ${user?.displayName || "Anonymous User"}.`}
                  </span>
                </div>
                <button
                  disabled={isIdentityLocked}
                  onPointerDown={(e) => {
                    // Prevent focus/click firing afterwards to avoid double-toggling
                    e.preventDefault();
                    if (!isIdentityLocked) setIsAnonymous(!isAnonymousState);
                  }}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    isAnonymous ? "bg-logo-blue" : "bg-stone-300"
                  } ${isIdentityLocked ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      isAnonymous ? "translate-x-6" : "translate-x-1"
                    }`}
                  />
                </button>
              </div>
              {/* Context area for replies */}
              {(isReply || isSubReply) && (
                <div className="border-l-2 border-stone-100 pl-4 py-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-semibold text-stone-500">
                      Replying to{" "}
                      {isSubReply
                        ? parentReply?.authorDisplay &&
                          parentReply.authorDisplay !== "Anonymous User"
                          ? parentReply.authorDisplay
                          : "Anonymous User"
                        : parentPost?.authorDisplay &&
                            parentPost.authorDisplay !== "Anonymous User"
                          ? parentPost.authorDisplay
                          : "Anonymous User"}
                      ...
                    </span>
                  </div>
                  <p className="text-sm text-stone-500 line-clamp-2 italic leading-relaxed">
                    "
                    {isSubReply
                      ? parentReply?.postContent
                      : parentPost?.postContent}
                    "
                  </p>
                </div>
              )}

              {/* Stance Selector: only for direct replies (not sub-replies) */}
              {needsStance && (
                <div className="space-y-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <span
                      id="stance-label"
                      className="text-sm font-bold text-stone-600"
                    >
                      Your Stance:
                    </span>
                    <span
                      aria-live="polite"
                      className={`text-sm font-semibold ${score === null ? "text-stone-400" : "text-stone-700"}`}
                    >
                      {score === null
                        ? "Pick your stance to reply"
                        : `${formatStance(score)} ${getStanceLabel(score)}`}
                    </span>
                  </div>
                  <div
                    role="radiogroup"
                    aria-labelledby="stance-label"
                    className="flex justify-between gap-2"
                  >
                    {STANCE_VALUES.map((val) => {
                      const color = getInterpolatedColor(val, DEFAULT_STOPS);
                      const isSelected = score === val;
                      return (
                        <button
                          key={val}
                          role="radio"
                          aria-checked={isSelected}
                          aria-label={`${formatStance(val)} ${getStanceLabel(val)}`}
                          title={getStanceLabel(val)}
                          onClick={() => setScore(val)}
                          style={
                            isSelected
                              ? { backgroundColor: color }
                              : {
                                  backgroundColor: `color-mix(in srgb, ${color} 18%, white)`,
                                  borderColor: `color-mix(in srgb, ${color} 45%, white)`,
                                }
                          }
                          className={`flex-1 py-3 rounded-control text-base font-bold border transition-all duration-200
                            ${isSelected ? "text-white border-transparent shadow-xl scale-110 z-10" : "text-stone-700 hover:scale-105 scale-100"}`}
                        >
                          {formatStance(val)}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex justify-between text-2xs font-medium text-stone-500 leading-tight">
                    <span className="w-1/3 text-left">Strongly disagree</span>
                    <span className="w-1/3 text-center">Neutral</span>
                    <span className="w-1/3 text-right">Strongly agree</span>
                  </div>
                </div>
              )}

              {/* Input Area */}
              <div className="relative">
                <textarea
                  maxLength={limit}
                  placeholder={
                    isReply ? "What do you think?" : "Speak your mind..."
                  }
                  value={content}
                  onChange={handleTextChange}
                  className="w-full min-h-50 text-lg text-stone-800 placeholder:text-stone-200 outline-none resize-none leading-relaxed"
                />
                <div
                  className={`text-2xs font-bold text-right pt-4 border-t border-stone-50 ${charsLeft < 50 ? "text-logo-red" : "text-stone-200"}`}
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
