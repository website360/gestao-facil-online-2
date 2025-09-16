-- Complete RLS policy reset for budgets table to fix client budget creation

-- First, disable RLS temporarily to see all current policies
SELECT schemaname, tablename, policyname, cmd, permissive, roles, qual, with_check 
FROM pg_policies 
WHERE tablename = 'budgets';

-- Drop ALL existing policies on budgets table
DROP POLICY IF EXISTS "Authenticated users can delete budgets" ON public.budgets;
DROP POLICY IF EXISTS "Authenticated users can insert budgets" ON public.budgets;
DROP POLICY IF EXISTS "Authenticated users can update budgets" ON public.budgets;
DROP POLICY IF EXISTS "Authenticated users can view budgets" ON public.budgets;
DROP POLICY IF EXISTS "Allow authenticated users to create budgets" ON public.budgets;
DROP POLICY IF EXISTS "Allow authenticated users to update budgets" ON public.budgets;
DROP POLICY IF EXISTS "Allow authenticated users to view budgets" ON public.budgets;

-- Create simple, working policies for all authenticated users
CREATE POLICY "Enable insert for authenticated users" 
ON public.budgets 
FOR INSERT 
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable select for authenticated users" 
ON public.budgets 
FOR SELECT 
TO authenticated
USING (true);

CREATE POLICY "Enable update for authenticated users" 
ON public.budgets 
FOR UPDATE 
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users" 
ON public.budgets 
FOR DELETE 
TO authenticated
USING (true);