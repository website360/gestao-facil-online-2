
import React, { useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Info, DollarSign, Ruler, Palette, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useProductForm } from '@/hooks/useProductForm';
import ProductBasicInfoForm from './product/ProductBasicInfoForm';
import ProductPriceStockForm from './product/ProductPriceStockForm';
import ProductWeightForm from './product/ProductWeightForm';
import ProductCharacteristicsForm from './product/ProductCharacteristicsForm';
import ProductMeasurementsForm from './product/ProductMeasurementsForm';
import ProductPhotoUpload from './product/ProductPhotoUpload';
import ProductObservationsForm from './product/ProductObservationsForm';

interface Product {
  id: string;
  name: string;
  internal_code: string;
  price: number;
  stock: number;
  stock_unit?: string;
  category_id?: string;
  barcode?: string;
  photo_url?: string;
  size?: string;
  composition?: string;
  color?: string;
  box?: string;
  observation?: string;
  width?: number;
  length?: number;
  height?: number;
  supplier_id?: string;
  categories?: { name: string };
  created_at: string;
}

interface ProductFormDialogProps {
  showForm: boolean;
  editingProduct: Product | null;
  onClose: () => void;
  onSuccess: () => void;
  readOnly?: boolean;
  userRole?: string;
}

const ProductFormDialog = ({ showForm, editingProduct, onClose, onSuccess, readOnly = false, userRole }: ProductFormDialogProps) => {
  const {
    name, setName,
    internalCode, setInternalCode,
    barcode, setBarcode,
    price, setPrice,
    stock, setStock,
    stockUnit, setStockUnit,
    weight, setWeight,
    weightUnit, setWeightUnit,
    categoryId, setCategoryId,
    supplierId, setSupplierId,
    photoUrl, setPhotoUrl,
    size, setSize,
    composition, setComposition,
    color, setColor,
    box, setBox,
    width, setWidth,
    length, setLength,
    height, setHeight,
    observation, setObservation,
    categories,
    suppliers,
    loading,
    fetchCategories,
    fetchSuppliers,
    handleSubmit,
    resetForm
  } = useProductForm(editingProduct, onSuccess);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={showForm} onOpenChange={handleClose}>
      <DialogContent className="max-w-[95vw] md:max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg md:text-xl font-semibold">
            {readOnly ? 'Visualizar Produto' : editingProduct ? 'Editar Produto' : 'Novo Produto'}
          </DialogTitle>
          <DialogDescription className="text-sm md:text-base">
            {readOnly ? 'Informações detalhadas do produto.' : editingProduct ? 'Edite as informações do produto abaixo.' : 'Preencha as informações para criar um novo produto.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Foto */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Camera className="h-5 w-5 text-primary" />
                Foto
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ProductPhotoUpload
                photoUrl={photoUrl}
                setPhotoUrl={setPhotoUrl}
                readOnly={readOnly}
              />
            </CardContent>
          </Card>

          {/* Informações Básicas */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Info className="h-5 w-5 text-primary" />
                Informações Básicas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ProductBasicInfoForm
                name={name}
                setName={setName}
                internalCode={internalCode}
                setInternalCode={setInternalCode}
                barcode={barcode}
                setBarcode={setBarcode}
                categoryId={categoryId}
                setCategoryId={setCategoryId}
                supplierId={supplierId}
                setSupplierId={setSupplierId}
                categories={categories}
                suppliers={suppliers}
                readOnly={readOnly}
                userRole={userRole}
              />
            </CardContent>
          </Card>

          {/* Preço e Estoque */}
          {userRole !== 'vendas' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Preço e Estoque
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ProductPriceStockForm
                  price={price}
                  setPrice={setPrice}
                  stock={stock}
                  setStock={setStock}
                  stockUnit={stockUnit}
                  setStockUnit={setStockUnit}
                  readOnly={readOnly}
                />
              </CardContent>
            </Card>
          )}

          {/* Apenas Preço para Vendedores */}
          {userRole === 'vendedor_externo' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <DollarSign className="h-5 w-5 text-primary" />
                  Preço
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="price">Preço *</Label>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      required
                      disabled={readOnly}
                      placeholder="0,00"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Medidas e Peso */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Ruler className="h-5 w-5 text-primary" />
                Medidas e Peso
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-muted-foreground">Obrigatório para cálculo de frete</span>
                  <span className="text-sm text-muted-foreground">Necessário para integração com Correios</span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="weight">Peso *</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.001"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder="0,000"
                      required
                      readOnly={readOnly}
                    />
                  </div>
                  <div>
                    <Label htmlFor="width">Largura</Label>
                    <Input
                      id="width"
                      type="number"
                      step="0.01"
                      value={width}
                      onChange={(e) => setWidth(e.target.value)}
                      placeholder="0,00"
                      readOnly={readOnly}
                    />
                  </div>
                  <div>
                    <Label htmlFor="length">Comprimento</Label>
                    <Input
                      id="length"
                      type="number"
                      step="0.01"
                      value={length}
                      onChange={(e) => setLength(e.target.value)}
                      placeholder="0,00"
                      readOnly={readOnly}
                    />
                  </div>
                   <div>
                     <Label htmlFor="height">Altura</Label>
                     <Input
                       id="height"
                       type="number"
                       step="0.01"
                       value={height}
                       onChange={(e) => setHeight(e.target.value)}
                       placeholder="0,00"
                       readOnly={readOnly}
                     />
                   </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Características */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Palette className="h-5 w-5 text-primary" />
                Características
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ProductCharacteristicsForm
                size={size}
                setSize={setSize}
                color={color}
                setColor={setColor}
                composition={composition}
                setComposition={setComposition}
                box={box}
                setBox={setBox}
                readOnly={readOnly}
              />
            </CardContent>
          </Card>

          {/* Observações */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-primary" />
                Observações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ProductObservationsForm
                observation={observation}
                setObservation={setObservation}
                readOnly={readOnly}
              />
            </CardContent>
          </Card>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:justify-end pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleClose} className="order-2 sm:order-1">
              {readOnly ? 'Fechar' : 'Cancelar'}
            </Button>
            {!readOnly && (
              <Button type="submit" disabled={loading} className="order-1 sm:order-2">
                {loading ? 'Salvando...' : 'Salvar Produto'}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ProductFormDialog;
