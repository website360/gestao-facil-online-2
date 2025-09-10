
import React from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { formatCurrency } from '@/lib/utils';
import type { LocalBudget } from '@/hooks/useBudgetManagement';

interface BudgetDeleteDialogProps {
  budgetToDelete: LocalBudget | null;
  onClose: () => void;
  onConfirm: () => void;
}

const BudgetDeleteDialog = ({ budgetToDelete, onClose, onConfirm }: BudgetDeleteDialogProps) => {
  return (
    <AlertDialog open={!!budgetToDelete} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja excluir este orçamento? Esta ação não pode ser desfeita.
            {budgetToDelete && (
              <div className="mt-2 p-2 bg-gray-50 rounded">
                <strong>Cliente:</strong> {budgetToDelete.clients?.name}<br />
                <strong>Valor:</strong> {formatCurrency(budgetToDelete.total_amount || 0)}
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className="bg-red-600 hover:bg-red-700">
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default BudgetDeleteDialog;
