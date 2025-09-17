
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import BudgetItemForm from './BudgetItemForm';

interface BudgetItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  discount_percentage: number;
  product_code?: string;
  has_individual_discount?: boolean;
}

interface BudgetItemsTableProps {
  items: BudgetItem[];
  productOptions: Array<{ value: string; label: string }>;
  products: Array<{ id: string; name: string; stock: number; price: number; internal_code?: string }>;
  generalDiscount: number;
  onAddItem: () => void;
  onProductChange: (index: number, productId: string) => void;
  onItemUpdate: (index: number, field: string, value: any) => void;
  onRemoveItem: (index: number) => void;
  calculateItemTotal: (item: BudgetItem) => number;
  readonly?: boolean;
  showStock?: boolean;
}

const BudgetItemsTable = ({
  items,
  productOptions,
  products,
  generalDiscount,
  onAddItem,
  onProductChange,
  onItemUpdate,
  onRemoveItem,
  calculateItemTotal,
  readonly = false,
  showStock = false
}: BudgetItemsTableProps) => {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Itens do Orçamento</h3>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-12 text-center text-xs">#</TableHead>
              <TableHead className="min-w-[120px] text-xs">Produto</TableHead>
              {showStock && <TableHead className="w-16 text-center text-xs">Estoque</TableHead>}
              <TableHead className="w-24 text-xs">Código</TableHead>
              <TableHead className="w-20 text-center text-xs">Qtd</TableHead>
              <TableHead className="w-24 text-center text-xs">Preço Un</TableHead>
              <TableHead className="w-20 text-center text-xs">Desc. %</TableHead>
              <TableHead className="w-24 text-center text-xs">Preço Un Desc</TableHead>
              <TableHead className="w-24 text-center text-xs">Total</TableHead>
              <TableHead className="w-12 text-center text-xs">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, index) => (
              <BudgetItemForm
                key={index}
                item={item}
                index={index}
                productOptions={productOptions}
                products={products}
                canRemove={items.length > 1}
                onProductChange={onProductChange}
                onItemUpdate={onItemUpdate}
                onRemove={onRemoveItem}
                calculateItemTotal={calculateItemTotal}
                generalDiscount={generalDiscount}
                readonly={readonly}
                showStock={showStock}
              />
            ))}
          </TableBody>
        </Table>
      </div>

      {!readonly && (
        <div className="flex justify-center pt-2">
          <Button type="button" onClick={onAddItem} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Item
          </Button>
        </div>
      )}
    </div>
  );
};

export default BudgetItemsTable;
