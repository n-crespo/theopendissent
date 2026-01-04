import { motion } from "framer-motion";

export const LoadingDots = ({ className = "" }: { className?: string }) => {
  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          initial={{ y: 0 }}
          animate={{ y: -4 }}
          transition={{
            duration: 0.5,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
            delay: i * 0.15,
          }}
          className="h-1 w-1 rounded-full bg-current"
        />
      ))}
    </div>
  );
};
