import { motion } from "framer-motion";

export const LoadingSpinner = () => (
  <motion.div
    animate={{ rotate: 360 }}
    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
    className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full"
  />
);