
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ProductPriceStockFormProps {
  price: string;
  setPrice: (value: string) => void;
  stock: string;
  setStock: (value: string) => void;
  stockUnit: string;
  setStockUnit: (value: string) => void;
  readOnly?: boolean;
}

const STOCK_UNITS = ['Peça', 'Unidade', 'Metro', 'Kit', 'Cartela', 'Rolo', 'Pacote', 'Par'];

const ProductPriceStockForm = ({
  price,
  setPrice,
  stock,
  setStock,
  stockUnit,
  setStockUnit,
  readOnly = false
}: ProductPriceStockFormProps) => {
  const formatPrice = (value: string) => {
    // Remove tudo que não é dígito
    const numbers = value.replace(/\D/g, '');
    
    // Se não há números, retorna vazio
    if (!numbers) return '';
    
    // Converte para centavos e formata
    const cents = parseInt(numbers);
    const reals = cents / 100;
    
    return reals.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2
    });
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatPrice(e.target.value);
    setPrice(formattedValue);
  };

  const getPriceValue = () => {
    // Se já está formatado, retorna como está
    if (price.includes('R$')) return price;
    
    // Se é um número simples vindo do banco de dados, formata corretamente
    if (price && !isNaN(Number(price))) {
      const numericValue = Number(price);
      return numericValue.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2
      });
    }
    
    return price;
  };

  return (
    <div className="space-y-4">
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label htmlFor="price">Preço *</Label>
          <Input
            id="price"
            type="text"
            value={getPriceValue()}
            onChange={handlePriceChange}
            required
            placeholder="R$ 0,00"
            readOnly={readOnly}
          />
        </div>
        <div>
          <Label htmlFor="stock">Estoque *</Label>
          <Input
            id="stock"
            type="number"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            required
            placeholder="0"
            readOnly={readOnly}
          />
        </div>
        <div>
          <Label htmlFor="stockUnit">Tipo</Label>
          <Select value={stockUnit} onValueChange={readOnly ? undefined : setStockUnit}>
            <SelectTrigger className={readOnly ? "pointer-events-none opacity-50" : ""}>
              <SelectValue placeholder="Selecione o tipo" />
            </SelectTrigger>
            <SelectContent>
              {STOCK_UNITS.map((unit) => (
                <SelectItem key={unit} value={unit}>
                  {unit}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default ProductPriceStockForm;
