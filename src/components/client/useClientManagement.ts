
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Client } from './types';
import { useUserProfile } from '@/hooks/useUserProfile';

export const useClientManagement = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  
  // Pagination state
  const [itemsPerPage, setItemsPerPage] = useState(300);
  const [currentPage, setCurrentPage] = useState(1);
  
  const { userProfile } = useUserProfile();

  useEffect(() => {
    if (userProfile) {
      fetchClients();
    }
  }, [userProfile]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter]);

  useEffect(() => {
    let filtered = clients;

    if (searchTerm) {
      filtered = filtered.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.cpf?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        client.cnpj?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(client => client.client_type === typeFilter);
    }

    setFilteredClients(filtered);
  }, [clients, searchTerm, typeFilter]);

  // Pagination calculations
  const totalItems = filteredClients.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedClients = filteredClients.slice(startIndex, endIndex);

  const fetchClients = async () => {
    try {
      console.log('Iniciando carregamento de clientes...');
      
      // Primeiro, verificar quantos clientes existem
      const { count } = await supabase
        .from('clients')
        .select('*', { count: 'exact', head: true });
      
      console.log(`Total de clientes no banco: ${count}`);
      
      let allClients: any[] = [];
      const pageSize = 1000;
      let currentPage = 0;
      let hasMore = true;
      
      // Carregar todos os clientes usando paginação
      while (hasMore) {
         let query = supabase
           .from('clients')
           .select('*')
           .order('name', { ascending: true })
           .range(currentPage * pageSize, (currentPage + 1) * pageSize - 1);

        // Se for vendas, filtrar apenas clientes atribuídos especificamente ao usuário
        // Clientes sem vendedor responsável (assigned_user_id null) ficam visíveis apenas para admin e gerente
        if (userProfile && userProfile.role === 'vendas') {
          query = query.eq('assigned_user_id', userProfile.id);
        }

        const { data, error } = await query;

        if (error) throw error;
        
        if (data && data.length > 0) {
          allClients = [...allClients, ...data];
          console.log(`Página ${currentPage + 1}: ${data.length} clientes carregados. Total: ${allClients.length}`);
          currentPage++;
          hasMore = data.length === pageSize; // Se retornou menos que pageSize, acabaram os dados
        } else {
          hasMore = false;
        }
      }

      console.log(`Carregamento finalizado: ${allClients.length} clientes`);
      setClients(allClients);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Erro ao carregar clientes');
    } finally {
      setLoading(false);
    }
  };

  const handleNewClient = () => {
    setEditingClient(null);
    setShowForm(true);
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    setShowForm(true);
  };

  const handleDelete = (client: Client) => {
    setClientToDelete(client);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingClient(null);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingClient(null);
    fetchClients();
  };

  const handleDeleteConfirm = async () => {
    if (!clientToDelete) return;

    try {
      const { error } = await supabase
        .from('clients')
        .delete()
        .eq('id', clientToDelete.id);

      if (error) {
        // Verifica se é um erro de foreign key constraint (cliente tem vendas associadas)
        if (error.code === '23503' && error.message.includes('sales_client_id_fkey')) {
          toast.error('Não é possível excluir este cliente pois existem vendas associadas a ele.');
        } else {
          toast.error('Erro ao excluir cliente');
        }
        return;
      }

      toast.success('Cliente excluído com sucesso');
      setClientToDelete(null);
      fetchClients();
    } catch (error) {
      console.error('Error deleting client:', error);
      toast.error('Erro ao excluir cliente');
    }
  };

  return {
    clients,
    filteredClients,
    paginatedClients,
    loading,
    showForm,
    editingClient,
    clientToDelete,
    searchTerm,
    typeFilter,
    itemsPerPage,
    currentPage,
    totalPages,
    totalItems,
    setSearchTerm,
    setTypeFilter,
    setItemsPerPage,
    setCurrentPage,
    setClientToDelete,
    handleNewClient,
    handleEdit,
    handleDelete,
    handleFormClose,
    handleFormSuccess,
    handleDeleteConfirm,
  };
};
