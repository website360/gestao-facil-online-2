
import React from 'react';
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent } from '@/components/ui/card';
import { Edit, Trash2, Package, ChevronUp, ChevronDown, Eye } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
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
  const isMobile = useIsMobile();
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

  if (isMobile) {
    return (
      <div className="space-y-4">
        {canManageProducts && (
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <Checkbox
              checked={isAllSelected}
              onCheckedChange={onSelectAll}
              aria-label="Selecionar todos"
              {...(isPartiallySelected ? { 'data-state': 'indeterminate' } : {})}
            />
            <span className="text-sm text-gray-600">Selecionar todos</span>
          </div>
        )}
        {products.map((product) => (
          <Card key={product.id} className="border border-gray-200">
            <CardContent className="p-4">
              <div className="space-y-3">
                {/* Header com checkbox e foto */}
                <div className="flex items-start gap-3">
                  {canManageProducts && (
                    <Checkbox
                      checked={selectedItems.has(product.id)}
                      onCheckedChange={() => onItemSelect(product.id)}
                      aria-label={`Selecionar ${product.name}`}
                      className="mt-1"
                    />
                  )}
                  <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                    {product.photo_url ? (
                      <img 
                        src={product.photo_url} 
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">{product.name}</h3>
                    <p className="text-sm text-gray-500 font-mono">{product.internal_code}</p>
                    <div className="mt-1">
                      <span className="text-sm text-gray-500">Preço:</span>
                      <p className="font-medium text-lg">{formatCurrency(product.price)}</p>
                    </div>
                  </div>
                </div>

                {/* Informações organizadas */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-sm text-gray-500">Estoque:</span>
                      <div className="mt-1">
                        <Badge className={product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                          {product.stock} {product.stock_unit || 'un'}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {product.categories?.name && (
                    <div>
                      <span className="text-sm text-gray-500">Categoria:</span>
                      <div className="mt-1">
                        <Badge className="bg-blue-100 text-blue-800">
                          {product.categories.name}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {product.suppliers?.name && (
                    <div>
                      <span className="text-sm text-gray-500">Fornecedor:</span>
                      <div className="mt-1">
                        <Badge className="bg-purple-100 text-purple-800">
                          {product.suppliers.name}
                        </Badge>
                      </div>
                    </div>
                  )}
                </div>

                {/* Data de criação */}
                <div>
                  <span className="text-sm text-gray-500">Criado em:</span>
                  <p className="text-sm">{new Date(product.created_at).toLocaleDateString('pt-BR')}</p>
                </div>

                {/* Ações */}
                <div className="flex gap-2 pt-2 border-t border-gray-100">
                  {canManageProducts ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(product)}
                        className="flex-1"
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete(product)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(product)}
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 mr-2" />
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
