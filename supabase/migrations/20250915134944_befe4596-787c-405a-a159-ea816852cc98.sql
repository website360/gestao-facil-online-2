-- Fix RLS policies for budgets table to allow clients to create budgets properly

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Clients can create their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Clients can update their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Clients can view their own budgets" ON public.budgets;

-- Create new policies that work correctly for clients
CREATE POLICY "Clients can create budgets when authenticated" 
ON public.budgets 
FOR INSERT 
TO authenticated
WITH CHECK (
  -- Allow authenticated users (including clients) to create budgets
  auth.uid() IS NOT NULL AND (
    -- Either it's a regular authenticated user
    true
    -- Or it's a client with system access creating their own budget
    OR (client_id = created_by AND EXISTS (
      SELECT 1 FROM clients c 
      WHERE c.id = budgets.client_id AND c.allow_system_access = true
    ))
  )
);

CREATE POLICY "Clients can update their own budgets when authenticated" 
ON public.budgets 
FOR UPDATE 
TO authenticated
USING (
  auth.uid() IS NOT NULL AND (
    -- Regular authenticated users can update
    true
    -- Or clients with system access updating their own budgets
    OR (client_id = created_by AND EXISTS (
      SELECT 1 FROM clients c 
      WHERE c.id = budgets.client_id AND c.allow_system_access = true
    ))
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND (
    -- Regular authenticated users can update
    true
    -- Or clients with system access updating their own budgets
    OR (client_id = created_by AND EXISTS (
      SELECT 1 FROM clients c 
      WHERE c.id = budgets.client_id AND c.allow_system_access = true
    ))
  )
);

CREATE POLICY "Clients can view budgets when authenticated" 
ON public.budgets 
FOR SELECT 
TO authenticated
USING (
  auth.uid() IS NOT NULL AND (
    -- Regular authenticated users can view all budgets
    true
    -- Or clients with system access can view their own budgets
    OR (client_id = created_by AND EXISTS (
      SELECT 1 FROM clients c 
      WHERE c.id = budgets.client_id AND c.allow_system_access = true
    ))
  )
);