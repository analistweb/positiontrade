import React from 'react';
import { motion } from "framer-motion";
import { LoaderIcon } from "lucide-react";
import { RSICard } from './RSICard';

export const LoadingRSI = () => (
  <RSICard>
    <div className="flex items-center justify-center py-8">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      >
        <LoaderIcon className="h-8 w-8 text-primary" />
      </motion.div>
    </div>
  </RSICard>
);