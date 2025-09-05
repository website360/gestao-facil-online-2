
import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter } from 'lucide-react';

interface ClientFiltersProps {
  searchTerm: string;
  typeFilter: string;
  filteredClientsCount: number;
  onSearchChange: (value: string) => void;
  onTypeFilterChange: (value: string) => void;
}

export const ClientFilters = ({
  searchTerm,
  typeFilter,
  filteredClientsCount,
  onSearchChange,
  onTypeFilterChange,
}: ClientFiltersProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <div className="flex gap-2 flex-1">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar por cliente ou e-mail..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={onTypeFilterChange}>
          <SelectTrigger className="w-48 gap-2">
            <Filter className="h-4 w-4" />
            <SelectValue placeholder="Todos os tipos" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="fisica">Pessoa Física</SelectItem>
            <SelectItem value="juridica">Pessoa Jurídica</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="text-sm text-gray-600">
        {filteredClientsCount} registros encontrados
      </div>
    </div>
  );
};
