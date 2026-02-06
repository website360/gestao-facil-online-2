
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from './useAuth';

interface BudgetItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  discount_percentage: number;
  product_code?: string;
}

interface BudgetFormData {
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
  items: BudgetItem[];
  status: 'processando' | 'aguardando_aprovacao' | 'aprovado';
}

export const useBudgetFormData = () => {
  const { isClient, clientData } = useAuth();
  const [clients, setClients] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  const [formData, setFormData] = useState<BudgetFormData>({
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
    check_due_dates: [],
    boleto_installments: 1,
    boleto_due_dates: [],
    items: [],
    status: 'processando'
  });

  const resetForm = () => {
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
      check_due_dates: [],
      boleto_installments: 1,
      boleto_due_dates: [],
      items: [],
      status: 'processando'
    });
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('=== FETCHING FORM DATA ===');
        console.log('Is client:', isClient);
        console.log('Client data:', clientData);
        
        let clientsData = [];
        
        if (isClient && clientData) {
          // Se for cliente, usar os dados já carregados no clientData
          console.log('Using client data from auth context');
          clientsData = [clientData];
          
          // Atualizar o formData com o client_id correto
          setFormData(prev => ({
            ...prev,
            client_id: clientData.id
          }));
        } else {
          // Se for funcionário, buscar TODOS os clientes com paginação (evita limite de 1.000 itens do Supabase)
          const pageSize = 1000;
          let currentPage = 0;
          let hasMore = true;
          let allClientsData: any[] = [];

          while (hasMore) {
            const { data, error } = await supabase
              .from('clients')
              .select('*')
              .order('name', { ascending: true })
              .range(currentPage * pageSize, (currentPage + 1) * pageSize - 1);

            if (error) {
              console.error('Error fetching clients:', error);
              toast.error('Erro ao carregar clientes');
              return;
            }

            if (data && data.length > 0) {
              allClientsData = [...allClientsData, ...data];
              currentPage++;
              hasMore = data.length === pageSize;
            } else {
              hasMore = false;
            }
          }
          
          clientsData = allClientsData || [];
        }

        // Fetch products (including IPI for tax calculations)
        const { data: productsData, error: productsError } = await supabase
          .from('products')
          .select('*, ipi')
          .order('name');

        if (productsError) {
          console.error('Error fetching products:', productsError);
          toast.error('Erro ao carregar produtos');
          return;
        }

        console.log('Clients loaded:', clientsData?.length || 0);
        console.log('Products loaded:', productsData?.length || 0);

        setClients(clientsData);
        setProducts(productsData || []);
        setDataLoaded(true);
        
        console.log('=== END FETCHING FORM DATA ===');
      } catch (error) {
        console.error('Unexpected error fetching data:', error);
        toast.error('Erro inesperado ao carregar dados');
      }
    };

    fetchData();
  }, [isClient, clientData]);

  return {
    formData,
    setFormData,
    resetForm,
    clients,
    products,
    loading,
    setLoading,
    dataLoaded
  };
};
