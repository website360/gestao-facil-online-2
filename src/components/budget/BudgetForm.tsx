
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import type { LocalBudget } from '@/hooks/useBudgetManagement';
import { useBudgetCalculations } from '@/hooks/useBudgetCalculations';
import { useBudgetFormOperations } from '@/hooks/useBudgetFormOperations';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import BudgetFormHeader from './BudgetFormHeader';
import BudgetItemsTable from './BudgetItemsTable';
import ClientBudgetItemsTable from './ClientBudgetItemsTable';
import ConditionalShippingSection from './ConditionalShippingSection';
import BudgetSummary from './BudgetSummary';
import BudgetPaymentInfo from './BudgetPaymentInfo';

interface BudgetFormProps {
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
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  clients: any[];
  products: any[];
  loading: boolean;
  editingBudget: LocalBudget | null;
  onSubmit: (e: React.FormEvent) => void;
  onCancel: () => void;
}

const BudgetForm = ({
  formData,
  setFormData,
  clients = [],
  products = [],
  loading,
  editingBudget,
  onSubmit,
  onCancel
}: BudgetFormProps) => {
  console.log('BudgetForm render - clients:', clients, 'products:', products);

  const { 
    calculateItemTotal, 
    calculateSubtotal, 
    calculateTotalWithDiscount, 
    calculateRealDiscountPercentage, 
    calculateTotalDiscountAmount 
  } = useBudgetCalculations();

  const { 
    addItem, 
    removeItem, 
    updateItem, 
    updateGeneralDiscount, 
    handleProductChange 
  } = useBudgetFormOperations(formData, setFormData, products);

  const { isClient, clientData, userProfile } = useAuth();
  const [shippingOptions, setShippingOptions] = useState<Array<{ id: string; name: string; price: number }>>([]);

  // Se for cliente, definir automaticamente o client_id
  React.useEffect(() => {
    if (isClient && clients.length > 0 && !editingBudget && !formData.client_id) {
      // Para clientes, deve haver apenas um cliente na lista (o próprio cliente logado)
      const clientToSet = clients[0];
      console.log('Setting client_id for logged client:', clientToSet);
      
      if (clientToSet) {
        setFormData(prev => ({ ...prev, client_id: clientToSet.id }));
      }
    }
  }, [isClient, clients, editingBudget, formData.client_id, setFormData]);

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

  console.log('Mapped options - clients:', clientOptions, 'products:', productOptions);

  if (!Array.isArray(clients) || !Array.isArray(products)) {
    return <div className="p-4">Carregando dados...</div>;
  }

  const totalWithShipping = calculateTotalWithDiscount(formData.items) + formData.shipping_cost;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <BudgetFormHeader
        clientId={formData.client_id}
        status={formData.status}
        clientOptions={clientOptions}
        onClientChange={(value) => setFormData(prev => ({ ...prev, client_id: value }))}
        onStatusChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
        isClient={isClient}
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
        onPaymentMethodChange={(value) => setFormData(prev => ({ ...prev, payment_method_id: value }))}
        onPaymentTypeChange={(value) => setFormData(prev => ({ ...prev, payment_type_id: value }))}
        onShippingOptionChange={(value) => setFormData(prev => ({ ...prev, shipping_option_id: value }))}
        onShippingCostChange={(value) => setFormData(prev => ({ ...prev, shipping_cost: value }))}
        onLocalDeliveryInfoChange={(value) => setFormData(prev => ({ ...prev, local_delivery_info: value }))}
        onInstallmentsChange={(value) => setFormData(prev => ({ ...prev, installments: value }))}
        onCheckInstallmentsChange={(value) => setFormData(prev => ({ ...prev, check_installments: value }))}
        onCheckDueDatesChange={(value) => setFormData(prev => ({ ...prev, check_due_dates: value }))}
        onBoletoInstallmentsChange={(value) => setFormData(prev => ({ ...prev, boleto_installments: value }))}
        onBoletoDueDatesChange={(value) => setFormData(prev => ({ ...prev, boleto_due_dates: value }))}
      />

      {isClient ? (
        <ClientBudgetItemsTable
          items={formData.items}
          productOptions={productOptions}
          products={products}
          generalDiscount={formData.discount_percentage}
          onAddItem={addItem}
          onProductChange={handleProductChange}
          onItemUpdate={updateItem}
          onRemoveItem={removeItem}
          calculateItemTotal={calculateItemTotal}
        />
      ) : (
        <BudgetItemsTable
          items={formData.items}
          productOptions={productOptions}
          products={products}
          generalDiscount={formData.discount_percentage}
          onAddItem={addItem}
          onProductChange={handleProductChange}
          onItemUpdate={updateItem}
          onRemoveItem={removeItem}
          calculateItemTotal={calculateItemTotal}
          showStock={userProfile?.role === 'admin' || userProfile?.role === 'gerente'}
        />
      )}

      <ConditionalShippingSection
        clientId={formData.client_id}
        shippingOptionId={formData.shipping_option_id}
        onShippingChange={(optionId) => setFormData(prev => ({ ...prev, shipping_option_id: optionId }))}
        onShippingCostChange={(cost) => setFormData(prev => ({ ...prev, shipping_cost: cost }))}
        cepDestino={formData.cep_destino}
        onCepChange={(cep) => setFormData(prev => ({ ...prev, cep_destino: cep }))}
        shippingOptions={shippingOptions}
        products={products}
        items={formData.items}
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
        onDiscountChange={updateGeneralDiscount}
        onInvoicePercentageChange={(value) => setFormData(prev => ({ ...prev, invoice_percentage: value }))}
        onNotesChange={(value) => setFormData(prev => ({ ...prev, notes: value }))}
      />

      <div className="flex justify-end space-x-4 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Salvando...' : editingBudget ? 'Atualizar' : 'Criar'} Orçamento
        </Button>
      </div>
    </form>
  );
};

export default BudgetForm;
