import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUpIcon, LoaderIcon } from "lucide-react";
import { motion } from "framer-motion";

const LoadingRecommendation = () => (
  <Card>
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        <TrendingUpIcon className="h-5 w-5 text-primary" />
        Recomendação DCA
      </CardTitle>
    </CardHeader>
    <CardContent>
      <div className="flex items-center justify-center py-8">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <LoaderIcon className="h-8 w-8 text-primary" />
        </motion.div>
      </div>
    </CardContent>
  </Card>
);

export default LoadingRecommendation;