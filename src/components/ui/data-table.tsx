import React, { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import EmptyState from '@/components/ui/empty-state';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Search,
  Package2,
} from 'lucide-react';

export interface DataTableColumn<T> {
  key: keyof T | string;
  header: string;
  render?: (item: T, index: number) => React.ReactNode;
  sortable?: boolean;
  searchable?: boolean;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  searchPlaceholder?: string;
  itemsPerPage?: number;
  className?: string;
  emptyMessage?: string;
  hideSearch?: boolean;
}

export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  searchPlaceholder = 'Buscar...',
  itemsPerPage = 100,
  className = '',
  emptyMessage = 'Nenhum registro encontrado',
  hideSearch = false,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [pageSize, setPageSize] = useState(itemsPerPage);

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let filtered = data;

    // Apply search filter
    if (searchTerm) {
      const searchableColumns = columns.filter(col => col.searchable !== false);
      filtered = data.filter(item => {
        return searchableColumns.some(column => {
          const value = item[column.key as keyof T];
          return value?.toString().toLowerCase().includes(searchTerm.toLowerCase());
        });
      });
    }

    // Apply sorting
    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a[sortColumn];
        const bValue = b[sortColumn];
        
        if (aValue == null) return 1;
        if (bValue == null) return -1;
        
        let comparison = 0;
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          comparison = aValue.localeCompare(bValue);
        } else if (typeof aValue === 'number' && typeof bValue === 'number') {
          comparison = aValue - bValue;
        } else if (aValue instanceof Date && bValue instanceof Date) {
          comparison = aValue.getTime() - bValue.getTime();
        } else {
          comparison = String(aValue).localeCompare(String(bValue));
        }
        
        return sortDirection === 'desc' ? -comparison : comparison;
      });
    }

    return filtered;
  }, [data, searchTerm, sortColumn, sortDirection, columns]);

  // Pagination
  const totalItems = filteredAndSortedData.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const currentData = filteredAndSortedData.slice(startIndex, endIndex);

  // Reset page when search changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const handleSort = (columnKey: string) => {
    const column = columns.find(col => col.key === columnKey);
    if (column?.sortable === false) return;

    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const getSortIcon = (columnKey: string) => {
    if (sortColumn !== columnKey) return null;
    return sortDirection === 'asc' ? ' ↑' : ' ↓';
  };

  return (
    <div className={`space-y-2 md:space-y-4 ${className}`}>
      {/* Search and Controls */}
      <div className="flex flex-col sm:flex-row gap-2 md:gap-4 items-start sm:items-center justify-between">
        {!hideSearch && (
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-2 md:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-3 w-3 md:h-4 md:w-4" />
            <Input
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 md:pl-10 h-8 md:h-10 text-sm"
            />
          </div>
        )}
        
        <div className="flex items-center gap-2 md:gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xs md:text-sm text-gray-600">Itens por página:</span>
            <Select value={pageSize.toString()} onValueChange={(value) => {
              setPageSize(Number(value));
              setCurrentPage(1);
            }}>
              <SelectTrigger className="w-16 md:w-20 h-8 md:h-10 text-xs md:text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
                <SelectItem value="100">100</SelectItem>
                <SelectItem value="200">200</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="text-xs md:text-sm text-gray-600">
            {totalItems > 0 ? (
              <>
                {startIndex + 1}-{endIndex} de {totalItems} registros
              </>
            ) : (
              '0 registros'
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-md md:rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              {columns.map((column) => (
                <TableHead
                  key={column.key as string}
                  className={`${column.sortable !== false ? 'cursor-pointer hover:bg-gray-100' : ''} ${column.width || ''} ${
                    column.align === 'center' ? 'text-center' : 
                    column.align === 'right' ? 'text-right' : 'text-left'
                  } text-xs md:text-sm py-2 md:py-3 px-2 md:px-4`}
                  onClick={() => column.sortable !== false && handleSort(column.key as string)}
                >
                  <div className={`flex items-center gap-1 ${
                    column.align === 'center' ? 'justify-center' : 
                    column.align === 'right' ? 'justify-end' : 'justify-start'
                  }`}>
                    {column.header}
                    {getSortIcon(column.key as string)}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentData.length > 0 ? (
              currentData.map((item, index) => (
                <TableRow key={index} className="hover:bg-gray-50">
                  {columns.map((column) => (
                    <TableCell key={column.key as string} className={`${column.width || ''} text-xs md:text-sm py-2 md:py-3 px-2 md:px-4`}>
                      {column.render
                        ? column.render(item, startIndex + index)
                        : item[column.key as keyof T]?.toString() || '-'}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="p-0 border-0">
                  <EmptyState
                    title={emptyMessage || "Nenhum registro encontrado"}
                    description="Os dados aparecerão aqui quando forem adicionados."
                    icon={Package2}
                  />
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="text-xs md:text-sm text-gray-600 order-2 sm:order-1">
            Página {currentPage} de {totalPages}
          </div>
          
          <div className="flex items-center gap-1 md:gap-2 order-1 sm:order-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(1)}
              disabled={currentPage === 1}
              className="h-7 w-7 md:h-8 md:w-8 p-0"
            >
              <ChevronsLeft className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="h-7 w-7 md:h-8 md:w-8 p-0"
            >
              <ChevronLeft className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
            
            {/* Page numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <Button
                  key={pageNum}
                  variant={currentPage === pageNum ? "default" : "outline"}
                  size="sm"
                  onClick={() => handlePageChange(pageNum)}
                  className="w-6 h-6 md:w-8 md:h-8 p-0 text-xs md:text-sm"
                >
                  {pageNum}
                </Button>
              );
            })}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="h-7 w-7 md:h-8 md:w-8 p-0"
            >
              <ChevronRight className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage === totalPages}
              className="h-7 w-7 md:h-8 md:w-8 p-0"
            >
              <ChevronsRight className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}