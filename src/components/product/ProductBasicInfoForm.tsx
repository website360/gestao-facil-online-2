
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ProductBasicInfoFormProps {
  name: string;
  setName: (value: string) => void;
  internalCode: string;
  setInternalCode: (value: string) => void;
  barcode: string;
  setBarcode: (value: string) => void;
  categoryId: string;
  setCategoryId: (value: string) => void;
  supplierId: string;
  setSupplierId: (value: string) => void;
  categories: any[];
  suppliers: any[];
  readOnly?: boolean;
  userRole?: string;
}

const ProductBasicInfoForm = ({
  name,
  setName,
  internalCode,
  setInternalCode,
  barcode,
  setBarcode,
  categoryId,
  setCategoryId,
  supplierId,
  setSupplierId,
  categories,
  suppliers,
  readOnly = false,
  userRole
}: ProductBasicInfoFormProps) => {
  // Handle category change - convert "none" back to empty string
  const handleCategoryChange = (value: string) => {
    setCategoryId(value === "none" ? "" : value);
  };

  // Handle supplier change - convert "none" back to empty string  
  const handleSupplierChange = (value: string) => {
    setSupplierId(value === "none" ? "" : value);
  };

  return (
    <div className="space-y-4">
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Nome do Produto *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            placeholder="Digite o nome do produto"
            readOnly={readOnly}
          />
        </div>
        <div>
          <Label htmlFor="internalCode">Código Interno *</Label>
          <Input
            id="internalCode"
            value={internalCode}
            onChange={(e) => setInternalCode(e.target.value)}
            required
            placeholder="Digite o código interno"
            readOnly={readOnly}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label htmlFor="barcode">Código de Barras</Label>
          <Input
            id="barcode"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            placeholder="Digite o código de barras"
            readOnly={readOnly}
          />
        </div>
        <div>
          <Label htmlFor="category">Categoria</Label>
          <Select value={categoryId || "none"} onValueChange={readOnly ? undefined : handleCategoryChange}>
            <SelectTrigger className={readOnly ? "pointer-events-none opacity-50" : ""}>
              <SelectValue placeholder="Selecione uma categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhuma categoria</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {userRole !== 'vendedor_externo' && (
        <div>
          <Label htmlFor="supplier">Fornecedor</Label>
          <Select value={supplierId || "none"} onValueChange={readOnly ? undefined : handleSupplierChange}>
            <SelectTrigger className={readOnly ? "pointer-events-none opacity-50" : ""}>
              <SelectValue placeholder="Selecione um fornecedor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Nenhum fornecedor</SelectItem>
              {suppliers.map((supplier) => (
                <SelectItem key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
};

export default ProductBasicInfoForm;
