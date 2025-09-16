
import React from 'react';
import { Label } from '@/components/ui/label';
import ProductSearchInput from './ProductSearchInput';

interface BudgetFormHeaderProps {
  clientId: string;
  status: 'processando' | 'aguardando_aprovacao' | 'aprovado';
  clientOptions: Array<{ value: string; label: string }>;
  onClientChange: (value: string) => void;
  onStatusChange: (value: 'processando' | 'aguardando_aprovacao' | 'aprovado') => void;
  isClient?: boolean;
  readonly?: boolean;
}

const BudgetFormHeader = ({
  clientId,
  status,
  clientOptions,
  onClientChange,
  onStatusChange,
  isClient = false,
  readonly = false
}: BudgetFormHeaderProps) => {
  console.log('BudgetFormHeader - clientOptions:', clientOptions);
  console.log('BudgetFormHeader - clientId:', clientId);

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="space-y-2">
        <Label htmlFor="client">Cliente *</Label>
        {isClient || readonly ? (
          <div className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
            {clientOptions.find(c => c.value === clientId)?.label || 'Cliente'}
          </div>
        ) : (
          <ProductSearchInput
            value={clientId}
            onValueChange={onClientChange}
            options={clientOptions}
            placeholder="Buscar cliente..."
            disabled={readonly}
          />
        )}
      </div>
    </div>
  );
};

export default BudgetFormHeader;
