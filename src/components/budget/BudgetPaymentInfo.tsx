import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { calculateDueDates } from '@/utils/dateCalculations';

interface PaymentMethod {
  id: string;
  name: string;
  active: boolean;
}

interface PaymentType {
  id: string;
  name: string;
  active: boolean;
}

interface ShippingOption {
  id: string;
  name: string;
  active: boolean;
}

interface BudgetPaymentInfoProps {
  paymentMethodId: string;
  paymentTypeId: string;
  shippingOptionId: string;
  shippingCost: number;
  localDeliveryInfo?: string;
  installments?: number;
  checkInstallments?: number;
  checkDueDates?: number[];
  boletoInstallments?: number;
  boletoDueDates?: number[];
  budgetCreatedAt?: string; // Para calcular as datas de vencimento
  onPaymentMethodChange: (value: string) => void;
  onPaymentTypeChange: (value: string) => void;
  onShippingOptionChange: (value: string) => void;
  onShippingCostChange: (value: number) => void;
  onLocalDeliveryInfoChange?: (value: string) => void;
  onInstallmentsChange?: (value: number) => void;
  onCheckInstallmentsChange?: (value: number) => void;
  onCheckDueDatesChange?: (value: number[]) => void;
  onBoletoInstallmentsChange?: (value: number) => void;
  onBoletoDueDatesChange?: (value: number[]) => void;
  readonly?: boolean;
}

const BudgetPaymentInfo = ({
  paymentMethodId,
  paymentTypeId,
  shippingOptionId,
  shippingCost,
  localDeliveryInfo = '',
  installments = 1,
  checkInstallments = 1,
  checkDueDates = [],
  boletoInstallments = 1,
  boletoDueDates = [],
  budgetCreatedAt,
  onPaymentMethodChange,
  onPaymentTypeChange,
  onShippingOptionChange,
  onShippingCostChange,
  onLocalDeliveryInfoChange,
  onInstallmentsChange,
  onCheckInstallmentsChange,
  onCheckDueDatesChange,
  onBoletoInstallmentsChange,
  onBoletoDueDatesChange,
  readonly = false
}: BudgetPaymentInfoProps) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([]);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [loading, setLoading] = useState(true);

  console.log('BudgetPaymentInfo render:');
  console.log('- Payment methods:', paymentMethods);
  console.log('- Payment types:', paymentTypes);
  console.log('- Shipping options:', shippingOptions);
  console.log('- Selected payment method ID:', paymentMethodId);
  console.log('- Selected payment type ID:', paymentTypeId);
  console.log('- Selected shipping option ID:', shippingOptionId);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      console.log('=== FETCHING PAYMENT DATA ===');
      
      const [methodsResponse, typesResponse, shippingResponse] = await Promise.all([
        supabase.from('payment_methods').select('*').eq('active', true).order('name'),
        supabase.from('payment_types').select('*').eq('active', true).order('name'),
        supabase.from('shipping_options').select('*').eq('active', true).order('name')
      ]);

      console.log('Payment methods response:', methodsResponse);
      console.log('Payment types response:', typesResponse);
      console.log('Shipping options response:', shippingResponse);

      if (methodsResponse.error) {
        console.error('Error fetching payment methods:', methodsResponse.error);
        throw methodsResponse.error;
      }
      if (typesResponse.error) {
        console.error('Error fetching payment types:', typesResponse.error);
        throw typesResponse.error;
      }
      if (shippingResponse.error) {
        console.error('Error fetching shipping options:', shippingResponse.error);
        throw shippingResponse.error;
      }

      console.log('Fetched payment methods:', methodsResponse.data);
      console.log('Fetched payment types:', typesResponse.data);
      console.log('Fetched shipping options:', shippingResponse.data);
      
      setPaymentMethods(methodsResponse.data || []);
      setPaymentTypes(typesResponse.data || []);
      setShippingOptions(shippingResponse.data || []);
    } catch (error) {
      console.error('Error in fetchData:', error);
      toast.error('Erro ao carregar dados de pagamento');
    } finally {
      setLoading(false);
    }
  };

  const selectedPaymentMethod = paymentMethods.find(method => method.id === paymentMethodId);
  const isCreditCard = selectedPaymentMethod?.name.toLowerCase().includes('cartão de crédito') || 
                      selectedPaymentMethod?.name.toLowerCase().includes('cartao de credito');
  const isCheck = selectedPaymentMethod?.name.toLowerCase().includes('cheque');
  const isBoleto = selectedPaymentMethod?.name.toLowerCase().includes('boleto');

  const handleCheckInstallmentsChange = (value: number) => {
    onCheckInstallmentsChange?.(value);
    // Resetar os prazos quando mudar o número de parcelas
    const newDueDates = Array(value).fill(0);
    onCheckDueDatesChange?.(newDueDates);
  };

  const handleCheckDueDateChange = (index: number, value: number) => {
    const newDueDates = [...checkDueDates];
    newDueDates[index] = value;
    onCheckDueDatesChange?.(newDueDates);
  };

  const handleBoletoInstallmentsChange = (value: number) => {
    onBoletoInstallmentsChange?.(value);
    // Resetar os prazos quando mudar o número de parcelas
    const newDueDates = Array(value).fill(0);
    onBoletoDueDatesChange?.(newDueDates);
  };

  const handleBoletoDueDateChange = (index: number, value: number) => {
    const newDueDates = [...boletoDueDates];
    newDueDates[index] = value;
    onBoletoDueDatesChange?.(newDueDates);
  };

  // Check if "Entrega Local" is selected (not "Retirada no Local")
  const selectedShippingOption = shippingOptions.find(option => option.id === shippingOptionId);
  const isLocalDelivery = selectedShippingOption?.name.toLowerCase().includes('entrega local') && 
                         !selectedShippingOption?.name.toLowerCase().includes('retirada');

  if (loading) {
    return <div>Carregando informações de pagamento...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informações de Pagamento e Frete</CardTitle>
        <CardDescription>
          Selecione as opções de pagamento e frete para este orçamento
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          <div className={`space-y-2 ${(isCreditCard || isCheck || isBoleto) ? 'md:col-span-4' : 'md:col-span-6'}`}>
            <Label htmlFor="payment-method">Meio de Pagamento</Label>
            <Select value={paymentMethodId} onValueChange={onPaymentMethodChange} disabled={readonly}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Selecione o meio de pagamento" />
              </SelectTrigger>
              <SelectContent className="bg-white border shadow-lg z-[9999] max-h-60 overflow-auto">
                {paymentMethods.map((method) => (
                  <SelectItem key={method.id} value={method.id} className="bg-white hover:bg-gray-50">
                    {method.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isCreditCard && (
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="installments">Parcelas</Label>
              <Select 
                value={installments.toString()} 
                onValueChange={(value) => onInstallmentsChange?.(parseInt(value))}
                disabled={readonly}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Parcelas" />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-50">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
                    <SelectItem key={num} value={num.toString()} className="bg-background hover:bg-muted">
                      {num}x
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {isCheck && (
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="check-installments">Parcelas</Label>
              <Select 
                value={checkInstallments.toString()} 
                onValueChange={(value) => handleCheckInstallmentsChange(parseInt(value))}
                disabled={readonly}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Parcelas" />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-50">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
                    <SelectItem key={num} value={num.toString()} className="bg-background hover:bg-muted">
                      {num}x
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {isBoleto && (
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="boleto-installments">Parcelas</Label>
              <Select 
                value={boletoInstallments.toString()} 
                onValueChange={(value) => handleBoletoInstallmentsChange(parseInt(value))}
                disabled={readonly}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue placeholder="Parcelas" />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-50">
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
                    <SelectItem key={num} value={num.toString()} className="bg-background hover:bg-muted">
                      {num}x
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2 md:col-span-6">
            <Label htmlFor="payment-type">Tipo de Pagamento</Label>
            <Select value={paymentTypeId} onValueChange={onPaymentTypeChange} disabled={readonly}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Selecione o tipo de pagamento" />
              </SelectTrigger>
              <SelectContent className="bg-white border shadow-lg z-[9999] max-h-60 overflow-auto">
                {paymentTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id} className="bg-white hover:bg-gray-50">
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {isCheck && checkInstallments > 1 && (
          <div className="space-y-2">
            <Label>Prazos dos Cheques (em dias)</Label>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Array.from({ length: checkInstallments }, (_, index) => (
                <div key={index} className="space-y-1">
                  <Label htmlFor={`check-due-${index}`} className="text-sm">
                    {index + 1}º Cheque (dias)
                  </Label>
                  <Input
                    id={`check-due-${index}`}
                    type="number"
                    min="0"
                    value={checkDueDates[index] || ''}
                    onChange={(e) => handleCheckDueDateChange(index, parseInt(e.target.value) || 0)}
                    placeholder="Ex: 30"
                    disabled={readonly}
                  />
                  {budgetCreatedAt && checkDueDates[index] > 0 && (
                    <div className="text-xs text-muted-foreground">
                      Data: {calculateDueDates(budgetCreatedAt, [checkDueDates[index]])[0]?.dueDate}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {isBoleto && boletoInstallments > 1 && (
          <div className="space-y-2">
            <Label>Prazos dos Boletos (em dias)</Label>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {Array.from({ length: boletoInstallments }, (_, index) => (
                <div key={index} className="space-y-1">
                  <Label htmlFor={`boleto-due-${index}`} className="text-sm">
                    {index + 1}º Boleto (dias)
                  </Label>
                  <Input
                    id={`boleto-due-${index}`}
                    type="number"
                    min="0"
                    value={boletoDueDates[index] || ''}
                    onChange={(e) => handleBoletoDueDateChange(index, parseInt(e.target.value) || 0)}
                    placeholder="Ex: 30"
                    disabled={readonly}
                  />
                  {budgetCreatedAt && boletoDueDates[index] > 0 && (
                    <div className="text-xs text-muted-foreground">
                      Data: {calculateDueDates(budgetCreatedAt, [boletoDueDates[index]])[0]?.dueDate}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Segunda linha: Opção de Frete */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="shipping-option">Opção de Frete</Label>
            <Select value={shippingOptionId} onValueChange={onShippingOptionChange} disabled={readonly}>
              <SelectTrigger className="bg-background">
                <SelectValue placeholder="Selecione a opção de frete" />
              </SelectTrigger>
              <SelectContent className="bg-white border shadow-lg z-[9999] max-h-60 overflow-auto">
                {shippingOptions.map((option) => (
                  <SelectItem key={option.id} value={option.id} className="bg-white hover:bg-gray-50">
                    {option.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="shipping-cost">Custo do Frete (R$)</Label>
            <Input
              id="shipping-cost"
              type="number"
              step="0.01"
              min="0"
              value={shippingCost}
              onChange={(e) => onShippingCostChange(parseFloat(e.target.value) || 0)}
              disabled={readonly}
            />
          </div>
        </div>

        {/* Campo adicional para Entrega Local */}
        {isLocalDelivery && (
          <div className="space-y-2">
            <Label htmlFor="local-delivery-info">Informações da Entrega Local</Label>
            <Textarea
              id="local-delivery-info"
              placeholder="Digite informações adicionais sobre a entrega local (endereço, horário, observações, etc.)"
              value={localDeliveryInfo}
              onChange={(e) => onLocalDeliveryInfoChange?.(e.target.value)}
              rows={3}
              disabled={readonly}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BudgetPaymentInfo;
