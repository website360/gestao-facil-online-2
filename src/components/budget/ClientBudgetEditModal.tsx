import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Send, Edit3, Eye, Plus, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { useBudgetCalculations } from '@/hooks/useBudgetCalculations';
import { useAuth } from '@/hooks/useAuth';
import type { LocalBudget } from '@/hooks/useBudgetManagement';

interface BudgetItem {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  discount_percentage?: number;
  products: { id: string; name: string; internal_code: string; price: number } | null;
}

interface Product {
  id: string;
  name: string;
  internal_code: string;
  price: number;
  stock: number;
}

interface PaymentMethod {
  id: string;
  name: string;
}

interface PaymentType {
  id: string;
  name: string;
}

interface ShippingOption {
  id: string;
  name: string;
  price: number;
}

interface ClientBudgetEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  budget: LocalBudget | null;
  onSuccess: () => void;
}

const ClientBudgetEditModal: React.FC<ClientBudgetEditModalProps> = ({ 
  isOpen, 
  onClose, 
  budget, 
  onSuccess 
}) => {
  const { clientData } = useAuth();
  const { calculateItemTotal, calculateSubtotal, calculateTotalWithDiscount } = useBudgetCalculations();
  
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([]);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  
  // Form data
  const [notes, setNotes] = useState('');
  const [paymentMethodId, setPaymentMethodId] = useState('');
  const [paymentTypeId, setPaymentTypeId] = useState('');
  const [shippingOptionId, setShippingOptionId] = useState('');
  const [shippingCost, setShippingCost] = useState(0);
  const [localDeliveryInfo, setLocalDeliveryInfo] = useState('');
  const [installments, setInstallments] = useState(1);

  // Verificar se o orçamento pode ser editado
  const canEdit = budget && (budget.status === 'aguardando_aprovacao');
  const isReadOnly = !canEdit || !isEditing;

  useEffect(() => {
    if (isOpen && budget) {
      // Resetar estado de edição quando abrir o modal
      setIsEditing(false);
      // Carregar dados atualizados
      fetchBudgetData();
      fetchMasterData();
    }
  }, [isOpen, budget?.id, budget?.updated_at]); // Incluir updated_at para detectar mudanças

  const fetchMasterData = async () => {
    try {
      const [productsRes, paymentMethodsRes, paymentTypesRes, shippingRes] = await Promise.all([
        supabase.from('products').select('*').order('name'),
        supabase.from('payment_methods').select('*').eq('active', true).order('name'),
        supabase.from('payment_types').select('*').eq('active', true).order('name'),
        supabase.from('shipping_options').select('*').eq('active', true).order('name')
      ]);

      if (productsRes.error) throw productsRes.error;
      if (paymentMethodsRes.error) throw paymentMethodsRes.error;
      if (paymentTypesRes.error) throw paymentTypesRes.error;
      if (shippingRes.error) throw shippingRes.error;

      setProducts(productsRes.data || []);
      setPaymentMethods(paymentMethodsRes.data || []);
      setPaymentTypes(paymentTypesRes.data || []);
      setShippingOptions(shippingRes.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      toast.error('Erro ao carregar dados do sistema');
    }
  };

  const fetchBudgetData = async () => {
    if (!budget) return;

    try {
      // Buscar dados atualizados com cache-busting
      const { data: items, error } = await supabase
        .from('budget_items')
        .select(`
          *,
          products(id, name, internal_code, price)
        `)
        .eq('budget_id', budget.id)
        .order('created_at', { ascending: true }); // Garantir ordem consistente

      if (error) throw error;

      console.log('Itens carregados do banco:', items);

      setBudgetItems(items?.map(item => ({
        ...item,
        products: item.products ? {
          id: (item.products as any).id,
          name: (item.products as any).name,
          internal_code: (item.products as any).internal_code,
          price: (item.products as any).price
        } : null
      })) || []);

      // Preencher dados do formulário
      setNotes(budget.notes || '');
      setPaymentMethodId(budget.payment_method_id || '');
      setPaymentTypeId(budget.payment_type_id || '');
      setShippingOptionId(budget.shipping_option_id || '');
      setShippingCost(budget.shipping_cost || 0);
      setLocalDeliveryInfo(budget.local_delivery_info || '');
      setInstallments(budget.installments || 1);
    } catch (error) {
      console.error('Erro ao carregar itens do orçamento:', error);
      toast.error('Erro ao carregar dados do orçamento');
    }
  };

  const handleAddItem = () => {
    if (!products.length) return;
    
    const newItem: BudgetItem = {
      id: `new-${Date.now()}`,
      product_id: '',
      quantity: 1,
      unit_price: 0,
      total_price: 0,
      discount_percentage: 0,
      products: null
    };
    
    setBudgetItems([...budgetItems, newItem]);
  };

  const handleRemoveItem = (index: number) => {
    setBudgetItems(budgetItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    // Verificar se o produto já existe quando for alteração de produto_id
    if (field === 'product_id' && value !== '') {
      const existingItemIndex = budgetItems.findIndex((item, i) => 
        i !== index && item.product_id === value
      );
      
      if (existingItemIndex !== -1) {
        toast.error('Este produto já foi adicionado ao orçamento!');
        return;
      }
    }
    
    const updatedItems = [...budgetItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };

    if (field === 'product_id') {
      const product = products.find(p => p.id === value);
      if (product) {
        updatedItems[index].unit_price = product.price;
        updatedItems[index].products = product;
        updatedItems[index].total_price = calculateItemTotal({
          quantity: updatedItems[index].quantity,
          unit_price: product.price,
          discount_percentage: updatedItems[index].discount_percentage || 0
        } as any);
      }
    } else if (field === 'quantity' || field === 'unit_price' || field === 'discount_percentage') {
      updatedItems[index].total_price = calculateItemTotal(updatedItems[index] as any);
    }

    setBudgetItems(updatedItems);
  };

  const handleSendForApproval = async () => {
    if (!budget) return;

    try {
      setLoading(true);

      const { error } = await supabase
        .from('budgets')
        .update({ 
          status: 'aguardando_aprovacao',
          updated_at: new Date().toISOString()
        })
        .eq('id', budget.id);

      if (error) throw error;

      toast.success('Orçamento enviado para aprovação!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao enviar para aprovação:', error);
      toast.error('Erro ao enviar orçamento para aprovação');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!budget) return;

    try {
      setLoading(true);

      console.log('=== INÍCIO DO SALVAMENTO ===');
      console.log('Orçamento ID:', budget.id);
      console.log('Itens atuais no estado:', budgetItems);

      // Validar se há itens válidos
      const validItems = budgetItems.filter(item => item.product_id && item.quantity > 0);
      
      console.log('Itens válidos para salvamento:', validItems);
      
      if (validItems.length === 0) {
        toast.error('Adicione pelo menos um item válido ao orçamento');
        return;
      }

      // Primeiro: REMOVER TODOS os itens existentes
      console.log('Removendo TODOS os itens existentes para orçamento:', budget.id);
      const { error: deleteError } = await supabase
        .from('budget_items')
        .delete()
        .eq('budget_id', budget.id);

      if (deleteError) {
        console.error('Erro ao remover itens existentes:', deleteError);
        throw deleteError;
      }
      console.log('✓ Itens existentes removidos com sucesso');

      // Segundo: INSERIR APENAS os novos itens válidos
      const itemsToInsert = validItems.map(item => ({
        budget_id: budget.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        discount_percentage: item.discount_percentage || 0
      }));

      console.log('Inserindo APENAS estes novos itens:', itemsToInsert);

      const { error: itemsError } = await supabase
        .from('budget_items')
        .insert(itemsToInsert);

      if (itemsError) {
        console.error('Erro ao inserir novos itens:', itemsError);
        throw itemsError;
      }
      console.log('✓ Novos itens inseridos com sucesso');

      // Terceiro: Calcular o total correto APENAS dos itens válidos
      const itemsForCalculation = validItems.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_percentage: item.discount_percentage || 0
      }));
      
      const subtotalCalculated = calculateSubtotal(itemsForCalculation as any);
      const totalCalculated = calculateTotalWithDiscount(itemsForCalculation as any);
      const finalTotal = totalCalculated + shippingCost;

      console.log('Cálculos do total:');
      console.log('- Subtotal calculado:', subtotalCalculated);
      console.log('- Total com desconto:', totalCalculated);
      console.log('- Custo do frete:', shippingCost);
      console.log('- Total final:', finalTotal);

      // Quarto: Atualizar o orçamento com o total correto
      console.log('Atualizando orçamento com total final:', finalTotal);
      const { error: budgetError } = await supabase
        .from('budgets')
        .update({
          notes,
          payment_method_id: paymentMethodId || null,
          payment_type_id: paymentTypeId || null,
          shipping_option_id: shippingOptionId || null,
          shipping_cost: shippingCost,
          local_delivery_info: localDeliveryInfo || null,
          installments,
          total_amount: finalTotal,
          updated_at: new Date().toISOString()
        })
        .eq('id', budget.id);

      if (budgetError) {
        console.error('Erro ao atualizar orçamento:', budgetError);
        throw budgetError;
      }
      console.log('✓ Orçamento atualizado com sucesso');

      toast.success('Orçamento atualizado com sucesso!');
      setIsEditing(false);
      
      // Recarregar os dados atualizados do orçamento
      console.log('Recarregando dados do orçamento...');
      await fetchBudgetData();
      console.log('=== FIM DO SALVAMENTO ===');
      
      onSuccess();
    } catch (error) {
      console.error('=== ERRO NO SALVAMENTO ===', error);
      toast.error('Erro ao salvar orçamento');
    } finally {
      setLoading(false);
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'aguardando': return 'Aguardando';
      case 'enviado': return 'Enviado para Aprovação';
      case 'aguardando_aprovacao': return 'Aguardando Aprovação';
      case 'aprovado': return 'Aprovado';
      case 'convertido': return 'Convertido em Venda';
      case 'negado': return 'Negado';
      default: return status;
    }
  };

  if (!budget) return null;

  // Converter para formato compatível com os cálculos
  const itemsForCalculation = budgetItems.map(item => ({
    product_id: item.product_id,
    quantity: item.quantity,
    unit_price: item.unit_price,
    discount_percentage: item.discount_percentage || 0
  }));
  
  const subtotal = calculateSubtotal(itemsForCalculation as any);
  const total = calculateTotalWithDiscount(itemsForCalculation as any);
  const totalWithShipping = total + shippingCost;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto bg-white">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle className="text-xl font-semibold">
              {isEditing ? 'Editar Orçamento' : 'Visualizar Orçamento'}
            </DialogTitle>
            <div className="flex items-center gap-2">
              {canEdit && (
                <>
                  {!isEditing ? (
                    <Button
                      onClick={() => setIsEditing(true)}
                      variant="outline"
                      size="sm"
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      Editar
                    </Button>
                  ) : (
                    <>
                      <Button
                        onClick={() => setIsEditing(false)}
                        variant="outline"
                        size="sm"
                      >
                        Cancelar
                      </Button>
                      <Button
                        onClick={handleSave}
                        disabled={loading}
                        size="sm"
                      >
                        Salvar
                      </Button>
                    </>
                  )}
                  
                  {budget.status === 'aguardando_aprovacao' && !isEditing && (
                    <Button
                      onClick={handleSendForApproval}
                      disabled={loading}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Send className="h-4 w-4 mr-2" />
                      Enviar para Aprovação
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações básicas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Cliente</Label>
              <Input value={clientData?.name || ''} disabled />
            </div>
            <div>
              <Label>Status</Label>
              <Input value={getStatusText(budget.status)} disabled />
            </div>
          </div>

          {/* Informações de Pagamento e Frete */}
          <Card>
            <CardHeader>
              <CardTitle>Informações de Pagamento e Frete</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="payment_method">Meio de Pagamento</Label>
                  <Select 
                    value={paymentMethodId} 
                    onValueChange={setPaymentMethodId}
                    disabled={isReadOnly}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentMethods.map(method => (
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
                    min="1"
                    value={installments}
                    onChange={(e) => setInstallments(parseInt(e.target.value) || 1)}
                    disabled={isReadOnly}
                  />
                </div>
                
                <div>
                  <Label htmlFor="payment_type">Tipo de Pagamento</Label>
                  <Select 
                    value={paymentTypeId} 
                    onValueChange={setPaymentTypeId}
                    disabled={isReadOnly}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentTypes.map(type => (
                        <SelectItem key={type.id} value={type.id}>
                          {type.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="shipping_option">Opção de Frete</Label>
                  <Select 
                    value={shippingOptionId} 
                    onValueChange={setShippingOptionId}
                    disabled={isReadOnly}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione..." />
                    </SelectTrigger>
                    <SelectContent>
                      {shippingOptions.map(option => (
                        <SelectItem key={option.id} value={option.id}>
                          {option.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="shipping_cost">Custo do Frete (R$)</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={shippingCost}
                    onChange={(e) => setShippingCost(parseFloat(e.target.value) || 0)}
                    disabled={isReadOnly}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="local_delivery_info">Informações de Entrega Local</Label>
                <Textarea
                  value={localDeliveryInfo}
                  onChange={(e) => setLocalDeliveryInfo(e.target.value)}
                  placeholder="Informações adicionais sobre a entrega..."
                  disabled={isReadOnly}
                />
              </div>
            </CardContent>
          </Card>

          {/* Itens do Orçamento */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Itens do Orçamento</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="text-center w-12">#</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead className="text-center">Código</TableHead>
                      <TableHead className="text-center">Qtd</TableHead>
                      <TableHead className="text-center">Preço Unit.</TableHead>
                      <TableHead className="text-center">Total</TableHead>
                      {isEditing && <TableHead className="text-center">Ações</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {budgetItems.map((item, index) => (
                      <TableRow key={item.id}>
                        <TableCell className="text-center font-mono">
                          {String(index + 1).padStart(3, '0')}
                        </TableCell>
                        <TableCell>
                          {isEditing ? (
                            <Select
                              value={item.product_id}
                              onValueChange={(value) => handleItemChange(index, 'product_id', value)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um produto..." />
                              </SelectTrigger>
                              <SelectContent>
                                {products.map(product => (
                                  <SelectItem key={product.id} value={product.id}>
                                    {product.name} - {product.internal_code}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            <span className="font-medium">
                              {item.products?.name || 'Produto não encontrado'}
                            </span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {item.products?.internal_code || 'N/A'}
                        </TableCell>
                        <TableCell className="text-center">
                          {isEditing ? (
                            <Input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                              className="w-20"
                            />
                          ) : (
                            item.quantity
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {isEditing ? (
                            <Input
                              type="text"
                              inputMode="decimal"
                              min="0"
                              value={Number.isFinite(item.unit_price) ? String(item.unit_price).replace('.', ',') : ''}
                              onChange={(e) => {
                                const input = e.target.value;
                                
                                // Parse formato brasileiro
                                let cleanValue = input.replace(/[^\d,]/g, '');
                                
                                if (cleanValue.includes(',')) {
                                  const parts = cleanValue.split(',');
                                  if (parts.length === 2) {
                                    const integerPart = parts[0];
                                    const decimalPart = parts[1].slice(0, 2);
                                    const parsed = parseFloat(`${integerPart}.${decimalPart}`);
                                    handleItemChange(index, 'unit_price', isNaN(parsed) ? 0 : parsed);
                                  } else {
                                    const parsed = parseFloat(parts[0]) || 0;
                                    handleItemChange(index, 'unit_price', parsed);
                                  }
                                } else {
                                  const parsed = parseFloat(cleanValue) || 0;
                                  handleItemChange(index, 'unit_price', parsed);
                                }
                              }}
                              className="w-24"
                              placeholder="0,00"
                            />
                          ) : (
                            formatCurrency(item.unit_price)
                          )}
                        </TableCell>
                        <TableCell className="text-center font-semibold">
                          {formatCurrency(item.total_price)}
                        </TableCell>
                        {isEditing && (
                          <TableCell className="text-center">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveItem(index)}
                              className="h-8 w-8"
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
              
              {isEditing && (
                <div className="flex justify-end pt-2">
                  <Button onClick={handleAddItem} variant="outline" size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Item
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Resumo */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo do Orçamento</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label htmlFor="notes">Observações</Label>
                <Textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Observações sobre o orçamento..."
                  disabled={isReadOnly}
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-lg mt-4 space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total dos Produtos:</span>
                  <span>{formatCurrency(total)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Frete:</span>
                  <span>{formatCurrency(shippingCost)}</span>
                </div>
                <hr className="my-2" />
                <div className="flex justify-between font-bold text-lg">
                  <span>Total Final:</span>
                  <span>{formatCurrency(totalWithShipping)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClientBudgetEditModal;