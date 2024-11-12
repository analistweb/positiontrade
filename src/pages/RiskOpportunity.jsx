import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const RiskOpportunity = () => {
  return (
    <div className="flex flex-col min-h-screen p-4 space-y-6">
      <h1 className="text-3xl font-bold">Risk & Opportunity</h1>
      <div className="flex flex-col lg:flex-row gap-6">
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Risk Analysis</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center min-h-[300px]">
            <p className="text-lg text-muted-foreground">Risk analysis content will be displayed here</p>
          </CardContent>
        </Card>
        <Card className="flex-1">
          <CardHeader>
            <CardTitle>Opportunity Analysis</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center justify-center min-h-[300px]">
            <p className="text-lg text-muted-foreground">Opportunity analysis content will be displayed here</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RiskOpportunity;