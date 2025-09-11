
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from '@/components/ui/sonner';
import EmptyState from '@/components/ui/empty-state';
import { Plus, Edit, Trash2, Building2, Truck } from 'lucide-react';

interface Supplier {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

const SupplierManagementTab = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [formData, setFormData] = useState({
    name: '',
  });

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const fetchSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name');

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error) {
      console.error('Erro ao buscar fornecedores:', error);
      toast.error('Erro ao carregar fornecedores');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (editingSupplier) {
        const { error } = await supabase
          .from('suppliers')
          .update({ name: formData.name })
          .eq('id', editingSupplier.id);

        if (error) throw error;
        toast.success('Fornecedor atualizado com sucesso!');
      } else {
        const { error } = await supabase
          .from('suppliers')
          .insert([{ name: formData.name }]);

        if (error) throw error;
        toast.success('Fornecedor criado com sucesso!');
      }

      resetForm();
      setIsDialogOpen(false);
      fetchSuppliers();
    } catch (error) {
      console.error('Erro ao salvar fornecedor:', error);
      toast.error('Erro ao salvar fornecedor');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    setFormData({
      name: supplier.name,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este fornecedor?')) return;

    try {
      const { error } = await supabase
        .from('suppliers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('Fornecedor excluído com sucesso!');
      fetchSuppliers();
    } catch (error) {
      console.error('Erro ao excluir fornecedor:', error);
      toast.error('Erro ao excluir fornecedor');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
    });
    setEditingSupplier(null);
  };

  if (loading && suppliers.length === 0) {
    return <div className="p-6">Carregando fornecedores...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Gestão de Fornecedores
          </CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Novo Fornecedor</span>
                <span className="sm:hidden">Novo</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>
                  {editingSupplier ? 'Editar Fornecedor' : 'Novo Fornecedor'}
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={loading}>
                    {loading ? 'Salvando...' : 'Salvar'}
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
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {suppliers.map((supplier) => (
                <TableRow key={supplier.id}>
                  <TableCell className="font-medium">{supplier.name}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEdit(supplier)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(supplier.id)}
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
          {suppliers.map((supplier) => (
            <Card key={supplier.id} className="p-4">
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">{supplier.name}</h3>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(supplier)}
                    className="flex-1 h-8 text-xs"
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(supplier.id)}
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
        
        {suppliers.length === 0 && !loading && (
          <EmptyState
            title="Nenhum fornecedor cadastrado"
            description="Os fornecedores aparecerão aqui quando forem adicionados."
            icon={Truck}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default SupplierManagementTab;
