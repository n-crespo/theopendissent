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
      className="flex items-center gap-x-3 py-3 px-4 bg-white border border-slate-200 rounded-2xl cursor-text hover:bg-slate-50 transition-colors shadow-sm"
    >
      <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
        <i className="bi bi-pencil-fill text-lg text-slate-500"></i>
      </div>
      <div className="flex-1 text-slate-500 text-[15px] select-none">
        {placeholder}
      </div>
    </div>
  );
};
