
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { LocalBudget } from './useBudgetManagement';

interface FormData {
  client_id: string;
  notes: string;
  discount_percentage: number;
  invoice_percentage: number;
  taxes_amount: number;
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
  }>;
  status: 'processando' | 'aguardando_aprovacao' | 'aprovado';
}

export const useBudgetFormState = (editingBudget: LocalBudget | null) => {
  const [formData, setFormData] = useState<FormData>({
    client_id: '',
    notes: '',
    discount_percentage: 0,
    invoice_percentage: 0,
    taxes_amount: 0,
    payment_method_id: '',
    payment_type_id: '',
    shipping_option_id: '',
    shipping_cost: 0,
    local_delivery_info: '',
    installments: 1,
    check_installments: 1,
    check_due_dates: [30],
    boleto_installments: 1,
    boleto_due_dates: [30],
    cep_destino: '',
    items: [{ 
      product_id: '', 
      quantity: 1, 
      unit_price: 0, 
      discount_percentage: 0, 
      product_code: ''
    }],
    status: 'processando'
  });

  useEffect(() => {
    if (editingBudget) {
      console.log('=== LOADING EDITING BUDGET ===');
      console.log('Editing budget data:', editingBudget);
      console.log('Client ID from budget:', editingBudget.client_id);
      console.log('Budget items:', editingBudget.budget_items);
      
      const budgetGeneralDiscount = editingBudget.discount_percentage || 0;
      
      const items = (editingBudget.budget_items || [])
        .filter(item => (item.quantity || 0) > 0)
        .map(item => {
          console.log('Processing item:', item);
          return {
            product_id: item.product_id || '',
            quantity: item.quantity || 1,
            unit_price: item.unit_price || 0,
            discount_percentage: item.discount_percentage || budgetGeneralDiscount,
            product_code: item.products?.internal_code || ''
          };
        });

      console.log('Processed items:', items);

      // Ensure status is compatible with FormData type
      const formStatus: 'processando' | 'aguardando_aprovacao' | 'aprovado' = 
        editingBudget.status === 'convertido' ? 'aprovado' : 
        editingBudget.status === 'rejeitado' ? 'processando' :
        (editingBudget.status as 'processando' | 'aguardando_aprovacao' | 'aprovado') || 'processando';

      const newFormData = {
        client_id: editingBudget.client_id || '',
        notes: editingBudget.notes || '',
        discount_percentage: budgetGeneralDiscount,
        invoice_percentage: editingBudget.invoice_percentage || 0,
        taxes_amount: (editingBudget as any).taxes_amount || 0,
        payment_method_id: editingBudget.payment_method_id || '',
        payment_type_id: editingBudget.payment_type_id || '',
        shipping_option_id: editingBudget.shipping_option_id || '',
        shipping_cost: editingBudget.shipping_cost || 0,
        local_delivery_info: editingBudget.local_delivery_info || '',
        installments: editingBudget.installments || 1,
        check_installments: editingBudget.check_installments || 1,
        check_due_dates: editingBudget.check_due_dates || [30],
        boleto_installments: editingBudget.boleto_installments || 1,
        boleto_due_dates: editingBudget.boleto_due_dates || [30],
        cep_destino: (editingBudget as any).cep_destino || '',
        items: items.length > 0 ? items : [{ 
          product_id: '', 
          quantity: 1, 
          unit_price: 0, 
          discount_percentage: budgetGeneralDiscount, 
          product_code: ''
        }],
        status: formStatus
      };

      console.log('Setting new form data:', newFormData);
      console.log('New form data client_id:', newFormData.client_id);
      console.log('New form data items:', newFormData.items);

      setFormData(newFormData);
      console.log('=== END LOADING EDITING BUDGET ===');
    } else {
      console.log('No editing budget, initializing form data');
      
      // Para clientes logados, definir automaticamente o client_id
      const initializeClientData = async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            // Verificar se o usuário é um cliente
            const { data: profileData } = await supabase
              .from('profiles')
              .select('role')
              .eq('id', user.id)
              .single();
              
            if (profileData?.role === 'cliente') {
              // Buscar o client_id baseado no email do usuário
              const { data: clientData } = await supabase
                .from('clients')
                .select('id')
                .eq('email', user.email)
                .single();
                
              if (clientData) {
                setFormData(prev => ({
                  ...prev,
                  client_id: clientData.id
                }));
                return;
              }
            }
          }
          
          // Se não é cliente ou não encontrou dados, usar dados padrão
          setFormData({
            client_id: '',
            notes: '',
            discount_percentage: 0,
            invoice_percentage: 0,
            taxes_amount: 0,
            payment_method_id: '',
            payment_type_id: '',
            shipping_option_id: '',
            shipping_cost: 0,
            local_delivery_info: '',
            installments: 1,
            check_installments: 1,
            check_due_dates: [30],
            boleto_installments: 1,
            boleto_due_dates: [30],
            cep_destino: '',
            items: [{ 
              product_id: '', 
              quantity: 1, 
              unit_price: 0, 
              discount_percentage: 0, 
              product_code: ''
            }],
            status: 'processando'
          });
        } catch (error) {
          console.error('Error initializing client data:', error);
          // Fallback to default form data
          setFormData({
            client_id: '',
            notes: '',
            discount_percentage: 0,
            invoice_percentage: 0,
            taxes_amount: 0,
            payment_method_id: '',
            payment_type_id: '',
            shipping_option_id: '',
            shipping_cost: 0,
            local_delivery_info: '',
            installments: 1,
            check_installments: 1,
            check_due_dates: [30],
            boleto_installments: 1,
            boleto_due_dates: [30],
            cep_destino: '',
            items: [{ 
              product_id: '', 
              quantity: 1, 
              unit_price: 0, 
              discount_percentage: 0, 
              product_code: ''
            }],
            status: 'processando'
          });
        }
      };
      
      initializeClientData();
    }
  }, [editingBudget]);

  return { formData, setFormData };
};
