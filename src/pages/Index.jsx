import React, { Suspense } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageContainer } from "@/components/layout/PageContainer";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from 'react-router-dom';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

const Index = () => {
  const navigate = useNavigate();

  const handleExplore = () => {
    navigate('/dashboard');
  };

  return (
    <PageContainer className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background to-background/80">
      <Suspense fallback={<LoadingSpinner />}>
        <AnimatePresence mode="wait">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-lg"
          >
            <Card className="backdrop-blur-sm bg-background/95 hover:bg-background/90 transition-colors">
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
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <Button 
                    size="lg"
                    className="mt-4 hover:scale-105 transition-transform"
                    onClick={handleExplore}
                  >
                    Explore Dashboard
                  </Button>
                </motion.div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </Suspense>
    </PageContainer>
  );
};

export default Index;