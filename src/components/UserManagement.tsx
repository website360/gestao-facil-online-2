
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit, Trash2, UserCircle } from 'lucide-react';
import { DataTable, DataTableColumn } from '@/components/ui/data-table';
import UserFormDialog from './UserFormDialog';
import UserDeleteDialog from './UserDeleteDialog';
import { toast } from 'sonner';
import { useUserProfile } from '@/hooks/useUserProfile';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'gerente' | 'vendas' | 'separacao' | 'conferencia' | 'nota_fiscal' | 'cliente' | 'entregador';
  created_at: string;
}

const UserManagement = () => {
  const { userProfile } = useUserProfile();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  // Verificar se o usuário tem acesso à página
  if (userProfile && !['admin', 'gerente'].includes(userProfile.role)) {
    return (
      <div className="min-h-screen p-2 md:p-6 bg-transparent">
        <Card className="bg-white shadow-sm">
          <CardContent className="p-3 md:p-6">
            <div className="text-center text-red-600">
              Acesso negado. Você não tem permissão para acessar esta página.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleNewUser = () => {
    setEditingUser(null);
    setShowForm(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setShowForm(true);
  };

  const handleDelete = (user: User) => {
    setUserToDelete(user);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingUser(null);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingUser(null);
    fetchUsers();
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;

    try {
      console.log('Calling delete function for user:', userToDelete.id);
      
      // Fazer a chamada diretamente com fetch para obter mais detalhes
      const response = await fetch(`https://hsugdbkauxbjuogzmukp.supabase.co/functions/v1/delete-user`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzdWdkYmthdXhianVvZ3ptdWtwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDk2ODk1NDUsImV4cCI6MjA2NTI2NTU0NX0.zt8k79ttdiKeEk7HOY7dd0RK_5-D3JbMrSSXZjWamuI'
        },
        body: JSON.stringify({ userId: userToDelete.id })
      });

      console.log('Response status:', response.status);
      
      const responseText = await response.text();
      console.log('Response text:', responseText);
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        responseData = { error: 'Invalid JSON response: ' + responseText };
      }

      console.log('Parsed response:', responseData);

      if (!response.ok) {
        toast.error(`Erro ${response.status}: ${responseData.error || responseData.message || 'Erro desconhecido'}`);
        return;
      }

      if (responseData.error) {
        toast.error(responseData.error);
        return;
      }

      toast.success('Usuário excluído com sucesso');
      setUserToDelete(null);
      fetchUsers();
      
    } catch (error: any) {
      console.error('Catch error:', error);
      toast.error('Erro de rede: ' + error.message);
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'gerente': return 'Gerente';
      case 'vendas': return 'Vendas';
      case 'separacao': return 'Separação';
      case 'conferencia': return 'Conferência';
      case 'nota_fiscal': return 'Nota Fiscal';
      case 'cliente': return 'Cliente';
      case 'entregador': return 'Entregador';
      default: return role;
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800';
      case 'gerente': return 'bg-indigo-100 text-indigo-800';
      case 'vendas': return 'bg-blue-100 text-blue-800';
      case 'separacao': return 'bg-orange-100 text-orange-800';
      case 'conferencia': return 'bg-green-100 text-green-800';
      case 'nota_fiscal': return 'bg-yellow-100 text-yellow-800';
      case 'cliente': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Função para verificar se pode excluir um usuário
  const canDeleteUser = (targetUser: User) => {
    if (!userProfile) return false;
    
    // Admin pode excluir todos
    if (userProfile.role === 'admin') return true;
    
    // Gerente pode excluir todos menos admin
    if (userProfile.role === 'gerente' && targetUser.role !== 'admin') return true;
    
    // Outras roles não podem excluir
    return false;
  };

  const columns: DataTableColumn<User>[] = [
    {
      key: 'name',
      header: 'Usuário',
      render: (user) => (
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-gray-100 rounded-md md:rounded-lg flex items-center justify-center">
            <UserCircle className="h-4 w-4 md:h-5 md:w-5 text-gray-500" />
          </div>
          <div>
            <div className="font-medium text-sm md:text-base">{user.name}</div>
            <div className="text-xs md:text-sm text-gray-500">{user.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Função',
      render: (user) => (
        <Badge className={`${getRoleColor(user.role)} text-xs md:text-sm`}>
          {getRoleLabel(user.role)}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      header: 'Data',
      render: (user) => <span className="text-xs md:text-sm">{new Date(user.created_at).toLocaleDateString('pt-BR')}</span>,
    },
    {
      key: 'actions',
      header: 'Ações',
      sortable: false,
      searchable: false,
      width: 'w-32 md:w-40',
      render: (user) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(user)}
            className="h-6 w-6 md:h-8 md:w-8 p-0"
            title="Editar usuário"
          >
            <Edit className="h-3 w-3 md:h-4 md:w-4" />
          </Button>
          {canDeleteUser(user) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(user)}
              className="h-6 w-6 md:h-8 md:w-8 p-0 text-red-600 hover:text-red-700"
              title="Excluir usuário"
            >
              <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen p-2 md:p-6 bg-transparent">
        <Card className="bg-white shadow-sm">
          <CardContent className="p-3 md:p-6">
            <div className="text-center">Carregando usuários...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-2 md:p-6 bg-transparent">
      <Card className="bg-white shadow-sm">
        <CardContent className="p-3 md:p-6 space-y-3 md:space-y-6">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2 md:gap-0">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Gerenciamento de Usuários</h1>
            {userProfile?.role === 'admin' && (
              <Button onClick={handleNewUser} className="btn-gradient w-full md:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Novo Usuário
              </Button>
            )}
          </div>

          <DataTable
            data={users}
            columns={columns}
            searchPlaceholder="Buscar por usuário ou e-mail..."
            itemsPerPage={100}
            emptyMessage="Nenhum usuário encontrado"
          />
        </CardContent>
      </Card>

      <UserFormDialog
        showForm={showForm}
        editingUser={editingUser}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
      />

      <UserDeleteDialog
        userToDelete={userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleDeleteConfirm}
        currentUserRole={userProfile?.role}
      />
    </div>
  );
};

export default UserManagement;
