-- Perfil "Super Admin": um administrador que pode excluir vendas em qualquer
-- etapa, inclusive entrega realizada e finalizada.
--
-- Modelado como flag em cima de role = 'admin', e nao como valor novo do enum
-- user_role, de proposito: existem ~60 checagens de role = 'admin' espalhadas
-- pelo frontend e varias policies RLS que testam o mesmo valor. Um role novo
-- faria o Super Admin perder silenciosamente todos os poderes de admin em cada
-- um desses pontos.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_super_admin boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.is_super_admin IS
  'Super Admin: administrador que pode excluir vendas em qualquer etapa, inclusive finalizadas.';

-- Concede o perfil aos dois usuarios definidos. O role vai junto porque o Super
-- Admin e, por definicao, um admin.
UPDATE public.profiles
SET role = 'admin',
    is_super_admin = true
WHERE lower(email) IN (
  'contato@agenciamay.com.br',
  'imtextil1@gmail.com'
);
