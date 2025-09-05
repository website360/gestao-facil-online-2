-- Verificar se existe trigger que altera created_at na tabela sales
-- e garantir que apenas o updated_at seja alterado automaticamente

-- Primeiro, vamos verificar os triggers existentes
SELECT
    trigger_name,
    event_manipulation,
    action_timing,
    action_statement
FROM information_schema.triggers
WHERE event_object_table = 'sales'
    AND event_object_schema = 'public';

-- Se houver trigger que altera created_at, vamos removê-lo e criar um novo apenas para updated_at
-- Vamos criar/recriar o trigger correto que só altera o updated_at

-- Remover trigger existente se houver problema
DROP TRIGGER IF EXISTS update_sales_updated_at ON public.sales;

-- Criar trigger correto que só atualiza o updated_at
CREATE OR REPLACE TRIGGER update_sales_updated_at
    BEFORE UPDATE ON public.sales
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Comentar sobre a funcionalidade
COMMENT ON TRIGGER update_sales_updated_at ON public.sales IS 'Atualiza automaticamente o campo updated_at quando um registro é alterado, preservando o created_at original';