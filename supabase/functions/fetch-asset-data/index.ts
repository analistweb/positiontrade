import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

// Cache simples em memória (5 minutos)
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

interface YahooChartResult {
  chart: {
    result: Array<{
      meta: {
        symbol: string;
        shortName?: string;
        longName?: string;
        currency: string;
        regularMarketPrice: number;
        previousClose: number;
      };
      timestamp: number[];
      indicators: {
        quote: Array<{
          open: number[];
          high: number[];
          low: number[];
          close: number[];
          volume: number[];
        }>;
      };
    }>;
    error?: { code: string; description: string };
  };
}

interface Candle {
  date: string;
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface AssetData {
  ticker: string;
  name: string;
  currency: string;
  candles: Candle[];
  currentPrice: number;
  previousClose: number;
  change24h: number;
  changePercent24h: number;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    let ticker: string | null = null;
    let range = '1y';
    let interval = '1d';

    // Suportar tanto GET com query params quanto POST com body
    if (req.method === 'GET') {
      const url = new URL(req.url);
      ticker = url.searchParams.get('ticker');
      range = url.searchParams.get('range') || '1y';
      interval = url.searchParams.get('interval') || '1d';
    } else if (req.method === 'POST') {
      try {
        const body = await req.json();
        ticker = body.ticker || null;
        range = body.range || '1y';
        interval = body.interval || '1d';
      } catch {
        // Se não conseguir parsear o body, continua com valores padrão
        console.log('Could not parse body, checking query params');
        const url = new URL(req.url);
        ticker = url.searchParams.get('ticker');
      }
    }

    if (!ticker) {
      return new Response(
        JSON.stringify({ error: 'Ticker é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Normalizar ticker - converter BBAS3-SA para BBAS3.SA automaticamente
    let normalizedTicker = ticker.toUpperCase().trim();
    
    // Corrigir formato de ações brasileiras (hífen para ponto)
    // BBAS3-SA → BBAS3.SA, PETR4-SA → PETR4.SA
    if (normalizedTicker.endsWith('-SA')) {
      normalizedTicker = normalizedTicker.replace(/-SA$/, '.SA');
      console.log(`[Ticker Fix] Converted to ${normalizedTicker}`);
    }
    
    // Se for apenas o código sem sufixo (BBAS3, PETR4), tentar adicionar .SA
    // para ações brasileiras conhecidas
    const brazilianStockPattern = /^[A-Z]{4}[0-9]{1,2}$/;
    if (brazilianStockPattern.test(normalizedTicker)) {
      normalizedTicker = `${normalizedTicker}.SA`;
      console.log(`[Ticker Fix] Added .SA suffix: ${normalizedTicker}`);
    }
    
    const cacheKey = `${normalizedTicker}_${range}_${interval}`;

    // Verificar cache
    const cached = cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log(`[Cache HIT] ${cacheKey}`);
      return new Response(
        JSON.stringify(cached.data),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[Cache MISS] Fetching ${normalizedTicker} from Yahoo Finance`);

    // Construir URL do Yahoo Finance
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(normalizedTicker)}?interval=${interval}&range=${range}&includePrePost=false`;

    const response = await fetch(yahooUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Yahoo Finance error: ${response.status} ${response.statusText}`);
      return new Response(
        JSON.stringify({ error: `Erro ao buscar dados: ${response.statusText}` }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const yahooData: YahooChartResult = await response.json();

    if (yahooData.chart.error) {
      console.error(`Yahoo Finance API error: ${yahooData.chart.error.description}`);
      return new Response(
        JSON.stringify({ error: yahooData.chart.error.description }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = yahooData.chart.result?.[0];
    if (!result) {
      return new Response(
        JSON.stringify({ error: 'Ativo não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { meta, timestamp, indicators } = result;
    const quote = indicators.quote[0];

    // Converter para formato estruturado
    const candles: Candle[] = [];
    for (let i = 0; i < timestamp.length; i++) {
      // Ignorar candles com dados inválidos
      if (
        quote.open[i] == null ||
        quote.high[i] == null ||
        quote.low[i] == null ||
        quote.close[i] == null
      ) {
        continue;
      }

      candles.push({
        date: new Date(timestamp[i] * 1000).toISOString().split('T')[0],
        timestamp: timestamp[i],
        open: quote.open[i],
        high: quote.high[i],
        low: quote.low[i],
        close: quote.close[i],
        volume: quote.volume[i] || 0,
      });
    }

    if (candles.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Sem dados disponíveis para o período' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const currentPrice = meta.regularMarketPrice;
    const previousClose = meta.previousClose;
    const change24h = currentPrice - previousClose;
    const changePercent24h = (change24h / previousClose) * 100;

    const assetData: AssetData = {
      ticker: meta.symbol,
      name: meta.longName || meta.shortName || meta.symbol,
      currency: meta.currency,
      candles,
      currentPrice,
      previousClose,
      change24h,
      changePercent24h,
    };

    // Armazenar no cache
    cache.set(cacheKey, { data: assetData, timestamp: Date.now() });

    // Limpar entradas antigas do cache
    for (const [key, value] of cache.entries()) {
      if (Date.now() - value.timestamp > CACHE_TTL * 2) {
        cache.delete(key);
      }
    }

    console.log(`[Success] ${normalizedTicker}: ${candles.length} candles, price: ${currentPrice}`);

    return new Response(
      JSON.stringify(assetData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in fetch-asset-data:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
