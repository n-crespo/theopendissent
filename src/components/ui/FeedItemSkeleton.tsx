// mirrors FeedItem's (post variant) box model so nothing shifts when content loads
export const FeedItemSkeleton = () => {
  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden animate-pulse">
      <div className="p-[clamp(1rem,3vw,1.25rem)] flex flex-col gap-y-4">
        {/* Header Row */}
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-x-3">
            {/* Avatar */}
            <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-100"></div>
            {/* Name & Time */}
            <div className="flex flex-col gap-1.5">
              <div className="h-3 w-24 rounded-full bg-slate-100"></div>
              <div className="h-2 w-16 rounded-full bg-slate-50"></div>
            </div>
          </div>
        </div>

        {/* Content Rows — each row is one line of the real post text */}
        <div className="text-[1.0625rem] leading-relaxed">
          <div className="flex h-[1lh] items-center">
            <div className="h-3 w-full rounded-full bg-slate-50"></div>
          </div>
          <div className="flex h-[1lh] items-center">
            <div className="h-3 w-[90%] rounded-full bg-slate-50"></div>
          </div>
          <div className="flex h-[1lh] items-center">
            <div className="h-3 w-[60%] rounded-full bg-slate-50"></div>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="grid grid-cols-2 border-t border-slate-100 bg-slate-50/20">
        <div className="flex items-center justify-center py-4">
          <div className="h-7 w-5 rounded-md bg-slate-100"></div>
        </div>
        <div className="flex items-center justify-center py-4 border-l border-slate-100">
          <div className="h-7 w-5 rounded-md bg-slate-100"></div>
        </div>
      </div>
    </div>
  );
};
