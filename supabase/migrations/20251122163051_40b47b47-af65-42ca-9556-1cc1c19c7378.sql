-- Correção de avisos de segurança da migração anterior

-- 1. Adicionar search_path para funções sem ele
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.cleanup_expired_tokens()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.verification_tokens
  WHERE expires_at < now() AND used_at IS NULL;
  
  DELETE FROM public.refresh_tokens
  WHERE expires_at < now() OR revoked_at IS NOT NULL;
END;
$$;

-- 2. Políticas RLS para verification_tokens (gerenciadas apenas por edge functions com service role)
CREATE POLICY "Service role pode gerenciar tokens de verificação"
  ON public.verification_tokens FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- 3. Políticas RLS para refresh_tokens (gerenciadas apenas por edge functions com service role)
CREATE POLICY "Service role pode gerenciar refresh tokens"
  ON public.refresh_tokens FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');