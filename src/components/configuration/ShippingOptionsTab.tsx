
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

interface ShippingOption {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  active: boolean;
  delivery_visible?: boolean;
}

const ShippingOptionsTab = () => {
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<ShippingOption | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    active: true
  });

  useEffect(() => {
    fetchShippingOptions();
  }, []);

  const fetchShippingOptions = async () => {
    try {
      const { data, error } = await supabase
        .from('shipping_options')
        .select('id, name, description, price, active, delivery_visible')
        .order('name');

      if (error) throw error;
      setShippingOptions(data || []);
    } catch (error) {
      console.error('Erro ao carregar opções de frete:', error);
      toast.error('Erro ao carregar opções de frete');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingItem) {
        const { error } = await supabase
          .from('shipping_options')
          .update({
            name: formData.name,
            description: formData.description,
            active: formData.active
          })
          .eq('id', editingItem.id);

        if (error) throw error;
        toast.success('Opção de frete atualizada!');
      } else {
        const { error } = await supabase
          .from('shipping_options')
          .insert([{
            name: formData.name,
            description: formData.description,
            active: formData.active,
            price: 0
          }]);

        if (error) throw error;
        toast.success('Opção de frete criada!');
      }

      setDialogOpen(false);
      resetForm();
      fetchShippingOptions();
    } catch (error) {
      console.error('Erro ao salvar opção de frete:', error);
      toast.error('Erro ao salvar opção de frete');
    }
  };

  const handleEdit = (item: ShippingOption) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      active: item.active
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta opção de frete?')) return;

    try {
      const { error } = await supabase
        .from('shipping_options')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Opção de frete excluída!');
      fetchShippingOptions();
    } catch (error) {
      console.error('Erro ao excluir opção de frete:', error);
      toast.error('Erro ao excluir opção de frete');
    }
  };

  const toggleActive = async (id: string, active: boolean) => {
    try {
      const { error } = await supabase
        .from('shipping_options')
        .update({ active })
        .eq('id', id);

      if (error) throw error;
      fetchShippingOptions();
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      toast.error('Erro ao atualizar status');
    }
  };

  const toggleDeliveryVisible = async (id: string, delivery_visible: boolean) => {
    try {
      const { error } = await supabase
        .from('shipping_options')
        .update({ delivery_visible })
        .eq('id', id);

      if (error) throw error;
      fetchShippingOptions();
    } catch (error) {
      console.error('Erro ao atualizar visibilidade para entregador:', error);
      toast.error('Erro ao atualizar visibilidade para entregador');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', description: '', active: true });
    setEditingItem(null);
  };

  if (loading) {
    return <div>Carregando opções de frete...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>Opções de Frete</CardTitle>
            <CardDescription>
              Gerencie as opções de frete disponíveis para os orçamentos
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Opção de Frete
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingItem ? 'Editar' : 'Nova'} Opção de Frete
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>Descrição</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Visível p/ Entregador</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shippingOptions.map((option) => (
              <TableRow key={option.id}>
                <TableCell className="font-medium">{option.name}</TableCell>
                <TableCell>{option.description || '-'}</TableCell>
                <TableCell>
                  <Switch
                    checked={option.active}
                    onCheckedChange={(checked) => toggleActive(option.id, checked)}
                  />
                </TableCell>
                <TableCell>
                  <Switch
                    checked={option.delivery_visible || false}
                    onCheckedChange={(checked) => toggleDeliveryVisible(option.id, checked)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(option)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(option.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default ShippingOptionsTab;
