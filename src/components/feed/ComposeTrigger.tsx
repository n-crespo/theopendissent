import { useOutletContext } from "react-router-dom";

interface ComposeTriggerProps {
  placeholder?: string;
}

export const ComposeTrigger = ({
  placeholder = "What's on your mind?",
}: ComposeTriggerProps) => {
  const { setIsComposeOpen }: any = useOutletContext();

  return (
    <div
      onClick={() => setIsComposeOpen(true)}
      className="flex items-center gap-x-3 py-3 px-4 bg-white border border-stone-200 rounded-card cursor-text hover:bg-stone-50 transition-colors shadow-sm"
    >
      <div className="h-10 w-10 rounded-full bg-stone-100 flex items-center justify-center shrink-0">
        <i className="bi bi-pencil-fill text-lg bg-linear-to-r from-logo-red via-logo-green to-logo-blue bg-clip-text text-transparent"></i>
      </div>
      <div className="flex-1 text-stone-500 text-base select-none">
        {placeholder}
      </div>
    </div>
  );
};
