
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
        client.email.toLowerCase().includes(searchTerm.toLowerCase())
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
      let query = supabase
        .from('clients')
        .select('*')
        .order('name', { ascending: true })
        .limit(5000); // Aumentar limite para garantir que todos os clientes sejam carregados

      // Se não for admin ou gerente, filtrar apenas clientes atribuídos ou não atribuídos
      if (userProfile && userProfile.role === 'vendas') {
        query = query.or(`assigned_user_id.is.null,assigned_user_id.eq.${userProfile.id}`);
      }

      const { data, error } = await query;

      if (error) throw error;
      console.log(`Clientes carregados: ${data?.length || 0}`);
      setClients(data || []);
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
