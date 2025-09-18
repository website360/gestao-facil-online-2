import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Eye, ShoppingCart, Package, FileText, Trash2 } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface BudgetItem {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  discount_percentage?: number;
  products: { name: string; internal_code: string } | null;
}

interface Budget {
  id: string;
  client_id: string;
  status: string;
  total_amount: number;
  notes: string;
  created_at: string;
  created_by: string;
  payment_method_id?: string;
  payment_type_id?: string;
  shipping_option_id?: string;
  shipping_cost?: number;
  installments?: number;
  check_installments?: number;
  check_due_dates?: number[];
  boleto_installments?: number;
  boleto_due_dates?: number[];
  discount_percentage?: number;
  invoice_percentage?: number;
  local_delivery_info?: string;
  clients: { name: string } | null;
  created_by_profile: { name: string } | null;
}

interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  cep?: string;
  cnpj?: string;
  cpf?: string;
  razao_social?: string;
  inscricao_estadual?: string;
  client_type?: string;
  birth_date?: string;
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
}

import { formatBudgetId } from '@/lib/budgetFormatter';

interface BudgetDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  budgetId: string | null;
}

const BudgetDetailModal: React.FC<BudgetDetailModalProps> = ({ isOpen, onClose, budgetId }) => {
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [budgetData, setBudgetData] = useState<Budget | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([]);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    if (isOpen && budgetId) {
      fetchBudgetDetails();
      getUserRole();
      fetchPaymentData();
    }
  }, [isOpen, budgetId]);

  const getUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setUserRole(data.role);
    } catch (error) {
      console.error('Erro ao buscar role do usuário:', error);
    }
  };

  const fetchPaymentData = async () => {
    try {
      const [methodsResponse, typesResponse, shippingResponse] = await Promise.all([
        supabase.from('payment_methods').select('*').eq('active', true).order('name'),
        supabase.from('payment_types').select('*').eq('active', true).order('name'),
        supabase.from('shipping_options').select('*').eq('active', true).order('name')
      ]);

      if (methodsResponse.error) throw methodsResponse.error;
      if (typesResponse.error) throw typesResponse.error;
      if (shippingResponse.error) throw shippingResponse.error;

      setPaymentMethods(methodsResponse.data || []);
      setPaymentTypes(typesResponse.data || []);
      setShippingOptions(shippingResponse.data || []);
    } catch (error) {
      console.error('Erro ao carregar dados de pagamento:', error);
    }
  };

  const fetchBudgetDetails = async () => {
    if (!budgetId) return;
    
    setLoading(true);
    try {
      // Fetch budget data
      const { data: budgetsData, error: budgetsError } = await supabase
        .from('budgets')
        .select(`
          *,
          clients(name)
        `)
        .eq('id', budgetId)
        .single();

      if (budgetsError) throw budgetsError;

      // Fetch creator profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', budgetsData.created_by)
        .single();

      if (profileError) {
        console.error('Erro ao buscar profile:', profileError);
      }

      // Fetch budget items
      const { data: itemsData, error: itemsError } = await supabase
        .from('budget_items')
        .select(`
          *,
          products(name, internal_code)
        `)
        .eq('budget_id', budgetId);

      if (itemsError) throw itemsError;

      // Fetch client details
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', budgetsData.client_id)
        .single();

      if (clientError) throw clientError;

      setBudgetData({
        ...budgetsData,
        clients: budgetsData.clients ? { name: (budgetsData.clients as any).name } : null,
        created_by_profile: profileData || null
      });

      setBudgetItems(itemsData?.map(item => ({
        ...item,
        products: item.products ? { 
          name: (item.products as any).name,
          internal_code: (item.products as any).internal_code
        } : null
      })) || []);

      setClient(clientData);
    } catch (error) {
      console.error('Erro ao carregar detalhes do orçamento:', error);
      toast.error('Erro ao carregar detalhes do orçamento');
    } finally {
      setLoading(false);
    }
  };

  // Remover função local - agora usa a centralizada


  const getPaymentMethodName = (id?: string) => {
    if (!id) return 'Não informado';
    const method = paymentMethods.find(m => m.id === id);
    return method?.name || 'Não informado';
  };

  const getPaymentTypeName = (id?: string) => {
    if (!id) return 'Não informado';
    const type = paymentTypes.find(t => t.id === id);
    return type?.name || 'Não informado';
  };

  const getShippingOptionName = (id?: string) => {
    if (!id) return 'Não informado';
    const option = shippingOptions.find(o => o.id === id);
    return option?.name || 'Não informado';
  };

  if (!budgetData) return null;

  return (
    <TooltipProvider>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[95vw] sm:max-w-6xl max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <div className="flex justify-between items-center">
              <DialogTitle className="text-lg sm:text-xl font-semibold">
                Visualizar Orçamento
              </DialogTitle>
              <div className="flex items-center gap-2">
                <Button 
                  onClick={onClose} 
                  variant="ghost" 
                  size="sm"
                  className="h-6 w-6 p-0"
                >
                  ×
                </Button>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              Visualize os detalhes do orçamento.
            </p>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
              <span className="ml-3 text-gray-600">Carregando...</span>
            </div>
          ) : (
            <div id="budget-print-content" className="space-y-6">
              {/* Informações básicas */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cliente *</label>
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded">
                    {client?.name || budgetData.clients?.name}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded capitalize">
                    {budgetData.status}
                  </div>
                </div>
              </div>

              {/* Dados Completos do Cliente */}
              {client && (
                <Card style={{ backgroundColor: '#F9FAFB' }} className="border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Dados Completos do Cliente</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                        <div className="p-2 bg-white border border-gray-200 rounded text-sm font-semibold">
                          {client.name}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <div className="p-2 bg-white border border-gray-200 rounded text-sm">
                          {client.email || 'Não informado'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Telefone</label>
                        <div className="p-2 bg-white border border-gray-200 rounded text-sm">
                          {client.phone || 'Não informado'}
                        </div>
                      </div>
                      
                      {/* CPF - apenas para Pessoa Física */}
                      {client.client_type !== 'pj' && client.client_type !== 'juridica' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">CPF</label>
                          <div className="p-2 bg-white border border-gray-200 rounded text-sm">
                            {client.cpf || 'Não informado'}
                          </div>
                        </div>
                      )}

                      {/* Data de Nascimento - apenas para Pessoa Física */}
                      {client.client_type !== 'pj' && client.client_type !== 'juridica' && client.birth_date && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Data de Nascimento</label>
                          <div className="p-2 bg-white border border-gray-200 rounded text-sm">
                            {new Date(client.birth_date).toLocaleDateString('pt-BR')}
                          </div>
                        </div>
                      )}

                      {/* CNPJ - apenas para Pessoa Jurídica */}
                      {(client.client_type === 'pj' || client.client_type === 'juridica') && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
                          <div className="p-2 bg-white border border-gray-200 rounded text-sm">
                            {client.cnpj || 'Não informado'}
                          </div>
                        </div>
                      )}

                      {/* Razão Social - apenas para Pessoa Jurídica */}
                      {(client.client_type === 'pj' || client.client_type === 'juridica') && client.razao_social && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Razão Social</label>
                          <div className="p-2 bg-white border border-gray-200 rounded text-sm">
                            {client.razao_social}
                          </div>
                        </div>
                      )}

                      {/* Inscrição Estadual - apenas para Pessoa Jurídica */}
                      {(client.client_type === 'pj' || client.client_type === 'juridica') && client.inscricao_estadual && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Inscrição Estadual</label>
                          <div className="p-2 bg-white border border-gray-200 rounded text-sm">
                            {client.inscricao_estadual}
                          </div>
                        </div>
                      )}

                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Endereço Completo</label>
                        <div className="p-2 bg-white border border-gray-200 rounded text-sm">
                          {`${client.street || ''} ${client.number || ''} ${client.complement || ''}, ${client.neighborhood || ''}, ${client.city || ''} - ${client.state || ''}, CEP: ${client.cep || ''}`}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Informações de Pagamento e Frete */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Informações de Pagamento e Frete</h3>
                <p className="text-sm text-gray-600 mb-4">Opções de pagamento e frete para este orçamento.</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Meio de Pagamento</label>
                    <div className="p-3 bg-white border border-gray-200 rounded">
                      {getPaymentMethodName(budgetData.payment_method_id)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Parcelas</label>
                    <div className="p-3 bg-white border border-gray-200 rounded">
                      {budgetData.installments || 1}x
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Pagamento</label>
                    <div className="p-3 bg-white border border-gray-200 rounded">
                      {getPaymentTypeName(budgetData.payment_type_id)}
                    </div>
                  </div>
                </div>

                {/* Prazos dos Cheques */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Prazos dos Cheques (em dias)</label>
                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">1° Cheque (dias)</label>
                      <div className="p-2 bg-white border border-gray-200 rounded text-center">
                        {budgetData.check_due_dates?.[0] || 10}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">2° Cheque (dias)</label>
                      <div className="p-2 bg-white border border-gray-200 rounded text-center">
                        {budgetData.check_due_dates?.[1] || 20}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">3° Cheque (dias)</label>
                      <div className="p-2 bg-white border border-gray-200 rounded text-center">
                        {budgetData.check_due_dates?.[2] || 30}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">4° Cheque (dias)</label>
                      <div className="p-2 bg-white border border-gray-200 rounded text-center">
                        {budgetData.check_due_dates?.[3] || 40}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Opção de Frete</label>
                    <div className="p-3 bg-white border border-gray-200 rounded">
                      {getShippingOptionName(budgetData.shipping_option_id)}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Custo do Frete (R$)</label>
                    <div className="p-3 bg-white border border-gray-200 rounded">
                      {formatCurrency(budgetData.shipping_cost || 0)}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Informações de Entrega Local</label>
                  <div className="p-3 bg-white border border-gray-200 rounded min-h-[60px]">
                    {budgetData.local_delivery_info || 'Informações adicionais sobre a entrega.'}
                  </div>
                </div>
              </div>

              {/* Itens do Orçamento */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Itens do Orçamento</h3>
                </div>
                
                {/* Desktop Table */}
                <div className="hidden sm:block overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="text-center w-12">#</TableHead>
                        <TableHead>Produto</TableHead>
                        <TableHead className="text-center">Estoque</TableHead>
                        <TableHead className="text-center">Código</TableHead>
                        <TableHead className="text-center">Qtd</TableHead>
                        <TableHead className="text-center">Preço Unit.</TableHead>
                        <TableHead className="text-center">Desc. %</TableHead>
                        <TableHead className="text-center">Total</TableHead>
                        <TableHead className="text-center">Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {budgetItems.map((item, index) => (
                        <TableRow key={item.id}>
                          <TableCell className="text-center font-mono">
                            {String(index + 1).padStart(3, '0')}
                          </TableCell>
                          <TableCell className="font-medium">
                            {item.products?.name || 'Produto não encontrado'}
                          </TableCell>
                          <TableCell className="text-center">
                            -
                          </TableCell>
                          <TableCell className="text-center font-mono">
                            {item.products?.internal_code || 'N/A'}
                          </TableCell>
                          <TableCell className="text-center">
                            {item.quantity}
                          </TableCell>
                          <TableCell className="text-center">
                            {formatCurrency(item.unit_price)}
                          </TableCell>
                          <TableCell className="text-center">
                            {item.discount_percentage || 0}%
                          </TableCell>
                          <TableCell className="text-center font-semibold">
                            {formatCurrency(item.total_price)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Remover item</TooltipContent>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="sm:hidden space-y-3">
                  {budgetItems.map((item, index) => (
                    <Card key={item.id} className="border border-gray-200">
                      <CardContent className="p-4">
                        <div className="space-y-3">
                          {/* Header */}
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono bg-gray-100 px-2 py-1 rounded">
                                #{String(index + 1).padStart(3, '0')}
                              </span>
                              <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                                <Package className="h-4 w-4 text-gray-500" />
                              </div>
                            </div>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Remover item</TooltipContent>
                            </Tooltip>
                          </div>

                          {/* Product Name */}
                          <div>
                            <h4 className="font-medium text-gray-900">
                              {item.products?.name || 'Produto não encontrado'}
                            </h4>
                            <p className="text-sm text-gray-500 font-mono">
                              Código: {item.products?.internal_code || 'N/A'}
                            </p>
                          </div>

                          {/* Details Grid */}
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div>
                              <span className="text-xs text-gray-500">Quantidade:</span>
                              <p className="font-medium">{item.quantity}</p>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500">Preço Unit.:</span>
                              <p className="font-medium">{formatCurrency(item.unit_price)}</p>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500">Desconto:</span>
                              <p className="font-medium">{item.discount_percentage || 0}%</p>
                            </div>
                            <div>
                              <span className="text-xs text-gray-500">Total:</span>
                              <p className="font-semibold text-lg">{formatCurrency(item.total_price)}</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Resumo do Orçamento */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold mb-4">Resumo do Orçamento</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Desconto Geral (%)</label>
                      <div className="p-3 bg-white border border-gray-200 rounded">
                        {budgetData.discount_percentage || 0}%
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Nota Fiscal (%) - Apenas Informativo</label>
                      <div className="p-3 bg-white border border-gray-200 rounded">
                        {budgetData.invoice_percentage || 0}%
                      </div>
                    </div>
                  </div>

                  {/* Observações */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                    <div className="p-3 bg-white border border-gray-200 rounded min-h-[60px]">
                      {budgetData.notes || 'Observações sobre o orçamento.'}
                    </div>
                  </div>

                  {/* Resumo Financeiro */}
                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span className="font-semibold">{formatCurrency(budgetItems.reduce((sum, item) => sum + item.total_price, 0))}</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>Desconto (0%):</span>
                      <span className="font-semibold">{formatCurrency(0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total dos Produtos:</span>
                      <span className="font-semibold">{formatCurrency(budgetItems.reduce((sum, item) => sum + item.total_price, 0))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Frete:</span>
                      <span className="font-semibold">{formatCurrency(budgetData.shipping_cost || 0)}</span>
                    </div>
                    <div className="flex justify-between text-xl font-bold text-blue-600 border-t pt-2">
                      <span>Total Final:</span>
                      <span>{formatCurrency(budgetData.total_amount)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};

export default BudgetDetailModal;