import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Eye, ShoppingCart, Package, FileText, Trash2 } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/formatters';

interface SaleItem {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  discount_percentage?: number;
  products: { name: string; internal_code: string } | null;
}

interface Sale {
  id: string;
  client_id: string;
  status: string;
  total_amount: number;
  notes: string;
  created_at: string;
  created_by: string;
  budget_id?: string | null;
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
  total_volumes?: number;
  total_weight_kg?: number;
  ready_for_shipping_label?: boolean;
}

interface SaleVolume {
  id: string;
  sale_id: string;
  volume_number: number;
  weight_kg: number;
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

interface SaleDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  saleId: string | null;
}

const SalesDetailModal: React.FC<SaleDetailModalProps> = ({ isOpen, onClose, saleId }) => {
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [saleData, setSaleData] = useState<Sale | null>(null);
  const [budgetData, setBudgetData] = useState<Budget | null>(null);
  const [client, setClient] = useState<Client | null>(null);
  const [saleVolumes, setSaleVolumes] = useState<SaleVolume[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([]);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    if (isOpen && saleId) {
      fetchSaleDetails();
      getUserRole();
      fetchPaymentData();
    }
  }, [isOpen, saleId]);

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

  const fetchSaleDetails = async () => {
    if (!saleId) return;
    
    setLoading(true);
    try {
      // Fetch sale data
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select(`
          *,
          clients(name)
        `)
        .eq('id', saleId)
        .single();

      if (salesError) throw salesError;

      // Fetch creator profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', salesData.created_by)
        .single();

      if (profileError) {
        console.error('Erro ao buscar profile:', profileError);
      }

      // Fetch sale items
      const { data: itemsData, error: itemsError } = await supabase
        .from('sale_items')
        .select(`
          *,
          products(name, internal_code)
        `)
        .eq('sale_id', saleId);

      if (itemsError) throw itemsError;

      // Fetch client details
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', salesData.client_id)
        .single();

      if (clientError) throw clientError;

      // Fetch sale volumes
      const { data: volumesData, error: volumesError } = await supabase
        .from('sale_volumes')
        .select('*')
        .eq('sale_id', saleId)
        .order('volume_number');

      if (volumesError) {
        console.error('Erro ao buscar volumes:', volumesError);
      }

      // Buscar dados do orçamento original se existir budget_id
      let originalBudgetData = null;
      if (salesData.budget_id) {
        const { data: budgetResponse, error: budgetError } = await supabase
          .from('budgets')
          .select('*')
          .eq('id', salesData.budget_id)
          .single();
        
        if (!budgetError && budgetResponse) {
          originalBudgetData = budgetResponse;
        }
      }

      setSaleData({
        ...salesData,
        clients: salesData.clients ? { name: (salesData.clients as any).name } : null,
        created_by_profile: profileData || null
      });

      setBudgetData(originalBudgetData);

      setSaleItems(itemsData?.map(item => ({
        ...item,
        products: item.products ? { 
          name: (item.products as any).name,
          internal_code: (item.products as any).internal_code
        } : null
      })) || []);

      setClient(clientData);
      setSaleVolumes(volumesData || []);
    } catch (error) {
      console.error('Erro ao carregar detalhes da venda:', error);
      toast.error('Erro ao carregar detalhes da venda');
    } finally {
      setLoading(false);
    }
  };

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
  
  // Verificar se deve mostrar informações de parcelas/prazos
  const shouldShowInstallmentInfo = () => {
    const paymentMethodName = getPaymentMethodName(saleData?.payment_method_id)?.toLowerCase();
    return paymentMethodName?.includes('cheque') || paymentMethodName?.includes('cartão') || 
           paymentMethodName?.includes('boleto') || paymentMethodName?.includes('crediário');
  };

  // Verificar se deve mostrar informações específicas de cheque
  const shouldShowCheckInfo = () => {
    const paymentMethodName = getPaymentMethodName(saleData?.payment_method_id)?.toLowerCase();
    return paymentMethodName?.includes('cheque');
  };

  // Verificar se deve mostrar informações específicas de boleto
  const shouldShowBoletoInfo = () => {
    const paymentMethodName = getPaymentMethodName(saleData?.payment_method_id)?.toLowerCase();
    return paymentMethodName?.includes('boleto');
  };

  if (!saleData) return null;

  return (
    <TooltipProvider>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[95vw] md:max-w-6xl w-full max-h-[90vh] overflow-y-auto bg-white">
          <DialogHeader>
            <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
              <DialogTitle className="text-lg md:text-xl font-semibold">
                {userRole === 'nota_fiscal' ? 'Nota Fiscal' : 'Visualizar Venda'}
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
              {userRole === 'nota_fiscal' 
                ? 'Gere a nota fiscal para esta venda.' 
                : 'Visualize os detalhes da venda.'
              }
            </p>
          </DialogHeader>

          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
              <span className="ml-3 text-gray-600">Carregando...</span>
            </div>
          ) : (
            <div id="sale-print-content" className="space-y-6">

              {/* Informações completas do cliente */}
              {(userRole === 'nota_fiscal' || userRole === 'admin' || userRole === 'gerente' || userRole === 'vendedor_externo' || userRole === 'vendedor_interno') && client && (
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
              <Card style={{ backgroundColor: '#F9FAFB' }} className="border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Informações de Pagamento e Frete</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Meio de Pagamento</label>
                      <div className="p-3 bg-white border border-gray-200 rounded">
                        {getPaymentMethodName(saleData?.payment_method_id)}
                      </div>
                    </div>
                    {shouldShowInstallmentInfo() && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Parcelas</label>
                        <div className="p-3 bg-white border border-gray-200 rounded">
                          {(() => {
                            const paymentMethodName = getPaymentMethodName(saleData?.payment_method_id)?.toLowerCase();
                            if (paymentMethodName?.includes('cheque')) {
                              return `${saleData.check_installments || 1}x`;
                            } else if (paymentMethodName?.includes('boleto')) {
                              return `${saleData.boleto_installments || 1}x`;
                            }
                            return `${saleData.installments || 1}x`;
                          })()}
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Pagamento</label>
                      <div className="p-3 bg-white border border-gray-200 rounded">
                        {getPaymentTypeName(saleData.payment_type_id)}
                      </div>
                    </div>
                  </div>

                  {/* Prazos dos Cheques - só mostrar se for pagamento com cheque */}
                  {shouldShowCheckInfo() && Array.isArray(saleData.check_due_dates) && saleData.check_due_dates.length > 0 && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Prazos dos Cheques (em dias)</label>
                      <div className="grid grid-cols-4 gap-4">
                        {saleData.check_due_dates.map((days, idx) => (
                          <div key={`check-${idx}`}>
                            <label className="block text-xs text-gray-600 mb-1">{idx + 1}° Cheque (dias)</label>
                            <div className="p-2 bg-white border border-gray-200 rounded text-center">
                              {days}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Prazos dos Boletos - só mostrar se for pagamento com boleto */}
                  {shouldShowBoletoInfo() && Array.isArray(saleData.boleto_due_dates) && saleData.boleto_due_dates.length > 0 && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Prazos dos Boletos (em dias)</label>
                      <div className="grid grid-cols-6 gap-4">
                        {saleData.boleto_due_dates.map((days, idx) => (
                          <div key={`boleto-${idx}`}>
                            <label className="block text-xs text-gray-600 mb-1">{idx + 1}° Boleto (dias)</label>
                            <div className="p-2 bg-white border border-gray-200 rounded text-center">
                              {days}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Opção de Frete</label>
                      <div className="p-3 bg-white border border-gray-200 rounded">
                        {getShippingOptionName(saleData.shipping_option_id)}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Custo do Frete (R$)</label>
                      <div className="p-3 bg-white border border-gray-200 rounded">
                        {formatCurrency(saleData.shipping_cost || 0)}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Informações de Entrega Local</label>
                    <div className="p-3 bg-white border border-gray-200 rounded min-h-[60px]">
                      {saleData.local_delivery_info || 'Informações adicionais sobre a entrega.'}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Itens da Venda */}
              <Card style={{ backgroundColor: '#F9FAFB' }} className="border-gray-200">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold">Itens da Venda</CardTitle>
                </CardHeader>
                 <CardContent>
                   {/* Desktop Table */}
                   <div className="hidden sm:block overflow-x-auto">
                     <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead className="text-center w-12">#</TableHead>
                            <TableHead>Produto</TableHead>
                            {(userRole === 'nota_fiscal' || userRole === 'admin' || userRole === 'gerente' || userRole === 'vendedor_externo' || userRole === 'vendedor_interno') ? (
                              <>
                                <TableHead className="text-center">Estoque</TableHead>
                                <TableHead className="text-center">Código</TableHead>
                                <TableHead className="text-center">Qtd</TableHead>
                                <TableHead className="text-center">Preço Un</TableHead>
                                <TableHead className="text-center">Desc. %</TableHead>
                                <TableHead className="text-center">Preço Un Desc</TableHead>
                                <TableHead className="text-center">Nota Fiscal</TableHead>
                                <TableHead className="text-center">Total</TableHead>
                                <TableHead className="text-center">Ações</TableHead>
                              </>
                            ) : null}
                          </TableRow>
                        </TableHeader>
                       <TableBody>
                         {saleItems.map((item, index) => (
                           <TableRow key={index}>
                             <TableCell className="text-center font-medium">{index + 1}</TableCell>
                             <TableCell className="font-medium">{item.products?.name || 'Produto não encontrado'}</TableCell>
                              {(userRole === 'nota_fiscal' || userRole === 'admin' || userRole === 'gerente' || userRole === 'vendedor_externo' || userRole === 'vendedor_interno') ? (
                                <>
                                  <TableCell className="text-center">-</TableCell>
                                  <TableCell className="text-center">{item.products?.internal_code || 'N/A'}</TableCell>
                                  <TableCell className="text-center">{item.quantity}</TableCell>
                                  <TableCell className="text-center">{formatNumber(item.unit_price)}</TableCell>
                                  <TableCell className="text-center">{item.discount_percentage || 0}%</TableCell>
                                  <TableCell className="text-center">{formatNumber(item.unit_price * (1 - (Number(item.discount_percentage || 0) / 100)))}</TableCell>
                                  <TableCell className="text-center font-semibold text-green-600">
                                    {formatCurrency((item.unit_price * (1 - (Number(item.discount_percentage || 0) / 100))) * ((saleData.invoice_percentage || 0) / 100))}
                                  </TableCell>
                                  <TableCell className="text-center font-semibold">{formatCurrency(item.total_price)}</TableCell>
                                  <TableCell className="text-center">
                                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </TableCell>
                                </>
                              ) : null}
                           </TableRow>
                         ))}
                       </TableBody>
                     </Table>
                   </div>

                   {/* Mobile Cards */}
                   <div className="sm:hidden space-y-3">
                     {saleItems.map((item, index) => (
                       <Card key={index} className="border border-gray-200 bg-white">
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
                               {(userRole === 'nota_fiscal' || userRole === 'admin' || userRole === 'gerente' || userRole === 'vendedor_externo' || userRole === 'vendedor_interno') && (
                                 <Button size="sm" variant="ghost" className="h-6 w-6 p-0">
                                   <Trash2 className="h-3 w-3" />
                                 </Button>
                               )}
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

                             {/* Details Grid - Only for authorized roles */}
                             {(userRole === 'nota_fiscal' || userRole === 'admin' || userRole === 'gerente' || userRole === 'vendedor_externo' || userRole === 'vendedor_interno') && (
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
                             )}
                           </div>
                         </CardContent>
                       </Card>
                     ))}
                   </div>
                 </CardContent>
              </Card>

              {/* Resumo da Venda */}
              {(userRole === 'nota_fiscal' || userRole === 'admin' || userRole === 'gerente' || userRole === 'vendedor_externo' || userRole === 'vendedor_interno') ? (
                <Card style={{ backgroundColor: '#F9FAFB' }} className="border-gray-200">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">Resumo da Venda</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Desconto Geral (%)</label>
                        <div className="p-3 bg-white border border-gray-200 rounded">
                          {budgetData?.discount_percentage || saleData.discount_percentage || 0}%
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nota Fiscal (%) - Apenas Informativo</label>
                        <div className="p-3 bg-white border border-gray-200 rounded">
                          {budgetData?.invoice_percentage || saleData.invoice_percentage || 0}%
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                      <div className="p-3 bg-white border border-gray-200 rounded min-h-[100px]">
                        {budgetData?.notes || saleData.notes || 'Observações sobre a venda.'}
                      </div>
                    </div>

                     {/* Totais */}
                     <div className="bg-white p-4 rounded-lg border space-y-2">
                       <div className="flex justify-between items-center">
                         <span className="text-sm font-medium">Subtotal:</span>
                         <span className="text-sm font-semibold">{formatCurrency(saleItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0))}</span>
                       </div>
                       <div className="flex justify-between items-center text-red-600">
                         <span className="text-sm font-medium">Desconto:</span>
                         <span className="text-sm font-semibold">-{formatCurrency(saleItems.reduce((sum, item) => sum + (item.quantity * item.unit_price - item.total_price), 0))}</span>
                       </div>
                       <div className="flex justify-between items-center">
                         <span className="text-sm font-medium">Total dos Produtos:</span>
                         <span className="text-sm font-semibold">{formatCurrency(saleItems.reduce((sum, item) => sum + item.total_price, 0))}</span>
                       </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Frete:</span>
                        <span className="text-sm font-semibold">{formatCurrency(saleData.shipping_cost || 0)}</span>
                      </div>
                      <hr className="my-2" />
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold">Total Final:</span>
                        <span className="text-lg font-bold text-blue-600">{formatCurrency(saleData.total_amount)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : null}

              {/* Botões de ação */}
              <div className="flex justify-end gap-4 pt-6">
                <Button variant="outline" onClick={onClose}>
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
};

export default SalesDetailModal;