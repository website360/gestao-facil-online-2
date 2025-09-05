
import React from 'react';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import EmptyState from '@/components/ui/empty-state';
import { FileText } from 'lucide-react';
import BudgetTableRow from './BudgetTableRow';
import type { LocalBudget } from '@/hooks/useBudgetManagement';

interface BudgetTableProps {
  budgets: LocalBudget[];
  onEdit: (budget: LocalBudget) => void;
  onDelete: (id: string) => void;
  onView: (budget: LocalBudget, index: number) => void;
  onDuplicate: (budget: LocalBudget) => void;
  onConvert: (budget: LocalBudget) => void;
  onSend: (budget: LocalBudget) => void;
  onSendForApproval?: (id: string) => void;
  onApprove?: (id: string) => void;
  isAdmin?: boolean;
  isClient?: boolean;
  selectedItems?: Set<string>;
  onItemSelect?: (itemId: string) => void;
  onSelectAll?: () => void;
  isAllSelected?: boolean;
  isPartiallySelected?: boolean;
  showBulkActions?: boolean;
}

const BudgetTable = ({ 
  budgets, 
  onEdit, 
  onDelete, 
  onView, 
  onDuplicate, 
  onConvert, 
  onSend,
  onSendForApproval,
  onApprove,
  isAdmin = false,
  isClient = false,
  selectedItems,
  onItemSelect,
  onSelectAll,
  isAllSelected = false,
  isPartiallySelected = false,
  showBulkActions = false
}: BudgetTableProps) => {
  if (budgets.length === 0) {
    return (
      <EmptyState
        title="Nenhum orçamento encontrado"
        description="Os orçamentos aparecerão aqui quando forem criados."
        icon={FileText}
      />
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            {showBulkActions && selectedItems && onItemSelect && onSelectAll && (
              <TableHead className="w-12">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={onSelectAll}
                  aria-label="Selecionar todos"
                  {...(isPartiallySelected ? { 'data-state': 'indeterminate' } : {})}
                />
              </TableHead>
            )}
            <TableHead className="w-16 text-center">#</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead className="text-center">Data</TableHead>
            <TableHead className="text-right">Total</TableHead>
            {isAdmin && <TableHead>Vendedor</TableHead>}
            <TableHead className="w-40 text-center">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {budgets.map((budget, index) => (
            <BudgetTableRow
              key={budget.id}
              budget={budget}
              index={index}
              onEdit={onEdit}
              onDelete={onDelete}
              onView={onView}
              onDuplicate={onDuplicate}
              onConvert={onConvert}
              onSend={onSend}
              onSendForApproval={onSendForApproval}
              onApprove={onApprove}
              isAdmin={isAdmin}
              isClient={isClient}
              selectedItems={selectedItems}
              onItemSelect={onItemSelect}
              showBulkActions={showBulkActions}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default BudgetTable;
