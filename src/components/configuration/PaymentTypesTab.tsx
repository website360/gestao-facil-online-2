
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PaymentType {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
}

const PaymentTypesTab = () => {
  const [paymentTypes, setPaymentTypes] = useState<PaymentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PaymentType | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    active: true
  });

  useEffect(() => {
    fetchPaymentTypes();
  }, []);

  const fetchPaymentTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_types')
        .select('*')
        .order('name');

      if (error) throw error;
      setPaymentTypes(data || []);
    } catch (error) {
      console.error('Erro ao carregar tipos de pagamento:', error);
      toast.error('Erro ao carregar tipos de pagamento');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingItem) {
        const { error } = await supabase
          .from('payment_types')
          .update(formData)
          .eq('id', editingItem.id);

        if (error) throw error;
        toast.success('Tipo de pagamento atualizado!');
      } else {
        const { error } = await supabase
          .from('payment_types')
          .insert([formData]);

        if (error) throw error;
        toast.success('Tipo de pagamento criado!');
      }

      setDialogOpen(false);
      resetForm();
      fetchPaymentTypes();
    } catch (error) {
      console.error('Erro ao salvar tipo de pagamento:', error);
      toast.error('Erro ao salvar tipo de pagamento');
    }
  };

  const handleEdit = (item: PaymentType) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      active: item.active
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este tipo de pagamento?')) return;

    try {
      const { error } = await supabase
        .from('payment_types')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Tipo de pagamento excluído!');
      fetchPaymentTypes();
    } catch (error) {
      console.error('Erro ao excluir tipo de pagamento:', error);
      toast.error('Erro ao excluir tipo de pagamento');
    }
  };

  const toggleActive = async (id: string, active: boolean) => {
    try {
      const { error } = await supabase
        .from('payment_types')
        .update({ active })
        .eq('id', id);

      if (error) throw error;
      fetchPaymentTypes();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', active: true });
    setEditingItem(null);
  };

  if (loading) {
    return <div>Carregando tipos de pagamento...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
          <div>
            <CardTitle>Tipos de Pagamento</CardTitle>
            <CardDescription>
              Gerencie os tipos de pagamento disponíveis para os orçamentos
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()} className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Novo Tipo de Pagamento</span>
                <span className="sm:hidden">Novo</span>
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? 'Editar' : 'Novo'} Tipo de Pagamento
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={formData.active}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, active: checked }))}
                  />
                  <Label>Ativo</Label>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingItem ? 'Atualizar' : 'Criar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {/* Desktop Table */}
        <div className="hidden sm:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paymentTypes.map((type) => (
                <TableRow key={type.id}>
                  <TableCell className="font-medium">{type.name}</TableCell>
                  <TableCell>{type.description || '-'}</TableCell>
                  <TableCell>
                    <Switch
                      checked={type.active}
                      onCheckedChange={(checked) => toggleActive(type.id, checked)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(type)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(type.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Mobile Cards */}
        <div className="sm:hidden space-y-4">
          {paymentTypes.map((type) => (
            <Card key={type.id} className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{type.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {type.description || 'Sem descrição'}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={type.active}
                      onCheckedChange={(checked) => toggleActive(type.id, checked)}
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(type)}
                    className="flex-1 h-8 text-xs"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(type.id)}
                    className="flex-1 h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Excluir
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default PaymentTypesTab;
