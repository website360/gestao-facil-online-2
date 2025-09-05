
import React from 'react';
import { TableHead, TableRow } from '@/components/ui/table';
import { ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SalesTableHeadersProps {
  userRole: string;
  sortField: string;
  sortDirection: 'asc' | 'desc';
  onSort: (field: string) => void;
  selectedItems?: Set<string>;
  onSelectAll?: () => void;
  isAllSelected?: boolean;
  isPartiallySelected?: boolean;
  showBulkActions?: boolean;
}

const SalesTableHeaders = ({ userRole, sortField, sortDirection, onSort }: SalesTableHeadersProps) => {
  const SortButton = ({ field, children }: { field: string; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      className="h-auto p-0 font-semibold text-gray-700 hover:text-gray-900 hover:bg-transparent"
      onClick={() => onSort(field)}
    >
      {children}
      <ArrowUpDown className="ml-2 h-4 w-4" />
    </Button>
  );

  // Headers específicos para role de separação
  if (userRole === 'separacao') {
    return (
      <TableRow className="border-b border-gray-200">
        <TableHead className="font-semibold text-gray-700 py-4 px-6 text-left">#</TableHead>
        <TableHead className="font-semibold text-gray-700 py-4 px-6 text-left">
          <SortButton field="client_name">Cliente</SortButton>
        </TableHead>
        <TableHead className="font-semibold text-gray-700 py-4 px-6 text-left">
          <SortButton field="status">Status</SortButton>
        </TableHead>
        <TableHead className="font-semibold text-gray-700 py-4 px-6 text-left">Progresso</TableHead>
        <TableHead className="font-semibold text-gray-700 py-4 px-6 text-left">
          <SortButton field="created_at">Data</SortButton>
        </TableHead>
        <TableHead className="font-semibold text-gray-700 py-4 px-6 text-left">Vendedor</TableHead>
        <TableHead className="font-semibold text-gray-700 py-4 px-6 text-center">Ações</TableHead>
      </TableRow>
    );
  }

  // Headers específicos para role de conferência
  if (userRole === 'conferencia') {
    return (
      <TableRow className="border-b border-gray-200">
        <TableHead className="font-semibold text-gray-700 py-4 px-6 text-left">#</TableHead>
        <TableHead className="font-semibold text-gray-700 py-4 px-6 text-left">
          <SortButton field="client_name">Cliente</SortButton>
        </TableHead>
        <TableHead className="font-semibold text-gray-700 py-4 px-6 text-left">
          <SortButton field="status">Status</SortButton>
        </TableHead>
        <TableHead className="font-semibold text-gray-700 py-4 px-6 text-left">Progresso</TableHead>
        <TableHead className="font-semibold text-gray-700 py-4 px-6 text-left">
          <SortButton field="created_at">Data</SortButton>
        </TableHead>
        <TableHead className="font-semibold text-gray-700 py-4 px-6 text-left">Vendedor</TableHead>
        <TableHead className="font-semibold text-gray-700 py-4 px-6 text-center">Ações</TableHead>
      </TableRow>
    );
  }

  // Headers específicos para role de nota fiscal
  if (userRole === 'nota_fiscal') {
    return (
      <TableRow className="border-b border-gray-200">
        <TableHead className="font-semibold text-gray-700 py-4 px-6 text-left">#</TableHead>
        <TableHead className="font-semibold text-gray-700 py-4 px-6 text-left">
          <SortButton field="client_name">Cliente</SortButton>
        </TableHead>
        <TableHead className="font-semibold text-gray-700 py-4 px-6 text-left">
          <SortButton field="status">Status</SortButton>
        </TableHead>
        <TableHead className="font-semibold text-gray-700 py-4 px-6 text-left">
          <SortButton field="created_at">Data</SortButton>
        </TableHead>
        <TableHead className="font-semibold text-gray-700 py-4 px-6 text-left">
          <SortButton field="total_amount">Total</SortButton>
        </TableHead>
        <TableHead className="font-semibold text-gray-700 py-4 px-6 text-left">Nº Nota</TableHead>
        <TableHead className="font-semibold text-gray-700 py-4 px-6 text-left">Vendedor</TableHead>
        <TableHead className="font-semibold text-gray-700 py-4 px-6 text-center">Ações</TableHead>
      </TableRow>
    );
  }

  // Headers específicos para role de entregador
  if (userRole === 'entregador') {
    return (
      <TableRow className="border-b border-gray-200">
        <TableHead className="font-semibold text-gray-700 py-4 px-6 text-left">#</TableHead>
        <TableHead className="font-semibold text-gray-700 py-4 px-6 text-left">
          <SortButton field="client_name">Cliente</SortButton>
        </TableHead>
        <TableHead className="font-semibold text-gray-700 py-4 px-6 text-left">
          <SortButton field="status">Status</SortButton>
        </TableHead>
        <TableHead className="font-semibold text-gray-700 py-4 px-6 text-left">
          <SortButton field="created_at">Data</SortButton>
        </TableHead>
        <TableHead className="font-semibold text-gray-700 py-4 px-6 text-left">
          <SortButton field="total_amount">Total</SortButton>
        </TableHead>
        <TableHead className="font-semibold text-gray-700 py-4 px-6 text-left">Nº Nota</TableHead>
        <TableHead className="font-semibold text-gray-700 py-4 px-6 text-left">Vendedor</TableHead>
        <TableHead className="font-semibold text-gray-700 py-4 px-6 text-center">Ações</TableHead>
      </TableRow>
    );
  }

  return (
    <TableRow className="border-b border-gray-200">
      <TableHead className="font-semibold text-gray-700 py-4 px-6 text-left">#</TableHead>
      <TableHead className="font-semibold text-gray-700 py-4 px-6 text-left">
        <SortButton field="client_name">Cliente</SortButton>
      </TableHead>
      <TableHead className="font-semibold text-gray-700 py-4 px-6 text-left">
        <SortButton field="status">Status</SortButton>
      </TableHead>
      <TableHead className="font-semibold text-gray-700 py-4 px-6 text-left">
        <SortButton field="created_at">Data</SortButton>
      </TableHead>
      <TableHead className="font-semibold text-gray-700 py-4 px-6 text-left">
        <SortButton field="total_amount">Total</SortButton>
      </TableHead>
      <TableHead className="font-semibold text-gray-700 py-4 px-6 text-left">Nº Nota</TableHead>
      <TableHead className="font-semibold text-gray-700 py-4 px-6 text-left">Vendedor</TableHead>
      <TableHead className="font-semibold text-gray-700 py-4 px-6 text-center">Ações</TableHead>
    </TableRow>
  );
};

export default SalesTableHeaders;
