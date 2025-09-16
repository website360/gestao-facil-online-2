-- Add anon role policies to allow client-portal budget creation securely

-- Permit anonymous (client-portal) users to INSERT budgets only for themselves when system access is enabled
CREATE POLICY "Anon clients can create their own budgets"
ON public.budgets
FOR INSERT
TO anon
WITH CHECK (
  client_id = created_by AND EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.id = budgets.client_id
      AND c.allow_system_access = true
  )
);

-- Permit anonymous clients to SELECT only their own budgets
CREATE POLICY "Anon clients can view their own budgets"
ON public.budgets
FOR SELECT
TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.id = budgets.client_id
      AND c.allow_system_access = true
      AND budgets.client_id = budgets.created_by
  )
);

-- Permit anonymous clients to UPDATE only their own budgets
CREATE POLICY "Anon clients can update their own budgets"
ON public.budgets
FOR UPDATE
TO anon
USING (
  EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.id = budgets.client_id
      AND c.allow_system_access = true
      AND budgets.client_id = budgets.created_by
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.id = budgets.client_id
      AND c.allow_system_access = true
      AND budgets.client_id = budgets.created_by
  )
);