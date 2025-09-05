import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ProductWeightFormProps {
  weight: string;
  setWeight: (value: string) => void;
  weightUnit: string;
  setWeightUnit: (value: string) => void;
}

const ProductWeightForm = ({
  weight,
  setWeight,
  weightUnit,
  setWeightUnit
}: ProductWeightFormProps) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-muted-foreground">Obrigatório para cálculo de frete</span>
        <span className="text-sm text-muted-foreground">Necessário para integração com Correios</span>
      </div>
      
      <div className="w-full max-w-xs">
        <div>
          <Label htmlFor="weight">Peso *</Label>
          <Input
            id="weight"
            type="number"
            step="0.001"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="0,000"
            required
          />
        </div>
      </div>
    </div>
  );
};

export default ProductWeightForm;