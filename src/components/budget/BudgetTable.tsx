
import React from 'react';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import EmptyState from '@/components/ui/empty-state';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FileText, Eye, Edit, Copy, ShoppingCart, Send, Check, Trash2 } from 'lucide-react';
import { useIsTabletOrMobile } from '@/hooks/use-tablet-mobile';
import BudgetTableRow from './BudgetTableRow';
import { formatCurrency } from '@/lib/formatters';
import type { LocalBudget } from '@/hooks/useBudgetManagement';

import { formatBudgetId } from '@/lib/budgetFormatter';

interface BudgetTableProps {
  budgets: LocalBudget[];
  onEdit: (budget: LocalBudget) => void;
  onDelete: (id: string) => void;
  onView: (budget: LocalBudget, index: number) => void;
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
  const isTabletOrMobile = useIsTabletOrMobile();

  // Usar função centralizada

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processando': return 'bg-yellow-100 text-yellow-800';
      case 'aprovado': return 'bg-green-100 text-green-800';
      case 'rejeitado': return 'bg-red-100 text-red-800';
      case 'aguardando_aprovacao': return 'bg-blue-100 text-blue-800';
      case 'convertido': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'processando': return 'Processando';
      case 'aprovado': return 'Aprovado';
      case 'rejeitado': return 'Rejeitado';
      case 'aguardando_aprovacao': return 'Aguardando Aprovação';
      case 'convertido': return 'Convertido';
      default: return status;
    }
  };

  const canEdit = (budget: LocalBudget) => {
    if (isClient) return false;
    return budget.status === 'processando' && (isAdmin || budget.creator_profile?.name);
  };

  const canDelete = (budget: LocalBudget) => {
    if (isClient) return false;
    return budget.status === 'processando' && (isAdmin || budget.creator_profile?.name);
  };

  const canConvert = (budget: LocalBudget) => {
    if (isClient) return false;
    return budget.status === 'aprovado' && isAdmin;
  };

  const canSendForApproval = (budget: LocalBudget) => {
    if (isClient) return false;
    return budget.status === 'processando' && onSendForApproval;
  };

  const canApprove = (budget: LocalBudget) => {
    if (isClient) return false;
    return budget.status === 'aguardando_aprovacao' && isAdmin && onApprove;
  };

  if (budgets.length === 0) {
    return (
      <EmptyState
        title="Nenhum orçamento encontrado"
        description="Os orçamentos aparecerão aqui quando forem criados."
        icon={FileText}
      />
    );
  }

  if (isTabletOrMobile) {
    return (
      <div className="space-y-4">
        {showBulkActions && selectedItems && onItemSelect && onSelectAll && (
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <Checkbox
              checked={isAllSelected}
              onCheckedChange={onSelectAll}
              aria-label="Selecionar todos"
              {...(isPartiallySelected ? { 'data-state': 'indeterminate' } : {})}
            />
            <span className="text-sm text-gray-600">Selecionar todos</span>
          </div>
        )}
        {budgets.map((budget, index) => (
          <Card key={budget.id} className="border border-gray-200">
            <CardContent className="p-4">
              <div className="space-y-3">
                {/* Header com checkbox, ID e status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {showBulkActions && selectedItems && onItemSelect && (
                      <Checkbox
                        checked={selectedItems.has(budget.id)}
                        onCheckedChange={() => onItemSelect(budget.id)}
                        aria-label={`Selecionar orçamento ${formatBudgetId(budget.id, budget.created_at)}`}
                      />
                    )}
                    <span className="font-mono text-sm font-medium">
                      {formatBudgetId(budget.id, budget.created_at)}
                    </span>
                  </div>
                  <Badge className={getStatusColor(budget.status)}>
                    {getStatusLabel(budget.status)}
                  </Badge>
                </div>

                {/* Cliente */}
                <div>
                  <span className="text-sm text-gray-500">Cliente:</span>
                  <p className="font-medium">{budget.clients?.name || 'Cliente não encontrado'}</p>
                </div>

                {/* Data, Total e Vendedor */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <span className="text-sm text-gray-500">Data:</span>
                    <p className="text-sm">{new Date(budget.created_at).toLocaleDateString('pt-BR')}</p>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">Total:</span>
                    <p className="font-medium">{formatCurrency(budget.total_amount)}</p>
                  </div>
                  {isAdmin && (
                    <div>
                      <span className="text-sm text-gray-500">Vendedor:</span>
                      <p className="text-sm">{budget.creator_profile?.name || 'N/A'}</p>
                    </div>
                  )}
                </div>

                {/* Ações organizadas em grid responsivo */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 pt-2 border-t border-gray-100">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onView(budget, index)}
                    className="h-8 text-xs"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Ver
                  </Button>
                  
                  {canEdit(budget) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(budget)}
                      className="h-8 text-xs"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                  )}

                  {canConvert(budget) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onConvert(budget)}
                      className="h-8 text-xs"
                    >
                      <ShoppingCart className="h-3 w-3 mr-1" />
                      Converter
                    </Button>
                  )}

                  {canSendForApproval(budget) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSendForApproval!(budget.id)}
                      className="h-8 text-xs"
                    >
                      <Send className="h-3 w-3 mr-1" />
                      Enviar
                    </Button>
                  )}

                  {canApprove(budget) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onApprove!(budget.id)}
                      className="h-8 text-xs"
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Aprovar
                    </Button>
                  )}

                  {canDelete(budget) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(budget.id)}
                      className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3 mr-1" />
                      Excluir
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
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
