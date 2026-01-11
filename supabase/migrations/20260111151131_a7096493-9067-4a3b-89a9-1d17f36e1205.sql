-- Explicit DENY policies for anonymous access to all sensitive tables
-- Defense-in-depth: ensures no anonymous access even if RLS behavior changes

CREATE POLICY "Deny anonymous access to audit_events"
  ON public.audit_events FOR ALL
  TO anon
  USING (false);

CREATE POLICY "Deny anonymous access to user_profiles"
  ON public.user_profiles FOR ALL
  TO anon
  USING (false);

CREATE POLICY "Deny anonymous access to verification_tokens"
  ON public.verification_tokens FOR ALL
  TO anon
  USING (false);

CREATE POLICY "Deny anonymous access to refresh_tokens"
  ON public.refresh_tokens FOR ALL
  TO anon
  USING (false);

CREATE POLICY "Deny anonymous access to user_roles"
  ON public.user_roles FOR ALL
  TO anon
  USING (false);

CREATE POLICY "Deny anonymous access to rate_limit_attempts"
  ON public.rate_limit_attempts FOR ALL
  TO anon
  USING (false);