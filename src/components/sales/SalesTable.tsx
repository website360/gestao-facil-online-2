
import React from 'react';
import { Table, TableBody, TableHeader } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import EmptyState from '@/components/ui/empty-state';
import { Package, User, Calendar, DollarSign, Eye, Edit, History, Trash2, Play, Check } from 'lucide-react';
import { useIsTabletOrMobile } from '@/hooks/use-tablet-mobile';
import { formatCurrency } from '@/lib/formatters';
import SalesTableHeaders from './SalesTableHeaders';
import SalesTableRow from './SalesTableRow';

interface Sale {
  id: string;
  client_id: string;
  status: 'separacao' | 'conferencia' | 'nota_fiscal' | 'aguardando_entrega' | 'entrega_realizada' | 'atencao';
  total_amount: number;
  notes: string;
  created_at: string;
  created_by: string;
  clients: { name: string } | null;
  created_by_profile: { name: string } | null;
  separation_user_id?: string | null;
  conference_user_id?: string | null;
  invoice_user_id?: string | null;
  separation_user_profile?: { name: string } | null;
  conference_user_profile?: { name: string } | null;
  invoice_user_profile?: { name: string } | null;
  conference_complete?: boolean;
  conference_percentage?: number;
  separation_complete?: boolean;
  separation_percentage?: number;
  sale_items?: any[];
  tracking_code?: string;
  budget_id?: string;
  invoice_number?: string;
  total_volumes?: number;
  total_weight_kg?: number;
}

interface SalesTableProps {
  sales: Sale[];
  userRole: string;
  startIndex: number;
  searchTerm: string;
  sortField: string;
  sortDirection: 'asc' | 'desc';
  onSort: (field: string) => void;
  onSeparationStart: (saleId: string) => void;
  onConferenceStart: (saleId: string) => void;
  onDelete: (saleId: string) => void;
  onView: (saleId: string) => void;
  onEdit: (saleId: string) => void;
  onHistory: (saleId: string) => void;
  onReturnToSales: (saleId: string) => void;
  onConfirmInvoice: (saleId: string) => void;
  onDeliveryStart: (saleId: string) => void;
  onStatusChange: (saleId: string) => void;
  onViewVolumes: (saleId: string) => void;
  getStatusColor: (status: string) => string;
  getStatusLabel: (status: string) => string;
  formatSaleId: (sale: Sale) => string;
  getCurrentResponsible: (sale: Sale) => string;
  selectedItems?: Set<string>;
  onItemSelect?: (itemId: string) => void;
  onSelectAll?: () => void;
  isAllSelected?: boolean;
  isPartiallySelected?: boolean;
  showBulkActions?: boolean;
}

const SalesTable = ({ 
  sales, 
  userRole, 
  startIndex, 
  searchTerm, 
  sortField, 
  sortDirection, 
  onSort, 
  onSeparationStart, 
  onConferenceStart,
  onDelete,
  onView,
  onEdit,
  onHistory,
  onReturnToSales,
  onConfirmInvoice,
  onDeliveryStart,
  onStatusChange,
  onViewVolumes,
  getStatusColor,
  getStatusLabel,
  formatSaleId,
  getCurrentResponsible,
  selectedItems,
  onItemSelect,
  onSelectAll,
  isAllSelected = false,
  isPartiallySelected = false,
  showBulkActions = false
}: SalesTableProps) => {
  const isTabletOrMobile = useIsTabletOrMobile();

  const canEdit = (sale: any) => {
    return userRole === 'admin' || userRole === 'vendedor_externo' || userRole === 'vendedor_interno';
  };

  const canDelete = (sale: any) => {
    return userRole === 'admin';
  };

  const canStartSeparation = (sale: any) => {
    return (userRole === 'separacao' || userRole === 'admin') && sale.status === 'separacao';
  };

  const canStartConference = (sale: any) => {
    return (userRole === 'conferencia' || userRole === 'admin') && sale.status === 'conferencia';
  };

  const canConfirmInvoice = (sale: any) => {
    return (userRole === 'nota_fiscal' || userRole === 'admin') && sale.status === 'nota_fiscal';
  };

  const canStartDelivery = (sale: any) => {
    return (userRole === 'entregador' || userRole === 'admin') && sale.status === 'aguardando_entrega';
  };

  if (sales.length === 0) {
    return (
      <EmptyState
        title={searchTerm ? 'Nenhuma venda encontrada' : 'Nenhuma venda encontrada'}
        description={searchTerm ? 'Tente ajustar os filtros de busca.' : 'As vendas aparecerão aqui quando forem criadas.'}
        icon={Package}
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
        {sales.map((sale, index) => (
          <Card key={sale.id} className="border border-gray-200">
            <CardContent className="p-4">
              <div className="space-y-3">
                {/* Header com checkbox, ID e status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {showBulkActions && selectedItems && onItemSelect && (
                      <Checkbox
                        checked={selectedItems.has(sale.id)}
                        onCheckedChange={() => onItemSelect(sale.id)}
                        aria-label={`Selecionar venda ${formatSaleId(sale)}`}
                      />
                    )}
                    <span className="font-mono text-sm font-medium">
                      {formatSaleId(sale)}
                    </span>
                  </div>
                  <Badge className={getStatusColor(sale.status)}>
                    {getStatusLabel(sale.status)}
                  </Badge>
                </div>

                {/* Cliente */}
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-gray-400" />
                  <div>
                    <span className="text-sm text-gray-500">Cliente:</span>
                    <p className="font-medium">{sale.clients?.name || 'Cliente não encontrado'}</p>
                  </div>
                </div>

                {/* Data, Total e Responsável */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <div>
                      <span className="text-sm text-gray-500">Data:</span>
                      <p className="text-sm">{new Date(sale.created_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="h-4 w-4 text-gray-400" />
                    <div>
                      <span className="text-sm text-gray-500">Total:</span>
                      <p className="font-medium">{formatCurrency(sale.total_amount)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-400" />
                    <div>
                      <span className="text-sm text-gray-500">Responsável:</span>
                      <p className="text-sm">{getCurrentResponsible(sale)}</p>
                    </div>
                  </div>
                </div>

                {/* Ações organizadas em grid responsivo */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 pt-2 border-t border-gray-100">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onView(sale.id)}
                    className="h-8 text-xs"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Ver
                  </Button>

                  {canEdit(sale) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(sale.id)}
                      className="h-8 text-xs"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onHistory(sale.id)}
                    className="h-8 text-xs"
                  >
                    <History className="h-3 w-3 mr-1" />
                    Histórico
                  </Button>

                  {canStartSeparation(sale) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onSeparationStart(sale.id)}
                      className="h-8 text-xs"
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Iniciar Separação
                    </Button>
                  )}

                  {canStartConference(sale) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onConferenceStart(sale.id)}
                      className="h-8 text-xs"
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Iniciar Conferência
                    </Button>
                  )}

                  {canConfirmInvoice(sale) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onConfirmInvoice(sale.id)}
                      className="h-8 text-xs"
                    >
                      <Check className="h-3 w-3 mr-1" />
                      Confirmar NF
                    </Button>
                  )}

                  {canStartDelivery(sale) && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDeliveryStart(sale.id)}
                      className="h-8 text-xs"
                    >
                      <Play className="h-3 w-3 mr-1" />
                      Iniciar Entrega
                    </Button>
                  )}

                  {canDelete(sale) && (
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={() => onDelete(sale.id)}
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
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <Table className="w-full">
          <TableHeader className="bg-gray-50">
            <SalesTableHeaders 
              userRole={userRole}
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={onSort}
              selectedItems={selectedItems}
              onSelectAll={onSelectAll}
              isAllSelected={isAllSelected}
              isPartiallySelected={isPartiallySelected}
              showBulkActions={showBulkActions}
            />
          </TableHeader>
          <TableBody>
            {sales.map((sale, index) => (
              <SalesTableRow
                key={sale.id}
                sale={sale}
                index={index}
                startIndex={startIndex}
                userRole={userRole}
                onSeparationStart={onSeparationStart}
                onConferenceStart={onConferenceStart}
                onDelete={onDelete}
                onView={onView}
                onEdit={onEdit}
                onHistory={onHistory}
                onReturnToSales={onReturnToSales}
              onConfirmInvoice={onConfirmInvoice}
              onDeliveryStart={onDeliveryStart}
              onStatusChange={onStatusChange}
              onViewVolumes={onViewVolumes}
                getStatusColor={getStatusColor}
                getStatusLabel={getStatusLabel}
                formatSaleId={formatSaleId}
                getCurrentResponsible={getCurrentResponsible}
                selectedItems={selectedItems}
                onItemSelect={onItemSelect}
                showBulkActions={showBulkActions}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default SalesTable;
