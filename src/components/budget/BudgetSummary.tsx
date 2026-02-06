
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { calculateDueDates } from '@/utils/dateCalculations';
import { supabase } from '@/integrations/supabase/client';
import { useDiscountPermissions } from '@/hooks/useDiscountPermissions';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface BudgetItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  discount_percentage: number;
}

interface Product {
  id: string;
  ipi?: number;
}

interface BudgetSummaryProps {
  discountPercentage: number;
  realDiscountPercentage: number;
  totalDiscountAmount: number;
  invoicePercentage: number;
  taxesAmount: number;
  notes: string;
  subtotal: number;
  total: number;
  shippingCost: number;
  totalWithShipping: number;
  budgetCreatedAt?: string;
  paymentMethodId?: string;
  checkDueDates?: number[];
  boletoDueDates?: number[];
  items?: BudgetItem[];
  products?: Product[];
  onDiscountChange: (value: number) => void;
  onInvoicePercentageChange: (value: number) => void;
  onTaxesAmountChange: (value: number) => void;
  onNotesChange: (value: string) => void;
  readonly?: boolean;
}

const BudgetSummary = ({
  discountPercentage,
  realDiscountPercentage,
  totalDiscountAmount,
  invoicePercentage,
  taxesAmount,
  notes,
  subtotal,
  total,
  shippingCost,
  totalWithShipping,
  budgetCreatedAt,
  paymentMethodId,
  checkDueDates = [],
  boletoDueDates = [],
  items = [],
  products = [],
  onDiscountChange,
  onInvoicePercentageChange,
  onTaxesAmountChange,
  onNotesChange,
  readonly = false
}: BudgetSummaryProps) => {
  const [paymentMethodName, setPaymentMethodName] = useState<string>('');
  const { 
    canEditDiscount, 
    isValidGeneralDiscount, 
    getMaxGeneralDiscount, 
    getDiscountErrorMessage,
    maxDiscount,
    loading
  } = useDiscountPermissions();

  const { isClient } = useAuth();

  // Log para debug
  console.log('BudgetSummary - maxDiscount:', maxDiscount, 'loading:', loading);

  // Calcular IPI automaticamente baseado nos itens, invoice_percentage e IPI dos produtos
  // Fórmula: Para cada item: (preço_unit × quantidade × (1 - desconto%) × nota_fiscal% × IPI_produto%)
  useEffect(() => {
    if (items.length === 0 || products.length === 0) return;

    let totalIpi = 0;

    items.forEach(item => {
      if (!item.product_id) return;
      
      const product = products.find(p => p.id === item.product_id);
      const productIpi = product?.ipi || 0;
      
      if (productIpi > 0 && invoicePercentage > 0) {
        // Valor do item com desconto
        const itemSubtotal = item.quantity * item.unit_price;
        const itemDiscount = itemSubtotal * (item.discount_percentage / 100);
        const itemTotal = itemSubtotal - itemDiscount;
        
        // Valor da nota fiscal (base para IPI)
        const invoiceValue = itemTotal * (invoicePercentage / 100);
        
        // Calcular IPI sobre o valor da nota fiscal
        const ipiValue = invoiceValue * (productIpi / 100);
        
        totalIpi += ipiValue;
        
        console.log(`IPI Calc - ${product?.id}: qty=${item.quantity}, price=${item.unit_price}, discount=${item.discount_percentage}%, invoice=${invoicePercentage}%, ipi=${productIpi}% => R$ ${ipiValue.toFixed(2)}`);
      }
    });

    console.log('Total IPI calculated:', totalIpi);
    
    // Só atualizar se o valor for diferente para evitar loops infinitos
    if (Math.abs(totalIpi - taxesAmount) > 0.01) {
      onTaxesAmountChange(Number(totalIpi.toFixed(2)));
    }
  }, [items, products, invoicePercentage]);

  useEffect(() => {
    const fetchPaymentMethod = async () => {
      if (paymentMethodId) {
        const { data } = await supabase
          .from('payment_methods')
          .select('name')
          .eq('id', paymentMethodId)
          .single();
        
        if (data) {
          setPaymentMethodName(data.name);
        }
      }
    };

    fetchPaymentMethod();
  }, [paymentMethodId]);

  const handleDiscountChange = (value: number) => {
    if (!canEditDiscount) {
      toast.error('Você não tem permissão para alterar desconto');
      return;
    }

    if (!isValidGeneralDiscount(value)) {
      toast.error(getDiscountErrorMessage('general', value));
      return;
    }

    onDiscountChange(value);
  };

  const isCheck = paymentMethodName?.toLowerCase().includes('cheque');
  const isBoleto = paymentMethodName?.toLowerCase().includes('boleto');
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resumo do Orçamento</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!isClient && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="discount">
                Desconto Geral (%)
                {!canEditDiscount && (
                  <span className="text-xs text-muted-foreground ml-2">
                    (Somente visualização)
                  </span>
                )}
              </Label>
              <Input
                id="discount"
                type="number"
                min="0"
                max={getMaxGeneralDiscount()}
                step="0.01"
                value={discountPercentage}
                onChange={(e) => handleDiscountChange(Number(e.target.value))}
                placeholder="0.00"
                disabled={!canEditDiscount}
                className={!canEditDiscount ? 'bg-gray-100' : ''}
              />
              {canEditDiscount && (
                <p className="text-xs text-muted-foreground mt-1">
                  Máximo: {getMaxGeneralDiscount()}%
                </p>
              )}
            </div>
            
            <div>
              <Label htmlFor="invoice">
                Nota Fiscal (%) - Apenas Informativo
                <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="invoice"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={invoicePercentage}
                onChange={(e) => onInvoicePercentageChange(Number(e.target.value))}
                placeholder="0.00"
                disabled={readonly}
                required
              />
            </div>

            <div>
              <Label htmlFor="taxes">
                IPI (R$)
              </Label>
              <Input
                id="taxes"
                type="number"
                min="0"
                step="0.01"
                value={taxesAmount}
                readOnly
                className="bg-muted"
                title="Valor calculado automaticamente baseado no IPI de cada produto e na porcentagem de nota fiscal"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Calculado automaticamente
              </p>
            </div>
          </div>
        )}

        <div>
          <Label htmlFor="notes">Observações</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            placeholder="Observações sobre o orçamento..."
            rows={3}
          />
        </div>

        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>R$ {subtotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          
          {totalDiscountAmount > 0 && (
            <div className="flex justify-between text-red-600">
              <span>Desconto ({realDiscountPercentage % 1 === 0 ? realDiscountPercentage.toFixed(0) : realDiscountPercentage.toFixed(1)}%):</span>
              <span>- R$ {totalDiscountAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          )}
          
          <div className="flex justify-between">
            <span>Total dos Produtos:</span>
            <span>R$ {total.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          
          <div className="flex justify-between">
            <span>Frete:</span>
            <span>R$ {shippingCost.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
          
          {taxesAmount > 0 && (
            <div className="flex justify-between">
              <span>IPI:</span>
              <span>R$ {taxesAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
          )}
          
          <hr className="my-2" />
          
          <div className="flex justify-between font-bold text-lg">
            <span>Total Final:</span>
            <span>R$ {(totalWithShipping + taxesAmount).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BudgetSummary;
