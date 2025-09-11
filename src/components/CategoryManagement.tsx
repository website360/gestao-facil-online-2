import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, Tag, TrashIcon } from 'lucide-react';
import { DataTable, DataTableColumn } from '@/components/ui/data-table';
import { useBulkSelection } from '@/hooks/useBulkSelection';
import CategoryFormDialog from './CategoryFormDialog';
import CategoryDeleteDialog from './CategoryDeleteDialog';
import BulkDeleteDialog from './common/BulkDeleteDialog';
import { toast } from 'sonner';

interface Category {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

const CategoryManagement = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [deletingBulk, setDeletingBulk] = useState(false);

  const {
    selectedItems,
    isAllSelected,
    isPartiallySelected,
    toggleItem,
    toggleAll,
    clearSelection,
    selectedCount
  } = useBulkSelection(categories.map(c => c.id));

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Erro ao carregar categorias');
    } finally {
      setLoading(false);
    }
  };

  const handleNewCategory = () => {
    setEditingCategory(null);
    setShowForm(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setShowForm(true);
  };

  const handleDelete = (category: Category) => {
    setCategoryToDelete(category);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingCategory(null);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingCategory(null);
    fetchCategories();
  };

  const handleDeleteConfirm = async () => {
    if (!categoryToDelete) return;

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', categoryToDelete.id);

      if (error) throw error;

      toast.success('Categoria excluída com sucesso!');
      setCategoryToDelete(null);
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Erro ao excluir categoria');
    }
  };

  const handleBulkDelete = async () => {
    setDeletingBulk(true);
    setTimeout(() => {
      clearSelection();
      setShowBulkDeleteDialog(false);
      setDeletingBulk(false);
      fetchCategories();
      toast.success(`${selectedCount} categoria(s) excluída(s) com sucesso!`);
    }, 1000);
  };

  const columns: DataTableColumn<Category>[] = [
    {
      key: 'name',
      header: 'Categoria',
      render: (category) => (
        <div className="flex items-center gap-2 md:gap-3">
          <div className="p-1 md:p-2 bg-blue-100 rounded-md md:rounded-lg">
            <Tag className="h-3 w-3 md:h-4 md:w-4 text-blue-600" />
          </div>
          <div>
            <div className="font-medium text-sm md:text-base">{category.name}</div>
            {category.description && (
              <div className="text-xs md:text-sm text-gray-500">{category.description}</div>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'created_at',
      header: 'Data de Criação',
      render: (category) => new Date(category.created_at).toLocaleDateString('pt-BR'),
    },
    {
      key: 'actions',
      header: 'Ações',
      sortable: false,
      searchable: false,
      width: 'w-32',
      render: (category) => (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(category)}
            className="h-6 w-6 md:h-8 md:w-8 p-0"
            title="Editar categoria"
          >
            <Edit className="h-3 w-3 md:h-4 md:w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(category)}
            className="h-6 w-6 md:h-8 md:w-8 p-0 text-red-600 hover:text-red-700"
            title="Excluir categoria"
          >
            <Trash2 className="h-3 w-3 md:h-4 md:w-4" />
          </Button>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen p-2 md:p-6 bg-transparent">
        <Card className="bg-white shadow-sm">
          <CardContent className="p-3 md:p-6">
            <div className="text-center">Carregando categorias...</div>
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
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Categorias</h1>
            <Button onClick={handleNewCategory} className="btn-gradient w-full md:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              Nova Categoria
            </Button>
          </div>

          {selectedCount > 0 && (
            <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4">
              <div className="flex items-center gap-2">
                <span className="text-xs md:text-sm font-medium text-blue-900">
                  {selectedCount} categoria(s) selecionada(s)
                </span>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowBulkDeleteDialog(true)}
                className="h-7 md:h-8 text-xs md:text-sm"
              >
                <TrashIcon className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
                Excluir Selecionadas
              </Button>
            </div>
          )}

          {/* Mobile Cards */}
          <div className="sm:hidden space-y-3">
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <span className="text-sm text-gray-600">Categorias cadastradas</span>
            </div>
            {categories.map((category) => (
              <Card key={category.id} className="border border-gray-200">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg flex-shrink-0">
                        <Tag className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900">{category.name}</h3>
                        {category.description && (
                          <p className="text-sm text-gray-600 mt-1">{category.description}</p>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <span className="text-xs text-gray-500">Criado em:</span>
                      <p className="text-sm mt-1">{new Date(category.created_at).toLocaleDateString('pt-BR')}</p>
                    </div>

                    <div className="flex gap-2 pt-3 border-t border-gray-100">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(category)}
                        className="flex-1 h-8 text-xs"
                      >
                        <Edit className="h-3 w-3 mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(category)}
                        className="flex-1 h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Desktop Table */}
          <div className="hidden sm:block">
            <DataTable
              data={categories}
              columns={columns}
              itemsPerPage={100}
              emptyMessage="Nenhuma categoria encontrada"
              hideSearch={true}
            />
          </div>
        </CardContent>
      </Card>

      <BulkDeleteDialog
        open={showBulkDeleteDialog}
        onOpenChange={setShowBulkDeleteDialog}
        onConfirm={handleBulkDelete}
        itemCount={selectedCount}
        itemType="categoria"
        loading={deletingBulk}
      />

      <CategoryFormDialog
        showForm={showForm}
        editingCategory={editingCategory}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
      />

      <CategoryDeleteDialog
        categoryToDelete={categoryToDelete}
        onClose={() => setCategoryToDelete(null)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
};

export default CategoryManagement;