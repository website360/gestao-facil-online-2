import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import type { LocalBudget } from '@/hooks/useBudgetManagement';
import { useBudgetCalculations } from '@/hooks/useBudgetCalculations';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import BudgetFormHeader from './BudgetFormHeader';
import BudgetItemsTable from './BudgetItemsTable';
import ClientBudgetItemsTable from './ClientBudgetItemsTable';
import ConditionalShippingSection from './ConditionalShippingSection';
import BudgetSummary from './BudgetSummary';
import BudgetPaymentInfo from './BudgetPaymentInfo';

interface BudgetViewFormProps {
  formData: {
    client_id: string;
    notes: string;
    discount_percentage: number;
    invoice_percentage: number;
    payment_method_id: string;
    payment_type_id: string;
    shipping_option_id: string;
    shipping_cost: number;
    local_delivery_info: string;
    installments: number;
    check_installments: number;
    check_due_dates: number[];
    boleto_installments: number;
    boleto_due_dates: number[];
    cep_destino: string;
    items: Array<{
      product_id: string;
      quantity: number;
      unit_price: number;
      discount_percentage: number;
      product_code?: string;
      has_individual_discount?: boolean;
    }>;
    status: 'processando' | 'aguardando_aprovacao' | 'aprovado';
  };
  clients: any[];
  products: any[];
  editingBudget: LocalBudget | null;
  onClose: () => void;
}

const BudgetViewForm = ({
  formData,
  clients = [],
  products = [],
  editingBudget,
  onClose
}: BudgetViewFormProps) => {
  const { 
    calculateItemTotal, 
    calculateSubtotal, 
    calculateTotalWithDiscount, 
    calculateRealDiscountPercentage, 
    calculateTotalDiscountAmount 
  } = useBudgetCalculations();

  const { isClient } = useAuth();
  const [shippingOptions, setShippingOptions] = useState<Array<{ id: string; name: string; price: number }>>([]);

  // Carregar opções de envio
  useEffect(() => {
    const fetchShippingOptions = async () => {
      try {
        const { data, error } = await supabase
          .from('shipping_options')
          .select('*')
          .eq('active', true)
          .order('name');

        if (error) throw error;

        const mappedOptions = (data || []).map(option => ({
          id: option.id,
          name: option.name,
          price: option.price || 0
        }));

        setShippingOptions(mappedOptions);
      } catch (error) {
        console.error('Error loading shipping options:', error);
      }
    };

    fetchShippingOptions();
  }, []);

  // Safely create options arrays with proper null checks
  const clientOptions = React.useMemo(() => {
    if (!Array.isArray(clients) || clients.length === 0) return [];
    return clients
      .filter(client => client && client.id && client.name)
      .map(client => ({
        value: client.id,
        label: client.name
      }));
  }, [clients]);

  const productOptions = React.useMemo(() => {
    if (!Array.isArray(products) || products.length === 0) return [];
    return products
      .filter(product => product && product.id && product.name)
      .map(product => ({
        value: product.id,
        label: `${product.name} - ${product.internal_code || 'Sem código'}`
      }));
  }, [products]);

  if (!Array.isArray(clients) || !Array.isArray(products)) {
    return <div className="p-4">Carregando dados...</div>;
  }

  const totalWithShipping = calculateTotalWithDiscount(formData.items) + formData.shipping_cost;

  // Funções vazias para os handlers (já que é apenas visualização)
  const noopHandler = () => {};
  const noopValueHandler = (value: any) => {};

  return (
    <div className="space-y-4">
      <BudgetFormHeader
        clientId={formData.client_id}
        status={formData.status}
        clientOptions={clientOptions}
        onClientChange={noopValueHandler}
        onStatusChange={noopValueHandler}
        isClient={isClient}
        readonly={true}
      />

      <BudgetPaymentInfo
        paymentMethodId={formData.payment_method_id}
        paymentTypeId={formData.payment_type_id}
        shippingOptionId={formData.shipping_option_id}
        shippingCost={formData.shipping_cost}
        localDeliveryInfo={formData.local_delivery_info}
        installments={formData.installments}
        checkInstallments={formData.check_installments}
        checkDueDates={formData.check_due_dates}
        boletoInstallments={formData.boleto_installments}
        boletoDueDates={formData.boleto_due_dates}
        budgetCreatedAt={editingBudget?.created_at || new Date().toISOString()}
        onPaymentMethodChange={noopValueHandler}
        onPaymentTypeChange={noopValueHandler}
        onShippingOptionChange={noopValueHandler}
        onShippingCostChange={noopValueHandler}
        onLocalDeliveryInfoChange={noopValueHandler}
        onInstallmentsChange={noopValueHandler}
        onCheckInstallmentsChange={noopValueHandler}
        onCheckDueDatesChange={noopValueHandler}
        onBoletoInstallmentsChange={noopValueHandler}
        onBoletoDueDatesChange={noopValueHandler}
        readonly={true}
      />

      {isClient ? (
        <ClientBudgetItemsTable
          items={formData.items}
          productOptions={productOptions}
          products={products}
          generalDiscount={formData.discount_percentage}
          onAddItem={noopHandler}
          onProductChange={noopValueHandler}
          onItemUpdate={noopValueHandler}
          onRemoveItem={noopValueHandler}
          calculateItemTotal={calculateItemTotal}
          readonly={true}
        />
      ) : (
        <BudgetItemsTable
          items={formData.items}
          productOptions={productOptions}
          products={products}
          generalDiscount={formData.discount_percentage}
          onAddItem={noopHandler}
          onProductChange={noopValueHandler}
          onItemUpdate={noopValueHandler}
          onRemoveItem={noopValueHandler}
          calculateItemTotal={calculateItemTotal}
          readonly={true}
        />
      )}

      <ConditionalShippingSection
        clientId={formData.client_id}
        shippingOptionId={formData.shipping_option_id}
        onShippingChange={noopValueHandler}
        onShippingCostChange={noopValueHandler}
        cepDestino={formData.cep_destino}
        onCepChange={noopValueHandler}
        shippingOptions={shippingOptions}
        products={products}
        items={formData.items}
        readonly={true}
      />

      <BudgetSummary
        discountPercentage={formData.discount_percentage}
        realDiscountPercentage={calculateRealDiscountPercentage(formData.items)}
        totalDiscountAmount={calculateTotalDiscountAmount(formData.items)}
        invoicePercentage={formData.invoice_percentage}
        notes={formData.notes}
        subtotal={calculateSubtotal(formData.items)}
        total={calculateTotalWithDiscount(formData.items)}
        shippingCost={formData.shipping_cost}
        totalWithShipping={totalWithShipping}
        budgetCreatedAt={editingBudget?.created_at || new Date().toISOString()}
        paymentMethodId={formData.payment_method_id}
        checkDueDates={formData.check_due_dates}
        boletoDueDates={formData.boleto_due_dates}
        onDiscountChange={noopValueHandler}
        onInvoicePercentageChange={noopValueHandler}
        onNotesChange={noopValueHandler}
        readonly={true}
      />

      <div className="flex justify-end space-x-4 pt-2">
        <Button type="button" onClick={onClose}>
          Fechar
        </Button>
      </div>
    </div>
  );
};

export default BudgetViewForm;