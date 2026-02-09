export const FeedItemSkeleton = () => {
  return (
    <div className="flex flex-col gap-4 rounded-xl border border-slate-100 bg-white p-4 shadow-sm animate-pulse">
      {/* Header Row */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="h-9 w-9 rounded-md bg-slate-100"></div>
          {/* Name & Time */}
          <div className="flex flex-col gap-1.5">
            <div className="h-3 w-24 rounded-full bg-slate-100"></div>
            <div className="h-2 w-16 rounded-full bg-slate-50"></div>
          </div>
        </div>
      </div>

      {/* Content Rows */}
      <div className="space-y-2 mt-1">
        <div className="h-3 w-full rounded-full bg-slate-50"></div>
        <div className="h-3 w-[90%] rounded-full bg-slate-50"></div>
        <div className="h-3 w-[60%] rounded-full bg-slate-50"></div>
      </div>

      {/* Footer Pills */}
      <div className="flex gap-2 mt-2 pt-3 border-t border-slate-50">
        <div className="h-6 w-16 rounded-full bg-slate-50"></div>
        <div className="h-6 w-16 rounded-full bg-slate-50"></div>
      </div>
    </div>
  );
};
