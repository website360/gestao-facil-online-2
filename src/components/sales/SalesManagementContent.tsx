import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import SalesManagementHeader from './SalesManagementHeader';
import SalesFilters from './SalesFilters';
import SalesTable from './SalesTable';
import SalesPagination from './SalesPagination';

interface Sale {
  id: string;
  client_id: string;
  status: 'separacao' | 'conferencia' | 'nota_fiscal' | 'aguardando_entrega' | 'entrega_realizada' | 'atencao' | 'finalizada';
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

interface SalesManagementContentProps {
  sales: Sale[];
  userRole: string;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  statusFilter: string;
  setStatusFilter: (status: string) => void;
  currentPage: number;
  setCurrentPage: (page: number) => void;
  sortField: string;
  sortDirection: 'asc' | 'desc';
  onSort: (field: string) => void;
  onRefresh: () => void;
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
  onConfirmDelivery: (saleId: string) => void;
  onViewDeliveryNotes: (saleId: string) => void;
  onFinalizeSale: (saleId: string) => void;
  getStatusColor: (status: string) => string;
  getStatusLabel: (status: string) => string;
  formatSaleId: (sale: Sale) => string;
  getCurrentResponsible: (sale: Sale) => string;
}

const SalesManagementContent = ({
  sales,
  userRole,
  searchTerm,
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  currentPage,
  setCurrentPage,
  sortField,
  sortDirection,
  onSort,
  onRefresh,
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
  onConfirmDelivery,
  onViewDeliveryNotes,
  onFinalizeSale,
  getStatusColor,
  getStatusLabel,
  formatSaleId,
  getCurrentResponsible
}: SalesManagementContentProps) => {
  const ITEMS_PER_PAGE = 20;
  const totalPages = Math.ceil(sales.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentSales = sales.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen p-2 md:p-6 bg-transparent">
      <Card className="bg-white shadow-sm">
        <CardContent className="p-3 md:p-6 space-y-4 md:space-y-6">
          <SalesManagementHeader onRefresh={onRefresh} />

          <SalesFilters 
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            userRole={userRole}
            filteredSalesCount={sales.length}
          />

          <SalesTable
            sales={currentSales}
            userRole={userRole}
            startIndex={startIndex}
            searchTerm={searchTerm}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={onSort}
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
            onConfirmDelivery={onConfirmDelivery}
            onViewDeliveryNotes={onViewDeliveryNotes}
            onFinalizeSale={onFinalizeSale}
            getStatusColor={getStatusColor}
            getStatusLabel={getStatusLabel}
            formatSaleId={formatSaleId}
            getCurrentResponsible={getCurrentResponsible}
          />

          <SalesPagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
            totalItems={sales.length}
            itemsPerPage={ITEMS_PER_PAGE}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default SalesManagementContent;
