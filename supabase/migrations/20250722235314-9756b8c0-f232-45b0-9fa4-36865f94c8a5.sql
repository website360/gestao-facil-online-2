-- Permitir que usuários anônimos visualizem categorias (para catálogo público)
CREATE POLICY "Public can view categories"
ON public.categories
FOR SELECT
USING (true);