
import React from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Filter } from 'lucide-react';

interface ProductFiltersProps {
  searchTerm: string;
  categoryFilter: string;
  filteredProductsCount: number;
  categories: any[];
  onSearchChange: (value: string) => void;
  onCategoryFilterChange: (value: string) => void;
}

const ProductFilters = ({
  searchTerm,
  categoryFilter,
  filteredProductsCount,
  categories,
  onSearchChange,
  onCategoryFilterChange
}: ProductFiltersProps) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
      <div className="flex gap-2 flex-1">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar por produto ou código..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={categoryFilter} onValueChange={onCategoryFilterChange}>
          <SelectTrigger className="w-56 gap-2">
            <Filter className="h-4 w-4" />
            <SelectValue placeholder="Todas as categorias" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as categorias</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="text-sm text-gray-600">
        {filteredProductsCount} registros encontrados
      </div>
    </div>
  );
};

export default ProductFilters;
