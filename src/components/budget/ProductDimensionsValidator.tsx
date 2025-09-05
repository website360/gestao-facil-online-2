import React from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';

interface ProductDimensionsValidatorProps {
  products: Array<{
    id: string;
    name?: string;
    weight?: number;
    width?: number;
    length?: number;
    height?: number;
  }>;
  items: Array<{
    product_id: string;
    quantity: number;
  }>;
}

const ProductDimensionsValidator = ({ products, items }: ProductDimensionsValidatorProps) => {
  const validateProductDimensions = () => {
    const incompleteProducts: string[] = [];

    items.forEach(item => {
      const product = products.find(p => p.id === item.product_id);
      if (product) {
        const missing = [];
        if (!product.weight) missing.push('peso');
        if (!product.width) missing.push('largura');
        if (!product.length) missing.push('comprimento');
        if (!product.height) missing.push('altura');

        if (missing.length > 0) {
          incompleteProducts.push(`${product.name || product.id}: ${missing.join(', ')}`);
        }
      }
    });

    return incompleteProducts;
  };

  const incompleteProducts = validateProductDimensions();

  if (incompleteProducts.length === 0) {
    return null;
  }

  return (
    <Alert variant="destructive" className="mb-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        <div className="space-y-2">
          <p className="font-semibold">Atenção: Produtos com dimensões incompletas</p>
          <p className="text-sm">
            Os seguintes produtos não possuem todas as dimensões necessárias para o cálculo preciso do frete dos Correios:
          </p>
          <ul className="text-sm list-disc list-inside space-y-1">
            {incompleteProducts.map((product, index) => (
              <li key={index}>{product}</li>
            ))}
          </ul>
          <p className="text-sm font-medium">
            Cadastre peso, largura, comprimento e altura para todos os produtos para obter valores exatos.
          </p>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default ProductDimensionsValidator;