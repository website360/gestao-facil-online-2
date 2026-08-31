-- Indices para acelerar a listagem de orcamentos.
--
-- A tela de Orcamentos passou a filtrar por periodo (created_at) e continua
-- trazendo os itens de cada orcamento no mesmo carregamento. Sem estes indices
-- o Postgres precisa varrer as tabelas inteiras a cada abertura da tela.

-- Filtro de periodo + ordenacao padrao da listagem (mais recentes primeiro)
CREATE INDEX IF NOT EXISTS idx_budgets_created_at
  ON public.budgets (created_at DESC);

-- Vendedores veem apenas os orcamentos que criaram
CREATE INDEX IF NOT EXISTS idx_budgets_created_by
  ON public.budgets (created_by);

-- Clientes veem apenas os proprios orcamentos
CREATE INDEX IF NOT EXISTS idx_budgets_client_id
  ON public.budgets (client_id);

-- Join dos itens de cada orcamento na listagem
CREATE INDEX IF NOT EXISTS idx_budget_items_budget_id
  ON public.budget_items (budget_id);
