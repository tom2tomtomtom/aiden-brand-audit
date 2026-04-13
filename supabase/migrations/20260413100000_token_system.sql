-- Token balance per user
CREATE TABLE IF NOT EXISTS public.token_balances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance integer NOT NULL DEFAULT 0,
  lifetime_granted integer NOT NULL DEFAULT 0,
  lifetime_spent integer NOT NULL DEFAULT 0,
  last_grant_month text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT token_balances_user_id_key UNIQUE (user_id)
);

CREATE INDEX IF NOT EXISTS idx_token_balances_user_id ON public.token_balances(user_id);

-- Token transaction ledger (full audit trail)
CREATE TABLE IF NOT EXISTS public.token_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount integer NOT NULL,
  type text NOT NULL CHECK (type IN ('grant', 'spend', 'refund', 'bonus')),
  description text,
  audit_id uuid,
  balance_after integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_token_transactions_user_id ON public.token_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_token_transactions_created_at ON public.token_transactions(created_at);

-- Deduct tokens atomically, returns new balance or -1 if insufficient
CREATE OR REPLACE FUNCTION public.deduct_tokens(
  p_user_id uuid,
  p_amount integer,
  p_description text DEFAULT NULL,
  p_audit_id uuid DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance integer;
BEGIN
  UPDATE public.token_balances
  SET balance = balance - p_amount,
      lifetime_spent = lifetime_spent + p_amount,
      updated_at = now()
  WHERE user_id = p_user_id AND balance >= p_amount
  RETURNING balance INTO v_balance;

  IF v_balance IS NULL THEN
    RETURN -1;
  END IF;

  INSERT INTO public.token_transactions (user_id, amount, type, description, audit_id, balance_after)
  VALUES (p_user_id, -p_amount, 'spend', p_description, p_audit_id, v_balance);

  RETURN v_balance;
END;
$$;

-- Grant tokens (monthly top-up, bonus, or purchase)
CREATE OR REPLACE FUNCTION public.grant_tokens(
  p_user_id uuid,
  p_amount integer,
  p_type text DEFAULT 'grant',
  p_description text DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance integer;
BEGIN
  INSERT INTO public.token_balances (user_id, balance, lifetime_granted, last_grant_month)
  VALUES (p_user_id, p_amount, p_amount, to_char(now(), 'YYYY-MM'))
  ON CONFLICT (user_id)
  DO UPDATE SET
    balance = token_balances.balance + p_amount,
    lifetime_granted = token_balances.lifetime_granted + p_amount,
    last_grant_month = to_char(now(), 'YYYY-MM'),
    updated_at = now()
  RETURNING balance INTO v_balance;

  INSERT INTO public.token_transactions (user_id, amount, type, description, balance_after)
  VALUES (p_user_id, p_amount, p_type, p_description, v_balance);

  RETURN v_balance;
END;
$$;

-- RLS
ALTER TABLE public.token_balances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own token balance"
  ON public.token_balances FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can read own token transactions"
  ON public.token_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages token balances"
  ON public.token_balances FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE POLICY "Service role manages token transactions"
  ON public.token_transactions FOR ALL TO service_role
  USING (true) WITH CHECK (true);
