import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { PageContainer } from "@/components/layout/PageContainer";
import { motion } from "framer-motion";

const Index = () => {
  return (
    <PageContainer className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-background/80">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        <Card className="backdrop-blur-sm bg-background/95">
          <CardContent className="flex flex-col items-center space-y-6 p-8">
            <motion.h1 
              className="text-4xl font-bold gradient-text text-center"
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.2 }}
            >
              Welcome to Crypto Analytics
            </motion.h1>
            <motion.p 
              className="text-xl text-center text-muted-foreground"
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Start exploring cryptocurrency market insights and analysis
            </motion.p>
          </CardContent>
        </Card>
      </motion.div>
    </PageContainer>
  );
};

export default Index;