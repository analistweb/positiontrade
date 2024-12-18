import React from 'react';
import { motion } from "framer-motion";
import { LoaderIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const LoadingState = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Carregando Indicadores
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
};

export default LoadingState;