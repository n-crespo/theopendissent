/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import logoUrl from "../../assets/Flat-Logo.svg";
import { useModal } from "../../context/ModalContext";

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
  const [activeIndex, setActiveIndex] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  // prevent background scrolling
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const { openModal } = useModal();

  const handleExit = () => {
    setIsExiting(true);
    setTimeout(() => onContinue(false), 500);
  };

  const handleListen = () => {
    setIsExiting(true);
    setTimeout(() => {
      onContinue(false);
      openModal("listen");
    }, 500);
  };

  const toggleCard = () => {
    setActiveIndex(activeIndex === 0 ? 1 : 0);
  };

  return (
    <div
      className={`fixed inset-0 z-100 bg-logo-offwhite transition-opacity duration-700 overflow-hidden flex flex-col items-center justify-between h-[100dvh] w-full
        ${isExiting ? "opacity-0 pointer-events-none" : "opacity-100"}`}
    >
      <motion.header
        custom={0}
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="max-w-xl w-full text-center pt-8 px-6 shrink-0"
      >
        <img
          src={logoUrl}
          alt="The Open Dissent"
          className="w-full mb-4"
          draggable="false"
        />
        <div className="mx-auto w-max bg-linear-to-r from-logo-red via-logo-green to-logo-blue bg-clip-text text-transparent">
          <p className="font-bold tracking-wide uppercase text-md">
            Disagree Better
          </p>
        </div>
      </motion.header>

      <main className="w-full max-w-115 px-4 py-4 flex-1 flex flex-col items-center justify-center min-h-0">
        <div className="w-full h-full max-h-[26rem] max-w-md flex flex-col items-center justify-center">
          {/* Fading Title Area */}
          <div className="mb-4 text-center h-8 relative w-full flex justify-center shrink-0">
            <AnimatePresence mode="wait">
              <motion.h3
                key={activeIndex}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="text-xl font-bold text-slate-900 tracking-tight absolute"
              >
                {activeIndex === 0
                  ? "Modern social media is ruining politics."
                  : "Here's how we're fixing it:"}
              </motion.h3>
            </AnimatePresence>
          </div>

          {/* 3D Flipping Card Container */}
          <div
            className="relative w-full h-full flex-1 cursor-pointer group min-h-[18rem]"
            style={{ perspective: "1000px" }}
            onClick={toggleCard}
          >
            <motion.div
              className="w-full h-full absolute inset-0"
              initial={false}
              animate={{ rotateY: activeIndex === 1 ? 180 : 0 }}
              transition={{ duration: 0.7, ease: [0.23, 1, 0.32, 1] }}
              style={{ transformStyle: "preserve-3d" }}
            >
              {/* Front Card */}
              <div
                className="absolute inset-0 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col"
                style={{
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                }}
              >
                <div className="flex-1 p-[clamp(1rem,3vw,1.25rem)] text-base flex flex-col justify-center items-center overflow-y-auto custom-scrollbar">
                  <div className="space-y-5 text-slate-700 leading-relaxed text-center px-4 w-full">
                    <p>
                      Your feed is <em>designed</em> to prioritize outrage, fuel
                      polarization, and perpetuate echo chambers.
                    </p>
                    <p>
                      Online discussions are littered with bots and corporate
                      interests.
                    </p>
                    <p>
                      Democracy thrives on open dissent, but these platforms
                      continue to suppress it.
                    </p>
                    <p className="font-bold text-slate-900">
                      You deserve better.
                    </p>
                  </div>
                </div>
                <div className="p-3 border-t border-slate-100 bg-slate-50/20 text-center shrink-0">
                  <span className="text-sm font-semibold text-logo-blue group-hover:underline">
                    Tap to see how we're fixing it
                  </span>
                </div>
              </div>

              {/* Back Card */}
              <div
                className="absolute inset-0 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col"
                style={{
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                }}
              >
                <div className="flex-1 p-[clamp(1rem,3vw,1.25rem)] text-[15px] flex flex-col justify-center items-center overflow-y-auto custom-scrollbar">
                  <ol className="list-decimal list-inside space-y-5 text-left w-fit text-slate-700 max-w-xs sm:max-w-max mx-auto marker:font-bold marker:text-slate-500 px-2">
                    <li className="leading-snug">
                      <strong className="text-slate-900">
                        Real, human discussions.
                      </strong>
                      <p className="text-sm text-slate-500 mt-1 pl-5">
                        Genuine dialogue &gt; viral soundbites.
                      </p>
                    </li>
                    <li className="leading-snug">
                      <strong className="text-slate-900">
                        No predatory algorithm.
                      </strong>
                      <p className="text-sm text-slate-500 mt-1 pl-5">
                        All posts are valued the same.
                      </p>
                    </li>
                    <li className="leading-snug">
                      <strong className="text-slate-900">
                        Zero engagement metrics.
                      </strong>
                      <p className="text-sm text-slate-500 mt-1 pl-5">
                        This isn't a popularity contest.
                      </p>
                    </li>
                    <li className="leading-snug">
                      <strong className="text-slate-900">
                        (Optional) Anonymity.
                      </strong>
                      <p className="text-sm text-slate-500 mt-1 pl-5">
                        Judge ideas, not individuals.
                      </p>
                    </li>
                  </ol>
                </div>
                <div className="p-3 border-t border-slate-100 bg-slate-50/20 text-center shrink-0">
                  <span className="text-sm font-semibold text-logo-blue group-hover:underline">
                    Tap to flip back
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      <footer className="w-full max-w-xl pb-8 px-6 shrink-0">
        <motion.div
          custom={1}
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="w-full flex flex-col-reverse sm:flex-row justify-center gap-3"
        >
          <button
            onClick={handleListen}
            className="w-full sm:w-auto px-8 py-4 bg-white border border-slate-200 text-slate-700 font-bold hover:bg-slate-50 transition-all active:scale-95 shadow-sm rounded-2xl flex items-center justify-center gap-2"
          >
            <i className="bi bi-mic-fill"></i> Listen In
          </button>

          <button
            onClick={handleExit}
            className="w-full sm:flex-1 py-4 text-white hover:brightness-110 transition-all active:scale-95 shadow-lg rounded-2xl bg-linear-to-r from-logo-red via-logo-green to-logo-blue font-bold tracking-wide animate-shimmer bg-size-[200%_auto] flex items-center justify-center gap-2"
          >
            Join the conversation. <i className="bi bi-arrow-right"></i>
          </button>
        </motion.div>
      </footer>
    </div>
  );
};
