import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import BudgetViewWrapper from './budget/BudgetViewWrapper';
import type { LocalBudget } from '@/hooks/useBudgetManagement';

interface BudgetViewModalProps {
  budget: LocalBudget | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budgetIndex: number;
}

const BudgetViewModal: React.FC<BudgetViewModalProps> = ({ 
  budget, 
  open, 
  onOpenChange, 
  budgetIndex 
}) => {
  if (!budget) return null;

  const formatBudgetId = (id: string, index: number) => {
    const sequentialNumber = (index + 1).toString().padStart(8, '0');
    return `#O${sequentialNumber}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Visualizar Orçamento {formatBudgetId(budget.id, budgetIndex)}
          </DialogTitle>
        </DialogHeader>

        <BudgetViewWrapper
          budget={budget}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
};

export default BudgetViewModal;