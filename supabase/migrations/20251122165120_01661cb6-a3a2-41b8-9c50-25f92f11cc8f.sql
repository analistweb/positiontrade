-- Tabela para rate limiting
CREATE TABLE IF NOT EXISTS public.rate_limit_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  attempted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_rate_limit_identifier ON public.rate_limit_attempts(identifier);
CREATE INDEX IF NOT EXISTS idx_rate_limit_attempted_at ON public.rate_limit_attempts(attempted_at);

-- RLS: Apenas service_role pode gerenciar
ALTER TABLE public.rate_limit_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role pode gerenciar rate limiting"
ON public.rate_limit_attempts
FOR ALL
TO service_role
USING (true);

-- Função para limpar tentativas antigas (>24h)
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  DELETE FROM public.rate_limit_attempts
  WHERE attempted_at < now() - interval '24 hours';
END;
$$;

COMMENT ON TABLE public.rate_limit_attempts IS 'Armazena tentativas de acesso para rate limiting';
COMMENT ON FUNCTION public.cleanup_old_rate_limits IS 'Remove tentativas antigas de rate limiting (>24h)';