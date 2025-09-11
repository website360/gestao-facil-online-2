
import React from 'react';
import type { LocalBudget } from '@/hooks/useBudgetManagement';
import BudgetFormDialog from './BudgetFormDialog';
import BudgetDeleteDialog from './BudgetDeleteDialog';
import BudgetConvertDialog from './BudgetConvertDialog';

interface BudgetManagementDialogsProps {
  showForm: boolean;
  editingBudget: LocalBudget | null;
  budgetToDelete: LocalBudget | null;
  budgetToConvert: LocalBudget | null;
  onFormClose: () => void;
  onFormSuccess: () => void;
  onDeleteClose: () => void;
  onDeleteConfirm: () => void;
  onConvertClose: () => void;
  onConvertConfirm: (updatedBudget?: LocalBudget, attachments?: any[]) => void;
}

const BudgetManagementDialogs = ({
  showForm,
  editingBudget,
  budgetToDelete,
  budgetToConvert,
  onFormClose,
  onFormSuccess,
  onDeleteClose,
  onDeleteConfirm,
  onConvertClose,
  onConvertConfirm
}: BudgetManagementDialogsProps) => {
  return (
    <>
      <BudgetFormDialog
        showForm={showForm}
        editingBudget={editingBudget}
        onClose={onFormClose}
        onSuccess={onFormSuccess}
      />

      <BudgetDeleteDialog
        budgetToDelete={budgetToDelete}
        onClose={onDeleteClose}
        onConfirm={onDeleteConfirm}
      />

      <BudgetConvertDialog
        budgetToConvert={budgetToConvert}
        onClose={onConvertClose}
        onConfirm={onConvertConfirm}
      />
    </>
  );
};

export default BudgetManagementDialogs;
