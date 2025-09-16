-- Create anon client policies (drop if already exist)

-- INSERT policy
DROP POLICY IF EXISTS "Anon clients can create their own budgets" ON public.budgets;
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

-- SELECT policy
DROP POLICY IF EXISTS "Anon clients can view their own budgets" ON public.budgets;
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

-- UPDATE policy
DROP POLICY IF EXISTS "Anon clients can update their own budgets" ON public.budgets;
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