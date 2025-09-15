-- Fix RLS policies for budgets table to allow clients to create budgets properly

-- Drop all existing client-related policies
DROP POLICY IF EXISTS "Clients can create budgets when authenticated" ON public.budgets;
DROP POLICY IF EXISTS "Clients can update their own budgets when authenticated" ON public.budgets;
DROP POLICY IF EXISTS "Clients can view budgets when authenticated" ON public.budgets;

-- Create simplified policies that allow authenticated users (including clients) to work with budgets
CREATE POLICY "Allow authenticated users to create budgets" 
ON public.budgets 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to update budgets" 
ON public.budgets 
FOR UPDATE 
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow authenticated users to view budgets" 
ON public.budgets 
FOR SELECT 
TO authenticated
USING (auth.uid() IS NOT NULL);