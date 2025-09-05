
import React from 'react';
import { Table, TableBody, TableHeader } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import EmptyState from '@/components/ui/empty-state';
import { Package } from 'lucide-react';
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
      
      {sales.length === 0 && (
        <EmptyState
          title={searchTerm ? 'Nenhuma venda encontrada' : 'Nenhuma venda encontrada'}
          description={searchTerm ? 'Tente ajustar os filtros de busca.' : 'As vendas aparecerão aqui quando forem criadas.'}
          icon={Package}
        />
      )}
    </div>
  );
};

export default SalesTable;
