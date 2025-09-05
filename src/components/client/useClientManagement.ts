
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
  const { userProfile } = useUserProfile();

  useEffect(() => {
    if (userProfile) {
      fetchClients();
    }
  }, [userProfile]);

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

  const fetchClients = async () => {
    try {
      let query = supabase
        .from('clients')
        .select('*')
        .order('name', { ascending: true });

      // Se não for admin ou gerente, filtrar apenas clientes atribuídos ou não atribuídos
      if (userProfile && userProfile.role === 'vendas') {
        query = query.or(`assigned_user_id.is.null,assigned_user_id.eq.${userProfile.id}`);
      }

      const { data, error } = await query;

      if (error) throw error;
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
    loading,
    showForm,
    editingClient,
    clientToDelete,
    searchTerm,
    typeFilter,
    setSearchTerm,
    setTypeFilter,
    setClientToDelete,
    handleNewClient,
    handleEdit,
    handleDelete,
    handleFormClose,
    handleFormSuccess,
    handleDeleteConfirm,
  };
};
