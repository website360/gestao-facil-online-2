
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

interface BudgetSummaryProps {
  discountPercentage: number;
  realDiscountPercentage: number;
  totalDiscountAmount: number;
  invoicePercentage: number;
  notes: string;
  subtotal: number;
  total: number;
  shippingCost: number;
  totalWithShipping: number;
  budgetCreatedAt?: string;
  paymentMethodId?: string;
  checkDueDates?: number[];
  boletoDueDates?: number[];
  onDiscountChange: (value: number) => void;
  onInvoicePercentageChange: (value: number) => void;
  onNotesChange: (value: string) => void;
  readonly?: boolean;
}

const BudgetSummary = ({
  discountPercentage,
  realDiscountPercentage,
  totalDiscountAmount,
  invoicePercentage,
  notes,
  subtotal,
  total,
  shippingCost,
  totalWithShipping,
  budgetCreatedAt,
  paymentMethodId,
  checkDueDates = [],
  boletoDueDates = [],
  onDiscountChange,
  onInvoicePercentageChange,
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
              <Label htmlFor="invoice">Nota Fiscal (%) - Apenas Informativo</Label>
              <Input
                id="invoice"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={invoicePercentage}
                onChange={(e) => onInvoicePercentageChange(Number(e.target.value))}
                placeholder="0.00"
              />
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
          
          <hr className="my-2" />
          
          <div className="flex justify-between font-bold text-lg">
            <span>Total Final:</span>
            <span>R$ {totalWithShipping.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BudgetSummary;
