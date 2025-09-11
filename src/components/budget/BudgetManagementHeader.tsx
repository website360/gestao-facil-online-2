
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface BudgetManagementHeaderProps {
  onNewBudget: () => void;
}

const BudgetManagementHeader = ({ onNewBudget }: BudgetManagementHeaderProps) => {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl md:text-2xl font-bold text-gray-900">Gerenciamento de Orçamentos</h1>
      <div className="flex justify-end">
        <Button onClick={onNewBudget} className="btn-gradient">
          <Plus className="h-4 w-4 mr-2" />
          <span className="hidden sm:inline">Novo Orçamento</span>
          <span className="sm:hidden">Novo</span>
        </Button>
      </div>
    </div>
  );
};

export default BudgetManagementHeader;
