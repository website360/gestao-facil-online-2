
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ProductCharacteristicsFormProps {
  size: string;
  setSize: (value: string) => void;
  color: string;
  setColor: (value: string) => void;
  composition: string;
  setComposition: (value: string) => void;
  box: string;
  setBox: (value: string) => void;
  readOnly?: boolean;
}

const ProductCharacteristicsForm = ({
  size,
  setSize,
  color,
  setColor,
  composition,
  setComposition,
  box,
  setBox,
  readOnly = false
}: ProductCharacteristicsFormProps) => {
  return (
    <div className="space-y-4">
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="size">Tamanho</Label>
          <Input
            id="size"
            value={size}
            onChange={(e) => setSize(e.target.value)}
            placeholder="ex: P, M, G, XG"
            readOnly={readOnly}
          />
        </div>
        <div>
          <Label htmlFor="color">Cor</Label>
          <Input
            id="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            placeholder="ex: Azul, Vermelho"
            readOnly={readOnly}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="composition">Composição</Label>
          <Input
            id="composition"
            value={composition}
            onChange={(e) => setComposition(e.target.value)}
            placeholder="ex: 100% Algodão"
            readOnly={readOnly}
          />
        </div>
        <div>
          <Label htmlFor="box">Caixa/Embalagem</Label>
          <Input
            id="box"
            value={box}
            onChange={(e) => setBox(e.target.value)}
            placeholder="Informações da embalagem"
            readOnly={readOnly}
          />
        </div>
      </div>
    </div>
  );
};

export default ProductCharacteristicsForm;
