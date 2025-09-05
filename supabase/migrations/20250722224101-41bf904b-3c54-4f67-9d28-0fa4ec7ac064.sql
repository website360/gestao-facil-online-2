-- Corrigir as duas funções restantes que ainda não têm search_path correto

-- Função check_budget_stock_availability
CREATE OR REPLACE FUNCTION public.check_budget_stock_availability(budget_id_param uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    warnings JSONB := '[]'::jsonb;
    item_record RECORD;
    product_record RECORD;
    warning_obj JSONB;
BEGIN
    -- Buscar todos os itens do orçamento
    FOR item_record IN 
        SELECT bi.*, p.name, p.stock, p.internal_code
        FROM public.budget_items bi
        JOIN public.products p ON p.id = bi.product_id
        WHERE bi.budget_id = budget_id_param
    LOOP
        -- Verificar se há estoque suficiente
        IF item_record.quantity > item_record.stock THEN
            warning_obj := jsonb_build_object(
                'product_id', item_record.product_id,
                'product_name', item_record.name,
                'product_code', item_record.internal_code,
                'requested_quantity', item_record.quantity,
                'available_stock', item_record.stock,
                'shortage', item_record.quantity - item_record.stock
            );
            warnings := warnings || jsonb_build_array(warning_obj);
        END IF;
    END LOOP;
    
    RETURN warnings;
END;
$$;

-- Função update_budget_stock_warnings
CREATE OR REPLACE FUNCTION public.update_budget_stock_warnings()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    stock_warnings JSONB;
BEGIN
    -- Verificar se o status mudou para 'aguardando_aprovacao'
    IF NEW.status = 'aguardando_aprovacao' AND OLD.status != 'aguardando_aprovacao' THEN
        -- Verificar estoque disponível
        stock_warnings := public.check_budget_stock_availability(NEW.id);
        
        -- Atualizar o orçamento com os alertas
        NEW.stock_warnings := stock_warnings;
    END IF;
    
    RETURN NEW;
END;
$$;