
import React from 'react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ProductObservationsFormProps {
  observation: string;
  setObservation: (value: string) => void;
  readOnly?: boolean;
}

const ProductObservationsForm = ({ observation, setObservation, readOnly = false }: ProductObservationsFormProps) => {
  return (
    <div className="space-y-4">
      
      <div>
        <Label htmlFor="observation">Observações Adicionais</Label>
        <Textarea
          id="observation"
          value={observation}
          onChange={(e) => setObservation(e.target.value)}
          placeholder="Digite observações sobre o produto..."
          rows={3}
          readOnly={readOnly}
        />
      </div>
    </div>
  );
};

export default ProductObservationsForm;
