import { useState } from "react";
import { motion, Variants } from "framer-motion";
import logoUrl from "../../assets/Flat-Logo.svg";
import { SocialLinksRow } from "./SocialLinksRow";

interface LandingPageProps {
  onContinue: (dontShowAgain: boolean) => void;
}

const fadeIn: Variants = {
  hidden: { opacity: 0, y: 15 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: i * 0.2,
      duration: 0.8,
      ease: [0.21, 0.47, 0.32, 0.98],
    },
  }),
};

export const LandingPage = ({ onContinue }: LandingPageProps) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const handleExit = () => {
    setIsExiting(true);
    setTimeout(() => onContinue(dontShowAgain), 500);
  };

  return (
    <div
      className={`fixed inset-0 z-100 bg-logo-offwhite transition-opacity duration-700
        snap-y snap-mandatory overflow-y-auto overflow-x-hidden custom-scrollbar
        ${isExiting ? "opacity-0 pointer-events-none" : "opacity-100"}`}
    >
      {/* 1. Header Overlay (Fixed) */}
      <div className="fixed top-0 left-0 right-0 z-50 h-[30vh] pointer-events-none bg-linear-to-b from-logo-offwhite via-logo-offwhite to-transparent flex justify-center pt-12 px-6">
        <motion.header
          custom={0}
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="max-w-xl w-full text-center pointer-events-auto"
        >
          <img
            src={logoUrl}
            alt="The Open Dissent"
            className="w-full mb-4"
            draggable="false"
          />
          <p className="text-slate-400 font-medium tracking-[0.2em] uppercase text-[11px]">
            Humanizing Political Discourse
          </p>
          <div className="mt-4">
            <SocialLinksRow />
          </div>
        </motion.header>
      </div>

      {/* scrollable content */}
      <main className="relative z-10 w-full">
        {/* text a - centered on load */}
        <section className="snap-start snap-always min-h-screen flex flex-col items-center justify-center px-6 text-center">
          <motion.div
            custom={1}
            initial="hidden"
            animate="visible"
            variants={fadeIn}
            className="max-w-md w-full flex flex-col items-center pt-[5vh]"
          >
            <div className="mb-6 space-y-2">
              <h3 className="text-xl font-bold text-slate-900 tracking-tight pt-[5vh]">
                Modern social media is broken.
              </h3>
            </div>
            <div className="relative w-full bg-white/50 backdrop-blur-sm border border-slate-200 rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden flex flex-col">
              {/* Content Area */}
              <div className="p-10 space-y-7 text-slate-700 text-[16px] leading-relaxed">
                <p className="relative">
                  Addictive algorithms fuels polarity and division.
                </p>

                <p>
                  Ragebait and corporate interests litter our (digital) public
                  square.
                </p>

                <p className="font-medium text-slate-900">
                  Stop interacting with a system that profits from your anger.
                </p>
              </div>

              <div className="animate-bounce text-slate-300">
                <i className="bi bi-chevron-down text-xl"></i>
              </div>
            </div>
          </motion.div>
        </section>

        {/* TEXT B: Scrolled View */}
        <section className="snap-start snap-always min-h-screen flex flex-col items-center justify-center px-6 text-center">
          <div className="max-w-md w-full flex flex-col items-center">
            <div className="mb-6 space-y-2">
              <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                Here's how we're fixing it:
              </h3>
            </div>

            {/* THE CLEAN CARD */}
            <div className="relative w-full bg-white/50 backdrop-blur-sm border border-slate-200 rounded-3xl shadow-xl shadow-slate-200/50 overflow-hidden flex flex-col">
              {/* Scrollable Area with Fade Masks */}
              <div className="relative flex-1 max-h-[40vh] overflow-y-auto custom-scrollbar p-8">
                <ul className="list-disc space-y-6 marker:text-slate-300 text-left w-fit mx-auto pl-6 text-slate-700">
                  <li className="leading-snug">
                    <strong className="text-slate-900">
                      fully anonymous profiles
                    </strong>
                    <p className="text-[13px] text-slate-500 mt-0.5">
                      No popularity contests.
                    </p>
                  </li>
                  <li className="leading-snug">
                    <strong className="text-slate-900">
                      no predatory algorithms
                    </strong>
                    <p className="text-[13px] text-slate-500 mt-0.5">
                      Posts are randomly shuffled.
                    </p>
                  </li>
                  <li className="leading-snug">
                    <strong className="text-slate-900">
                      zero visible metrics
                    </strong>
                    <p className="text-[13px] text-slate-500 mt-0.5">
                      To avoid crowd bias.
                    </p>
                  </li>
                  <li className="leading-snug">
                    <strong className="text-slate-900">
                      sliders for interaction
                    </strong>
                    <p className="text-[13px] text-slate-500 mt-0.5">
                      Real issues have nuance.
                    </p>
                  </li>
                  <li className="leading-snug">
                    <strong className="text-slate-900">
                      our companion podcast
                    </strong>
                    <p className="text-[13px] text-slate-500 mt-0.5">
                      Where online discussions come to life.
                    </p>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* footer overlay */}
      <div className="fixed bottom-0 left-0 right-0 z-50 h-[35vh] pointer-events-none bg-linear-to-t from-logo-offwhite via-logo-offwhite/95 to-transparent flex flex-col items-center justify-end pb-8 px-6 gap-4">
        <motion.strong
          custom={2}
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="text-slate-900 pointer-events-auto"
        >
          Join the conversation today.
        </motion.strong>

        <motion.div
          custom={3}
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="flex w-full justify-center pointer-events-auto"
        >
          <button
            onClick={handleExit}
            className="w-full max-w-xs py-3.5 text-white hover:brightness-110 transition-all active:scale-95 shadow-2xl rounded-2xl bg-linear-to-r from-logo-red via-logo-green to-logo-blue flex items-center justify-center"
          >
            <i className="bi bi-arrow-right text-[32px] leading-none"></i>
          </button>
        </motion.div>

        <motion.label
          custom={5}
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider hover:text-slate-600 cursor-pointer select-none transition-colors pointer-events-auto"
        >
          <input
            type="checkbox"
            className="rounded-sm border-slate-300 text-slate-900 focus:ring-slate-900 h-3.5 w-3.5"
            checked={dontShowAgain}
            onChange={(e) => setDontShowAgain(e.target.checked)}
          />
          Don't show me this message again
        </motion.label>
      </div>
    </div>
  );
};
