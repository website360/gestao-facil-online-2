-- Corrigir search_path nas funções para segurança
-- Atualizar todas as funções para ter search_path definido corretamente

-- Função is_client_user
CREATE OR REPLACE FUNCTION public.is_client_user()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND role = 'cliente'
  );
$$;

-- Função has_role (já existente, mas vamos garantir que tenha search_path)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role user_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = _user_id
      AND role = _role
  )
$$;

-- Função handle_new_user 
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.email,
    'vendas'
  );
  RETURN new;
END;
$$;

-- Função update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
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

-- Função register_stock_movement
CREATE OR REPLACE FUNCTION public.register_stock_movement(p_product_id uuid, p_user_id uuid, p_movement_type text, p_quantity numeric, p_previous_stock numeric, p_new_stock numeric, p_reason text, p_reference_id uuid DEFAULT NULL::uuid, p_notes text DEFAULT NULL::text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  movement_id UUID;
BEGIN
  INSERT INTO public.stock_movements (
    product_id,
    user_id,
    movement_type,
    quantity,
    previous_stock,
    new_stock,
    reason,
    reference_id,
    notes
  ) VALUES (
    p_product_id,
    p_user_id,
    p_movement_type,
    p_quantity,
    p_previous_stock,
    p_new_stock,
    p_reason,
    p_reference_id,
    p_notes
  ) RETURNING id INTO movement_id;
  
  RETURN movement_id;
END;
$$;

-- Função log_sale_status_change
CREATE OR REPLACE FUNCTION public.log_sale_status_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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
        WHEN NEW.status = 'atencao' THEN 'Retornado para vendas devido a problemas na separação'
        WHEN OLD.status = 'atencao' AND NEW.status = 'separacao' THEN 'Reenviado para separação após ajustes'
        WHEN NEW.status = 'separacao' THEN 'Iniciado processo de separação'
        WHEN NEW.status = 'conferencia' THEN 'Enviado para conferência'
        WHEN NEW.status = 'nota_fiscal' THEN 'Enviado para geração de nota fiscal'
        WHEN NEW.status = 'finalizado' THEN 'Venda finalizada'
        ELSE 'Mudança de status'
      END
    );
  END IF;
  
  RETURN NEW;
END;
$$;