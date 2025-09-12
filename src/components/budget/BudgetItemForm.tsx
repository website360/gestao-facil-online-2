
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatCurrency, formatNumber } from '@/lib/formatters';
import { useDiscountPermissions } from '@/hooks/useDiscountPermissions';
import ProductSearchInput from './ProductSearchInput';

interface BudgetItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  discount_percentage: number;
  product_code?: string;
}

interface BudgetItemFormProps {
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

const BudgetItemForm = ({
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
}: BudgetItemFormProps) => {
  console.log('BudgetItemForm - productOptions:', productOptions);
  console.log('BudgetItemForm - item.product_id:', item.product_id);

  const { 
    canEditDiscount, 
    isValidIndividualDiscount, 
    getMaxIndividualDiscount, 
    getDiscountErrorMessage,
    maxDiscount,
    loading
  } = useDiscountPermissions();

  // Log para debug
  console.log('BudgetItemForm - maxDiscount:', maxDiscount, 'loading:', loading);

  // Get current stock for the selected product
  const selectedProduct = products.find(p => p.id === item.product_id);
  const currentStock = selectedProduct?.stock || 0;

  const handleQuantityChange = (newQuantity: number) => {
    if (newQuantity <= 0) {
      toast.error('Quantidade deve ser maior que zero');
      return;
    }
    
    onItemUpdate(index, 'quantity', newQuantity);
  };

  const handleDiscountChange = (value: number) => {
    if (!canEditDiscount) {
      toast.error('Você não tem permissão para alterar desconto');
      return;
    }

    if (!isValidIndividualDiscount(value)) {
      toast.error(getDiscountErrorMessage('individual', value));
      return;
    }

    onItemUpdate(index, 'discount_percentage', value);
  };

  return (
    <tr className="border-b hover:bg-gray-50">
      <td className="p-2 text-sm font-medium text-center">
        {index + 1}
      </td>
      
      <td className="p-2">
        <ProductSearchInput
          value={item.product_id}
          onValueChange={(value) => {
            console.log('=== BudgetItemForm onProductChange ===');
            console.log('Index:', index, 'New product ID:', value);
            onProductChange(index, value);
            console.log('=== onProductChange called ===');
          }}
          options={productOptions}
          placeholder="Digite para buscar produto..."
          disabled={readonly}
        />
      </td>

      <td className="p-2">
        <Input
          value={currentStock.toString()}
          readOnly
          className="h-8 text-xs text-center bg-gray-100 border-gray-300"
          placeholder="0"
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
          type="text"
          inputMode="decimal"
          value={formatNumber(item.unit_price)}
          onChange={(e) => {
            const raw = e.target.value;
            const sanitized = raw.replace(/\./g, '').replace(',', '.').replace(/[^0-9.]/g, '');
            const parsed = parseFloat(sanitized);
            onItemUpdate(index, 'unit_price', isNaN(parsed) ? 0 : parsed);
          }}
          placeholder="0,00"
          className="h-8 text-xs text-right"
          disabled={readonly}
        />
      </td>

      <td className="p-2">
        <Input
          type="number"
          step="0.01"
          min="0"
          max={getMaxIndividualDiscount()}
          value={item.discount_percentage}
          onChange={(e) => handleDiscountChange(parseFloat(e.target.value) || 0)}
          className={`h-8 text-xs text-center ${!canEditDiscount || readonly ? 'bg-gray-100' : ''}`}
          placeholder={`${generalDiscount}%`}
          disabled={!canEditDiscount || readonly}
          title={!canEditDiscount ? 'Você não tem permissão para alterar desconto' : `Máximo: ${getMaxIndividualDiscount()}%`}
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

export default BudgetItemForm;
