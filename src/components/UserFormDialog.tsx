
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useUserProfile } from '@/hooks/useUserProfile';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'gerente' | 'vendas' | 'separacao' | 'conferencia' | 'nota_fiscal' | 'cliente' | 'entregador';
  created_at: string;
}

interface UserFormDialogProps {
  showForm: boolean;
  editingUser: User | null;
  onClose: () => void;
  onSuccess: () => void;
}

const UserFormDialog = ({ showForm, editingUser, onClose, onSuccess }: UserFormDialogProps) => {
  const { userProfile } = useUserProfile();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'gerente' | 'vendas' | 'separacao' | 'conferencia' | 'nota_fiscal' | 'cliente' | 'entregador'>('vendas');
  const [loading, setLoading] = useState(false);
  const [changePassword, setChangePassword] = useState(false);

  useEffect(() => {
    if (editingUser) {
      setName(editingUser.name);
      setEmail(editingUser.email);
      setRole(editingUser.role);
      setPassword('');
      setChangePassword(false);
    } else {
      setName('');
      setEmail('');
      setRole('vendas');
      setPassword('');
      setChangePassword(false);
    }
  }, [editingUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingUser) {
        console.log('Updating user:', editingUser.id, 'with data:', { name, email, role });
        console.log('Email changed:', email !== editingUser.email, 'from:', editingUser.email, 'to:', email);

        // SEMPRE sincronizar email entre auth.users e profiles para garantir consistência
        console.log('Sincronizando email para garantir consistência...');
        const { error: emailError } = await supabase.functions.invoke('update-user-email', {
          body: { userId: editingUser.id, newEmail: email }
        });

        if (emailError) {
          console.error('Error updating email:', emailError);
          toast.error('Erro ao atualizar email: ' + emailError.message);
          setLoading(false);
          return;
        }
        console.log('Email sincronizado com sucesso');

        // Update name and role in profiles table
        console.log('Updating profile with name and role...');
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ name, role, email }) // Include email here too for consistency
          .eq('id', editingUser.id);

        if (profileError) {
          console.error('Error updating profile:', profileError);
          toast.error('Erro ao atualizar perfil do usuário');
          setLoading(false);
          return;
        }
        console.log('Profile updated successfully');

        // Update password if requested
        if (changePassword && password) {
          const { error: passwordError } = await supabase.functions.invoke('update-user-password', {
            body: { userId: editingUser.id, newPassword: password }
          });

          if (passwordError) {
            console.error('Error updating password:', passwordError);
            toast.error('Erro ao atualizar senha: ' + passwordError.message);
            setLoading(false);
            return;
          }
        }

        toast.success('Usuário atualizado com sucesso');
      } else {
        // Create new user
        const { data, error } = await supabase.functions.invoke('create-user', {
          body: { name, email, password, role }
        });

        if (error) {
          console.error('Error creating user:', error);
          toast.error('Erro ao criar usuário: ' + error.message);
          setLoading(false);
          return;
        }
        
        toast.success('Usuário criado com sucesso');
      }

      onSuccess();
      
      // Limpar formulário após sucesso
      if (!editingUser) {
        setName('');
        setEmail('');
        setPassword('');
        setRole('vendas');
      }
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error('Erro ao salvar usuário');
    } finally {
      setLoading(false);
    }
  };

  // Verificar se pode alterar senha do usuário
  const canChangePassword = (targetUser: User | null) => {
    if (!userProfile || !targetUser) return false;
    
    // Admin pode alterar senha de todos
    if (userProfile.role === 'admin') return true;
    
    // Gerente pode alterar senha de todos menos admin
    if (userProfile.role === 'gerente' && targetUser.role !== 'admin') return true;
    
    return false;
  };

  return (
    <Dialog open={showForm} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Nome *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div>
            <Label htmlFor="email">E-mail *</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          {!editingUser && (
            <div>
              <Label htmlFor="password">Senha *</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          )}
          
          {editingUser && canChangePassword(editingUser) && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="changePassword" 
                  checked={changePassword}
                  onCheckedChange={(checked) => setChangePassword(checked === true)}
                />
                <Label htmlFor="changePassword">Alterar senha</Label>
              </div>
              
              {changePassword && (
                <div>
                  <Label htmlFor="newPassword">Nova Senha *</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required={changePassword}
                    placeholder="Digite a nova senha"
                  />
                </div>
              )}
            </div>
          )}
          <div>
            <Label htmlFor="role">Função *</Label>
            <Select value={role} onValueChange={(value: 'admin' | 'gerente' | 'vendas' | 'separacao' | 'conferencia' | 'nota_fiscal' | 'cliente' | 'entregador') => setRole(value)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a função" />
              </SelectTrigger>
               <SelectContent>
                 <SelectItem value="admin">Administrador</SelectItem>
                 <SelectItem value="gerente">Gerente</SelectItem>
                 <SelectItem value="vendas">Vendas</SelectItem>
                 <SelectItem value="separacao">Separação</SelectItem>
                 <SelectItem value="conferencia">Conferência</SelectItem>
                 <SelectItem value="nota_fiscal">Nota Fiscal</SelectItem>
                 <SelectItem value="entregador">Entregador</SelectItem>
               </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:justify-end">
            <Button type="button" variant="outline" onClick={onClose} className="order-2 sm:order-1">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="order-1 sm:order-2">
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UserFormDialog;
