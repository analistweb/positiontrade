import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CryptoPanicNews {
  id: number;
  title: string;
  url: string;
  source: { title: string; domain: string };
  published_at: string;
  currencies: Array<{ code: string; title: string }>;
  kind: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const CRYPTOPANIC_API_KEY = Deno.env.get("CRYPTOPANIC_API_KEY");

    if (!CRYPTOPANIC_API_KEY) {
      // Return mock news when API key is not configured
      const mockNews = [
        {
          id: "1",
          title: "Federal Reserve mantém taxa de juros, Bitcoin reage positivamente",
          summary: "O Fed decidiu manter as taxas de juros, impactando positivamente o mercado de criptomoedas.",
          source: "Reuters",
          publishedAt: new Date().toISOString(),
          category: "economy",
          url: "https://www.reuters.com/markets/currencies/",
          impact: "high"
        },
        {
          id: "2", 
          title: "Inflação nos EUA desacelera para 2.9% em dezembro",
          summary: "Dados de inflação mais baixos que o esperado animam investidores de Bitcoin.",
          source: "Bloomberg",
          publishedAt: new Date(Date.now() - 3600000).toISOString(),
          category: "economy",
          url: "https://www.bloomberg.com/crypto",
          impact: "high"
        },
        {
          id: "3",
          title: "ETFs de Bitcoin registram entradas recordes de $1.2 bilhões",
          summary: "Fundos de Bitcoin spot nos EUA atraem capital institucional massivo.",
          source: "CoinDesk",
          publishedAt: new Date(Date.now() - 7200000).toISOString(),
          category: "crypto",
          url: "https://www.coindesk.com/",
          impact: "medium"
        },
        {
          id: "4",
          title: "Banco Central Europeu sinaliza possível corte de juros",
          summary: "BCE indica flexibilização monetária, beneficiando ativos de risco como Bitcoin.",
          source: "Financial Times",
          publishedAt: new Date(Date.now() - 10800000).toISOString(),
          category: "economy",
          url: "https://www.ft.com/",
          impact: "medium"
        },
        {
          id: "5",
          title: "China flexibiliza regulação de mineração de Bitcoin",
          summary: "Governo chinês relaxa restrições regionais para mineração de criptomoedas.",
          source: "South China Morning Post",
          publishedAt: new Date(Date.now() - 14400000).toISOString(),
          category: "regulation",
          url: "https://www.scmp.com/tech",
          impact: "medium"
        }
      ];

      return new Response(JSON.stringify({ 
        news: mockNews, 
        source: "mock",
        message: "Configure CRYPTOPANIC_API_KEY for real-time news"
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch real news from CryptoPanic
    const response = await fetch(
      `https://cryptopanic.com/api/v1/posts/?auth_token=${CRYPTOPANIC_API_KEY}&kind=news&filter=hot&currencies=BTC,ETH&public=true`,
      { 
        headers: { "Accept": "application/json" },
      }
    );

    if (!response.ok) {
      throw new Error(`CryptoPanic API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.results || !Array.isArray(data.results)) {
      throw new Error("Invalid response from CryptoPanic");
    }

    // Transform and classify news
    const news = data.results.slice(0, 10).map((item: CryptoPanicNews) => {
      const title = item.title.toLowerCase();
      
      // Classify impact based on keywords
      let impact = "low";
      if (
        title.includes("fed") ||
        title.includes("federal reserve") ||
        title.includes("inflation") ||
        title.includes("interest rate") ||
        title.includes("juros") ||
        title.includes("inflação") ||
        title.includes("etf") ||
        title.includes("sec") ||
        title.includes("regulation")
      ) {
        impact = "high";
      } else if (
        title.includes("bank") ||
        title.includes("whale") ||
        title.includes("institutional") ||
        title.includes("billion") ||
        title.includes("million") ||
        title.includes("price") ||
        title.includes("rally") ||
        title.includes("crash")
      ) {
        impact = "medium";
      }

      return {
        id: String(item.id),
        title: item.title,
        summary: "",
        source: item.source?.title || item.source?.domain || "Unknown",
        publishedAt: item.published_at,
        category: item.kind || "news",
        url: item.url, // Direct link to the article
        impact
      };
    });

    // Sort by impact (high first) then by date
    const sortedNews = news.sort((a: any, b: any) => {
      const impactOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
      if (impactOrder[a.impact] !== impactOrder[b.impact]) {
        return impactOrder[a.impact] - impactOrder[b.impact];
      }
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });

    return new Response(JSON.stringify({ 
      news: sortedNews, 
      source: "cryptopanic",
      count: sortedNews.length
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error fetching market news:", error);
    return new Response(JSON.stringify({ 
      error: error.message,
      news: [] 
    }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
