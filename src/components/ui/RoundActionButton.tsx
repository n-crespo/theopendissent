import { motion } from "framer-motion";

interface RoundActionButtonProps {
  /** without one, the label shows as text */
  icon?: string;
  label: string;
  onClick: () => void;
  /** sets the size, e.g. "h-14 w-14" */
  className: string;
}

export const RoundActionButton = ({
  icon,
  label,
  onClick,
  className,
}: RoundActionButtonProps) => {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`${className} rounded-full flex items-center justify-center text-white bg-linear-to-r from-logo-red via-logo-green to-logo-blue animate-shimmer bg-[length:200%_auto] border border-white/20`}
    >
      {icon ? <i className={`bi ${icon} text-2xl`}></i> : label}
    </motion.button>
  );
};
