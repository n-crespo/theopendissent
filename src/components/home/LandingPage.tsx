/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import { motion, AnimatePresence, Variants } from "framer-motion";
import logoUrl from "../../assets/Flat-Logo.svg";
import { InfoCard } from "../ui/InfoCard";

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

const cardVariants: Variants = {
  enter: (direction: number) => ({
    x: direction > 0 ? "100%" : "-100%",
    opacity: 0,
    scale: 0.98,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
    transition: {
      // bez-curve provides the nonlinear slide without spring overhead
      x: { duration: 0.45, ease: [0.21, 0.47, 0.32, 0.98] },
      opacity: { duration: 0.25 },
      scale: { duration: 0.3, ease: "easeOut" },
    },
  },
  exit: (direction: number) => ({
    x: direction < 0 ? "100%" : "-100%",
    opacity: 0,
    scale: 0.98,
    transition: {
      x: { duration: 0.4, ease: [0.21, 0.47, 0.32, 0.98] },
      opacity: { duration: 0.2 },
    },
  }),
};

export const LandingPage = ({ onContinue }: LandingPageProps) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  // prevent background scrolling
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const handleExit = () => {
    setIsExiting(true);
    setTimeout(() => onContinue(false), 500);
  };

  const paginate = (newDirection: number) => {
    const newIndex = activeIndex + newDirection;
    if (newIndex >= 0 && newIndex <= 1) {
      setDirection(newDirection);
      setActiveIndex(newIndex);
    }
  };

  const renderFooter = () => (
    <>
      <div className="flex justify-start">
        <button
          onClick={() => paginate(-1)}
          className={`p-2 text-slate-400 hover:text-slate-900 transition-all active:scale-90
            ${activeIndex === 0 ? "opacity-0 pointer-events-none" : "opacity-100"}`}
        >
          <i className="bi bi-arrow-left text-lg"></i>
        </button>
      </div>

      <div className="flex justify-center gap-2">
        {[0, 1].map((idx) => (
          <div
            key={idx}
            className={`w-1.5 h-1.5 rounded-full transition-colors duration-300
              ${activeIndex === idx ? "bg-slate-900" : "bg-slate-200"}`}
          />
        ))}
      </div>

      <div className="flex justify-end">
        <button
          onClick={() => paginate(1)}
          className={`p-2 text-slate-400 hover:text-slate-900 transition-all active:scale-90
            ${activeIndex === 1 ? "opacity-0 pointer-events-none" : "opacity-100"}`}
        >
          <i className="bi bi-arrow-right text-lg"></i>
        </button>
      </div>
    </>
  );

  return (
    <div
      className={`fixed inset-0 z-100 bg-logo-offwhite transition-opacity duration-700 overflow-y-auto flex flex-col items-center
        ${isExiting ? "opacity-0 pointer-events-none" : "opacity-100"}`}
    >
      <motion.header
        custom={0}
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="max-w-xl w-full text-center pt-12 px-6 shrink-0"
      >
        <img
          src={logoUrl}
          alt="The Open Dissent"
          className="w-full mb-4"
          draggable="false"
        />
        <div className="mx-auto w-max bg-linear-to-r from-logo-red via-logo-green to-logo-blue bg-clip-text text-transparent">
          <p className="font-bold tracking-widest uppercase text-md">
            Disagree Better
          </p>
        </div>
      </motion.header>

      <main className="w-md max-w-[85vw] py-12 flex-1 flex flex-col justify-center">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={activeIndex}
            custom={direction}
            variants={cardVariants}
            initial="enter"
            animate="center"
            exit="exit"
            className="w-full"
          >
            {activeIndex === 0 ? (
              <InfoCard
                title="Modern social media is ruining politics."
                footer={renderFooter()}
              >
                <div className="space-y-7 text-slate-700 leading-relaxed text-center">
                  <p>
                    Addictive algorithms fuels <b>polarity</b> and{" "}
                    <b>division</b>.
                  </p>
                  <p>
                    <b>Ragebait</b> and <b>corporate interests</b> litter our
                    digital public square.
                  </p>
                  <b>
                    Stop interacting with a system that profits from your anger.
                  </b>
                </div>
              </InfoCard>
            ) : (
              <InfoCard
                title="Here's how we're fixing it:"
                footer={renderFooter()}
              >
                {/* <div className="w-full"> */}
                <ul className="list-disc px-[6vw] space-y-6 marker:text-slate-500 text-left w-fit text-slate-700">
                  <li className="leading-snug">
                    <strong className="text-slate-900">
                      real, human discussions
                    </strong>
                    <p className="text-sm text-slate-500 mt-0.5">
                      From our website to our podcast.
                    </p>
                  </li>
                  <li className="leading-snug">
                    <strong className="text-slate-900">
                      no predatory algorithms
                    </strong>
                    <p className="text-sm text-slate-500 mt-0.5">
                      Posts are randomly shuffled.
                    </p>
                  </li>
                  <li className="leading-snug">
                    <strong className="text-slate-900">
                      no engagement metrics
                    </strong>
                    <p className="text-sm text-slate-500 mt-0.5">
                      Quality &gt; Click Count
                    </p>
                  </li>
                  <li className="leading-snug">
                    <strong className="text-slate-900">
                      (optional) anonymity
                    </strong>
                    <p className="text-sm text-slate-500 mt-0.5">
                      Judge ideas, not individuals.
                    </p>
                  </li>
                </ul>
                {/* </div> */}
              </InfoCard>
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="w-full max-w-xl pb-12 px-6 shrink-0">
        <motion.div
          custom={1}
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="w-full flex justify-center"
        >
          <button
            onClick={handleExit}
            className="w-full max-w-xs py-4 text-white hover:brightness-110 transition-all active:scale-95 shadow-2xl rounded-2xl bg-linear-to-r from-logo-red via-logo-green to-logo-blue font-bold tracking-wide"
          >
            Join the conversation.
          </button>
        </motion.div>
      </footer>
    </div>
  );
};
