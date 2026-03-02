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
        <div className="max-w-xl w-full px-6 py-16 md:px-14">
          <header className="mb text-center justify-center">
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
          <div className="space-y-4 text-slate-900 text-center my-16">
            <section>Modern social media fuels polarity and division.</section>
            <section>
              Ragebait and corporate interests litter our (digital) public
              square.
            </section>
            <section>
              Stop interacting with the algorithm that profits from your anger.
            </section>
            <section>
              <strong>Join the conversation today.</strong>
            </section>
          </div>
          <div className="flex flex-col justify-center items-center gap-4 mt-12">
            <div className="flex w-full justify-center">
              <button
                onClick={handleExit}
                className="w-auto px-24 py-2 text-white hover:bg-black transition-all active:scale-95 shadow-xl rounded-xl bg-linear-to-r from-logo-red via-logo-green to-logo-blue flex items-center justify-center"
              >
                <i className="bi bi-arrow-right text-[30px] leading-none"></i>
              </button>
            </div>

            <label className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider hover:text-slate-600 cursor-pointer select-none transition-colors mt-2">
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
    </>
  );
};
