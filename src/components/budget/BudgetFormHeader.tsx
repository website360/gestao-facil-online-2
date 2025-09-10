
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface BudgetFormHeaderProps {
  clientId: string;
  status: 'aguardando_aprovacao' | 'aprovado';
  clientOptions: Array<{ value: string; label: string }>;
  onClientChange: (value: string) => void;
  onStatusChange: (value: 'aguardando_aprovacao' | 'aprovado') => void;
  isClient?: boolean;
}

const BudgetFormHeader = ({
  clientId,
  status,
  clientOptions,
  onClientChange,
  onStatusChange,
  isClient = false
}: BudgetFormHeaderProps) => {
  console.log('BudgetFormHeader - clientOptions:', clientOptions);
  console.log('BudgetFormHeader - clientId:', clientId);

  return (
    <div className="grid grid-cols-1 gap-4">
      <div className="space-y-2">
        <Label htmlFor="client">Cliente *</Label>
        {isClient ? (
          <div className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background">
            {clientOptions.find(c => c.value === clientId)?.label || 'Cliente'}
          </div>
        ) : (
          <Select value={clientId} onValueChange={onClientChange}>
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="Selecione um cliente..." />
            </SelectTrigger>
            <SelectContent className="bg-white border shadow-lg z-[9999] max-h-60 overflow-auto">
              {clientOptions.map((client) => (
                <SelectItem key={client.value} value={client.value} className="bg-white hover:bg-gray-50">
                  {client.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>
    </div>
  );
};

export default BudgetFormHeader;
