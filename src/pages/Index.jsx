
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

const Index = () => {
  console.log("Index component rendered");
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Bem-vindo à Análise de Criptomoedas</h1>
      
      <Card className="mb-6">
        <CardContent className="p-6">
          <p className="text-xl">
            Esta aplicação fornece ferramentas avançadas para análise do mercado de criptomoedas.
            Utilize o menu lateral para navegar entre as diferentes seções de análise.
          </p>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-2">Dashboard</h2>
            <p>Visão geral do mercado com indicadores importantes e tendências atuais.</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-2">Análise de Compra/Venda</h2>
            <p>Ferramentas para ajudar na decisão de quando comprar ou vender.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Index;
