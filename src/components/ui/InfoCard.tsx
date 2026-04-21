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
      <div className="w-full min-h-[22rem] bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col transition-all duration-200">
        <div className="flex-1 p-[clamp(1rem,3vw,1.25rem)] text-[15px] flex flex-col justify-center items-center">
          {children}
        </div>

        {/* fixed height footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/20 grid grid-cols-3 items-center shrink-0">
          {footer}
        </div>
      </div>
    </div>
  );
};
