/**
 * Sessao do portal do cliente.
 *
 * O portal nao usa o auth do Supabase: o login (edge function client-login)
 * devolve um token de sessao, guardado no localStorage. Esse token e o que
 * identifica o cliente nas RPCs `client_portal_*`, que rodam como
 * SECURITY DEFINER e devolvem/gravam somente os dados daquele cliente.
 *
 * Por que um helper em vez de usar o useAuth: os servicos e os hooks de
 * orcamento sao compartilhados com o painel interno e nem todos tem acesso ao
 * contexto de auth. Ler o token do localStorage mantem esses pontos simples.
 */

import { supabase } from '@/integrations/supabase/client';

const CLIENT_TOKEN_KEY = 'clientSessionToken';

export const getClientPortalToken = (): string | null => {
  try {
    return localStorage.getItem(CLIENT_TOKEN_KEY);
  } catch {
    return null;
  }
};

export const isClientPortalSession = (): boolean => !!getClientPortalToken();

export interface ClientPortalConfig {
  max_discount_sales: string | null;
  pdf_budget_config: string | null;
  correios_enabled: boolean;
}

const EMPTY_CONFIG: ClientPortalConfig = {
  max_discount_sales: null,
  pdf_budget_config: null,
  correios_enabled: false,
};

let configCache: { token: string; value: Promise<ClientPortalConfig> } | null = null;

/**
 * Configuracoes liberadas para o portal (desconto maximo, layout do PDF e se o
 * frete dos Correios esta ativo). A tabela system_configurations guarda
 * credenciais, entao o portal nao a le direto - recebe apenas esta lista
 * branca. O resultado e cacheado por sessao.
 */
export const getClientPortalConfig = async (): Promise<ClientPortalConfig> => {
  const token = getClientPortalToken();
  if (!token) return EMPTY_CONFIG;

  if (configCache?.token === token) return configCache.value;

  const request = (async () => {
    const { data, error } = await supabase.rpc('client_portal_config', { p_token: token });

    if (error) {
      console.error('Erro ao carregar configurações do portal:', error);
      return EMPTY_CONFIG;
    }

    const payload = (data || {}) as Partial<ClientPortalConfig> & { error?: string };
    if (payload.error) return EMPTY_CONFIG;

    return {
      max_discount_sales: payload.max_discount_sales ?? null,
      pdf_budget_config: payload.pdf_budget_config ?? null,
      correios_enabled: payload.correios_enabled ?? false,
    };
  })();

  configCache = { token, value: request };
  return request;
};

let clientCache: { token: string; value: Promise<any | null> } | null = null;

/**
 * Cadastro do próprio cliente da sessão (endereço/CEP para o frete,
 * documentos para o PDF). A tabela `clients` não é legível pelo portal.
 */
export const getClientPortalClient = async (): Promise<any | null> => {
  const token = getClientPortalToken();
  if (!token) return null;

  if (clientCache?.token === token) return clientCache.value;

  const request = (async () => {
    const { data, error } = await supabase.rpc('client_portal_me', { p_token: token });

    if (error) {
      console.error('Erro ao carregar dados do cliente no portal:', error);
      return null;
    }

    const payload = (data || {}) as { error?: string; client?: any };
    return payload.error ? null : payload.client ?? null;
  })();

  clientCache = { token, value: request };
  return request;
};

export const clearClientPortalCache = () => {
  configCache = null;
  clientCache = null;
};

const saleItemsCache = new Map<string, any[]>();

/**
 * Itens de uma venda, sob demanda.
 *
 * A listagem do painel não traz itens: um cliente com centenas de vendas fazia
 * a consulta estourar o tempo limite da API. Os itens só são buscados quando o
 * cliente abre o pedido ou baixa o PDF.
 */
export const getClientPortalSaleItems = async (saleId: string): Promise<any[]> => {
  const token = getClientPortalToken();
  if (!token) return [];

  const cached = saleItemsCache.get(saleId);
  if (cached) return cached;

  const { data, error } = await supabase.rpc('client_portal_sale_items', {
    p_token: token,
    p_sale_id: saleId,
  });

  if (error) {
    console.error('Erro ao carregar itens da venda:', error);
    return [];
  }

  const payload = (data || {}) as { error?: string; items?: any[] };
  const items = payload.error || !Array.isArray(payload.items) ? [] : payload.items;

  saleItemsCache.set(saleId, items);
  return items;
};

/**
 * Envia o orçamento para aprovação. Pela sessão do portal quando existe, senão
 * pelo caminho antigo (update direto), que é o que o painel interno usa.
 * Retorna null em caso de sucesso, ou a mensagem de erro.
 */
export const submitBudgetForApproval = async (budgetId: string): Promise<string | null> => {
  const token = getClientPortalToken();

  if (token) {
    const { data, error } = await supabase.rpc('client_portal_submit_budget', {
      p_token: token,
      p_budget_id: budgetId,
    });

    if (error) return error.message;

    const payload = (data || {}) as { error?: string };
    if (payload.error === 'invalid_session') return 'Sua sessão expirou. Entre novamente.';
    if (payload.error) return 'Este orçamento não pode ser enviado para aprovação.';

    return null;
  }

  const { error } = await supabase
    .from('budgets')
    .update({ status: 'aguardando_aprovacao', updated_at: new Date().toISOString() })
    .eq('id', budgetId);

  return error ? error.message : null;
};
