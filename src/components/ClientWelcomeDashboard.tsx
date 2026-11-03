import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, Clock, CheckCircle, AlertCircle, Truck, Package, Edit, Send, Eye, Download } from 'lucide-react';
import { useBudgetManagement } from '@/hooks/useBudgetManagement';
import { useAuth } from '@/hooks/useAuth';
import BudgetManagementDialogs from './budget/BudgetManagementDialogs';
import ClientBudgetEditModal from './budget/ClientBudgetEditModal';
import ClientOrderTrackingModal from './client/ClientOrderTrackingModal';
import BudgetApprovalDialog from './budget/BudgetApprovalDialog';
import { supabase } from '@/integrations/supabase/client';
import { getClientPortalSaleItems, submitBudgetForApproval } from '@/integrations/supabase/clientPortal';
import { useBudgetCalculations } from '@/hooks/useBudgetCalculations';
import type { LocalBudget } from '@/hooks/useBudgetManagement';
import { toast } from 'sonner';
import { generateSalePDF } from './sales/pdf/pdfGeneratorSimple';

import { formatBudgetId, formatSaleId } from '@/lib/budgetFormatter';
import {
  CLIENT_ORDER_STEPS,
  getClientOrderStatusInfo,
  type ClientOrderStatusInfo,
} from '@/lib/clientOrderStatus';

/**
 * Um pedido do ponto de vista do cliente.
 *
 * Internamente o pedido comeca em `budgets` e, quando aprovado, passa a existir
 * tambem em `sales` (o orcamento fica com status `convertido`). Antes a tela
 * escondia o orcamento convertido e dependia exclusivamente da venda aparecer
 * na consulta - quando a venda nao vinha, o pedido simplesmente desaparecia do
 * painel. Agora o orcamento e a base do pedido e a venda apenas enriquece o
 * status, entao o pedido continua visivel em todas as etapas.
 */
interface ClientOrder {
  key: string;
  displayId: string;
  createdAt: string;
  total: number;
  budget: LocalBudget | null;
  sale: any | null;
  trackingCode?: string | null;
  status: ClientOrderStatusInfo;
}

const ClientWelcomeDashboard = () => {
  const { clientData, clientToken, signOut } = useAuth();
  const { budgets, loading, deleteBudget, fetchBudgets } = useBudgetManagement('cliente');
  const { calculateBudgetTotal } = useBudgetCalculations();

  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState<LocalBudget | null>(null);
  const [budgetToDelete, setBudgetToDelete] = useState<LocalBudget | null>(null);
  const [budgetToConvert, setBudgetToConvert] = useState<LocalBudget | null>(null);
  const [sales, setSales] = useState<any[]>([]);
  const [budgetEditModalOpen, setBudgetEditModalOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<LocalBudget | null>(null);
  const [trackingOrder, setTrackingOrder] = useState<ClientOrder | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [budgetToSendForApproval, setBudgetToSendForApproval] = useState<LocalBudget | null>(null);
  const [needsRelogin, setNeedsRelogin] = useState(false);

  // Chave estavel com os ids dos orcamentos, para refazer a busca de vendas
  // somente quando a lista realmente mudar (e nao a cada render).
  const budgetIdsKey = useMemo(
    () => budgets.map(budget => budget.id).sort().join(','),
    [budgets]
  );

  /**
   * Retorna true quando a sessão do portal respondeu e as vendas já foram
   * carregadas; false quando a RPC não está disponível (migration pendente) e
   * vale tentar o caminho antigo.
   */
  const fetchSalesViaPortalSession = async (): Promise<boolean> => {
    const { data, error } = await supabase.rpc('client_portal_sales', {
      p_token: clientToken as string,
    });

    if (error) {
      console.error('Erro na RPC client_portal_sales:', error);
      return false;
    }

    const payload = (data || {}) as { error?: string; sales?: any[]; client?: any };

    // Sessão expirada ou acesso do cliente desativado: derrubar o login
    if (payload.error === 'invalid_session') {
      toast.error('Sua sessão expirou. Entre novamente.');
      await signOut();
      return true;
    }

    // O cadastro do cliente vem uma vez só (são todas vendas do mesmo cliente);
    // aqui ele é colado em cada venda, no formato que o PDF espera.
    const loadedSales = Array.isArray(payload.sales) ? payload.sales : [];
    setSales(
      payload.client
        ? loadedSales.map(sale => ({ ...sale, clients: payload.client }))
        : loadedSales
    );
    return true;
  };

  // Buscar vendas do cliente quando os dados estiverem disponíveis.
  //
  // Caminho preferencial: RPC client_portal_sales, que identifica o cliente
  // pelo token da sessão do portal e devolve no servidor apenas as vendas dele.
  // O caminho antigo (consulta direta) continua como fallback para sessões que
  // começaram antes do token existir ou enquanto a migration/edge function não
  // estiverem publicadas.
  const fetchClientSales = async (budgetIds: string[]) => {
    if (!clientData?.id) return;

    if (clientToken && (await fetchSalesViaPortalSession())) return;

    const saleFields = `
      *,
      clients(name),
      sale_items(
        *,
        products(name, internal_code, price)
      )
    `;

    try {
      // Busca por cliente e, em paralelo, pelos orcamentos do cliente.
      // A segunda busca garante o vinculo mesmo quando a venda foi gerada com
      // outro client_id (ou quando o cliente foi reatribuido depois).
      const [byClient, byBudget] = await Promise.all([
        supabase
          .from('sales')
          .select(saleFields)
          .eq('client_id', clientData.id)
          .order('created_at', { ascending: false }),
        budgetIds.length > 0
          ? supabase
              .from('sales')
              .select(saleFields)
              .in('budget_id', budgetIds)
              .order('created_at', { ascending: false })
          : Promise.resolve({ data: [], error: null } as any),
      ]);

      if (byClient.error) console.error('Erro ao buscar vendas do cliente:', byClient.error);
      if (byBudget.error) console.error('Erro ao buscar vendas pelos orçamentos:', byBudget.error);

      // Unir os dois resultados sem duplicar
      const merged = new Map<string, any>();
      [...(byClient.data || []), ...(byBudget.data || [])].forEach(sale => {
        merged.set(sale.id, sale);
      });

      setSales(Array.from(merged.values()));
    } catch (error) {
      console.error('Erro ao buscar vendas:', error);
    }
  };

  // Garantir que os dados do cliente estejam disponíveis para o hook de orçamentos
  useEffect(() => {
    if (clientData && !localStorage.getItem('clientData')) {
      localStorage.setItem('clientData', JSON.stringify(clientData));
    }
  }, [clientData]);

  useEffect(() => {
    if (!clientData?.id) return;
    fetchClientSales(budgetIdsKey ? budgetIdsKey.split(',') : []);
  }, [clientData?.id, clientToken, budgetIdsKey]);

  // Sessão antiga (sem token): o aviso de novo login só faz sentido se as RPCs
  // do portal já existirem no banco. Enquanto não existirem, o caminho antigo
  // de consulta continua valendo e não há nada para o cliente fazer.
  useEffect(() => {
    if (!clientData?.id || clientToken) {
      setNeedsRelogin(false);
      return;
    }

    let active = true;

    (async () => {
      // Token vazio: só serve para saber se a função existe
      const { data, error } = await supabase.rpc('client_portal_budgets', { p_token: '' });
      if (!active) return;

      const payload = (data || {}) as { error?: string };
      setNeedsRelogin(!error && payload.error === 'invalid_session');
    })();

    return () => {
      active = false;
    };
  }, [clientData?.id, clientToken]);

  // Montar a lista de pedidos: cada orçamento é um pedido, enriquecido com a
  // venda correspondente quando ela já existe.
  const orders = useMemo<ClientOrder[]>(() => {
    const salesByBudgetId = new Map<string, any>();

    sales.forEach(sale => {
      if (sale.budget_id) {
        salesByBudgetId.set(sale.budget_id, sale);
      }
    });

    // Vendas já aproveitadas como pedido de um orçamento
    const attachedSaleIds = new Set<string>();

    const list: ClientOrder[] = budgets.map(budget => {
      const sale = salesByBudgetId.get(budget.id) || null;
      if (sale) attachedSaleIds.add(sale.id);

      return {
        key: `budget-${budget.id}`,
        displayId: formatBudgetId(budget.id, budget.created_at),
        createdAt: budget.created_at,
        total: sale ? Number(sale.total_amount) || 0 : calculateBudgetTotal(budget),
        budget,
        sale,
        trackingCode: sale?.tracking_code,
        status: getClientOrderStatusInfo(budget.status, sale?.status),
      };
    });

    // Vendas que não ficaram penduradas em nenhum orçamento da lista viram
    // pedido por conta própria: venda de balcão (sem orçamento) ou pedido que a
    // equipe montou para o cliente. Sem isso elas desapareceriam do painel.
    sales.filter(sale => !attachedSaleIds.has(sale.id)).forEach(sale => {
      list.push({
        key: `sale-${sale.id}`,
        displayId: formatSaleId(sale.id, sale.created_at),
        createdAt: sale.created_at,
        total: Number(sale.total_amount) || 0,
        budget: null,
        sale,
        trackingCode: sale.tracking_code,
        status: getClientOrderStatusInfo(null, sale.status),
      });
    });

    return list.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [budgets, sales, calculateBudgetTotal]);

  // Estatísticas do painel do cliente
  const stats = useMemo(() => {
    const entregueIndex = CLIENT_ORDER_STEPS.length - 1;
    const aprovacaoIndex = CLIENT_ORDER_STEPS.findIndex(step => step.key === 'aprovacao');

    return {
      total: orders.length,
      aguardandoAprovacao: orders.filter(order => order.status.stepIndex === aprovacaoIndex).length,
      emAndamento: orders.filter(
        order => order.status.stepIndex > aprovacaoIndex && order.status.stepIndex < entregueIndex
      ).length,
      entregues: orders.filter(order => order.status.stepIndex === entregueIndex).length,
    };
  }, [orders]);

  // PDF da venda: a listagem não traz os itens, então eles são buscados na
  // hora do download (ou reaproveitados, quando vieram pelo caminho antigo).
  const handleDownloadSalePDF = async (sale: any) => {
    try {
      const items =
        sale.sale_items?.length > 0 ? sale.sale_items : await getClientPortalSaleItems(sale.id);
      await generateSalePDF({ ...sale, sale_items: items || [] });
    } catch (error) {
      console.error('Erro ao gerar PDF da venda:', error);
      toast.error('Erro ao gerar o PDF do pedido');
    }
  };

  const openTrackingPage = (trackingCode: string) => {
    const url = `https://www2.correios.com.br/sistemas/rastreamento/resultado.cfm?objeto=${trackingCode}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleNewBudget = () => {
    setEditingBudget(null);
    setShowForm(true);
  };

  const handleEdit = (budget: LocalBudget) => {
    setEditingBudget(budget);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    const budget = budgets.find(b => b.id === id);
    if (budget) {
      setBudgetToDelete(budget);
    }
  };

  // Antes da aprovação o cliente abre o orçamento para revisar/editar;
  // depois disso o pedido é só acompanhamento.
  const handleViewBudget = (budget: LocalBudget) => {
    setSelectedBudget(budget);
    setBudgetEditModalOpen(true);
  };

  const handleSend = async (budget: LocalBudget) => {
    setBudgetToSendForApproval(budget);
    setShowApprovalDialog(true);
  };

  const handleApprovalConfirm = async () => {
    if (!budgetToSendForApproval) return;

    try {
      const error = await submitBudgetForApproval(budgetToSendForApproval.id);

      if (error) {
        console.error('Erro ao enviar orçamento para aprovação:', error);
        toast.error('Erro ao enviar orçamento para aprovação: ' + error);
        return;
      }

      toast.success('Orçamento enviado para aprovação com sucesso!');
      await fetchBudgets();
    } catch (error) {
      console.error('Erro geral ao enviar orçamento para aprovação:', error);
      toast.error('Erro ao enviar orçamento para aprovação');
    } finally {
      setShowApprovalDialog(false);
      setBudgetToSendForApproval(null);
    }
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingBudget(null);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingBudget(null);
    // Forçar atualização da lista de orçamentos
    fetchBudgets();
  };

  const handleDeleteClose = () => {
    setBudgetToDelete(null);
  };

  const handleDeleteConfirm = async () => {
    if (budgetToDelete) {
      await deleteBudget(budgetToDelete.id);
      setBudgetToDelete(null);
    }
  };

  const handleConvertClose = () => {
    setBudgetToConvert(null);
  };

  const handleConvertConfirm = () => {
    // Cliente não converte orçamento em venda; quem converte é a equipe interna
    setBudgetToConvert(null);
  };

  const handleBudgetEditSuccess = () => {
    fetchBudgets();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mensagem de Boas-vindas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-primary">
            Bem-vindo, {clientData?.name || 'Cliente'}! 👋
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Aqui você cria novos pedidos e acompanha cada etapa: aprovação, separação,
            conferência, nota fiscal e entrega.
          </p>
        </CardContent>
      </Card>

      {/* Sessão antiga, de antes da sessão com token: o acompanhamento do
          pedido depende do token, então pedimos um novo login. Aviso em vez de
          logout automático de propósito - derrubar a sessão sozinho daria um
          laço caso a edge function client-login ainda não esteja publicada. */}
      {needsRelogin && (
        <Card className="border-yellow-300 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-5 w-5 shrink-0 text-yellow-600" />
                <div>
                  <p className="font-medium text-yellow-900">Entre novamente para ver seus pedidos</p>
                  <p className="text-sm text-yellow-800">
                    Atualizamos o acesso do portal. Saia e entre de novo para acompanhar o
                    andamento dos seus pedidos.
                  </p>
                </div>
              </div>
              <Button variant="outline" onClick={() => signOut()} className="shrink-0">
                Sair e entrar de novo
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">Aguardando Aprovação</p>
                <p className="text-2xl font-bold">{stats.aguardandoAprovacao}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Em Andamento</p>
                <p className="text-2xl font-bold">{stats.emAndamento}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Entregues</p>
                <p className="text-2xl font-bold">{stats.entregues}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Total de Pedidos</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header com botão de novo orçamento */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Meus Pedidos</h2>
        <Button onClick={handleNewBudget} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Orçamento
        </Button>
      </div>

      {/* Tabela no padrão admin */}
      {orders.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum pedido encontrado</h3>
              <p className="text-gray-500 mb-4">Comece criando seu primeiro orçamento</p>
              <Button onClick={handleNewBudget}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Orçamento
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-lg overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-24 text-center">#</TableHead>
                <TableHead>Etapa</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Data</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="w-40 text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map(order => {
                const hasTracking = !!order.trackingCode && order.trackingCode.trim() !== '';
                // O cliente só edita/envia/exclui enquanto o pedido não entrou
                // em produção (ou seja, enquanto não existe venda).
                const canEditBudget =
                  !!order.budget &&
                  !order.sale &&
                  (order.budget.status === 'processando' || order.budget.status === 'rejeitado');
                const stepLabel =
                  order.status.stepIndex >= 0
                    ? `Etapa ${order.status.stepIndex + 1} de ${CLIENT_ORDER_STEPS.length}`
                    : '—';

                return (
                  <TableRow key={order.key} className="hover:bg-gray-50">
                    <TableCell className="text-center font-medium">{order.displayId}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {order.sale ? (
                          <Package className="h-4 w-4 text-green-500" />
                        ) : (
                          <FileText className="h-4 w-4 text-blue-500" />
                        )}
                        <span className="text-sm text-muted-foreground">{stepLabel}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={order.status.color}>{order.status.label}</Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {new Date(order.createdAt).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      R$ {order.total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-center items-center">
                        {/* Acompanhar: disponível em qualquer etapa */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setTrackingOrder(order)}
                          className="h-8 w-8 p-0 text-gray-600 hover:text-gray-700"
                          title="Acompanhar pedido"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>

                        {hasTracking && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openTrackingPage(order.trackingCode!)}
                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                            title={`Rastrear: ${order.trackingCode}`}
                          >
                            <Truck className="h-4 w-4" />
                          </Button>
                        )}

                        {canEditBudget && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(order.budget!)}
                              className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                              title="Editar orçamento"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSend(order.budget!)}
                              className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                              title="Enviar para aprovação"
                            >
                              <Send className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(order.budget!.id)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                              title="Excluir orçamento"
                            >
                              <AlertCircle className="h-4 w-4" />
                            </Button>
                          </>
                        )}

                        {/* Orçamento ainda em aprovação: o cliente pode revisar os itens */}
                        {!order.sale && order.budget?.status === 'aguardando_aprovacao' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewBudget(order.budget!)}
                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                            title="Revisar orçamento"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        )}

                        {order.sale && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDownloadSalePDF(order.sale)}
                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                            title="Baixar PDF do pedido"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Dialogs */}
      <BudgetManagementDialogs
        showForm={showForm}
        editingBudget={editingBudget}
        budgetToDelete={budgetToDelete}
        budgetToConvert={budgetToConvert}
        onFormClose={handleFormClose}
        onFormSuccess={handleFormSuccess}
        onDeleteClose={handleDeleteClose}
        onDeleteConfirm={handleDeleteConfirm}
        onConvertClose={handleConvertClose}
        onConvertConfirm={handleConvertConfirm}
      />

      {/* Acompanhamento do pedido (orçamento + venda) */}
      <ClientOrderTrackingModal
        isOpen={!!trackingOrder}
        onClose={() => setTrackingOrder(null)}
        order={trackingOrder}
      />

      {/* Modal de edição do orçamento */}
      <ClientBudgetEditModal
        isOpen={budgetEditModalOpen}
        onClose={() => setBudgetEditModalOpen(false)}
        budget={selectedBudget}
        onSuccess={handleBudgetEditSuccess}
      />

      {/* Dialog de confirmação de envio para aprovação */}
      <BudgetApprovalDialog
        open={showApprovalDialog}
        onOpenChange={setShowApprovalDialog}
        onConfirm={handleApprovalConfirm}
      />
    </div>
  );
};

export default ClientWelcomeDashboard;
