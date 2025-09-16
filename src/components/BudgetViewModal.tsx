import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import BudgetViewWrapper from './budget/BudgetViewWrapper';
import type { LocalBudget } from '@/hooks/useBudgetManagement';

import { formatBudgetId } from '@/lib/budgetFormatter';

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

  // Usar a função centralizada
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] md:max-w-7xl w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg md:text-xl">
            Visualizar Orçamento {formatBudgetId(budget.id, budget.created_at)}
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