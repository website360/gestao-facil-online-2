-- Verificar e corrigir a função update_updated_at_column para garantir que preserve o created_at
-- E também verificar se há algum problema na conversão de orçamento em venda que possa estar alterando a data

-- Ver a função atual
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'update_updated_at_column';

-- Recriar a função de forma mais específica para garantir que só o updated_at seja alterado
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Apenas atualizar o updated_at, preservando todas as outras colunas incluindo created_at
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Comentar a função
COMMENT ON FUNCTION public.update_updated_at_column() IS 'Atualiza apenas o campo updated_at preservando o created_at original e todos os outros campos';

-- Verificar se existe trigger na tabela budgets também
DROP TRIGGER IF EXISTS update_budgets_updated_at ON public.budgets;

CREATE OR REPLACE TRIGGER update_budgets_updated_at
    BEFORE UPDATE ON public.budgets
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

COMMENT ON TRIGGER update_budgets_updated_at ON public.budgets IS 'Atualiza automaticamente o campo updated_at quando um orçamento é alterado, preservando o created_at original';