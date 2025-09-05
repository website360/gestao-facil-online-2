import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Trash2, Plus, Eye } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import { registerStockMovement } from '@/services/stockMovementService';

interface SaleItem {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  products: { name: string; price: number } | null;
}

interface Sale {
  id: string;
  client_id: string;
  status: string;
  total_amount: number;
  notes: string;
  created_at: string;
  payment_method_id?: string;
  payment_type_id?: string;
  shipping_option_id?: string;
  shipping_cost?: number;
  installments?: number;
  tracking_code?: string;
  budget_id?: string;
  clients: { name: string } | null;
}

interface SalesEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  saleId: string | null;
  onSaleUpdated: () => void;
}

const SalesEditModal: React.FC<SalesEditModalProps> = ({ isOpen, onClose, saleId, onSaleUpdated }) => {
  const [saleData, setSaleData] = useState<Sale | null>(null);
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [paymentTypes, setPaymentTypes] = useState<any[]>([]);
  const [shippingOptions, setShippingOptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [originalSaleItems, setOriginalSaleItems] = useState<SaleItem[]>([]);

  // Form states
  const [selectedClientId, setSelectedClientId] = useState('');
  const [notes, setNotes] = useState('');
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [paymentTypeId, setPaymentTypeId] = useState('');
  const [shippingOptionId, setShippingOptionId] = useState('');
  const [shippingCost, setShippingCost] = useState(0);
  const [installments, setInstallments] = useState(1);
  const [trackingCode, setTrackingCode] = useState('');

  // Check if sale is finalized
  const isFinalized = saleData?.status === 'finalizado';

  useEffect(() => {
    if (isOpen && saleId) {
      fetchSaleDetails();
      fetchFormData();
    }
  }, [isOpen, saleId]);

  const fetchSaleDetails = async () => {
    if (!saleId) return;
    
    setLoading(true);
    try {
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select(`
          *,
          clients(name)
        `)
        .eq('id', saleId)
        .single();

      if (salesError) throw salesError;

      const { data: itemsData, error: itemsError } = await supabase
        .from('sale_items')
        .select(`
          *,
          products(name, price)
        `)
        .eq('sale_id', saleId);

      if (itemsError) throw itemsError;

      setSaleData({
        ...salesData,
        clients: salesData.clients ? { name: (salesData.clients as any).name } : null
      });

      const mappedItems = itemsData?.map(item => ({
        ...item,
        products: item.products ? { 
          name: (item.products as any).name,
          price: (item.products as any).price
        } : null
      })) || [];
      
      setSaleItems(mappedItems);
      setOriginalSaleItems(mappedItems);

      // Set form values
      setSelectedClientId(salesData.client_id);
      setNotes(salesData.notes || '');
      setPaymentMethodId(salesData.payment_method_id || '');
      setPaymentTypeId(salesData.payment_type_id || '');
      setShippingOptionId(salesData.shipping_option_id || '');
      setShippingCost(salesData.shipping_cost || 0);
      setInstallments(salesData.installments || 1);
      setTrackingCode(salesData.tracking_code || '');
    } catch (error) {
      console.error('Erro ao carregar detalhes da venda:', error);
      toast.error('Erro ao carregar detalhes da venda');
    } finally {
      setLoading(false);
    }
  };

  const fetchFormData = async () => {
    try {
      const [clientsResponse, productsResponse, methodsResponse, typesResponse, shippingResponse] = await Promise.all([
        supabase.from('clients').select('*').order('name'),
        supabase.from('products').select('id, name, price, stock, internal_code').order('name'),
        supabase.from('payment_methods').select('*').eq('active', true).order('name'),
        supabase.from('payment_types').select('*').eq('active', true).order('name'),
        supabase.from('shipping_options').select('*').eq('active', true).order('name')
      ]);

      if (clientsResponse.error) throw clientsResponse.error;
      if (productsResponse.error) throw productsResponse.error;
      if (methodsResponse.error) throw methodsResponse.error;
      if (typesResponse.error) throw typesResponse.error;
      if (shippingResponse.error) throw shippingResponse.error;

      setClients(clientsResponse.data || []);
      setProducts(productsResponse.data || []);
      setPaymentMethods(methodsResponse.data || []);
      setPaymentTypes(typesResponse.data || []);
      setShippingOptions(shippingResponse.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados do formulário:', error);
    }
  };

  const handleSave = async () => {
    if (isFinalized) {
      toast.error('Não é possível editar uma venda finalizada');
      return;
    }

    if (!selectedClientId || saleItems.length === 0) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setSaving(true);
    try {
      // Processar mudanças no estoque antes de salvar
      await processStockChanges();

      const totalAmount = saleItems.reduce((sum, item) => sum + item.total_price, 0);

      const { error: saleError } = await supabase
        .from('sales')
        .update({
          client_id: selectedClientId,
          total_amount: totalAmount,
          notes,
          payment_method_id: paymentMethodId || null,
          payment_type_id: paymentTypeId || null,
          shipping_option_id: shippingOptionId || null,
          shipping_cost: shippingCost || 0,
          installments: installments || 1,
          tracking_code: trackingCode || null
        })
        .eq('id', saleId);

      if (saleError) throw saleError;

      await supabase.from('sale_items').delete().eq('sale_id', saleId);

      const itemsToInsert = saleItems.map(item => ({
        sale_id: saleId,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      toast.success('Venda atualizada com sucesso!');
      onSaleUpdated();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar venda:', error);
      toast.error('Erro ao salvar venda');
    } finally {
      setSaving(false);
    }
  };

  const processStockChanges = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Processar mudanças no estoque
    for (const originalItem of originalSaleItems) {
      const currentItem = saleItems.find(item => item.product_id === originalItem.product_id);
      const product = products.find(p => p.id === originalItem.product_id);
      
      if (!product) continue;

      if (!currentItem) {
        // Item foi removido - devolver ao estoque
        const newStock = product.stock + originalItem.quantity;
        
        await supabase
          .from('products')
          .update({ stock: newStock })
          .eq('id', originalItem.product_id);

        await registerStockMovement({
          productId: originalItem.product_id,
          userId: user.id,
          movementType: 'entrada',
          quantity: originalItem.quantity,
          previousStock: product.stock,
          newStock,
          reason: 'ajuste_manual',
          referenceId: saleId,
          notes: 'Produto removido da venda durante edição'
        });
      } else if (currentItem.quantity !== originalItem.quantity) {
        // Quantidade mudou
        const quantityDiff = currentItem.quantity - originalItem.quantity;
        const newStock = product.stock - quantityDiff;
        
        if (newStock < 0) {
          throw new Error(`Estoque insuficiente para ${product.name}`);
        }

        await supabase
          .from('products')
          .update({ stock: newStock })
          .eq('id', originalItem.product_id);

        await registerStockMovement({
          productId: originalItem.product_id,
          userId: user.id,
          movementType: quantityDiff > 0 ? 'saida' : 'entrada',
          quantity: Math.abs(quantityDiff),
          previousStock: product.stock,
          newStock,
          reason: 'ajuste_manual',
          referenceId: saleId,
          notes: 'Quantidade alterada durante edição da venda'
        });
      }
    }

    // Processar novos itens
    for (const currentItem of saleItems) {
      const wasOriginal = originalSaleItems.find(item => item.product_id === currentItem.product_id);
      if (!wasOriginal && currentItem.product_id) {
        // Novo item adicionado
        const product = products.find(p => p.id === currentItem.product_id);
        if (!product) continue;

        const newStock = product.stock - currentItem.quantity;
        
        if (newStock < 0) {
          throw new Error(`Estoque insuficiente para ${product.name}`);
        }

        await supabase
          .from('products')
          .update({ stock: newStock })
          .eq('id', currentItem.product_id);

        await registerStockMovement({
          productId: currentItem.product_id,
          userId: user.id,
          movementType: 'saida',
          quantity: currentItem.quantity,
          previousStock: product.stock,
          newStock,
          reason: 'venda',
          referenceId: saleId,
          notes: 'Produto adicionado durante edição da venda'
        });
      }
    }
  };

  const addItem = async () => {
    if (isFinalized) return;
    
    const newItem: SaleItem = {
      id: Date.now().toString(),
      product_id: '',
      quantity: 1,
      unit_price: 0,
      total_price: 0,
      products: null
    };
    setSaleItems([...saleItems, newItem]);
  };

  const removeItem = async (index: number) => {
    if (isFinalized) return;
    setSaleItems(saleItems.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    if (isFinalized) return;
    
    const updatedItems = [...saleItems];
    const currentItem = updatedItems[index];

    if (field === 'quantity') {
      const selectedProduct = products.find(p => p.id === currentItem.product_id);
      if (selectedProduct) {
        // Calcular estoque disponível considerando a quantidade original do item
        const originalItem = originalSaleItems.find(item => item.product_id === currentItem.product_id);
        const originalQuantity = originalItem ? originalItem.quantity : 0;
        const availableStock = selectedProduct.stock + originalQuantity;
        
        if (value > availableStock) {
          toast.error(`Estoque insuficiente! Disponível: ${availableStock} unidades`);
          return;
        }
      }
    }

    updatedItems[index] = { ...updatedItems[index], [field]: value };

    if (field === 'product_id') {
      const selectedProduct = products.find(p => p.id === value);
      if (selectedProduct) {
        updatedItems[index].unit_price = selectedProduct.price;
        updatedItems[index].products = { name: selectedProduct.name, price: selectedProduct.price };
        
        // Verificar se a quantidade atual é válida para o novo produto
        const originalItem = originalSaleItems.find(item => item.product_id === value);
        const originalQuantity = originalItem ? originalItem.quantity : 0;
        const availableStock = selectedProduct.stock + originalQuantity;
        
        if (updatedItems[index].quantity > availableStock) {
          updatedItems[index].quantity = Math.max(1, availableStock);
          toast.warning(`Quantidade ajustada para o estoque disponível: ${availableStock}`);
        }
      }
    }

    if (field === 'quantity' || field === 'unit_price') {
      updatedItems[index].total_price = updatedItems[index].quantity * updatedItems[index].unit_price;
    }

    setSaleItems(updatedItems);
  };

  if (!saleData) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-xl font-semibold">
              {isFinalized ? 'Visualizar Venda' : 'Editar Venda'}
            </DialogTitle>
            <Button 
              onClick={onClose} 
              variant="ghost" 
              size="sm"
              className="h-6 w-6 p-0"
            >
              ×
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            {isFinalized 
              ? 'Esta venda foi finalizada e não pode ser editada.'
              : 'Faça as alterações necessárias na venda e clique em Salvar.'
            }
          </p>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
            <span className="ml-3 text-gray-600">Carregando...</span>
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
            {/* Informações Básicas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="client">Cliente *</Label>
                <Select 
                  value={selectedClientId} 
                  onValueChange={setSelectedClientId}
                  disabled={isFinalized}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={saleData.status} disabled>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={saleData.status}>{saleData.status}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Informações de Pagamento e Frete */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Informações de Pagamento e Frete</h3>
              <p className="text-sm text-gray-600 mb-4">Selecione as opções de pagamento e frete para esta venda.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <Label htmlFor="paymentMethod">Meio de Pagamento</Label>
                  <Select 
                    value={paymentMethodId} 
                    onValueChange={setPaymentMethodId}
                    disabled={isFinalized}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map((method) => (
                        <SelectItem key={method.id} value={method.id}>
                          {method.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="installments">Parcelas</Label>
                  <Input
                    type="number"
                    value={installments}
                    onChange={(e) => setInstallments(parseInt(e.target.value) || 1)}
                    min="1"
                    disabled={isFinalized}
                  />
                </div>

                <div>
                  <Label htmlFor="paymentType">Tipo de Pagamento</Label>
                  <Select 
                    value={paymentTypeId} 
                    onValueChange={setPaymentTypeId}
                    disabled={isFinalized}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentTypes.map((type) => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Prazos dos Cheques */}
              <div className="mb-4">
                <Label>Prazos dos Cheques (em dias)</Label>
                <div className="grid grid-cols-4 gap-4 mt-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">1° Cheque (dias)</label>
                    <Input
                      type="number"
                      defaultValue={10}
                      disabled={isFinalized}
                      className="text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">2° Cheque (dias)</label>
                    <Input
                      type="number"
                      defaultValue={20}
                      disabled={isFinalized}
                      className="text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">3° Cheque (dias)</label>
                    <Input
                      type="number"
                      defaultValue={30}
                      disabled={isFinalized}
                      className="text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">4° Cheque (dias)</label>
                    <Input
                      type="number"
                      defaultValue={40}
                      disabled={isFinalized}
                      className="text-center"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label htmlFor="shippingOption">Opção de Frete</Label>
                  <Select 
                    value={shippingOptionId} 
                    onValueChange={setShippingOptionId}
                    disabled={isFinalized}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {shippingOptions.map((option) => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="shippingCost">Custo do Frete (R$)</Label>
                  <Input
                    type="number"
                    value={shippingCost}
                    onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
                    step="0.01"
                    disabled={isFinalized}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="localDeliveryInfo">Informações de Entrega Local</Label>
                <Textarea
                  placeholder="Informações adicionais sobre a entrega..."
                  rows={3}
                  disabled={isFinalized}
                />
              </div>
            </div>

            {/* Campo de Rastreio - só aparece se a venda foi convertida de orçamento */}
            {saleData.budget_id && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4 text-blue-800">Rastreamento da Entrega</h3>
                <div>
                  <Label htmlFor="trackingCode">Código de Rastreio dos Correios</Label>
                  <Input
                    type="text"
                    value={trackingCode}
                    onChange={(e) => setTrackingCode(e.target.value)}
                    placeholder="Ex: BR123456789BR"
                    disabled={isFinalized}
                    className="uppercase"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Este código será usado para rastreamento na página dos Correios.
                  </p>
                </div>
              </div>
            )}

            {/* Itens da Venda */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Itens da Venda</h3>
                {!isFinalized && (
                  <Button type="button" onClick={addItem} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Item
                  </Button>
                )}
              </div>
              
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="text-center">#</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead className="text-center">Estoque</TableHead>
                      <TableHead className="text-center">Código</TableHead>
                      <TableHead className="text-center">Qtd</TableHead>
                      <TableHead className="text-center">Preço Unit.</TableHead>
                      <TableHead className="text-center">Desc. %</TableHead>
                      <TableHead className="text-center">Total</TableHead>
                      {!isFinalized && <TableHead className="text-center">Ações</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {saleItems.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell className="text-center font-medium">{index + 1}</TableCell>
                        <TableCell>
                          <Select
                            value={item.product_id}
                            onValueChange={(value) => updateItem(index, 'product_id', value)}
                            disabled={isFinalized}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione um produto" />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map((product) => (
                                <SelectItem key={product.id} value={product.id}>
                                  {product.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-center">
                          {(() => {
                            const selectedProduct = products.find(p => p.id === item.product_id);
                            if (!selectedProduct) return '-';
                            
                            // Calcular estoque disponível considerando a quantidade original
                            const originalItem = originalSaleItems.find(orig => orig.product_id === item.product_id);
                            const originalQuantity = originalItem ? originalItem.quantity : 0;
                            const availableStock = selectedProduct.stock + originalQuantity;
                            
                            return (
                              <span className={availableStock <= 5 ? 'text-red-600 font-semibold' : ''}>
                                {availableStock}
                              </span>
                            );
                          })()}
                        </TableCell>
                        <TableCell className="text-center">
                          {products.find(p => p.id === item.product_id)?.internal_code || '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                            min="1"
                            max={(() => {
                              const selectedProduct = products.find(p => p.id === item.product_id);
                              if (!selectedProduct) return undefined;
                              const originalItem = originalSaleItems.find(orig => orig.product_id === item.product_id);
                              const originalQuantity = originalItem ? originalItem.quantity : 0;
                              return selectedProduct.stock + originalQuantity;
                            })()}
                            disabled={isFinalized}
                            className={`w-20 text-center ${(() => {
                              const selectedProduct = products.find(p => p.id === item.product_id);
                              if (!selectedProduct) return '';
                              const originalItem = originalSaleItems.find(orig => orig.product_id === item.product_id);
                              const originalQuantity = originalItem ? originalItem.quantity : 0;
                              const availableStock = selectedProduct.stock + originalQuantity;
                              return item.quantity > availableStock ? 'border-red-500 bg-red-50' : '';
                            })()}`}
                          />
                        </TableCell>
                        <TableCell className="text-center">
                          <Input
                            type="number"
                            value={item.unit_price}
                            onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                            step="0.01"
                            disabled={isFinalized}
                            className="w-24"
                          />
                        </TableCell>
                        <TableCell className="text-center">0</TableCell>
                        <TableCell className="text-center font-semibold">
                          {formatCurrency(item.total_price)}
                        </TableCell>
                        {!isFinalized && (
                          <TableCell className="text-center">
                            <Button
                              type="button"
                              size="sm"
                              variant="destructive"
                              onClick={() => removeItem(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Resumo da Venda */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Resumo da Venda</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="discountPercentage">Desconto Geral (%)</Label>
                  <Input
                    type="number"
                    value={0}
                    step="0.01"
                    disabled={true}
                  />
                </div>
                <div>
                  <Label htmlFor="invoicePercentage">Nota Fiscal (%) - Apenas Informativo</Label>
                  <Input
                    type="number"
                    value={0}
                    step="0.01"
                    disabled={true}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observações sobre a venda..."
                  rows={4}
                  disabled={isFinalized}
                />
              </div>

              {/* Totais */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Subtotal:</span>
                  <span className="text-sm font-semibold">{formatCurrency(saleItems.reduce((sum, item) => sum + item.total_price, 0))}</span>
                </div>
                <div className="flex justify-between items-center text-red-600">
                  <span className="text-sm font-medium">Desconto (0%):</span>
                  <span className="text-sm font-semibold">R$ 0,00</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Total dos Produtos:</span>
                  <span className="text-sm font-semibold">{formatCurrency(saleItems.reduce((sum, item) => sum + item.total_price, 0))}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Frete:</span>
                  <span className="text-sm font-semibold">{formatCurrency(shippingCost)}</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between items-center">
                  <span className="text-lg font-bold">Total Final:</span>
                  <span className="text-lg font-bold text-blue-600">{formatCurrency(saleItems.reduce((sum, item) => sum + item.total_price, 0) + shippingCost)}</span>
                </div>
              </div>
            </div>

            {/* Botões de ação */}
            <div className="flex justify-end gap-4 pt-6">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              {!isFinalized && (
                <Button type="submit" disabled={saving}>
                  {saving ? 'Salvando...' : 'Atualizar Venda'}
                </Button>
              )}
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SalesEditModal;
