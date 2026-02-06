-- Corrigir IPI do produto 81 que estava faltando
UPDATE public.products SET ipi = 5.20 WHERE internal_code = '81';