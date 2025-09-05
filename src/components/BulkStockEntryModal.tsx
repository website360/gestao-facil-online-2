import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Package, Plus, Search, TrendingUp, X } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  internal_code: string;
  stock: number;
  stock_unit: string;
}

interface StockEntry {
  productId: string;
  quantity: number;
}

interface BulkStockEntryModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const BulkStockEntryModal = ({ open, onClose, onSuccess }: BulkStockEntryModalProps) => {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [stockEntries, setStockEntries] = useState<Record<string, number>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    if (open) {
      fetchProducts();
    }
  }, [open]);

  useEffect(() => {
    filterProducts();
  }, [searchTerm, products]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, internal_code, stock, stock_unit')
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      console.error('Error fetching products:', error);
      toast.error('Erro ao carregar produtos');
    }
  };

  const filterProducts = () => {
    if (!searchTerm) {
      setFilteredProducts(products);
      return;
    }

    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.internal_code.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredProducts(filtered);
  };

  const addProductToList = (product: Product) => {
    if (!selectedProducts.find(p => p.id === product.id)) {
      setSelectedProducts([...selectedProducts, product]);
      setStockEntries({ ...stockEntries, [product.id]: 0 });
    }
  };

  const removeProductFromList = (productId: string) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
    const newEntries = { ...stockEntries };
    delete newEntries[productId];
    setStockEntries(newEntries);
  };

  const updateQuantity = (productId: string, quantity: number) => {
    // Garantir que seja um número inteiro
    const integerQuantity = Math.round(quantity);
    setStockEntries({ ...stockEntries, [productId]: integerQuantity });
  };

  const getValidEntries = () => {
    return selectedProducts.filter(product => 
      stockEntries[product.id] !== undefined && stockEntries[product.id] !== 0
    ).map(product => ({
      product,
      quantity: stockEntries[product.id],
      newStock: product.stock + stockEntries[product.id]
    }));
  };

  const handleProcessEntries = () => {
    const validEntries = getValidEntries();
    if (validEntries.length === 0) {
      toast.error('Adicione pelo menos um produto com quantidade válida');
      return;
    }
    setShowConfirmation(true);
  };

  const confirmStockEntries = async () => {
    const validEntries = getValidEntries();
    setLoading(true);

    try {
      // Atualizar todos os produtos e registrar movimentações em paralelo
      const updates = validEntries.map(async (entry) => {
        // Atualizar estoque
        const { error: updateError } = await supabase
          .from('products')
          .update({ stock: entry.newStock })
          .eq('id', entry.product.id);

        if (updateError) throw updateError;

        // Registrar movimentação
        const movementType = entry.quantity > 0 ? 'entrada' : 'saida';
        const reason = entry.quantity > 0 ? 'entrada_massa' : 'ajuste_manual';
        const notes = entry.quantity > 0 ? 
          `Entrada em massa via sistema` : 
          `Saída em massa via sistema`;

        const { error: movementError } = await supabase.rpc('register_stock_movement', {
          p_product_id: entry.product.id,
          p_user_id: user?.id,
          p_movement_type: movementType,
          p_quantity: Math.abs(entry.quantity),
          p_previous_stock: entry.product.stock,
          p_new_stock: entry.newStock,
          p_reason: reason,
          p_notes: notes
        });

        if (movementError) throw movementError;
      });

      await Promise.all(updates);

      toast.success(`Estoque atualizado com sucesso para ${validEntries.length} produto(s)!`);
      
      // Resetar formulário
      setSelectedProducts([]);
      setStockEntries({});
      setSearchTerm('');
      setShowConfirmation(false);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error updating stock:', error);
      toast.error('Erro ao atualizar estoque');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setSelectedProducts([]);
      setStockEntries({});
      setSearchTerm('');
      setShowConfirmation(false);
      onClose();
    }
  };

  const validEntries = getValidEntries();

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Movimentação de Estoque em Massa
          </DialogTitle>
          <DialogDescription>
            Adicione ou remova estoque de múltiplos produtos de uma vez. Use números positivos para entrada e negativos para saída.
          </DialogDescription>
        </DialogHeader>

        {!showConfirmation ? (
          <div className="flex flex-col h-full space-y-4">
            {/* Busca de produtos */}
            <div className="space-y-2">
              <Label htmlFor="search">Buscar Produtos</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  id="search"
                  placeholder="Digite o nome ou código do produto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 flex-1 min-h-0">
              {/* Lista de produtos disponíveis */}
              <div className="space-y-2">
                <Label>Produtos Disponíveis</Label>
                <div className="border rounded-lg h-64 overflow-y-auto p-2">
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-2 hover:bg-muted rounded cursor-pointer"
                      onClick={() => addProductToList(product)}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {product.internal_code} | {product.stock} {product.stock_unit}
                        </p>
                      </div>
                      <Plus className="h-4 w-4 text-muted-foreground ml-2" />
                    </div>
                  ))}
                  {filteredProducts.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      Nenhum produto encontrado
                    </div>
                  )}
                </div>
              </div>

              {/* Lista de produtos selecionados */}
              <div className="space-y-2">
                <Label>Produtos Selecionados ({selectedProducts.length})</Label>
                <div className="border rounded-lg h-64 overflow-y-auto p-2 space-y-2">
                  {selectedProducts.map((product) => (
                    <Card key={product.id} className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            Código: {product.internal_code}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Estoque atual: {product.stock} {product.stock_unit}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeProductFromList(product.id)}
                          className="ml-2"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                       <div className="space-y-1">
                         <Label className="text-xs">Quantidade (+ para entrada, - para saída):</Label>
                         <Input
                           type="number"
                           placeholder="0"
                           step="1"
                           value={stockEntries[product.id] || ''}
                           onChange={(e) => updateQuantity(product.id, parseInt(e.target.value) || 0)}
                           className="h-8"
                         />
                         {stockEntries[product.id] !== 0 && stockEntries[product.id] !== undefined && (
                           <p className={`text-xs ${stockEntries[product.id] > 0 ? 'text-green-600' : 'text-red-600'}`}>
                             Novo estoque: {product.stock + stockEntries[product.id]} {product.stock_unit}
                           </p>
                         )}
                      </div>
                    </Card>
                  ))}
                  {selectedProducts.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      Nenhum produto selecionado
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Resumo e ações */}
            {validEntries.length > 0 && (
              <Card className="p-4 bg-muted/50">
                <div className="flex items-center justify-between">
                  <div>
                     <p className="font-medium">Resumo da operação:</p>
                     <p className="text-sm text-muted-foreground">
                       {validEntries.length} produto(s) com movimentação de estoque
                     </p>
                  </div>
                  <Badge variant="secondary" className="bg-green-100 text-green-700">
                    {validEntries.length} item(s)
                  </Badge>
                </div>
              </Card>
            )}

            <div className="flex gap-2 justify-end pt-4 border-t">
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button 
                onClick={handleProcessEntries}
                disabled={validEntries.length === 0}
                 className="bg-green-600 hover:bg-green-700"
               >
                 <TrendingUp className="mr-2 h-4 w-4" />
                 Processar Movimentações ({validEntries.length})
               </Button>
            </div>
          </div>
        ) : (
          /* Modal de confirmação */
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-3">Confirmar Movimentação de Estoque</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {validEntries.map((entry) => (
                  <div key={entry.product.id} className="flex justify-between items-center text-sm p-2 bg-background rounded">
                    <div className="flex-1">
                      <p className="font-medium">{entry.product.name}</p>
                      <p className="text-muted-foreground text-xs">{entry.product.internal_code}</p>
                    </div>
                     <div className="text-right">
                       <p>
                         {entry.product.stock} {entry.quantity >= 0 ? '+' : ''} {entry.quantity} = 
                         <span className={`font-medium ml-1 ${entry.quantity >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                           {entry.newStock} {entry.product.stock_unit}
                         </span>
                       </p>
                     </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                onClick={() => setShowConfirmation(false)}
                disabled={loading}
              >
                Voltar
              </Button>
              <Button 
                onClick={confirmStockEntries}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                    Processando...
                  </div>
                 ) : (
                   <div className="flex items-center">
                     <Plus className="mr-2 h-4 w-4" />
                     Confirmar Todas as Movimentações
                   </div>
                 )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BulkStockEntryModal;