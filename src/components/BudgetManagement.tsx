
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useBudgetManagement } from '@/hooks/useBudgetManagement';
import { useBudgetActions } from '@/hooks/useBudgetActions';
import { useBudgetFilters } from '@/hooks/useBudgetFilters';
import { useBulkSelection } from '@/hooks/useBulkSelection';
import { useUserProfile } from '@/hooks/useUserProfile';
import type { LocalBudget } from '@/hooks/useBudgetManagement';
import BudgetManagementContent, { BUDGETS_PER_PAGE } from './budget/BudgetManagementContent';
import BudgetManagementDialogs from './budget/BudgetManagementDialogs';
import BudgetManagementLoading from './budget/BudgetManagementLoading';
import BudgetSendForApprovalDialog from './budget/BudgetSendForApprovalDialog';
import BulkDeleteDialog from './common/BulkDeleteDialog';
import BudgetViewModal from './BudgetViewModal';
import { toast as sonnerToast } from 'sonner';

const BudgetManagement = () => {
  const { toast } = useToast();
  const { userProfile, profileLoading, isAdmin } = useUserProfile();
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [deletingBulk, setDeletingBulk] = useState(false);
  const [showSendForApprovalDialog, setShowSendForApprovalDialog] = useState(false);
  const [budgetToSendForApproval, setBudgetToSendForApproval] = useState<string | null>(null);
  const [sendingForApproval, setSendingForApproval] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [budgetToView, setBudgetToView] = useState<LocalBudget | null>(null);
  const [viewBudgetIndex, setViewBudgetIndex] = useState(0);

  const {
    budgets,
    loading,
    fetchBudgets,
    startDate,
    setStartDate,
    endDate,
    setEndDate
  } = useBudgetManagement(userProfile?.role);

  const {
    filteredBudgets,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter
  } = useBudgetFilters(budgets, userProfile?.role);

  const [currentPage, setCurrentPage] = useState(1);

  // Busca e status mudam o tamanho da lista: voltar para a primeira pagina
  // evita o usuario ficar parado numa pagina que deixou de existir.
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  // A selecao em massa considera apenas os itens visiveis na pagina atual,
  // para que "selecionar todos" nunca marque orcamentos fora da tela.
  const currentPageBudgetIds = useMemo(() => {
    const startIndex = (currentPage - 1) * BUDGETS_PER_PAGE;
    return filteredBudgets.slice(startIndex, startIndex + BUDGETS_PER_PAGE).map(b => b.id);
  }, [filteredBudgets, currentPage]);

  const {
    selectedItems,
    isAllSelected,
    isPartiallySelected,
    toggleItem,
    toggleAll,
    clearSelection,
    selectedCount
  } = useBulkSelection(currentPageBudgetIds);

  const {
    budgetToDelete,
    setBudgetToDelete,
    budgetToConvert,
    setBudgetToConvert,
    handleDeleteConfirm,
    handleConvertToSaleConfirm,
    handleSend
  } = useBudgetActions(fetchBudgets);

  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState<LocalBudget | null>(null);

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

  const handleConvert = (budget: LocalBudget) => {
    setBudgetToConvert(budget);
  };

  const handleView = (budget: LocalBudget, index: number) => {
    setBudgetToView(budget);
    setViewBudgetIndex(index);
    setShowViewModal(true);
  };

  const handleBulkDelete = async () => {
    setDeletingBulk(true);
    setTimeout(() => {
      clearSelection();
      setShowBulkDeleteDialog(false);
      setDeletingBulk(false);
      fetchBudgets();
      sonnerToast.success(`${selectedCount} orçamento(s) excluído(s) com sucesso!`);
    }, 1000);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingBudget(null);
    fetchBudgets();
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingBudget(null);
  };

  // O periodo e filtrado no banco, entao mudar as datas so tem efeito ao aplicar
  const handleApplyDateFilter = () => {
    setCurrentPage(1);
    clearSelection();
    fetchBudgets();
  };

  const handleClearDateFilter = () => {
    setStartDate(undefined);
    setEndDate(undefined);
    setCurrentPage(1);
    clearSelection();
    // null (e nao undefined) sinaliza "buscar sem limite de data"
    fetchBudgets(null, null);
  };

  const handleSendForApproval = (budgetId: string) => {
    setBudgetToSendForApproval(budgetId);
    setShowSendForApprovalDialog(true);
  };

  const handleSendForApprovalConfirm = async (notes?: string) => {
    if (!budgetToSendForApproval) return;
    
    try {
      setSendingForApproval(true);
      const { error } = await supabase
        .from('budgets')
        .update({ 
          status: 'aguardando_aprovacao' as any,
          approval_notes: notes || null
        })
        .eq('id', budgetToSendForApproval);

      if (error) throw error;
      
      sonnerToast.success('Orçamento enviado para aprovação com sucesso!');
      
      fetchBudgets();
      setShowSendForApprovalDialog(false);
      setBudgetToSendForApproval(null);
    } catch (error) {
      console.error('Error:', error);
      sonnerToast.error('Erro ao enviar orçamento para aprovação');
    } finally {
      setSendingForApproval(false);
    }
  };

  const handleApprove = async (budgetId: string) => {
    try {
      const { error } = await supabase
        .from('budgets')
        .update({ 
          status: 'aprovado' as any,
          approved_by: userProfile?.id,
          approved_at: new Date().toISOString()
        })
        .eq('id', budgetId);

      if (error) throw error;
      
      toast({
        title: "Sucesso",
        description: "Orçamento aprovado com sucesso.",
      });
      
      fetchBudgets();
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Erro",
        description: "Erro ao aprovar orçamento.",
        variant: "destructive",
      });
    }
  };

  if (loading || profileLoading) {
    return <BudgetManagementLoading />;
  }

  return (
    <>
      <BudgetManagementContent
        filteredBudgets={filteredBudgets}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        isAdmin={isAdmin}
        onNewBudget={() => setShowForm(true)}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        onConvert={handleConvert}
        onSend={handleSend}
        onSendForApproval={handleSendForApproval}
        onApprove={handleApprove}
        isClient={false} // Clientes não acessam esta tela, apenas funcionários
        selectedItems={selectedItems}
        onItemSelect={toggleItem}
        onSelectAll={toggleAll}
        isAllSelected={isAllSelected}
        isPartiallySelected={isPartiallySelected}
        selectedCount={selectedCount}
        onBulkDelete={() => setShowBulkDeleteDialog(true)}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onApplyDateFilter={handleApplyDateFilter}
        onClearDateFilter={handleClearDateFilter}
        loading={loading}
      />

      <BulkDeleteDialog
        open={showBulkDeleteDialog}
        onOpenChange={setShowBulkDeleteDialog}
        onConfirm={handleBulkDelete}
        itemCount={selectedCount}
        itemType="orçamento"
        loading={deletingBulk}
      />

      <BudgetManagementDialogs
        showForm={showForm}
        editingBudget={editingBudget}
        budgetToDelete={budgetToDelete}
        budgetToConvert={budgetToConvert}
        onFormClose={handleFormClose}
        onFormSuccess={handleFormSuccess}
        onDeleteClose={() => setBudgetToDelete(null)}
        onDeleteConfirm={handleDeleteConfirm}
        onConvertClose={() => setBudgetToConvert(null)}
        onConvertConfirm={handleConvertToSaleConfirm}
      />

      <BudgetSendForApprovalDialog
        open={showSendForApprovalDialog}
        onOpenChange={setShowSendForApprovalDialog}
        onConfirm={handleSendForApprovalConfirm}
        loading={sendingForApproval}
      />

      <BudgetViewModal
        budget={budgetToView}
        open={showViewModal}
        onOpenChange={setShowViewModal}
        budgetIndex={viewBudgetIndex}
      />
    </>
  );
};

export default BudgetManagement;
