import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';

export interface LocalBudget {
  id: string;
  client_id: string;
  notes: string | null;
  discount_percentage: number | null;
  invoice_percentage: number | null;
  payment_method_id: string | null;
  payment_type_id: string | null;
  shipping_option_id: string | null;
  shipping_cost: number | null;
  local_delivery_info: string | null;
  installments: number | null;
  check_installments: number | null;
  check_due_dates: number[] | null;
  boleto_installments: number | null;
  boleto_due_dates: number[] | null;
  status: 'processando' | 'aguardando_aprovacao' | 'aprovado' | 'rejeitado' | 'convertido';
  total_amount: number;
  created_at: string;
  updated_at: string;
  created_by: string;
  stock_warnings?: any;
  clients?: {
    id: string;
    name: string;
    email: string;
    phone: string;
    client_type?: string;
    cpf?: string;
    cnpj?: string;
    razao_social?: string;
    birth_date?: string;
    cep?: string;
    street?: string;
    number?: string;
    complement?: string;
    neighborhood?: string;
    city?: string;
    state?: string;
    allow_system_access?: boolean;
    system_password?: string;
  };
  creator_profile?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  budget_items: Array<{
    id: string;
    budget_id: string;
    product_id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    discount_percentage: number | null;
    products: {
      id: string;
      name: string;
      internal_code: string;
      price: number;
    };
  }>;
}

export const useBudgetManagement = (userRole?: string) => {
  const { user, clientData, isClient } = useAuth();
  const [budgets, setBudgets] = useState<LocalBudget[]>([]);
  const [filteredBudgets, setFilteredBudgets] = useState<LocalBudget[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBudgets();
  }, [userRole, clientData, isClient]);

  const fetchBudgets = async () => {
    setLoading(true);
    try {
      console.log('=== FETCHING BUDGETS ===');
      console.log('User role:', userRole);
      
      // Criar query base
      let query = supabase
        .from('budgets')
        .select(`
          *,
          clients (
            id,
            name,
            email,
            phone,
            client_type,
            cpf,
            cnpj,
            razao_social,
            birth_date,
            cep,
            street,
            number,
            complement,
            neighborhood,
            city,
            state,
            allow_system_access,
            system_password
          ),
          budget_items (
            *,
            products (
              id,
              name,
              internal_code,
              price
            )
          )
        `);

      // Se for cliente, mostrar apenas seus próprios orçamentos
      if (userRole === 'cliente') {
        let clientId = null;
        
        console.log('=== CLIENTE DETECTION ===');
        console.log('isClient:', isClient);
        console.log('clientData:', clientData);
        
        if (isClient && clientData) {
          // Cliente logado via sistema customizado
          console.log('Cliente autenticado via sistema customizado:', clientData);
          clientId = clientData.id;
        } else {
          // Cliente logado via auth normal do Supabase
          const { data: userData } = await supabase.auth.getUser();
          console.log('User data:', userData);
          
          if (userData.user) {
            console.log('Buscando cliente por email:', userData.user.email);
            const { data: clientAuthData, error: clientError } = await supabase
              .from('clients')
              .select('id')
              .eq('email', userData.user.email)
              .single();
              
            console.log('Cliente encontrado via auth:', clientAuthData, 'Error:', clientError);
            if (clientAuthData) {
              clientId = clientAuthData.id;
            }
          }
        }
        
        if (clientId) {
          console.log('Cliente encontrado, buscando orçamentos para clientId:', clientId);
          // Buscar orçamentos onde o cliente é o destinatário OU o criador
          query = query.or(`client_id.eq.${clientId},created_by.eq.${clientId}`);
        } else {
          // Se não encontrou o cliente, mostrar lista vazia mas permitir criar orçamentos
          console.log('Cliente não encontrado');
          setBudgets([]);
          setFilteredBudgets([]);
          setLoading(false);
          return;
        }
      }
      
      // Para vendas, mostrar apenas orçamentos criados por eles
      if (userRole === 'vendas' && user?.id) {
        query = query.eq('created_by', user.id);
      }
      
      // Admin e gerente veem todos os orçamentos

      console.log('Query final:', query);
      const { data: budgetsData, error: budgetsError } = await query
        .order('created_at', { ascending: false });

      if (budgetsError) {
        console.error('Error fetching budgets:', budgetsError);
        toast.error('Erro ao carregar orçamentos');
        return;
      }

      console.log('Raw budgets data:', budgetsData);
      
      // LOGS DETALHADOS PARA DEBUG
      console.log('=== DIAGNÓSTICO COMPLETO DOS DADOS ===');
      console.log('Número de orçamentos:', budgetsData?.length);
      
      if (budgetsData && budgetsData.length > 0) {
        const firstBudget = budgetsData[0];
        console.log('=== PRIMEIRO ORÇAMENTO COMPLETO ===');
        console.log(JSON.stringify(firstBudget, null, 2));
        
        console.log('=== DADOS DO CLIENTE ===');
        console.log('Cliente existe:', !!firstBudget.clients);
        console.log('Cliente completo:', firstBudget.clients);
        
        if (firstBudget.clients) {
          console.log('Campos disponíveis:', Object.keys(firstBudget.clients));
          console.log('client_type valor:', firstBudget.clients.client_type);
          console.log('name valor:', firstBudget.clients.name);
          console.log('email valor:', firstBudget.clients.email);
          console.log('cpf valor:', firstBudget.clients.cpf);
          console.log('cnpj valor:', firstBudget.clients.cnpj);
        } else {
          console.log('❌ CLIENTE É NULL/UNDEFINED!');
        }
      }

      if (budgetsData && budgetsData.length > 0) {
        // Testar query direta de clientes para verificar RLS
        console.log('=== TESTANDO ACESSO DIRETO À TABELA CLIENTS ===');
        const { data: clientsTest, error: clientsTestError } = await supabase
          .from('clients')
          .select(`
            id,
            name, 
            email,
            phone,
            client_type,
            cpf,
            cnpj,
            razao_social,
            birth_date,
            cep,
            street,
            number,
            complement,
            neighborhood,
            city,
            state
          `)
          .limit(3);
          
        console.log('Teste clientes direto - Dados:', clientsTest);
        console.log('Teste clientes direto - Erro:', clientsTestError);

        // Buscar perfis dos criadores separadamente
        const creatorIds = [...new Set(budgetsData.map(budget => budget.created_by))];
        console.log('Creator IDs:', creatorIds);

        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name, email, role')
          .in('id', creatorIds);

        if (profilesError) {
          console.error('Error fetching creator profiles:', profilesError);
          // Continuar sem os perfis se houver erro
        }

        console.log('Profiles data:', profilesData);

        // Combinar os dados
        const processedData = budgetsData.map(budget => {
          const creatorProfile = profilesData?.find(profile => profile.id === budget.created_by) || null;
          
          return {
            ...budget,
            creator_profile: creatorProfile
          };
        });

        console.log('Processed budgets data:', processedData);
        
        setBudgets(processedData as LocalBudget[]);
        setFilteredBudgets(processedData as LocalBudget[]);
        console.log('Budgets loaded successfully:', processedData.length);
      } else {
        console.log('No budgets found');
        setBudgets([]);
        setFilteredBudgets([]);
      }
    } catch (error) {
      console.error('Unexpected error fetching budgets:', error);
      toast.error('Erro inesperado ao carregar orçamentos');
    } finally {
      setLoading(false);
      console.log('=== END FETCHING BUDGETS ===');
    }
  };

  const createBudget = async (budgetData: any, userId: string) => {
    setLoading(true);
    try {
      // Extract budget items
      const budgetItems = budgetData.items;

      // Remove budget items from budget data to avoid inserting directly into budgets table
      const { items, ...budgetWithoutItems } = budgetData;

      // Create the budget
      const { data: budget, error: budgetError } = await supabase
        .from('budgets')
        .insert([
          {
            ...budgetWithoutItems,
            created_by: userId,
            total_amount: 0, // Set initial total amount
          },
        ])
        .select()
        .single();

      if (budgetError) {
        console.error('Error creating budget:', budgetError);
        toast.error('Erro ao criar orçamento');
        return;
      }

      // Create budget items
      if (budgetItems && budgetItems.length > 0) {
        const itemsToInsert = budgetItems.map((item: any) => ({
          ...item,
          budget_id: budget.id,
          total_price: item.quantity * item.unit_price,
        }));

        const { error: itemsError } = await supabase
          .from('budget_items')
          .insert(itemsToInsert);

        if (itemsError) {
          console.error('Error creating budget items:', itemsError);
          toast.error('Erro ao criar itens do orçamento');
          return;
        }
      }

      // Update the total_amount in the budget
      await updateBudgetTotalAmount(budget.id);

      toast.success('Orçamento criado com sucesso!');
      fetchBudgets(); // Refresh budgets
    } catch (error) {
      console.error('Unexpected error creating budget:', error);
      toast.error('Erro inesperado ao criar orçamento');
    } finally {
      setLoading(false);
    }
  };

  const updateBudget = async (budgetData: any, editingBudget: LocalBudget) => {
    setLoading(true);
    try {
      // Extract budget items
      const budgetItems = budgetData.items;

      // Remove budget items from budget data to avoid updating directly into budgets table
      const { items, ...budgetWithoutItems } = budgetData;

      // Update the budget
      const { error: budgetError } = await supabase
        .from('budgets')
        .update({
          ...budgetWithoutItems,
        })
        .eq('id', editingBudget.id);

      if (budgetError) {
        console.error('Error updating budget:', budgetError);
        toast.error('Erro ao atualizar orçamento');
        return;
      }

      // Delete existing budget items
      const { error: deleteError } = await supabase
        .from('budget_items')
        .delete()
        .eq('budget_id', editingBudget.id);

      if (deleteError) {
        console.error('Error deleting existing budget items:', deleteError);
        toast.error('Erro ao remover itens antigos do orçamento');
        return;
      }

      // Create budget items
      if (budgetItems && budgetItems.length > 0) {
        const itemsToInsert = budgetItems.map((item: any) => ({
          ...item,
          budget_id: editingBudget.id,
          total_price: item.quantity * item.unit_price,
        }));

        const { error: itemsError } = await supabase
          .from('budget_items')
          .insert(itemsToInsert);

        if (itemsError) {
          console.error('Error creating budget items:', itemsError);
          toast.error('Erro ao criar itens do orçamento');
          return;
        }
      }

      // Update the total_amount in the budget
      await updateBudgetTotalAmount(editingBudget.id);

      toast.success('Orçamento atualizado com sucesso!');
      fetchBudgets(); // Refresh budgets
    } catch (error) {
      console.error('Unexpected error updating budget:', error);
      toast.error('Erro inesperado ao atualizar orçamento');
    } finally {
      setLoading(false);
    }
  };

  const deleteBudget = async (id: string) => {
    setLoading(true);
    try {
      // Delete budget items first
      const { error: itemsError } = await supabase
        .from('budget_items')
        .delete()
        .eq('budget_id', id);

      if (itemsError) {
        console.error('Error deleting budget items:', itemsError);
        toast.error('Erro ao remover itens do orçamento');
        return;
      }

      // Then delete the budget
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting budget:', error);
        toast.error('Erro ao excluir orçamento');
        return;
      }

      toast.success('Orçamento excluído com sucesso!');
      fetchBudgets(); // Refresh budgets
    } catch (error) {
      console.error('Unexpected error deleting budget:', error);
      toast.error('Erro inesperado ao excluir orçamento');
    } finally {
      setLoading(false);
    }
  };

  const updateBudgetTotalAmount = async (budgetId: string) => {
    try {
      const { data: budgetItems, error: itemsError } = await supabase
        .from('budget_items')
        .select('quantity, unit_price')
        .eq('budget_id', budgetId);

      if (itemsError) {
        console.error('Error fetching budget items:', itemsError);
        toast.error('Erro ao carregar itens do orçamento para cálculo do valor total');
        return;
      }

      // Calculate total amount
      const totalAmount = budgetItems.reduce((sum, item) => {
        return sum + (item.quantity * item.unit_price);
      }, 0);

      // Update the budget with the new total_amount
      const { error: updateError } = await supabase
        .from('budgets')
        .update({ total_amount: totalAmount })
        .eq('id', budgetId);

      if (updateError) {
        console.error('Error updating budget with total amount:', updateError);
        toast.error('Erro ao atualizar orçamento com o valor total calculado');
      }
    } catch (error) {
      console.error('Unexpected error calculating and updating budget total amount:', error);
      toast.error('Erro inesperado ao calcular e atualizar o valor total do orçamento');
    }
  };

  return {
    budgets,
    filteredBudgets,
    setFilteredBudgets,
    loading,
    fetchBudgets,
    createBudget,
    updateBudget,
    deleteBudget,
  };
};
