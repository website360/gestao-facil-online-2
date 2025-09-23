-- Allow anon clients to delete their own budgets and budget items
-- These policies align with existing anon INSERT/UPDATE/SELECT policies

-- Budgets: allow DELETE when the client created the budget and has system access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'budgets' 
      AND policyname = 'Anon clients can delete their own budgets'
  ) THEN
    CREATE POLICY "Anon clients can delete their own budgets"
    ON public.budgets
    FOR DELETE
    USING ((client_id = created_by) AND client_has_system_access(client_id));
  END IF;
END $$;

-- Budget items: allow DELETE when anon can manage the parent budget
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'budget_items' 
      AND policyname = 'Anon clients can delete their own budget items'
  ) THEN
    CREATE POLICY "Anon clients can delete their own budget items"
    ON public.budget_items
    FOR DELETE
    USING (anon_can_manage_budget(budget_id));
  END IF;
END $$;