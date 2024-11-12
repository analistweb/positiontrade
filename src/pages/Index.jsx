import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

const Index = () => {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-gradient-to-br from-background to-background/80">
      <Card className="w-full max-w-lg">
        <CardContent className="flex flex-col items-center space-y-6 p-8">
          <h1 className="text-4xl font-bold gradient-text text-center">Welcome to Crypto Analytics</h1>
          <p className="text-xl text-center text-muted-foreground">
            Start exploring cryptocurrency market insights and analysis
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;