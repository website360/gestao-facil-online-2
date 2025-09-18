import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, X, Filter } from 'lucide-react';

interface SalesFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  userRole: string;
  filteredSalesCount: number;
}

const SalesFilters = ({ 
  searchTerm, 
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  userRole,
  filteredSalesCount 
}: SalesFiltersProps) => {
  const clearSearch = () => {
    setSearchTerm('');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar por cliente, número da venda, vendedor ou número da nota..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-gray-100"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        {/* Filtro de status - apenas para admin e gerente */}
        {(userRole === 'admin' || userRole === 'gerente') && (
          <div className="w-full md:w-48">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full">
                <Filter className="w-4 h-4 mr-2 text-gray-500" />
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent className="w-full">
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="separacao">Separação</SelectItem>
                <SelectItem value="conferencia">Conferência</SelectItem>
                <SelectItem value="nota_fiscal">Nota Fiscal</SelectItem>
                <SelectItem value="aguardando_entrega">Aguardando Entrega</SelectItem>
                <SelectItem value="entrega_realizada">Entrega Realizada</SelectItem>
                <SelectItem value="atencao">Atenção</SelectItem>
                <SelectItem value="finalizada">Finalizada</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      <div className="text-sm text-gray-600">
        {filteredSalesCount} registros encontrados
      </div>
    </div>
  );
};

export default SalesFilters;