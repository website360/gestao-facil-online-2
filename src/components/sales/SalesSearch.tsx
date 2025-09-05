
import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter } from 'lucide-react';

interface SalesSearchProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  userRole: string;
  filteredCount: number;
}

const SalesSearch = ({ searchTerm, onSearchChange, userRole, filteredCount }: SalesSearchProps) => {
  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100 mb-6">
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar por cliente ou vendedor..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500 h-10"
          />
        </div>
        
        <div className="flex items-center gap-4">
          <Select defaultValue="todos">
            <SelectTrigger className="w-48 h-10 border-gray-200 focus:border-blue-500 focus:ring-blue-500">
              <Filter className="h-4 w-4 mr-2 text-gray-500" />
              <SelectValue placeholder="Todos os status" />
            </SelectTrigger>
            <SelectContent className="bg-white border border-gray-200 shadow-lg">
              <SelectItem value="todos">Todos os status</SelectItem>
              <SelectItem value="separacao">Separação</SelectItem>
              <SelectItem value="conferencia">Conferência</SelectItem>
              <SelectItem value="nota_fiscal">Nota Fiscal</SelectItem>
              <SelectItem value="finalizado">Finalizado</SelectItem>
            </SelectContent>
          </Select>
          
          <span className="text-sm text-gray-600 font-medium bg-gray-50 px-3 py-2 rounded-md">
            {filteredCount} registros
          </span>
        </div>
      </div>
    </div>
  );
};

export default SalesSearch;
