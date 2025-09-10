
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface SalesManagementHeaderProps {
  onRefresh: () => void;
}

const SalesManagementHeader = ({ onRefresh }: SalesManagementHeaderProps) => {
  return (
    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
      <h1 className="text-xl md:text-2xl font-bold text-gray-900">Gerenciamento de Vendas</h1>
      <Button onClick={onRefresh} variant="outline" className="flex items-center gap-2 w-full md:w-auto">
        <RefreshCw className="h-4 w-4" />
        Atualizar
      </Button>
    </div>
  );
};

export default SalesManagementHeader;
