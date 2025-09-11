
// ProductTable component for displaying products
import React from 'react';
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Edit, Trash2, Package, ArrowUpDown, Eye } from 'lucide-react';
import { useIsTabletOrMobile } from '@/hooks/use-tablet-mobile';
import { formatCurrency } from '@/lib/formatters';

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
  const isTabletOrMobile = useIsTabletOrMobile();
  // Verificar se usuário pode editar/excluir produtos (admin ou gerente)
  const canManageProducts = userRole === 'admin' || userRole === 'gerente';

  const renderSortableHeader = (field: string, label: string, className?: string) => {
    return (
      <TableHead className={className || ''}>
        <Button
          variant="ghost"
          size="sm"
          className="h-auto p-0 font-semibold text-gray-700 hover:text-gray-900 hover:bg-transparent"
          onClick={() => onSort(field)}
        >
          {label}
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      </TableHead>
    );
  };

  if (isTabletOrMobile) {
    return (
      <div className="space-y-2">
        {canManageProducts && (
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
            <Checkbox
              checked={isAllSelected}
              onCheckedChange={onSelectAll}
              aria-label="Selecionar todos"
              {...(isPartiallySelected ? { 'data-state': 'indeterminate' } : {})}
            />
            <span className="text-xs text-gray-600">Selecionar todos</span>
          </div>
        )}
        {products.map((product) => (
          <Card key={product.id} className="border border-gray-200">
            <CardContent className="p-3">
              <div className="space-y-2">
                {/* Header com checkbox e foto */}
                <div className="flex items-start gap-2">
                  {canManageProducts && (
                    <Checkbox
                      checked={selectedItems.has(product.id)}
                      onCheckedChange={() => onItemSelect(product.id)}
                      aria-label={`Selecionar ${product.name}`}
                      className="mt-1"
                    />
                  )}
                  <div className="w-12 h-12 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
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
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate text-sm">{product.name}</h3>
                    <p className="text-xs text-gray-500 font-mono">{product.internal_code}</p>
                    <div className="mt-0.5">
                      <span className="text-xs text-gray-500">Preço:</span>
                      <p className="font-medium text-sm">{formatCurrency(product.price)}</p>
                    </div>
                  </div>
                </div>

                {/* Informações organizadas lado a lado */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div>
                    <span className="text-xs text-gray-500 block">Estoque:</span>
                    <Badge className={`text-xs mt-1 ${product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {product.stock} {product.stock_unit || 'un'}
                    </Badge>
                  </div>

                  {product.categories?.name && (
                    <div>
                      <span className="text-xs text-gray-500 block">Categoria:</span>
                      <Badge className="bg-blue-100 text-blue-800 text-xs mt-1">
                        {product.categories.name}
                      </Badge>
                    </div>
                  )}

                  {product.suppliers?.name && (
                    <div>
                      <span className="text-xs text-gray-500 block">Fornecedor:</span>
                      <Badge className="bg-purple-100 text-purple-800 text-xs mt-1">
                        {product.suppliers.name}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Data de criação */}
                <div>
                  <span className="text-xs text-gray-500">Criado em:</span>
                  <p className="text-xs">{new Date(product.created_at).toLocaleDateString('pt-BR')}</p>
                </div>

                {/* Ações */}
                <div className="flex gap-2 pt-1.5 border-t border-gray-100">
                  {canManageProducts ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(product)}
                        className="flex-1 h-8 text-xs"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete(product)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8 p-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(product)}
                      className="flex-1 h-8 text-xs"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Visualizar
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="min-w-[1000px] overflow-x-auto">
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
                {formatCurrency(product.price)}
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
    </div>
  );
};

export default ProductTable;
