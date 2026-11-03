/**
 * Mapeamento de status para o painel do CLIENTE.
 *
 * No painel interno um pedido vive em duas tabelas: enquanto e orcamento fica
 * em `budgets`, e depois de aprovado passa a existir tambem em `sales`. Para o
 * cliente isso e um unico pedido, que precisa continuar visivel e legivel em
 * TODAS as etapas - antes era escondido quando o orcamento virava venda.
 */

export type ClientOrderTone = 'pending' | 'progress' | 'done' | 'alert';

export interface ClientOrderStatusInfo {
  /** Indice da etapa atual dentro de CLIENT_ORDER_STEPS (-1 quando nao se aplica) */
  stepIndex: number;
  /** Texto exibido no badge */
  label: string;
  /** Classes do badge */
  color: string;
  tone: ClientOrderTone;
  /** Explicacao curta do que esta acontecendo, para o cliente */
  description: string;
}

export const CLIENT_ORDER_STEPS = [
  { key: 'criado', label: 'Pedido criado' },
  { key: 'aprovacao', label: 'Aguardando aprovação' },
  { key: 'aprovado', label: 'Aprovado' },
  { key: 'separacao', label: 'Em separação' },
  { key: 'conferencia', label: 'Em conferência' },
  { key: 'nota_fiscal', label: 'Nota fiscal' },
  { key: 'entrega', label: 'Em entrega' },
  { key: 'entregue', label: 'Entregue' },
] as const;

export type ClientOrderStepKey = typeof CLIENT_ORDER_STEPS[number]['key'];

const STEP_INDEX: Record<ClientOrderStepKey, number> = CLIENT_ORDER_STEPS.reduce(
  (acc, step, index) => ({ ...acc, [step.key]: index }),
  {} as Record<ClientOrderStepKey, number>
);

const TONE_COLORS: Record<ClientOrderTone, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  progress: 'bg-blue-100 text-blue-800',
  done: 'bg-green-100 text-green-800',
  alert: 'bg-red-100 text-red-800',
};

const budgetStatusMap: Record<string, Omit<ClientOrderStatusInfo, 'color'>> = {
  processando: {
    stepIndex: STEP_INDEX.criado,
    label: 'Em elaboração',
    tone: 'pending',
    description: 'Você ainda pode editar este pedido e enviá-lo para aprovação.',
  },
  aguardando_aprovacao: {
    stepIndex: STEP_INDEX.aprovacao,
    label: 'Aguardando aprovação',
    tone: 'pending',
    description: 'Pedido enviado. Nossa equipe está analisando valores e disponibilidade.',
  },
  aprovado: {
    stepIndex: STEP_INDEX.aprovado,
    label: 'Aprovado',
    tone: 'progress',
    description: 'Pedido aprovado. Em breve entra na fila de separação.',
  },
  rejeitado: {
    stepIndex: STEP_INDEX.aprovacao,
    label: 'Revisar pedido',
    tone: 'alert',
    description: 'O pedido voltou para revisão. Ajuste os itens e envie novamente.',
  },
  convertido: {
    stepIndex: STEP_INDEX.aprovado,
    label: 'Aprovado - em preparação',
    tone: 'progress',
    description: 'Pedido aprovado e em preparação pela nossa equipe.',
  },
};

const saleStatusMap: Record<string, Omit<ClientOrderStatusInfo, 'color'>> = {
  separacao: {
    stepIndex: STEP_INDEX.separacao,
    label: 'Em separação',
    tone: 'progress',
    description: 'Estamos separando os itens do seu pedido no estoque.',
  },
  conferencia: {
    stepIndex: STEP_INDEX.conferencia,
    label: 'Em conferência',
    tone: 'progress',
    description: 'Os itens separados estão sendo conferidos antes do faturamento.',
  },
  nota_fiscal: {
    stepIndex: STEP_INDEX.nota_fiscal,
    label: 'Emitindo nota fiscal',
    tone: 'progress',
    description: 'Pedido conferido. Estamos emitindo a nota fiscal.',
  },
  aguardando_entrega: {
    stepIndex: STEP_INDEX.entrega,
    label: 'Aguardando entrega',
    tone: 'progress',
    description: 'Pedido faturado e pronto para sair para entrega.',
  },
  entrega_realizada: {
    stepIndex: STEP_INDEX.entregue,
    label: 'Entregue',
    tone: 'done',
    description: 'Pedido entregue. Obrigado pela compra!',
  },
  finalizada: {
    stepIndex: STEP_INDEX.entregue,
    label: 'Finalizado',
    tone: 'done',
    description: 'Pedido concluído.',
  },
  atencao: {
    stepIndex: STEP_INDEX.separacao,
    label: 'Precisa de atenção',
    tone: 'alert',
    description: 'Há uma pendência neste pedido. Fale com o seu vendedor.',
  },
};

const withColor = (info: Omit<ClientOrderStatusInfo, 'color'>): ClientOrderStatusInfo => ({
  ...info,
  color: TONE_COLORS[info.tone],
});

const fallback = (status: string): ClientOrderStatusInfo =>
  withColor({
    stepIndex: -1,
    label: status ? status.replace(/_/g, ' ') : 'Em andamento',
    tone: 'progress',
    description: 'Pedido em andamento.',
  });

export const getBudgetStatusInfo = (status?: string | null): ClientOrderStatusInfo => {
  if (!status) return fallback('');
  return budgetStatusMap[status] ? withColor(budgetStatusMap[status]) : fallback(status);
};

export const getSaleStatusInfo = (status?: string | null): ClientOrderStatusInfo => {
  if (!status) return fallback('');
  return saleStatusMap[status] ? withColor(saleStatusMap[status]) : fallback(status);
};

/**
 * Status do pedido do ponto de vista do cliente: a venda manda quando existe,
 * senao vale o status do orcamento.
 */
export const getClientOrderStatusInfo = (
  budgetStatus?: string | null,
  saleStatus?: string | null
): ClientOrderStatusInfo =>
  saleStatus ? getSaleStatusInfo(saleStatus) : getBudgetStatusInfo(budgetStatus);

export interface ClientOrderTimelineStep {
  key: ClientOrderStepKey;
  label: string;
  state: 'done' | 'current' | 'pending';
  /** Data em que a etapa foi concluida, quando conhecida */
  date?: string | null;
}

/**
 * Monta a linha do tempo do pedido usando as datas que o proprio fluxo interno
 * ja registra na venda (separacao, conferencia, nota fiscal e entrega).
 */
export const buildClientOrderTimeline = (
  budget: { created_at?: string; status?: string; approved_at?: string | null } | null | undefined,
  sale:
    | {
        status?: string;
        created_at?: string;
        converted_from_budget_at?: string | null;
        separation_completed_at?: string | null;
        conference_completed_at?: string | null;
        invoice_completed_at?: string | null;
        delivery_completed_at?: string | null;
      }
    | null
    | undefined
): ClientOrderTimelineStep[] => {
  const current = getClientOrderStatusInfo(budget?.status, sale?.status);

  const dates: Partial<Record<ClientOrderStepKey, string | null | undefined>> = {
    criado: budget?.created_at,
    aprovado: sale?.converted_from_budget_at || sale?.created_at || budget?.approved_at,
    separacao: sale?.separation_completed_at,
    conferencia: sale?.conference_completed_at,
    nota_fiscal: sale?.invoice_completed_at,
    entregue: sale?.delivery_completed_at,
  };

  return CLIENT_ORDER_STEPS.map((step, index) => ({
    key: step.key,
    label: step.label,
    state:
      current.stepIndex < 0
        ? 'pending'
        : index < current.stepIndex
        ? 'done'
        : index === current.stepIndex
        ? 'current'
        : 'pending',
    date: dates[step.key] ?? null,
  }));
};
