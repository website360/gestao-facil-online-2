import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency, formatNumber } from '@/lib/formatters';
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
  showStock?: boolean;
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
  readonly = false,
  showStock = false
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

      {showStock && (
        <td className="p-2">
          <Input
            value={products.find(p => p.id === item.product_id)?.stock?.toString() || '0'}
            readOnly
            className="h-8 text-xs text-center bg-gray-100 border-gray-300"
            placeholder="0"
          />
        </td>
      )}

      <td className="p-2">
        <Input
          placeholder="Código"
          value={item.product_code || ''}
          className="h-8 text-xs bg-gray-100"
          readOnly
          title="Clientes não podem alterar o código do produto"
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
          type="text"
          inputMode="decimal"
          value={formatNumber(item.unit_price)}
          placeholder="0,00"
          className="h-8 text-xs text-right bg-gray-100"
          readOnly
          title="Clientes não podem alterar o preço unitário"
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

      <td className="p-2">
        <Input
          type="text"
          inputMode="decimal"
          value={formatNumber(item.unit_price * (1 - item.discount_percentage / 100))}
          className="h-8 text-xs text-right bg-gray-50"
          readOnly
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