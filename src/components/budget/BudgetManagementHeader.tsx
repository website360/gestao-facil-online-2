
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface BudgetManagementHeaderProps {
  onNewBudget: () => void;
}

const BudgetManagementHeader = ({ onNewBudget }: BudgetManagementHeaderProps) => {
  return (
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-bold text-gray-900">Gerenciamento de Orçamentos</h1>
      <Button onClick={onNewBudget} className="btn-gradient">
        <Plus className="h-4 w-4 mr-2" />
        Novo Orçamento
      </Button>
    </div>
  );
};

export default BudgetManagementHeader;
