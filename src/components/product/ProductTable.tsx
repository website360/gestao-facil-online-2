
import React from 'react';
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Edit, Trash2, Package, ChevronUp, ChevronDown } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  internal_code: string;
  price: number;
  stock: number;
  stock_unit?: string;
  category_id?: string;
  supplier_id?: string;
  photo_url?: string;
  categories?: { name: string };
  suppliers?: { name: string };
  created_at: string;
}

interface ProductTableProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (product: Product) => void;
  selectedItems: Set<string>;
  onItemSelect: (itemId: string) => void;
  onSelectAll: () => void;
  isAllSelected: boolean;
  isPartiallySelected: boolean;
  userRole?: string;
  sortField: string;
  sortDirection: 'asc' | 'desc';
  onSort: (field: string) => void;
}

const ProductTable = ({ 
  products, 
  onEdit, 
  onDelete, 
  selectedItems, 
  onItemSelect, 
  onSelectAll, 
  isAllSelected, 
  isPartiallySelected,
  userRole,
  sortField,
  sortDirection,
  onSort 
}: ProductTableProps) => {
  // Verificar se usuário pode editar/excluir produtos (admin ou gerente)
  const canManageProducts = userRole === 'admin' || userRole === 'gerente';

  const renderSortableHeader = (field: string, label: string, className?: string) => {
    const isActive = sortField === field;
    return (
      <TableHead 
        className={`cursor-pointer hover:bg-gray-100 select-none ${className || ''}`}
        onClick={() => onSort(field)}
      >
        <div className="flex items-center gap-1">
          <span>{label}</span>
          {isActive && (
            sortDirection === 'asc' 
              ? <ChevronUp className="h-4 w-4" />
              : <ChevronDown className="h-4 w-4" />
          )}
        </div>
      </TableHead>
    );
  };
  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            {canManageProducts && (
              <TableHead className="w-12">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={onSelectAll}
                  aria-label="Selecionar todos"
                  {...(isPartiallySelected ? { 'data-state': 'indeterminate' } : {})}
                />
              </TableHead>
            )}
            <TableHead>Foto</TableHead>
            {renderSortableHeader('name', 'Produto')}
            {renderSortableHeader('category', 'Categoria')}
            {renderSortableHeader('supplier', 'Fornecedor')}
            {renderSortableHeader('internal_code', 'Código')}
            {renderSortableHeader('price', 'Preço', 'text-right')}
            {renderSortableHeader('stock', 'Estoque', 'text-right')}
            {renderSortableHeader('created_at', 'Data')}
            {canManageProducts && <TableHead className="w-40">Ações</TableHead>}
            {!canManageProducts && <TableHead className="w-40">Visualizar</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow key={product.id} className="hover:bg-gray-50">
              {canManageProducts && (
                <TableCell>
                  <Checkbox
                    checked={selectedItems.has(product.id)}
                    onCheckedChange={() => onItemSelect(product.id)}
                    aria-label={`Selecionar ${product.name}`}
                  />
                </TableCell>
              )}
              <TableCell>
                <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden">
                  {product.photo_url ? (
                    <img 
                      src={product.photo_url} 
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <div className="font-medium">{product.name}</div>
              </TableCell>
              <TableCell>
                {product.categories?.name && (
                  <Badge className="bg-blue-100 text-blue-800">
                    {product.categories.name}
                  </Badge>
                )}
              </TableCell>
              <TableCell>
                {product.suppliers?.name && (
                  <Badge className="bg-green-100 text-green-800">
                    {product.suppliers.name}
                  </Badge>
                )}
              </TableCell>
              <TableCell className="font-mono text-sm">
                {product.internal_code}
              </TableCell>
              <TableCell className="text-right font-medium">
                R$ {product.price.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </TableCell>
              <TableCell className="text-right">
                <Badge className={product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                  {product.stock} {product.stock_unit || 'un'}
                </Badge>
              </TableCell>
              <TableCell>
                {new Date(product.created_at).toLocaleDateString('pt-BR')}
              </TableCell>
              {(canManageProducts || !canManageProducts) && (
                <TableCell>
                  <div className="flex gap-1">
                    {canManageProducts && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEdit(product)}
                          className="h-8 w-8 p-0"
                          title="Editar produto"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(product)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                          title="Excluir produto"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {!canManageProducts && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(product)}
                        className="h-8 w-8 p-0 text-blue-600 hover:text-blue-700"
                        title="Visualizar produto"
                      >
                        <Package className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ProductTable;
