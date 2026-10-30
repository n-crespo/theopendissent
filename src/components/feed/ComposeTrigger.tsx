import { useOutletContext } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

interface ComposeTriggerProps {
  placeholder?: string;
  signedOutPlaceholder?: string;
  className?: string;
}

export const ComposeTrigger = ({
  placeholder = "What's on your mind?",
  signedOutPlaceholder = "Sign in with your UCLA email to post",
  className = "",
}: ComposeTriggerProps) => {
  const { user } = useAuth();
  const { setIsComposeOpen }: any = useOutletContext();

  return (
    <button
      type="button"
      onClick={() => setIsComposeOpen(true)}
      className={`flex w-full items-center gap-x-3 py-3 px-4 text-left bg-white border border-stone-200 rounded-card cursor-text hover:bg-stone-50 transition-colors shadow-sm ${className}`}
    >
      <span className="h-10 w-10 rounded-full bg-stone-100 flex items-center justify-center shrink-0">
        <i className="bi bi-pencil-fill text-lg text-stone-500"></i>
      </span>
      <span className="flex-1 text-stone-500 text-base select-none">
        {user ? placeholder : signedOutPlaceholder}
      </span>
    </button>
  );
};
