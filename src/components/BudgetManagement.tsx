
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useBudgetManagement } from '@/hooks/useBudgetManagement';
import { useBudgetActions } from '@/hooks/useBudgetActions';
import { useBudgetFilters } from '@/hooks/useBudgetFilters';
import { useBulkSelection } from '@/hooks/useBulkSelection';
import { useUserProfile } from '@/hooks/useUserProfile';
import type { LocalBudget } from '@/hooks/useBudgetManagement';
import BudgetManagementContent from './budget/BudgetManagementContent';
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
    fetchBudgets
  } = useBudgetManagement(userProfile?.role);

  const {
    selectedItems,
    isAllSelected,
    isPartiallySelected,
    toggleItem,
    toggleAll,
    clearSelection,
    selectedCount
  } = useBulkSelection(budgets.map(b => b.id));

  const {
    filteredBudgets,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter
  } = useBudgetFilters(budgets, userProfile?.role);

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
