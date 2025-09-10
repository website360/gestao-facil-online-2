
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import BudgetFormWrapper from './BudgetFormWrapper';
import type { LocalBudget } from '@/hooks/useBudgetManagement';

interface BudgetFormDialogProps {
  showForm: boolean;
  editingBudget: LocalBudget | null;
  onClose: () => void;
  onSuccess: () => void;
}

const BudgetFormDialog = ({ showForm, editingBudget, onClose, onSuccess }: BudgetFormDialogProps) => {
  const handleFormCancel = () => {
    onClose();
  };

  return (
    <Dialog open={showForm} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] md:max-w-6xl w-full max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <DialogTitle className="text-lg md:text-xl">
            {editingBudget ? 'Editar Orçamento' : 'Novo Orçamento'}
          </DialogTitle>
          <DialogDescription className="text-sm md:text-base">
            {editingBudget 
              ? 'Faça as alterações necessárias no orçamento e clique em Salvar.'
              : 'Preencha os dados abaixo para criar um novo orçamento.'
            }
          </DialogDescription>
        </DialogHeader>
        <BudgetFormWrapper
          editingBudget={editingBudget}
          onSuccess={onSuccess}
          onCancel={handleFormCancel}
        />
      </DialogContent>
    </Dialog>
  );
};

export default BudgetFormDialog;
