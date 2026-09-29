/**
 * Regra única de quem pode excluir uma venda.
 *
 * Antes isto estava duplicado e divergente entre a tabela do desktop e os cards
 * do mobile: o desktop bloqueava por etapa, o mobile liberava o admin em
 * qualquer etapa. Agora as duas telas chamam esta função.
 */

/** Etapas em que a mercadoria já saiu: exclusão bloqueada para quem não é Super Admin. */
const BLOCKED_STATUSES = ['entrega_realizada', 'finalizada'];

/** Perfis que excluem vendas nas etapas iniciais ('vendas' é a role antiga do vendedor). */
const ROLES_WITH_DELETE = ['admin', 'vendedor_externo', 'vendedor_interno', 'vendas'];

/** Etapas a partir da emissão da nota: os itens já foram faturados. */
const POST_INVOICE_STATUSES = ['nota_fiscal', 'aguardando_entrega', 'entrega_realizada', 'finalizada'];

export const canDeleteSale = (
  status: string,
  userRole: string,
  isSuperAdmin = false
): boolean => {
  // Super Admin exclui em qualquer etapa, inclusive entrega realizada e finalizada
  if (isSuperAdmin) return true;

  if (!ROLES_WITH_DELETE.includes(userRole)) return false;

  return !BLOCKED_STATUSES.includes(status);
};

/**
 * Se a venda já passou da nota fiscal, devolver os itens ao estoque inflaria o
 * saldo com mercadoria que já saiu — então o modal pergunta em vez de assumir.
 */
export const shouldAskAboutStock = (status: string): boolean =>
  POST_INVOICE_STATUSES.includes(status);
