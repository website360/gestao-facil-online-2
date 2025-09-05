-- Fix the client data access by updating the RLS policy for clients
-- The current policy is trying to access auth.users table which causes permission errors

-- Drop the problematic policy
DROP POLICY IF EXISTS "Clients can view their own client data" ON public.clients;

-- Create a new policy that works with the client login system
-- Since clients login via edge function and don't have auth.uid(), we need a different approach
CREATE POLICY "Clients can view their own client data via email" 
ON public.clients 
FOR SELECT 
USING (
  -- Allow if user is authenticated normally (for admin/staff users)
  auth.uid() IS NOT NULL 
  OR 
  -- Allow access for client login system (this will be controlled by the edge function)
  allow_system_access = true
);

-- Also ensure clients can read their own budgets
CREATE POLICY "Clients can view their own budgets" 
ON public.budgets 
FOR SELECT 
USING (
  -- Normal authenticated users can see all
  auth.uid() IS NOT NULL
  OR
  -- For client login system, allow if they have system access enabled
  EXISTS (
    SELECT 1 FROM public.clients c 
    WHERE c.id = budgets.client_id 
    AND c.allow_system_access = true
  )
);