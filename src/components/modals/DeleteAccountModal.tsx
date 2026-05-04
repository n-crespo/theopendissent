import { useState } from "react";
import { motion } from "framer-motion";
import { deleteUserAccount } from "../../lib/firebase";
import { useAuth } from "../../context/AuthContext";
import { LoadingDots } from "../ui/LoadingDots";

interface Props {
  onClose: () => void;
}

const CONFIRMATION_PHRASE = "I want to delete my account";

export const DeleteAccountModal = ({ onClose }: Props) => {
  const { user } = useAuth();
  const [inputValue, setInputValue] = useState("");
  const [deleteContent, setDeleteContent] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConfirmed = inputValue === CONFIRMATION_PHRASE;

  const handleDelete = async () => {
    if (!isConfirmed || !user) return;

    setIsDeleting(true);
    setError(null);

    try {
      await deleteUserAccount(deleteContent);
      onClose();
      // App.tsx auth observer will handle redirecting the user as their session ends
    } catch (err: any) {
      console.error("Account deletion error:", err);
      setError(
        err.message ||
          "An unexpected error occurred while deleting your account.",
      );
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex flex-col">
      <h2 className="text-xl font-semibold mb-6 text-slate-900 text-center">
        Delete Account
      </h2>
      <p className="text-sm text-slate-500 text-center mb-6 leading-relaxed">
        This action is permanent and cannot be undone. Your account will be
        permanently closed.
      </p>

      <div className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-[clamp(1rem,3vw,1.25rem)] mb-6 text-left">
        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="relative flex items-center justify-center mt-0.5">
            <input
              type="checkbox"
              checked={deleteContent}
              onChange={(e) => setDeleteContent(e.target.checked)}
              disabled={isDeleting}
              className="peer appearance-none w-5 h-5 border-2 border-slate-300 rounded focus:ring-2 focus:ring-logo-red/20 focus:border-logo-red checked:bg-logo-red checked:border-logo-red transition-all cursor-pointer disabled:opacity-50"
            />
            <i className="bi bi-check text-white absolute pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity text-lg leading-none" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-logo-red group-hover:text-logo-red transition-colors">
              Delete all my posts and replies
            </span>
            <span className="text-sm text-slate-500 mt-1 leading-relaxed">
              If unchecked, your content will remain visible but your name will
              be permanently changed to "[Deleted User]".
            </span>
          </div>
        </label>
      </div>

      <div className="w-full text-left mb-6">
        <label className="block mb-2 text-sm text-slate-500 text-center leading-relaxed">
          To confirm, type "{CONFIRMATION_PHRASE}" below:
        </label>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          disabled={isDeleting}
          placeholder={CONFIRMATION_PHRASE}
          className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-logo-red focus:ring-1 focus:ring-logo-red/20 outline-none transition-all text-sm text-slate-900"
        />
      </div>

      {error && (
        <div className="w-full bg-red-50 text-logo-red text-sm p-3 rounded-xl mb-6 flex items-center gap-2">
          <i className="bi bi-exclamation-circle-fill"></i>
          <span className="leading-tight">{error}</span>
        </div>
      )}

      <div className="w-full flex flex-col gap-2">
        <button
          onClick={handleDelete}
          disabled={!isConfirmed || isDeleting}
          className="inline-flex w-full items-center justify-center rounded-xl bg-logo-red px-4 py-2.5 text-sm font-semibold text-white cursor-pointer transition-colors hover:bg-(--disagree) disabled:opacity-50 disabled:hover:bg-logo-red disabled:cursor-not-allowed"
        >
          {isDeleting ? (
            <LoadingDots className="text-white" />
          ) : (
            "Delete permanently"
          )}
        </button>

        <button
          onClick={onClose}
          disabled={isDeleting}
          className="w-full rounded-xl px-4 py-2 text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-100 disabled:opacity-50 disabled:hover:bg-transparent"
        >
          Nevermind, keep it
        </button>
      </div>
    </div>
  );
};
