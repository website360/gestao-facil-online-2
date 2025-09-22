import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Sale {
  id: string;
  client_id: string;
  status: 'separacao' | 'conferencia' | 'nota_fiscal' | 'aguardando_entrega' | 'entrega_realizada' | 'atencao' | 'finalizada';
  total_amount: number;
  notes: string;
  created_at: string;
  created_by: string;
  budget_id?: string | null;
  tracking_code?: string | null;
  invoice_number?: string | null;
  total_volumes?: number | null;
  total_weight_kg?: number | null;
  clients: { name: string } | null;
  created_by_profile: { name: string } | null;
  budgets?: { created_by: string } | null;
  separation_user_id?: string | null;
  conference_user_id?: string | null;
  invoice_user_id?: string | null;
  separation_user_profile?: { name: string } | null;
  conference_user_profile?: { name: string } | null;
  invoice_user_profile?: { name: string } | null;
  conference_complete?: boolean;
  conference_percentage?: number;
  separation_complete?: boolean;
  separation_percentage?: number;
  sale_items?: any[];
  delivery_user_id?: string | null;
  shipping_option_visible?: boolean;
  shipping_option_name?: string | null;
  ready_for_shipping_label?: boolean;
}

export const useSalesManagement = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [filteredSales, setFilteredSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isDeleting, setIsDeleting] = useState(false);

  const checkConferenceStatus = async (saleId: string) => {
    try {
      const { data: saleItems, error: saleItemsError } = await supabase
        .from('sale_items')
        .select('id')
        .eq('sale_id', saleId);

      if (saleItemsError) throw saleItemsError;

      if (!saleItems || saleItems.length === 0) return { complete: false, percentage: 0 };

      const { data: conferenceItems, error: conferenceError } = await supabase
        .from('conference_items')
        .select('sale_item_id, is_correct')
        .eq('sale_id', saleId);

      if (conferenceError) throw conferenceError;

      const correctItems = conferenceItems?.filter(item => item.is_correct).length || 0;
      const totalItems = saleItems.length;
      const percentage = Math.round((correctItems / totalItems) * 100);
      
      return {
        complete: correctItems === totalItems,
        percentage: percentage
      };
    } catch (error) {
      console.error('Erro ao verificar status da conferência:', error);
      return { complete: false, percentage: 0 };
    }
  };

  const checkSeparationStatus = async (saleId: string) => {
    try {
      const { data: saleItems, error: saleItemsError } = await supabase
        .from('sale_items')
        .select('id, quantity')
        .eq('sale_id', saleId);

      if (saleItemsError) throw saleItemsError;

      if (!saleItems || saleItems.length === 0) return { complete: false, percentage: 0 };

      const { data: separationItems, error: separationError } = await supabase
        .from('separation_items')
        .select('sale_item_id, separated_quantity, total_quantity')
        .eq('sale_id', saleId);

      if (separationError) throw separationError;

      let totalExpected = 0;
      let totalSeparated = 0;

      saleItems.forEach(item => {
        totalExpected += item.quantity;
        const separationItem = separationItems?.find(si => si.sale_item_id === item.id);
        if (separationItem) {
          totalSeparated += separationItem.separated_quantity;
        }
      });

      const percentage = totalExpected > 0 ? Math.round((totalSeparated / totalExpected) * 100) : 0;
      
      return {
        complete: totalSeparated >= totalExpected && totalExpected > 0,
        percentage: percentage
      };
    } catch (error) {
      console.error('Erro ao verificar status da separação:', error);
      return { complete: false, percentage: 0 };
    }
  };

  const fixMissingHistoryData = async (sale: Sale) => {
    try {
      console.log('Corrigindo dados de histórico para venda:', sale.id, 'Status:', sale.status);
      
      const updateData: any = {};

      if (['conferencia', 'nota_fiscal', 'aguardando_entrega', 'entrega_realizada', 'finalizada'].includes(sale.status) && !sale.separation_user_id) {
        updateData.separation_user_id = sale.created_by;
        updateData.separation_completed_at = sale.created_at;
        console.log('Definindo separation_user_id:', sale.created_by);
      }

      if (['nota_fiscal', 'aguardando_entrega', 'entrega_realizada', 'finalizada'].includes(sale.status) && !sale.conference_user_id) {
        updateData.conference_user_id = sale.created_by;
        updateData.conference_completed_at = sale.created_at;
        console.log('Definindo conference_user_id:', sale.created_by);
      }

      if (['aguardando_entrega', 'entrega_realizada', 'finalizada'].includes(sale.status) && !sale.invoice_user_id) {
        updateData.invoice_user_id = sale.created_by;
        updateData.invoice_completed_at = sale.created_at;
        console.log('Definindo invoice_user_id:', sale.created_by);
      }

      if (Object.keys(updateData).length > 0) {
        const { error } = await supabase
          .from('sales')
          .update(updateData)
          .eq('id', sale.id);

        if (error) throw error;
        console.log('Dados de histórico corrigidos para venda:', sale.id);
      }
    } catch (error) {
      console.error('Erro ao corrigir dados de histórico:', error);
    }
  };

  const fetchSales = async () => {
    try {
      console.log('Fetching sales from database...');
      setLoading(true);
      
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select(`
          *,
          clients(name),
          budgets(created_by),
          sale_items(
            *,
            products(
              id,
              name,
              price
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (salesError) {
        console.error('Error fetching sales:', salesError);
        throw salesError;
      }

      console.log('Sales data fetched:', salesData?.length || 0, 'records');

      if (!salesData || salesData.length === 0) {
        console.log('No sales data found');
        setSales([]);
        return;
      }

      // Buscar informações de shipping_options separadamente
      const shippingOptionIds = [...new Set(salesData.map(sale => sale.shipping_option_id).filter(Boolean))];
      let shippingOptionsData: any[] = [];
      
      if (shippingOptionIds.length > 0) {
        const { data: shippingData, error: shippingError } = await supabase
          .from('shipping_options')
          .select('id, name, delivery_visible')
          .in('id', shippingOptionIds);
          
        if (shippingError) {
          console.error('Error fetching shipping options:', shippingError);
        } else {
          shippingOptionsData = shippingData || [];
        }
      }

      const allUserIds = [...new Set([
        ...salesData.map(sale => sale.created_by),
        ...salesData.map(sale => sale.separation_user_id).filter(Boolean),
        ...salesData.map(sale => sale.conference_user_id).filter(Boolean),
        ...salesData.map(sale => sale.invoice_user_id).filter(Boolean),
        ...salesData.map(sale => sale.delivery_user_id).filter(Boolean)
      ])];
      
      console.log('Fetching profiles for users:', allUserIds);
      
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', allUserIds);

      if (profilesError) {
        console.error('Erro ao buscar profiles:', profilesError);
        // Não pare a execução mesmo se houver erro nos perfis
      }

      console.log('Profiles data:', profilesData?.length || 0, 'records');
      console.log('Profiles found:', profilesData);

      const enrichedSales = await Promise.all(salesData.map(async (sale) => {
        let conference_complete = false;
        let conference_percentage = 0;
        let separation_complete = false;
        let separation_percentage = 0;
        
        if (sale.status === 'conferencia' || sale.status === 'nota_fiscal') {
          const conferenceStatus = await checkConferenceStatus(sale.id);
          conference_complete = conferenceStatus.complete;
          conference_percentage = conferenceStatus.percentage;
        }

        if (sale.status === 'separacao' || sale.status === 'conferencia' || sale.status === 'nota_fiscal' || sale.status === 'aguardando_entrega' || sale.status === 'entrega_realizada' || sale.status === 'finalizada') {
          const separationStatus = await checkSeparationStatus(sale.id);
          separation_complete = separationStatus.complete;
          separation_percentage = separationStatus.percentage;
        }

        // Encontrar a opção de frete para esta venda
        const shippingOption = shippingOptionsData.find(option => option.id === sale.shipping_option_id);

        const enrichedSale = {
          ...sale,
          clients: sale.clients ? { name: (sale.clients as any).name } : null,
          budgets: sale.budgets ? { created_by: (sale.budgets as any).created_by } : null,
          shipping_option_visible: shippingOption?.delivery_visible || false,
          shipping_option_name: shippingOption?.name || null,
          created_by_profile: profilesData?.find(p => p.id === sale.created_by) || null,
          separation_user_profile: profilesData?.find(p => p.id === sale.separation_user_id) || null,
          conference_user_profile: profilesData?.find(p => p.id === sale.conference_user_id) || null,
          invoice_user_profile: profilesData?.find(p => p.id === sale.invoice_user_id) || null,
          delivery_user_profile: profilesData?.find(p => p.id === sale.delivery_user_id) || null,
          conference_complete,
          conference_percentage,
          separation_complete,
          separation_percentage
        };

        await fixMissingHistoryData(enrichedSale);
        return enrichedSale;
      }));

      console.log('Enriched sales:', enrichedSales.length, 'records');
      console.log('Sample enriched sale:', enrichedSales[0]);
      setSales(enrichedSales);
    } catch (error: any) {
      console.error('Erro ao buscar vendas:', error);
      toast.error('Erro ao carregar vendas: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  const getUserRole = async () => {
    try {
      console.log('Fetching user role...');
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user found');
        return;
      }

      console.log('User ID:', user.id);

      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user role:', error);
        throw error;
      }
      
      console.log('User role:', data.role);
      setUserRole(data.role);
    } catch (error) {
      console.error('Erro ao buscar role do usuário:', error);
      setUserRole('');
    }
  };

  const filterAndSortSales = () => {
    let filtered = sales.filter(sale => {
      switch (userRole) {
        case 'admin':
        case 'gerente':
        case 'vendedor_externo':
        case 'vendedor_interno':
          return true;
        case 'separacao':
          return sale.status === 'separacao';
        case 'conferencia':
          // Ocultar vendas que foram finalizadas na conferência e enviadas para nota fiscal
          return sale.status === 'conferencia';
        case 'nota_fiscal':
          return sale.status === 'nota_fiscal';
        case 'entregador':
          // Para entregadores, filtrar apenas vendas aguardando entrega com shipping_option_visible = true
          return sale.shipping_option_visible && sale.status === 'aguardando_entrega';
        default:
          return false;
      }
    });

    if (searchTerm) {
      const filteredWithOriginalIndex = filtered.map((sale) => {
        // Encontrar o índice original na lista completa de vendas
        const originalIndex = sales.findIndex(s => s.id === sale.id);
        return {
          ...sale,
          originalIndex
        };
      }).filter((sale) => {
        // Gerar o ID formatado para o índice original
        const startIndex = (currentPage - 1) * 20;
        const sequentialNumber = (startIndex + sale.originalIndex + 1).toString().padStart(8, '0');
        const formattedId = `#V${sequentialNumber}`;
        
        const idMatch = sale.id.toLowerCase().includes(searchTerm.toLowerCase());
        const formattedIdMatch = formattedId.toLowerCase().includes(searchTerm.toLowerCase());
        const sequentialMatch = sequentialNumber.includes(searchTerm);
        const clientMatch = sale.clients?.name.toLowerCase().includes(searchTerm.toLowerCase());
        const createdByMatch = sale.created_by_profile?.name.toLowerCase().includes(searchTerm.toLowerCase());
        const notesMatch = sale.notes?.toLowerCase().includes(searchTerm.toLowerCase());
        const invoiceMatch = sale.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase());
        const statusMatch = getStatusLabel(sale.status).toLowerCase().includes(searchTerm.toLowerCase());
        
        return idMatch || formattedIdMatch || sequentialMatch || clientMatch || createdByMatch || notesMatch || invoiceMatch || statusMatch;
      });
      
      // Remover a propriedade temporária originalIndex
      filtered = filteredWithOriginalIndex.map(({ originalIndex, ...sale }) => sale);
    }

    // Filtrar por status se não for "todos"
    if (statusFilter && statusFilter !== 'todos') {
      filtered = filtered.filter(sale => sale.status === statusFilter);
    }

    filtered.sort((a, b) => {
      let aVal: any = a[sortField as keyof Sale];
      let bVal: any = b[sortField as keyof Sale];

      if (sortField === 'client_name') {
        aVal = a.clients?.name || '';
        bVal = b.clients?.name || '';
      } else if (sortField === 'status_label') {
        aVal = getStatusLabel(a.status);
        bVal = getStatusLabel(b.status);
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc' 
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      if (sortDirection === 'asc') {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    setFilteredSales(filtered);
    setCurrentPage(1);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'separacao': return 'Separação';
      case 'conferencia': return 'Conferência';
      case 'nota_fiscal': return 'Nota Fiscal';
      case 'aguardando_entrega': return 'Aguardando Entrega';
      case 'entrega_realizada': return 'Entrega Realizada';
      case 'atencao': return 'Atenção';
      case 'finalizada': return 'Finalizada';
      default: return status;
    }
  };

  const handleDelete = async (id: string) => {
    setIsDeleting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Usuário não autenticado');
        return;
      }

      // Buscar os itens da venda antes de deletar para retornar o estoque
      const { data: saleItems, error: saleItemsError } = await supabase
        .from('sale_items')
        .select('product_id, quantity')
        .eq('sale_id', id);

      if (saleItemsError) throw saleItemsError;

      // Retornar estoque para cada produto
      if (saleItems && saleItems.length > 0) {
        for (const item of saleItems) {
          // Buscar estoque atual do produto
          const { data: product, error: productError } = await supabase
            .from('products')
            .select('stock')
            .eq('id', item.product_id)
            .single();

          if (productError) {
            console.error('Erro ao buscar produto:', productError);
            continue;
          }

          const currentStock = product.stock;
          const newStock = currentStock + item.quantity;

          // Atualizar estoque do produto
          const { error: updateError } = await supabase
            .from('products')
            .update({ stock: newStock })
            .eq('id', item.product_id);

          if (updateError) {
            console.error('Erro ao atualizar estoque:', updateError);
            throw new Error(`Erro ao retornar estoque para o produto: ${updateError.message}`);
          }

          // Registrar movimento de estoque
          try {
            await supabase.rpc('register_stock_movement', {
              p_product_id: item.product_id,
              p_user_id: user.id,
              p_movement_type: 'entrada',
              p_quantity: item.quantity,
              p_previous_stock: currentStock,
              p_new_stock: newStock,
              p_reason: 'ajuste_manual',
              p_reference_id: id,
              p_notes: 'Estoque retornado devido à exclusão da venda'
            });
          } catch (movementError) {
            console.error('Erro ao registrar movimento de estoque:', movementError);
            // Não bloquear a exclusão se houver erro no movimento
          }

          console.log(`Estoque retornado: Produto ${item.product_id}, Quantidade: ${item.quantity}, Estoque: ${currentStock} -> ${newStock}`);
        }
      }

      // Deletar os itens da venda
      const { error: itemsError } = await supabase
        .from('sale_items')
        .delete()
        .eq('sale_id', id);

      if (itemsError) throw itemsError;

      // Deletar registros relacionados de separação e conferência
      await supabase.from('separation_items').delete().eq('sale_id', id);
      await supabase.from('conference_items').delete().eq('sale_id', id);

      // Deletar a venda
      const { error } = await supabase
        .from('sales')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Venda excluída com sucesso! Estoque dos produtos foi retornado.');
      fetchSales();
    } catch (error) {
      console.error('Erro ao excluir venda:', error);
      toast.error('Erro ao excluir venda: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmInvoice = async (saleId: string, invoiceNumber: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Usuário não autenticado');
        return;
      }

      const { error } = await supabase
        .from('sales')
        .update({
          status: 'entrega_realizada',
          invoice_user_id: user.id,
          invoice_completed_at: new Date().toISOString(),
          invoice_number: invoiceNumber
        })
        .eq('id', saleId);

      if (error) throw error;

      toast.success('Nota fiscal confirmada! Venda finalizada.');
      fetchSales();
    } catch (error) {
      console.error('Erro ao confirmar nota fiscal:', error);
      toast.error('Erro ao confirmar nota fiscal');
    }
  };

  const handleReturnToSales = async (saleId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Usuário não autenticado');
        return;
      }

      // Buscar informações da venda para saber quem foi o vendedor responsável
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .select('created_by, responsible_user_id')
        .eq('id', saleId)
        .single();

      if (saleError) throw saleError;

      // Definir o responsável da venda (prioriza responsible_user_id, senão usa created_by)
      const responsibleUserId = saleData.responsible_user_id || saleData.created_by;

      const { error } = await supabase
        .from('sales')
        .update({
          status: 'separacao',
          responsible_user_id: responsibleUserId,
          separation_user_id: null,
          separation_completed_at: null,
          conference_user_id: null,
          conference_completed_at: null,
          invoice_user_id: null,
          invoice_completed_at: null
        })
        .eq('id', saleId);

      if (error) throw error;

      toast.success('Venda retornada para o responsável com status "Atenção"');
      fetchSales();
    } catch (error) {
      console.error('Erro ao retornar venda para vendas:', error);
      toast.error('Erro ao retornar venda para vendas');
    }
  };

  useEffect(() => {
    console.log('SalesManagement: Component mounted, fetching sales...');
    fetchSales();
    getUserRole();
  }, []);

  useEffect(() => {
    filterAndSortSales();
  }, [sales, searchTerm, statusFilter, userRole, sortField, sortDirection]);

  return {
    sales,
    filteredSales,
    loading,
    userRole,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter,
    currentPage,
    setCurrentPage,
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
    fetchSales,
    handleDelete,
    handleConfirmInvoice,
    handleReturnToSales,
    getStatusLabel,
    isDeleting
  };
};
