import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CryptoCompareNews {
  id: string;
  title: string;
  body: string;
  url: string;
  source: string;
  source_info: { name: string; lang: string };
  published_on: number;
  categories: string;
}

// Translate common English terms to Portuguese
function translateToPortuguese(text: string): string {
  const translations: Record<string, string> = {
    // Common crypto terms
    "Bitcoin": "Bitcoin",
    "Ethereum": "Ethereum",
    "crypto": "cripto",
    "cryptocurrency": "criptomoeda",
    "cryptocurrencies": "criptomoedas",
    "blockchain": "blockchain",
    "price": "preço",
    "market": "mercado",
    "trading": "negociação",
    "whale": "baleia",
    "whales": "baleias",
    "bull": "alta",
    "bear": "baixa",
    "bullish": "altista",
    "bearish": "baixista",
    "rally": "alta",
    "crash": "queda",
    "pump": "subida",
    "dump": "queda",
    "all-time high": "máxima histórica",
    "ATH": "ATH",
    // Economic terms
    "Federal Reserve": "Federal Reserve",
    "Fed": "Fed",
    "interest rate": "taxa de juros",
    "interest rates": "taxas de juros",
    "inflation": "inflação",
    "CPI": "IPC",
    "GDP": "PIB",
    "unemployment": "desemprego",
    "recession": "recessão",
    "stimulus": "estímulo",
    "monetary policy": "política monetária",
    "central bank": "banco central",
    // Regulatory
    "SEC": "SEC",
    "regulation": "regulação",
    "regulatory": "regulatório",
    "approval": "aprovação",
    "ETF": "ETF",
    "spot ETF": "ETF spot",
    // Market actions
    "buy": "compra",
    "sell": "venda",
    "hold": "manter",
    "surge": "dispara",
    "surges": "dispara",
    "soars": "dispara",
    "drops": "cai",
    "falls": "cai",
    "rises": "sobe",
    "gains": "ganha",
    "loses": "perde",
    // Time
    "today": "hoje",
    "yesterday": "ontem",
    "week": "semana",
    "month": "mês",
    "year": "ano",
  };

  let translated = text;
  
  // Apply translations (case-insensitive replacement)
  Object.entries(translations).forEach(([en, pt]) => {
    const regex = new RegExp(`\\b${en}\\b`, 'gi');
    translated = translated.replace(regex, pt);
  });
  
  return translated;
}

// Create a summary from the body
function createSummary(body: string): string {
  if (!body) return "";
  // Get first 150 characters, clean HTML if any
  const cleanBody = body.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  if (cleanBody.length <= 150) return translateToPortuguese(cleanBody);
  return translateToPortuguese(cleanBody.substring(0, 147) + "...");
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[fetch-market-news] Fetching from CryptoCompare (free public API)...");
    
    // CryptoCompare News API - Free, no API key required for basic access
    const response = await fetch(
      "https://min-api.cryptocompare.com/data/v2/news/?lang=EN&categories=BTC,ETH,Regulation,Market&excludeCategories=Sponsored",
      { 
        headers: { 
          "Accept": "application/json",
          "User-Agent": "CryptoAnalytics/1.0"
        },
      }
    );

    if (!response.ok) {
      console.error(`[fetch-market-news] CryptoCompare API error: ${response.status}`);
      throw new Error(`CryptoCompare API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.Data || !Array.isArray(data.Data)) {
      console.error("[fetch-market-news] Invalid response structure:", data);
      throw new Error("Invalid response from CryptoCompare");
    }

    console.log(`[fetch-market-news] Received ${data.Data.length} news items`);

    // Transform and classify news
    const news = data.Data.slice(0, 10).map((item: CryptoCompareNews) => {
      const title = item.title.toLowerCase();
      const body = item.body?.toLowerCase() || "";
      const combinedText = title + " " + body;
      
      // Classify impact based on keywords (macro-economic focus)
      let impact = "low";
      
      // High impact: Fed, interest rates, inflation, ETF approvals, major regulations
      if (
        combinedText.includes("fed") ||
        combinedText.includes("federal reserve") ||
        combinedText.includes("fomc") ||
        combinedText.includes("inflation") ||
        combinedText.includes("cpi") ||
        combinedText.includes("interest rate") ||
        combinedText.includes("etf approv") ||
        combinedText.includes("sec approv") ||
        combinedText.includes("spot etf") ||
        combinedText.includes("billion") ||
        combinedText.includes("trillion") ||
        combinedText.includes("halving") ||
        combinedText.includes("regulation") ||
        combinedText.includes("ban") ||
        combinedText.includes("lawsuit")
      ) {
        impact = "high";
      } 
      // Medium impact: Banks, institutions, major price moves
      else if (
        combinedText.includes("bank") ||
        combinedText.includes("institutional") ||
        combinedText.includes("blackrock") ||
        combinedText.includes("grayscale") ||
        combinedText.includes("fidelity") ||
        combinedText.includes("whale") ||
        combinedText.includes("million") ||
        combinedText.includes("all-time high") ||
        combinedText.includes("ath") ||
        combinedText.includes("surge") ||
        combinedText.includes("crash") ||
        combinedText.includes("rally")
      ) {
        impact = "medium";
      }

      // Determine category
      let category = "crypto";
      if (item.categories?.includes("Regulation")) {
        category = "regulation";
      } else if (
        combinedText.includes("fed") ||
        combinedText.includes("inflation") ||
        combinedText.includes("interest rate") ||
        combinedText.includes("economy")
      ) {
        category = "economy";
      }

      return {
        id: item.id,
        title: translateToPortuguese(item.title),
        summary: createSummary(item.body),
        source: item.source_info?.name || item.source || "CryptoCompare",
        publishedAt: new Date(item.published_on * 1000).toISOString(),
        category,
        url: item.url, // Direct link to original article
        impact
      };
    });

    // Sort by impact (high first) then by date (newest first)
    const sortedNews = news.sort((a: any, b: any) => {
      const impactOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
      if (impactOrder[a.impact] !== impactOrder[b.impact]) {
        return impactOrder[a.impact] - impactOrder[b.impact];
      }
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });

    console.log(`[fetch-market-news] Returning ${sortedNews.length} processed news items`);

    return new Response(JSON.stringify({ 
      news: sortedNews, 
      source: "cryptocompare",
      count: sortedNews.length,
      updatedAt: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[fetch-market-news] Error:", error);
    
    // Return fallback news on error to maintain UI integrity
    const fallbackNews = [
      {
        id: "fallback-1",
        title: "Aguardando dados de notícias em tempo real...",
        summary: "O sistema está tentando conectar com as fontes de notícias. Tente novamente em alguns segundos.",
        source: "Sistema",
        publishedAt: new Date().toISOString(),
        category: "system",
        url: "#",
        impact: "low"
      }
    ];
    
    return new Response(JSON.stringify({ 
      error: error.message,
      news: fallbackNews,
      source: "fallback"
    }), {
      status: 200, // Return 200 with fallback to not break UI
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
