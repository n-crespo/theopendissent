import { useState } from "react";
import logoUrl from "../../assets/Flat-Logo.svg";
import { SocialLinksRow } from "./SocialLinksRow";

interface LandingPageProps {
  onContinue: (dontShowAgain: boolean) => void;
}

export const LandingPage = ({ onContinue }: LandingPageProps) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const handleExit = () => {
    setIsExiting(true);
    // match the duration of the transition (500ms)
    setTimeout(() => {
      onContinue(dontShowAgain);
    }, 500);
  };

  return (
    <>
      <div
        className={`fixed inset-0 z-100 flex items-center justify-center bg-logo-offwhite transition-opacity duration-700 ease-in-out
    ${isExiting ? "opacity-0 pointer-events-none" : "opacity-100"}
  `}
      >
        <div className="max-w-xl w-full px-8 py-16 md:px-14">
          <header className="mb-16 text-center justify-center">
            <h1 className="text-4xl font-bold text-slate-900 mb-4 tracking-tighter flex justify-center items-center">
              <img
                src={logoUrl}
                alt="App Icon"
                draggable="false"
                className="w-full"
              />
            </h1>
            <p className="text-slate-400 font-medium tracking-[0.2em] uppercase text-[11px] mb-4">
              Humanizing Political Discourse
            </p>
            <SocialLinksRow />
          </header>

          {/* Contents */}
          <div className="space-y-7 text-slate-900 text-center">
            <section className="text-center">
              <p className="leading-relaxed">
                The Open Dissent is a <strong>social platform</strong> and
                <strong> podcast</strong> dedicated to humanizing political
                discourse.
              </p>
            </section>
            <section>
              <p className="leading-relaxed text-[15px]">
                Our social feed combats the polarization of virality.
              </p>
            </section>
            <section>
              <p className="leading-relaxed text-[15px]">
                Our debates turn your posts into human conversations.
              </p>
            </section>
            <section>
              A functional democracy cannot survive without open dissent.
            </section>
            <div className="flex flex-col justify-center items-center gap-4">
              <div className="font-bold mt-8 text-slate-900">
                Join the conversation today.
              </div>

              {/* The Fix: Explicit centering wrapper for the gradient button */}
              <div className="flex w-full justify-center">
                <button
                  onClick={handleExit}
                  className="w-auto px-24 py-2 text-white hover:bg-black transition-all active:scale-95 shadow-xl rounded-xl bg-linear-to-r from-logo-red via-logo-green to-logo-blue flex items-center justify-center"
                >
                  <i className="bi bi-arrow-right text-[30px] leading-none"></i>
                </button>
              </div>

              <label className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-widest hover:text-slate-600 cursor-pointer select-none transition-colors mt-2">
                <input
                  type="checkbox"
                  className="rounded-sm border-slate-300 text-slate-900 focus:ring-slate-900 h-3.5 w-3.5"
                  checked={dontShowAgain}
                  onChange={(e) => setDontShowAgain(e.target.checked)}
                />
                Don't show me this message again
              </label>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
