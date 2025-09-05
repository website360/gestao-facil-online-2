-- Criar função para atribuir role de cliente automaticamente quando o cliente é criado ou atualizado com acesso ao sistema
CREATE OR REPLACE FUNCTION public.handle_client_system_access()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Se o cliente tem acesso ao sistema habilitado e tem uma senha
  IF NEW.allow_system_access = true AND NEW.system_password IS NOT NULL THEN
    -- Verificar se já existe um usuário com esse email
    DECLARE
      existing_user_id UUID;
    BEGIN
      -- Buscar se já existe um usuário na tabela auth.users com esse email
      SELECT id INTO existing_user_id
      FROM auth.users
      WHERE email = NEW.email
      LIMIT 1;
      
      -- Se encontrou um usuário, criar ou atualizar o perfil com role cliente
      IF existing_user_id IS NOT NULL THEN
        -- Inserir ou atualizar o perfil
        INSERT INTO public.profiles (id, name, email, role)
        VALUES (existing_user_id, NEW.name, NEW.email, 'cliente')
        ON CONFLICT (id) 
        DO UPDATE SET 
          name = EXCLUDED.name,
          email = EXCLUDED.email,
          role = 'cliente',
          updated_at = now();
      END IF;
    END;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Criar trigger para executar a função quando um cliente é inserido ou atualizado
DROP TRIGGER IF EXISTS on_client_system_access_change ON public.clients;
CREATE TRIGGER on_client_system_access_change
  AFTER INSERT OR UPDATE ON public.clients
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_client_system_access();