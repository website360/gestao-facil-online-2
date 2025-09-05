-- Add assigned_user_id column to clients table
ALTER TABLE public.clients 
ADD COLUMN assigned_user_id uuid REFERENCES public.profiles(id);

-- Update RLS policies for clients to handle user assignment
DROP POLICY IF EXISTS "Authenticated users can view clients" ON public.clients;
DROP POLICY IF EXISTS "Clients can view their own client data via email" ON public.clients;

-- New policy for viewing clients based on role and assignment
CREATE POLICY "Users can view clients based on role and assignment" 
ON public.clients 
FOR SELECT 
USING (
  -- Admin and gerente can see all clients
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'gerente')
  )
  OR
  -- Vendas can see clients assigned to them or unassigned clients (assigned_user_id IS NULL)
  (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND role = 'vendas'
    )
    AND (assigned_user_id = auth.uid() OR assigned_user_id IS NULL)
  )
  OR
  -- Clients can view their own data if they have system access
  (allow_system_access = true)
);

-- Keep existing policies for insert, update, delete as they were
CREATE POLICY "Authenticated users can insert clients" 
ON public.clients 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Authenticated users can update clients" 
ON public.clients 
FOR UPDATE 
USING (true);

CREATE POLICY "Authenticated users can delete clients" 
ON public.clients 
FOR DELETE 
USING (true);