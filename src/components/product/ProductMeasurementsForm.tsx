
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ProductMeasurementsFormProps {
  width: string;
  setWidth: (value: string) => void;
  length: string;
  setLength: (value: string) => void;
  height: string;
  setHeight: (value: string) => void;
}

const ProductMeasurementsForm = ({
  width,
  setWidth,
  length,
  setLength,
  height,
  setHeight
}: ProductMeasurementsFormProps) => {
  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="font-semibold text-sm text-blue-900 mb-2">Como funciona o cálculo dos Correios:</div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-blue-800">
          <div>
            <div className="font-medium">Peso Cúbico</div>
            <div className="text-blue-700">
              (L×C×A) ÷ 6000<br/>
              Cobrança pelo maior peso
            </div>
          </div>
          
          <div>
            <div className="font-medium">Dimensões Mínimas</div>
            <div className="text-blue-700">
              11cm × 16cm × 2cm
            </div>
          </div>
          
          <div>
            <div className="font-medium">Limites Máximos</div>
            <div className="text-blue-700">
              30kg, 200cm total, 105cm maior lado
            </div>
          </div>
        </div>
        
        <div className="text-xs text-orange-700 bg-orange-50 p-2 rounded border border-orange-200 mt-3">
          <strong>Importante:</strong> Todas as medidas são obrigatórias para cálculo preciso do frete dos Correios.
        </div>
      </div>
      
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="width">Largura (cm) *</Label>
          <Input
            id="width"
            type="number"
            step="0.01"
            value={width}
            onChange={(e) => setWidth(e.target.value)}
            placeholder="0,00"
            required
          />
        </div>
        <div>
          <Label htmlFor="length">Comprimento (cm) *</Label>
          <Input
            id="length"
            type="number"
            step="0.01"
            value={length}
            onChange={(e) => setLength(e.target.value)}
            placeholder="0,00"
            required
          />
        </div>
        <div>
          <Label htmlFor="height">Altura (cm) *</Label>
          <Input
            id="height"
            type="number"
            step="0.01"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            placeholder="0,00"
            required
          />
        </div>
      </div>
    </div>
  );
};

export default ProductMeasurementsForm;
