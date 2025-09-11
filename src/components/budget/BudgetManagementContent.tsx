import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import type { LocalBudget } from '@/hooks/useBudgetManagement';
import BudgetTable from './BudgetTable';
import BudgetFilters from './BudgetFilters';
import BudgetManagementHeader from './BudgetManagementHeader';
interface BudgetManagementContentProps {
  filteredBudgets: LocalBudget[];
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  isAdmin: boolean;
  isClient?: boolean;
  onNewBudget: () => void;
  onEdit: (budget: LocalBudget) => void;
  onDelete: (id: string) => void;
  onView: (budget: LocalBudget, index: number) => void;
  onConvert: (budget: LocalBudget) => void;
  onSend: (budget: LocalBudget) => void;
  onSendForApproval?: (id: string) => void;
  onApprove?: (id: string) => void;
  selectedItems?: Set<string>;
  onItemSelect?: (itemId: string) => void;
  onSelectAll?: () => void;
  isAllSelected?: boolean;
  isPartiallySelected?: boolean;
  selectedCount?: number;
  onBulkDelete?: () => void;
}

const BudgetManagementContent = ({
  filteredBudgets,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  isAdmin,
  isClient,
  onNewBudget,
  onEdit,
  onDelete,
  onView,
  onConvert,
  onSend,
  onSendForApproval,
  onApprove,
  selectedItems,
  onItemSelect,
  onSelectAll,
  isAllSelected = false,
  isPartiallySelected = false,
  selectedCount = 0,
  onBulkDelete
}: BudgetManagementContentProps) => {
  return (
    <div className="min-h-screen p-2 md:p-6 bg-transparent">
      <Card className="bg-white shadow-sm">
        <CardContent className="p-3 md:p-6 space-y-4 md:space-y-6">
          <BudgetManagementHeader onNewBudget={onNewBudget} />

          <BudgetFilters 
            searchTerm={searchTerm} 
            setSearchTerm={setSearchTerm} 
            statusFilter={statusFilter} 
            setStatusFilter={setStatusFilter} 
            filteredBudgetsCount={filteredBudgets.length} 
          />

          <BudgetTable 
            budgets={filteredBudgets} 
            onEdit={onEdit} 
            onDelete={onDelete} 
            onView={onView} 
            onConvert={onConvert} 
            onSend={onSend} 
            onSendForApproval={onSendForApproval} 
            onApprove={onApprove}
            isAdmin={isAdmin}
            isClient={isClient}
          />
        </CardContent>
      </Card>
    </div>
  );
};
export default BudgetManagementContent;