-- Adicionar política para que todos os usuários autenticados possam ver nomes dos profiles
-- Isso é necessário para que a role "separacao" possa ver o nome do vendedor responsável
CREATE POLICY "All authenticated users can view basic profile info"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);