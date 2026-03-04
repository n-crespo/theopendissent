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
            className="max-w-xl space-y-6 text-slate-900 text-[16px] leading-relaxed pt-[10vh]"
          >
            <p>Modern social media fuels polarity and division.</p>
            <p>
              Ragebait and corporate interests litter our (digital) public
              square.
            </p>
            <p>
              Stop interacting with an algorithm that profits from your anger.
            </p>
            <div className="mt-12 animate-bounce text-slate-400">
              <i className="bi bi-chevron-down text-2xl"></i>
            </div>
          </motion.div>
        </section>

        {/* TEXT B: Scrolled View */}
        <section className="snap-start snap-always min-h-screen flex flex-col items-center justify-center px-6 text-center">
          <div className="max-w-lg w-full space-y-6 text-slate-900 text-[16px] leading-relaxed py-[20vh] flex flex-col items-center">
            <p>Here's how we're fixing it:</p>

            {/* INDEPENDENT SCROLL CONTAINER */}
            <div className="w-full max-h-[35vh] overflow-y-auto custom-scrollbar pr-2 border-y border-slate-100 py-4">
              <ul className="list-disc space-y-6 marker:text-slate-400 text-left w-fit mx-auto pl-7">
                <li>
                  <strong>fully anonymous profiles</strong> (no popularity
                  contests)
                </li>
                <li>
                  <strong>no predatory algorithms</strong> (posts are randomly
                  shuffled)
                </li>
                <li>
                  <strong>zero visible metrics</strong> (to avoid crowd bias)
                </li>
                <li>
                  <strong>sliders for interaction</strong> (real issues have
                  nuance)
                </li>
                <li>
                  <strong>our podcast</strong> (where online discussions come to
                  life)
                </li>
              </ul>
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
