-- Add inscricao_estadual field to clients table
ALTER TABLE public.clients 
ADD COLUMN inscricao_estadual text;