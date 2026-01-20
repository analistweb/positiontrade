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
  imageurl: string;
  source: string;
  source_info: { name: string; lang: string };
  published_on: number;
  categories: string;
}

interface TranslationResult {
  translations: string[];
}

// Translate texts using Lovable AI
async function translateWithAI(texts: string[]): Promise<string[]> {
  const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
  
  if (!LOVABLE_API_KEY || texts.length === 0) {
    console.log("[fetch-market-news] No API key or empty texts, skipping AI translation");
    return texts;
  }

  try {
    console.log(`[fetch-market-news] Translating ${texts.length} texts with AI...`);
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash-lite',
        messages: [{
          role: 'user',
          content: `Traduza os seguintes títulos de notícias do inglês para português brasileiro de forma natural e fluente. Mantenha termos técnicos como Bitcoin, Ethereum, ETF, SEC, Fed quando apropriado. Retorne APENAS um JSON válido no formato: {"translations": ["tradução1", "tradução2", ...]}\n\nTextos para traduzir:\n${texts.map((t, i) => `${i + 1}. ${t}`).join('\n')}`
        }],
      }),
    });

    if (!response.ok) {
      console.error(`[fetch-market-news] AI translation failed: ${response.status}`);
      return texts;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';
    
    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1].trim();
    }
    
    // Try to parse the JSON
    try {
      const parsed: TranslationResult = JSON.parse(jsonStr);
      if (parsed.translations && Array.isArray(parsed.translations) && parsed.translations.length === texts.length) {
        console.log(`[fetch-market-news] Successfully translated ${parsed.translations.length} texts`);
        return parsed.translations;
      }
    } catch (parseError) {
      console.error("[fetch-market-news] Failed to parse AI response:", parseError);
    }
    
    return texts;
  } catch (error) {
    console.error("[fetch-market-news] AI translation error:", error);
    return texts;
  }
}

// Fallback translation using keywords
function translateKeywords(text: string): string {
  const translations: Record<string, string> = {
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
    "Federal Reserve": "Federal Reserve",
    "Fed": "Fed",
    "interest rate": "taxa de juros",
    "interest rates": "taxas de juros",
    "inflation": "inflação",
    "CPI": "IPC",
    "GDP": "PIB",
    "unemployment": "desemprego",
    "recession": "recessão",
    "regulation": "regulação",
    "regulatory": "regulatório",
    "approval": "aprovação",
    "surge": "dispara",
    "surges": "dispara",
    "soars": "dispara",
    "drops": "cai",
    "falls": "cai",
    "rises": "sobe",
    "gains": "ganha",
    "loses": "perde",
    "today": "hoje",
    "yesterday": "ontem",
    "week": "semana",
    "month": "mês",
    "year": "ano",
    "Signals": "Sinaliza",
    "Signaling": "Sinalizando",
    "Potential": "Potencial",
    "Shift": "Mudança",
    "Climbs": "Sobe",
    "Index": "Índice",
    "Season": "Temporada",
    "Altcoin": "Altcoin",
  };

  let translated = text;
  Object.entries(translations).forEach(([en, pt]) => {
    const regex = new RegExp(`\\b${en}\\b`, 'gi');
    translated = translated.replace(regex, pt);
  });
  
  return translated;
}

// Create a summary from the body
function createSummary(body: string, maxLength: number = 150): string {
  if (!body) return "";
  const cleanBody = body.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  if (cleanBody.length <= maxLength) return cleanBody;
  return cleanBody.substring(0, maxLength - 3) + "...";
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("[fetch-market-news] Fetching from CryptoCompare...");
    
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

    // Get the first 10 items
    const items: CryptoCompareNews[] = data.Data.slice(0, 10);
    
    // Extract titles and summaries for translation
    const titlesToTranslate = items.map(item => item.title);
    const summariesToTranslate = items.map(item => createSummary(item.body));
    
    // Translate with AI
    const [translatedTitles, translatedSummaries] = await Promise.all([
      translateWithAI(titlesToTranslate),
      translateWithAI(summariesToTranslate.filter(s => s.length > 0))
    ]);
    
    // Build translated summaries array (handling empty ones)
    let summaryIndex = 0;
    const finalSummaries = items.map(item => {
      const summary = createSummary(item.body);
      if (summary.length > 0) {
        return translatedSummaries[summaryIndex++] || translateKeywords(summary);
      }
      return "";
    });

    // Transform and classify news
    const news = items.map((item, index) => {
      const title = item.title.toLowerCase();
      const body = item.body?.toLowerCase() || "";
      const combinedText = title + " " + body;
      
      // Classify impact based on keywords
      let impact = "low";
      
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
      } else if (
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

      // Use AI translation or fallback to keyword translation
      const finalTitle = translatedTitles[index] || translateKeywords(item.title);

      return {
        id: item.id,
        title: finalTitle,
        summary: finalSummaries[index] || "",
        source: item.source_info?.name || item.source || "CryptoCompare",
        publishedAt: new Date(item.published_on * 1000).toISOString(),
        category,
        url: item.url,
        imageUrl: item.imageurl || null,
        impact
      };
    });

    // Sort by impact (high first) then by date (newest first)
    const sortedNews = news.sort((a, b) => {
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
    
    const fallbackNews = [
      {
        id: "fallback-1",
        title: "Aguardando dados de notícias em tempo real...",
        summary: "O sistema está tentando conectar com as fontes de notícias. Tente novamente em alguns segundos.",
        source: "Sistema",
        publishedAt: new Date().toISOString(),
        category: "system",
        url: "#",
        imageUrl: null,
        impact: "low"
      }
    ];
    
    return new Response(JSON.stringify({ 
      error: error.message,
      news: fallbackNews,
      source: "fallback"
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
