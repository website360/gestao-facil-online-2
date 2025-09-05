-- Atualizar enum de status de vendas para incluir os novos status
ALTER TYPE sale_status RENAME TO sale_status_old;

CREATE TYPE sale_status AS ENUM (
  'separacao',
  'conferencia', 
  'nota_fiscal',
  'aguardando_entrega',
  'entrega_realizada',
  'atencao'
);

-- Atualizar a tabela sales para usar o novo enum
ALTER TABLE sales 
ALTER COLUMN status DROP DEFAULT,
ALTER COLUMN status TYPE sale_status USING 
  CASE 
    WHEN status::text = 'finalizado' THEN 'entrega_realizada'::sale_status
    ELSE status::text::sale_status
  END,
ALTER COLUMN status SET DEFAULT 'separacao'::sale_status;

-- Atualizar enum de status de orçamento para seguir a nova ordem
ALTER TYPE budget_status RENAME TO budget_status_old;

CREATE TYPE budget_status AS ENUM (
  'aguardando_aprovacao',
  'aprovado', 
  'rejeitado',
  'convertido'
);

-- Atualizar a tabela budgets para usar o novo enum
ALTER TABLE budgets
ALTER COLUMN status DROP DEFAULT,
ALTER COLUMN status TYPE budget_status USING status::text::budget_status,
ALTER COLUMN status SET DEFAULT 'aguardando_aprovacao'::budget_status;

-- Atualizar tabela sale_status_logs para usar o novo enum
ALTER TABLE sale_status_logs
ALTER COLUMN previous_status TYPE sale_status USING previous_status::text::sale_status,
ALTER COLUMN new_status TYPE sale_status USING new_status::text::sale_status;

-- Remover os tipos antigos
DROP TYPE sale_status_old;
DROP TYPE budget_status_old;

-- Adicionar coluna para controlar quem fez a entrega
ALTER TABLE sales ADD COLUMN delivery_user_id uuid;
ALTER TABLE sales ADD COLUMN delivery_completed_at timestamp with time zone;

-- Atualizar função de log de mudança de status
CREATE OR REPLACE FUNCTION public.log_sale_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Se o status mudou, registrar no log
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.sale_status_logs (
      sale_id,
      previous_status,
      new_status,
      user_id,
      reason
    ) VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      auth.uid(),
      CASE 
        WHEN NEW.status = 'atencao' THEN 'Retornado para vendas devido a problemas'
        WHEN OLD.status = 'atencao' AND NEW.status = 'separacao' THEN 'Reenviado para separação após ajustes'
        WHEN NEW.status = 'separacao' THEN 'Iniciado processo de separação'
        WHEN NEW.status = 'conferencia' THEN 'Enviado para conferência'
        WHEN NEW.status = 'nota_fiscal' THEN 'Enviado para geração de nota fiscal'
        WHEN NEW.status = 'aguardando_entrega' THEN 'Nota fiscal gerada, aguardando entrega'
        WHEN NEW.status = 'entrega_realizada' THEN 'Entrega realizada com sucesso'
        ELSE 'Mudança de status'
      END
    );
  END IF;
  
  RETURN NEW;
END;
$function$;