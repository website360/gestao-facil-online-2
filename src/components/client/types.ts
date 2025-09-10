
export interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  client_type: string;
  cpf?: string;
  cnpj?: string;
  birth_date?: string;
  razao_social?: string;
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  allow_system_access?: boolean;
  system_password?: string;
  assigned_user_id?: string;
  assigned_user?: {
    id: string;
    name: string;
    email: string;
  };
  created_at: string;
}
