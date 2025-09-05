
import React from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

interface SalesManagementHeaderProps {
  onRefresh: () => void;
}

const SalesManagementHeader = ({ onRefresh }: SalesManagementHeaderProps) => {
  return (
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-bold text-gray-900">Gerenciamento de Vendas</h1>
      <Button onClick={onRefresh} variant="outline" className="flex items-center gap-2">
        <RefreshCw className="h-4 w-4" />
        Atualizar
      </Button>
    </div>
  );
};

export default SalesManagementHeader;
