import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import ClientBudgetItemForm from './ClientBudgetItemForm';

interface BudgetItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  discount_percentage: number;
  product_code?: string;
  has_individual_discount?: boolean;
}

interface ClientBudgetItemsTableProps {
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
}

const ClientBudgetItemsTable = ({
  items,
  productOptions,
  products,
  generalDiscount,
  onAddItem,
  onProductChange,
  onItemUpdate,
  onRemoveItem,
  calculateItemTotal,
  readonly = false
}: ClientBudgetItemsTableProps) => {
  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Itens do Orçamento</h3>
        {!readonly && (
          <Button type="button" onClick={onAddItem} variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Item
          </Button>
        )}
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50">
              <TableHead className="w-12 text-center text-xs">#</TableHead>
              <TableHead className="min-w-[120px] text-xs">Produto</TableHead>
              <TableHead className="w-24 text-xs">Código</TableHead>
              <TableHead className="w-20 text-center text-xs">Qtd</TableHead>
              <TableHead className="w-24 text-center text-xs">Preço Unit.</TableHead>
              <TableHead className="w-20 text-center text-xs">Desc. %</TableHead>
              <TableHead className="w-24 text-center text-xs">Total</TableHead>
              <TableHead className="w-12 text-center text-xs">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item, index) => (
              <ClientBudgetItemForm
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
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default ClientBudgetItemsTable;