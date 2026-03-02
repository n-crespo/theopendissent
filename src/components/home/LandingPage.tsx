import { useState, useRef } from "react";
import { motion, Variants, useScroll, useTransform } from "framer-motion";
import logoUrl from "../../assets/Flat-Logo.svg";
import { SocialLinksRow } from "./SocialLinksRow";

interface LandingPageProps {
  onContinue: (dontShowAgain: boolean) => void;
}

// helper component to scrub opacity and y-position on scroll
const ScrubText = ({
  children,
  className,
  containerRef,
}: {
  children: React.ReactNode;
  className?: string;
  containerRef: React.RefObject<HTMLDivElement | null>;
}) => {
  const ref = useRef<HTMLDivElement>(null);

  // triggers when the element's top hits 90% down the container, finishes when the bottom hits 60%
  const { scrollYProgress } = useScroll({
    container: containerRef,
    target: ref,
    offset: ["start 90%", "end 60%"],
  });

  const opacity = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const y = useTransform(scrollYProgress, [0, 1], [40, 0]);

  return (
    <motion.div ref={ref} style={{ opacity, y }} className={className}>
      {children}
    </motion.div>
  );
};

export const LandingPage = ({ onContinue }: LandingPageProps) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleExit = () => {
    setIsExiting(true);
    setTimeout(() => onContinue(dontShowAgain), 500);
  };

  const fadeIn: Variants = {
    hidden: { opacity: 0, y: 15 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.2,
        duration: 0.8,
        ease: [0.21, 0.47, 0.32, 0.98] as const,
      },
    }),
  };

  return (
    <div
      className={`fixed inset-0 z-100 bg-logo-offwhite transition-opacity duration-700
        ${isExiting ? "opacity-0 pointer-events-none" : "opacity-100"}`}
    >
      {/* header: fixed with a gradient block to hide text scrolling underneath */}
      <div className="absolute top-0 left-0 right-0 z-40 flex justify-center pt-16 h-[30vh] px-6 pointer-events-none bg-linear-to-b from-logo-offwhite from-75% via-logo-offwhite to-transparent">
        <motion.header
          custom={0}
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="max-w-xl w-full text-center pointer-events-auto"
        >
          <h1 className="text-4xl font-bold text-slate-900 mb-4 tracking-tighter">
            <img
              src={logoUrl}
              alt="The Open Dissent"
              className="w-full"
              draggable="false"
            />
          </h1>
          <p className="text-slate-400 font-medium tracking-[0.2em] uppercase text-[11px] mb-4">
            Humanizing Political Discourse
          </p>
          <SocialLinksRow />
        </motion.header>
      </div>

      {/* scroll engine: normal document flow */}
      <div
        ref={containerRef}
        className="h-full overflow-y-auto custom-scrollbar scroll-smooth"
      >
        {/* reduced gap to 30vh and bottom padding to 40vh */}
        <div className="max-w-xl mx-auto px-6 pt-[40vh] pb-[40vh] flex flex-col items-center gap-[20vh] md:gap-[50vh] text-center">
          {/* text a */}
          <div className="flex flex-col items-center gap-6">
            <div className="space-y-6 text-slate-900 text-[16px] leading-relaxed">
              <motion.section
                custom={1}
                initial="hidden"
                animate="visible"
                variants={fadeIn}
              >
                Modern social media fuels polarity and division.
              </motion.section>
              <motion.section
                custom={2}
                initial="hidden"
                animate="visible"
                variants={fadeIn}
              >
                Ragebait and corporate interests litter our (digital) public
                square.
              </motion.section>
              <motion.section
                custom={3}
                initial="hidden"
                animate="visible"
                variants={fadeIn}
              >
                Stop interacting with an algorithm that profits from your anger.
              </motion.section>
            </div>

            <motion.div
              custom={4}
              initial="hidden"
              animate="visible"
              variants={fadeIn}
              className="mt-8 animate-bounce text-slate-300"
            >
              <i className="bi bi-chevron-down text-2xl"></i>
            </motion.div>
          </div>

          {/* text b */}
          <ScrubText
            containerRef={containerRef}
            className="flex flex-col items-center gap-6 w-full max-w-lg"
          >
            <div className="space-y-6 text-slate-900 text-[16px] leading-relaxed">
              <section>Here's how we fixed it:</section>
              <ul className="list-disc space-y-2 marker:text-slate-400 text-left px-7">
                <li>
                  <strong>fully anonymous profiles </strong>(no popularity
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
                  <strong>sliders for interaction</strong> (because real issues
                  have nuance)
                </li>
              </ul>
            </div>
          </ScrubText>
        </div>
      </div>

      {/* footer: permanently fixed */}
      <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-logo-offwhite via-logo-offwhite from-70% to-transparent pt-[15vh] pb-8 px-6 flex flex-col items-center gap-4 z-40 pointer-events-none">
        <motion.strong
          custom={5}
          initial="hidden"
          animate="visible"
          variants={fadeIn}
          className="text-slate-900 pointer-events-auto"
        >
          Join the conversation today.
        </motion.strong>

        <motion.div
          custom={6}
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
          custom={7}
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
