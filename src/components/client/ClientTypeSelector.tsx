
import React from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ClientTypeSelectorProps {
  clientType: string;
  onClientTypeChange: (value: string) => void;
}

export const ClientTypeSelector = ({
  clientType,
  onClientTypeChange,
}: ClientTypeSelectorProps) => {
  return (
    <div>
      <Label htmlFor="clientType">Tipo *</Label>
      <Select value={clientType} onValueChange={onClientTypeChange} required>
        <SelectTrigger>
          <SelectValue placeholder="Selecione o tipo" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="fisica">Pessoa Física</SelectItem>
          <SelectItem value="juridica">Pessoa Jurídica</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
};
