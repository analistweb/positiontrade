
import React from 'react';
import { motion } from "framer-motion";

const LoadingState = () => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center justify-center min-h-[400px]"
    >
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
    </motion.div>
  );
};

export default LoadingState;
