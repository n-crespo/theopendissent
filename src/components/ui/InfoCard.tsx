import React from "react";

interface InfoCardProps {
  title: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}

export const InfoCard = ({ title, children, footer }: InfoCardProps) => {
  return (
    <div className="w-full flex flex-col items-center">
      {/* title area */}
      <div className="mb-6 text-center">
        <h3 className="text-xl font-bold text-slate-900 tracking-tight">
          {title}
        </h3>
      </div>

      {/* card body */}
      <div className="bg-white/50 backdrop-blur-sm border border-slate-200 rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden flex flex-col">
        <div className="pt-7 px-12 text-lg items-center">{children}</div>

        {/* fixed height footer */}
        <div className="p-4 mt-3 grid grid-cols-3 items-center shrink-0">
          {footer}
        </div>
      </div>
    </div>
  );
};
