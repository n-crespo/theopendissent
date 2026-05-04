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
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isConfirmed = inputValue === CONFIRMATION_PHRASE;

  const handleDelete = async () => {
    if (!isConfirmed || !user) return;
    
    setIsDeleting(true);
    setError(null);
    
    try {
      await deleteUserAccount();
      onClose();
      // App.tsx auth observer will handle redirecting the user as their session ends
    } catch (err: any) {
      console.error("Account deletion error:", err);
      setError(
        err.message || "An unexpected error occurred while deleting your account."
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
        This action is permanent and cannot be undone. 
        All your posts, replies, and profile data will be completely wiped from our servers immediately.
      </p>

      <div className="w-full text-left mb-6">
        <label className="block text-xs font-semibold text-slate-500 mb-2 tracking-tight uppercase">
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
          {isDeleting ? <LoadingDots className="text-white" /> : "Delete permanently"}
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
