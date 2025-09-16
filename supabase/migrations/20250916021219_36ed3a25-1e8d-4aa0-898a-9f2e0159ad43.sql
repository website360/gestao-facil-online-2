-- Helper functions to avoid RLS recursion and allow anon checks securely

-- Function: check if a client has system access
CREATE OR REPLACE FUNCTION public.client_has_system_access(p_client_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.id = p_client_id AND c.allow_system_access = true
  );
$$;

-- Function: check if an anon client can manage a given budget (own budget)
CREATE OR REPLACE FUNCTION public.anon_can_manage_budget(p_budget_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.budgets b
    JOIN public.clients c ON c.id = b.client_id
    WHERE b.id = p_budget_id
      AND b.client_id = b.created_by
      AND c.allow_system_access = true
  );
$$;

-- Update anon policies on budgets to use helper function
DROP POLICY IF EXISTS "Anon clients can create their own budgets" ON public.budgets;
CREATE POLICY "Anon clients can create their own budgets"
ON public.budgets
FOR INSERT
TO anon
WITH CHECK (
  client_id = created_by AND public.client_has_system_access(client_id)
);

DROP POLICY IF EXISTS "Anon clients can view their own budgets" ON public.budgets;
CREATE POLICY "Anon clients can view their own budgets"
ON public.budgets
FOR SELECT
TO anon
USING (
  client_id = created_by AND public.client_has_system_access(client_id)
);

DROP POLICY IF EXISTS "Anon clients can update their own budgets" ON public.budgets;
CREATE POLICY "Anon clients can update their own budgets"
ON public.budgets
FOR UPDATE
TO anon
USING (
  client_id = created_by AND public.client_has_system_access(client_id)
)
WITH CHECK (
  client_id = created_by AND public.client_has_system_access(client_id)
);

-- Add anon policies for budget_items using helper function
DROP POLICY IF EXISTS "Anon clients can insert budget items" ON public.budget_items;
CREATE POLICY "Anon clients can insert budget items"
ON public.budget_items
FOR INSERT
TO anon
WITH CHECK (
  public.anon_can_manage_budget(budget_id)
);

DROP POLICY IF EXISTS "Anon clients can view their own budget items" ON public.budget_items;
CREATE POLICY "Anon clients can view their own budget items"
ON public.budget_items
FOR SELECT
TO anon
USING (
  public.anon_can_manage_budget(budget_id)
);

DROP POLICY IF EXISTS "Anon clients can update their own budget items" ON public.budget_items;
CREATE POLICY "Anon clients can update their own budget items"
ON public.budget_items
FOR UPDATE
TO anon
USING (
  public.anon_can_manage_budget(budget_id)
)
WITH CHECK (
  public.anon_can_manage_budget(budget_id)
);
