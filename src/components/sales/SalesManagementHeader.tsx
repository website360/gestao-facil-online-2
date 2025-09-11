
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface SalesManagementHeaderProps {
  onRefresh: () => void;
}

const SalesManagementHeader = ({ onRefresh }: SalesManagementHeaderProps) => {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl md:text-2xl font-bold text-gray-900">Gerenciamento de Vendas</h1>
      <div className="flex justify-end">
        <Button onClick={onRefresh} variant="outline" className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          <span className="hidden sm:inline">Atualizar</span>
          <span className="sm:hidden">Refresh</span>
        </Button>
      </div>
    </div>
  );
};

export default SalesManagementHeader;
