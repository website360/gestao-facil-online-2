import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, Clock, CheckCircle, AlertCircle, Truck, Package, Edit, Send, Eye } from 'lucide-react';
import { useBudgetManagement } from '@/hooks/useBudgetManagement';
import { useBudgetFilters } from '@/hooks/useBudgetFilters';
import { useAuth } from '@/hooks/useAuth';
import BudgetManagementDialogs from './budget/BudgetManagementDialogs';
import SalesDetailModal from './SalesDetailModal';
import ClientBudgetEditModal from './budget/ClientBudgetEditModal';
import BudgetApprovalDialog from './budget/BudgetApprovalDialog';
import { supabase } from '@/integrations/supabase/client';
import { useBudgetCalculations } from '@/hooks/useBudgetCalculations';
import type { LocalBudget } from '@/hooks/useBudgetManagement';
import { toast } from 'sonner';
import SalePDFGenerator from './sales/SalePDFGenerator';

import { formatBudgetId, formatSaleId } from '@/lib/budgetFormatter';

interface CombinedItem {
  id: string;
  type: 'budget' | 'sale';
  status: string;
  created_at: string;
  total_amount: number;
  client_name: string;
  tracking_code?: string;
  original_data: any;
}

const ClientWelcomeDashboard = () => {
  const { clientData } = useAuth();
  const { budgets, loading, deleteBudget, fetchBudgets } = useBudgetManagement('cliente');
  const { calculateBudgetTotal } = useBudgetCalculations();
  
  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState<LocalBudget | null>(null);
  const [budgetToDelete, setBudgetToDelete] = useState<LocalBudget | null>(null);
  const [budgetToConvert, setBudgetToConvert] = useState<LocalBudget | null>(null);
  const [sales, setSales] = useState<any[]>([]);
  const [salesLoading, setSalesLoading] = useState(false);
  const [combinedItems, setCombinedItems] = useState<CombinedItem[]>([]);
  const [saleDetailOpen, setSaleDetailOpen] = useState(false);
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [budgetEditModalOpen, setBudgetEditModalOpen] = useState(false);
  const [selectedBudget, setSelectedBudget] = useState<LocalBudget | null>(null);
  const [showApprovalDialog, setShowApprovalDialog] = useState(false);
  const [budgetToSendForApproval, setBudgetToSendForApproval] = useState<LocalBudget | null>(null);

  // Buscar vendas do cliente quando os dados estiverem disponíveis
  const fetchClientSales = async () => {
    if (!clientData?.id) return;
    
    setSalesLoading(true);
    try {
      // Buscar as vendas baseadas nos orçamentos do cliente
      const { data: salesData, error } = await supabase
        .from('sales')
        .select(`
          *,
          clients(name),
          budget_id,
          sale_items(
            *,
            products(name, internal_code, price)
          )
        `)
        .eq('client_id', clientData.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar vendas:', error);
        return;
      }
      
      console.log('Vendas encontradas:', salesData);
      setSales(salesData || []);
    } catch (error) {
      console.error('Erro ao buscar vendas:', error);
    } finally {
      setSalesLoading(false);
    }
  };

  // Garantir que os dados do cliente estejam disponíveis para o hook de orçamentos
  useEffect(() => {
    if (clientData && !localStorage.getItem('clientData')) {
      localStorage.setItem('clientData', JSON.stringify(clientData));
    }
    if (clientData?.id) {
      fetchClientSales();
    }
  }, [clientData]);

  // Combinar orçamentos e vendas em uma única lista
  useEffect(() => {
    const combined: CombinedItem[] = [];

    // Adicionar orçamentos (apenas os que não foram convertidos em vendas)
    budgets
      .filter(budget => budget.status !== 'convertido')
      .forEach(budget => {
        combined.push({
          id: budget.id,
          type: 'budget',
          status: budget.status,
          created_at: budget.created_at,
          total_amount: calculateBudgetTotal(budget),
          client_name: budget.clients?.name || '',
          original_data: budget
        });
      });

    // Adicionar vendas
    sales.forEach(sale => {
      combined.push({
        id: sale.id,
        type: 'sale',
        status: sale.status,
        created_at: sale.created_at,
        total_amount: Number(sale.total_amount) || 0,
        client_name: sale.clients?.name || '',
        tracking_code: sale.tracking_code,
        original_data: sale
      });
    });

    // Ordenar por data (mais recente primeiro)
    combined.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    setCombinedItems(combined);
  }, [budgets, sales]);

  // Estatísticas dos orçamentos e vendas (excluindo orçamentos convertidos)
  const pendingBudgets = budgets.filter(b => b.status === 'aguardando_aprovacao').length;
  const approvedBudgets = budgets.filter(b => b.status === 'aprovado').length;
  const totalSales = sales.length; // Total de vendas
  const finishedSales = sales.filter(s => s.status === 'entrega_realizada').length;

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

  const handleView = (item: CombinedItem) => {
    if (item.type === 'budget') {
      const budget = item.original_data as LocalBudget;
      setSelectedBudget(budget);
      setBudgetEditModalOpen(true);
    }
  };

  const handleDuplicate = (budget: LocalBudget) => {
    // Implementar duplicação se necessário
    console.log('Duplicate budget:', budget);
  };

  const handleConvert = (budget: LocalBudget) => {
    setBudgetToConvert(budget);
  };

  const handleSend = async (budget: LocalBudget) => {
    setBudgetToSendForApproval(budget);
    setShowApprovalDialog(true);
  };

  const handleApprovalConfirm = async () => {
    if (!budgetToSendForApproval) return;

    try {
      console.log('=== INICIANDO ENVIO PARA APROVAÇÃO ===');
      console.log('Budget ID:', budgetToSendForApproval.id);
      console.log('Status atual:', budgetToSendForApproval.status);
      console.log('Client data:', clientData);

      // Primeiro, vamos verificar o status atual no banco
      const { data: currentBudget, error: fetchError } = await supabase
        .from('budgets')
        .select('id, status')
        .eq('id', budgetToSendForApproval.id)
        .single();
      
      console.log('Status atual no banco ANTES do update:', currentBudget);

      const { data, error } = await supabase
        .from('budgets')
        .update({ 
          status: 'aguardando_aprovacao',
          updated_at: new Date().toISOString()
        })
        .eq('id', budgetToSendForApproval.id)
        .select('id, status, updated_at');

      console.log('Resultado do update:', { data, error });

      if (error) {
        console.error('Erro Supabase ao enviar orçamento para aprovação:', error);
        toast.error('Erro ao enviar orçamento para aprovação: ' + error.message);
        return;
      }

      // Verificar se o status foi realmente atualizado
      const { data: updatedBudget, error: verifyError } = await supabase
        .from('budgets')
        .select('id, status, updated_at')
        .eq('id', budgetToSendForApproval.id)
        .single();
      
      console.log('Status no banco APÓS o update:', updatedBudget);

      console.log('Update executado com sucesso:', data);
      toast.success('Orçamento enviado para aprovação com sucesso!');
      
      // Atualizar a lista local
      await fetchBudgets();
      console.log('=== FIM ENVIO PARA APROVAÇÃO ===');
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

  const handleConvertConfirm = (updatedBudget?: any, attachments?: any[]) => {
    // Implementar conversão se necessário para clientes
    console.log('Cliente tentando converter orçamento:', updatedBudget, attachments);
    setBudgetToConvert(null);
  };

  const handleViewSale = (saleId: string) => {
    setSelectedSaleId(saleId);
    setSaleDetailOpen(true);
  };

  const handleBudgetEditSuccess = () => {
    // Não precisamos mais chamar fetchBudgets() aqui pois o ClientBudgetEditModal
    // já salva corretamente e fecha automaticamente. A página será recarregada
    // quando necessário pelo próprio hook useBudgetManagement
    console.log('Budget edit success - modal will close automatically');
  };

  const getStatusDisplay = (item: CombinedItem) => {
    if (item.type === 'budget') {
      switch (item.status) {
        case 'aguardando_aprovacao':
          return { text: 'Aguardando Aprovação', color: 'bg-yellow-100 text-yellow-800' };
        case 'aprovado':
          return { text: 'Aprovado', color: 'bg-green-100 text-green-800' };
        case 'rejeitado':
          return { text: 'Rejeitado', color: 'bg-red-100 text-red-800' };
        default:
          return { text: item.status, color: 'bg-gray-100 text-gray-800' };
      }
    } else {
      switch (item.status) {
        case 'separacao':
          return { text: 'Separação', color: 'bg-orange-100 text-orange-800' };
        case 'conferencia':
          return { text: 'Conferência', color: 'bg-blue-100 text-blue-800' };
        case 'nota_fiscal':
          return { text: 'Nota Fiscal', color: 'bg-yellow-100 text-yellow-800' };
        case 'entrega_realizada':
          return { text: 'Finalizada', color: 'bg-green-100 text-green-800' };
        default:
          return { text: item.status, color: 'bg-gray-100 text-gray-800' };
      }
    }
  };

  const formatItemId = (item: CombinedItem) => {
    return item.type === 'budget' 
      ? formatBudgetId(item.id, item.created_at) 
      : formatSaleId(item.id, item.created_at);
  };

  if (loading || salesLoading) {
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
            Aqui você pode acompanhar todos os seus orçamentos, criar novos pedidos e acompanhar o status de suas solicitações.
          </p>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm font-medium">Aguardando Aprovação</p>
                <p className="text-2xl font-bold">{pendingBudgets}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Aprovados</p>
                <p className="text-2xl font-bold">{approvedBudgets}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Package className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Total de Vendas</p>
                <p className="text-2xl font-bold">{totalSales}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm font-medium">Vendas Finalizadas</p>
                <p className="text-2xl font-bold">{finishedSales}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header com botão de novo orçamento */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Meus Orçamentos e Vendas</h2>
        <Button onClick={handleNewBudget} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Orçamento
        </Button>
      </div>

      {/* Tabela no padrão admin */}
      {combinedItems.length === 0 ? (
        <Card>
          <CardContent className="p-12">
            <div className="text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum orçamento encontrado</h3>
              <p className="text-gray-500 mb-4">Comece criando seu primeiro orçamento</p>
              <Button onClick={handleNewBudget}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Orçamento
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="w-16 text-center">#</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Data</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="w-40 text-center">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {combinedItems.map((item, index) => {
                const statusDisplay = getStatusDisplay(item);
                const hasTracking = item.tracking_code && item.tracking_code.trim() !== '';
                
                return (
                  <TableRow key={`${item.type}-${item.id}`} className="hover:bg-gray-50">
                    <TableCell className="text-center font-medium">
                      {formatItemId(item)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {item.type === 'budget' ? (
                          <FileText className="h-4 w-4 text-blue-500" />
                        ) : (
                          <Package className="h-4 w-4 text-green-500" />
                        )}
                        <span className="text-sm">
                          {item.type === 'budget' ? 'Orçamento' : 'Venda'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={statusDisplay.color}>
                        {statusDisplay.text}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      {new Date(item.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      R$ {item.total_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1 justify-center items-center">
                        {hasTracking && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openTrackingPage(item.tracking_code!)}
                            className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                            title={`Rastrear: ${item.tracking_code}`}
                          >
                            <Truck className="h-4 w-4" />
                          </Button>
                        )}
                        
                        {item.type === 'budget' ? (
                          <>
                            {/* Botão de visualizar - sempre disponível */}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleView(item)}
                              className="h-8 w-8 p-0 text-gray-600 hover:text-gray-700"
                              title="Visualizar orçamento"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            
                            {/* Botões para status 'processando' e 'rejeitado' */}
                            {(item.status === 'processando' || item.status === 'rejeitado') && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(item.original_data)}
                                  className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                                  title="Editar orçamento"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleSend(item.original_data)}
                                  className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
                                  title="Enviar para aprovação"
                                >
                                  <Send className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(item.id)}
                                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                                  title="Excluir orçamento"
                                >
                                  <AlertCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </>
                        ) : (
                          <div className="flex gap-1 justify-center items-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewSale(item.id)}
                              className="h-8 w-8 p-0 text-gray-600 hover:text-gray-700"
                              title="Ver detalhes da venda"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <SalePDFGenerator sale={item.original_data} />
                          </div>
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

      {/* Modal de visualização da venda */}
      <SalesDetailModal
        isOpen={saleDetailOpen}
        onClose={() => setSaleDetailOpen(false)}
        saleId={selectedSaleId}
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