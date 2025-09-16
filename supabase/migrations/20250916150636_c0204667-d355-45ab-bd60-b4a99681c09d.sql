-- Allow anonymous users to view products and clients for budget creation

-- Products: Allow anon users to view all products
DROP POLICY IF EXISTS "Anon can view products" ON public.products;
CREATE POLICY "Anon can view products"
ON public.products
FOR SELECT
TO anon
USING (true);

-- Clients: Allow anon users to view clients with system access
DROP POLICY IF EXISTS "Anon can view system-enabled clients" ON public.clients;
CREATE POLICY "Anon can view system-enabled clients"
ON public.clients
FOR SELECT
TO anon
USING (allow_system_access = true);

-- Payment methods: Allow anon to view active payment methods
DROP POLICY IF EXISTS "Anon can view active payment methods" ON public.payment_methods;
CREATE POLICY "Anon can view active payment methods"
ON public.payment_methods
FOR SELECT
TO anon
USING (active = true);

-- Payment types: Allow anon to view active payment types
DROP POLICY IF EXISTS "Anon can view active payment types" ON public.payment_types;
CREATE POLICY "Anon can view active payment types"
ON public.payment_types
FOR SELECT
TO anon
USING (active = true);

-- Shipping options: Allow anon to view active shipping options
DROP POLICY IF EXISTS "Anon can view active shipping options" ON public.shipping_options;
CREATE POLICY "Anon can view active shipping options"
ON public.shipping_options
FOR SELECT
TO anon
USING (active = true);

-- Categories: Allow anon to view all categories (already exists but ensure it's there)
DROP POLICY IF EXISTS "Anon can view categories" ON public.categories;
CREATE POLICY "Anon can view categories"
ON public.categories
FOR SELECT
TO anon
USING (true);