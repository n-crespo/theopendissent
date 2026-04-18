import React from "react";

interface InfoCardProps {
  title: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}

export const InfoCard = ({ title, children, footer }: InfoCardProps) => {
  return (
    <div className="w-full flex flex-col">
      {/* title area */}
      <div className="mb-6 text-center">
        <h3 className="text-xl font-bold text-slate-900 tracking-tight">
          {title}
        </h3>
      </div>

      {/* card body */}
      <div className="bg-white/50 backdrop-blur-sm border border-slate-200 rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden flex flex-col">
        <div className="p-10 text-[16px]">{children}</div>

        {/* fixed height footer */}
        <div className="border-t border-slate-100 h-16 px-4 grid grid-cols-3 items-center shrink-0">
          {footer}
        </div>
      </div>
    </div>
  );
};
