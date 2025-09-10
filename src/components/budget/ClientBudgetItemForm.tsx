import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import ProductSearchInput from './ProductSearchInput';

interface BudgetItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  discount_percentage: number;
  product_code?: string;
}

interface ClientBudgetItemFormProps {
  item: BudgetItem;
  index: number;
  productOptions: Array<{ value: string; label: string }>;
  products: Array<{ id: string; name: string; stock: number; price: number; internal_code?: string }>;
  canRemove: boolean;
  generalDiscount: number;
  onProductChange: (index: number, productId: string) => void;
  onItemUpdate: (index: number, field: string, value: any) => void;
  onRemove: (index: number) => void;
  calculateItemTotal: (item: BudgetItem) => number;
  readonly?: boolean;
}

const ClientBudgetItemForm = ({
  item,
  index,
  productOptions,
  products,
  canRemove,
  generalDiscount,
  onProductChange,
  onItemUpdate,
  onRemove,
  calculateItemTotal,
  readonly = false
}: ClientBudgetItemFormProps) => {
  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity <= 0) {
      toast.error('Quantidade deve ser maior que zero');
      return;
    }
    
    onItemUpdate(index, 'quantity', newQuantity);
  };

  // Clientes não podem alterar desconto
  const handleDiscountChange = (value: number) => {
    toast.error('Clientes não podem alterar desconto. O desconto será aplicado na aprovação.');
  };

  return (
    <tr className="border-b hover:bg-gray-50">
      <td className="p-2 text-sm font-medium text-center">
        {index + 1}
      </td>
      
      <td className="p-2">
        <ProductSearchInput
          value={item.product_id}
          onValueChange={(value) => onProductChange(index, value)}
          options={productOptions}
          placeholder="Digite para buscar produto..."
          disabled={readonly}
        />
      </td>

      <td className="p-2">
        <Input
          placeholder="Código"
          value={item.product_code || ''}
          onChange={(e) => onItemUpdate(index, 'product_code', e.target.value)}
          className="h-8 text-xs"
          disabled={readonly}
        />
      </td>

      <td className="p-2">
        <Input
          type="number"
          min="1"
          value={item.quantity}
          onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
          className="h-8 text-xs text-center w-20"
          disabled={readonly}
        />
      </td>

      <td className="p-2">
        <Input
          type="number"
          step="0.01"
          min="0"
          value={item.unit_price}
          onChange={(e) => onItemUpdate(index, 'unit_price', parseFloat(e.target.value) || 0)}
          className="h-8 text-xs text-right"
          disabled={readonly}
        />
      </td>

      <td className="p-2">
        <Input
          type="number"
          value={item.discount_percentage}
          className="h-8 text-xs text-center bg-gray-100"
          placeholder="0%"
          disabled
          title="Clientes não podem alterar desconto"
        />
      </td>

      <td className="p-2 text-right">
        <div className="text-xs font-medium">
          {formatCurrency(calculateItemTotal(item))}
        </div>
      </td>

      <td className="p-2 text-center">
        {canRemove && !readonly && (
          <Button
            type="button"
            onClick={() => onRemove(index)}
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </td>
    </tr>
  );
};

export default ClientBudgetItemForm;