import React, { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { User } from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';

interface ClientUserSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

interface Profile {
  id: string;
  name: string;
  email: string;
  role: string;
}

export const ClientUserSelector = ({ value, onChange }: ClientUserSelectorProps) => {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const { userProfile } = useUserProfile();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, email, role')
        .in('role', ['vendas', 'vendedor_externo', 'vendedor_interno'])
        .order('name', { ascending: true });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUserName = (userId: string) => {
    if (userId === 'all') return 'Visível apenas para Administradores e Gerentes';
    const user = users.find(u => u.id === userId);
    return user ? `${user.name} (${user.email})` : 'Usuário não encontrado';
  };

  // Verificar se o usuário tem permissão para ver este campo (após todos os hooks)
  const canView = userProfile?.role === 'admin' || userProfile?.role === 'gerente';

  // Se não pode ver, não renderizar nada
  if (!canView) {
    return null;
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="assigned_user">
        <User className="inline-block mr-2 h-4 w-4" />
        Vendedor Responsável
      </Label>
      <Select value={value} onValueChange={onChange} disabled={loading}>
        <SelectTrigger>
          <SelectValue placeholder="Selecione o vendedor responsável" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Visível apenas para Administradores e Gerentes</SelectItem>
          {users.map((user) => (
            <SelectItem key={user.id} value={user.id}>
              {user.name} ({user.email})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};