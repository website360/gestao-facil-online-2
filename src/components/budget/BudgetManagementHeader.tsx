
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface BudgetManagementHeaderProps {
  onNewBudget: () => void;
}

const BudgetManagementHeader = ({ onNewBudget }: BudgetManagementHeaderProps) => {
  return (
    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
      <h1 className="text-xl md:text-2xl font-bold text-gray-900">Gerenciamento de Orçamentos</h1>
      <Button onClick={onNewBudget} className="btn-gradient w-full md:w-auto">
        <Plus className="h-4 w-4 mr-2" />
        Novo Orçamento
      </Button>
    </div>
  );
};

export default BudgetManagementHeader;
