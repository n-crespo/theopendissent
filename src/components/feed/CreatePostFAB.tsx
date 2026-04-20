import { motion } from "framer-motion";

interface CreatePostFABProps {
  onClick: () => void;
}

export const CreatePostFAB = ({ onClick }: CreatePostFABProps) => {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      // removed 'fixed', 'bottom-8', and 'right-8'
      className="h-14 w-14 rounded-full shadow-2xl flex items-center justify-center text-white bg-linear-to-r from-logo-red via-logo-green to-logo-blue border border-white/20"
    >
      <i className="bi bi-plus-lg text-2xl"></i>
    </motion.button>
  );
};
