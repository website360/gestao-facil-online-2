
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  internal_code: string;
  price: number;
  stock: number;
  stock_unit?: string;
  category_id?: string;
  supplier_id?: string;
  photo_url?: string;
  categories?: { name: string };
  suppliers?: { name: string };
  created_at: string;
}

export const useProductManagement = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  useEffect(() => {
    let filtered = products;

    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.internal_code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter(product => product.category_id === categoryFilter);
    }

    // Sort alphabetically by product name
    filtered = filtered.sort((a, b) => a.name.localeCompare(b.name));

    setFilteredProducts(filtered);
  }, [products, searchTerm, categoryFilter]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories!products_category_id_fkey (
            id,
            name
          ),
          suppliers!products_supplier_id_fkey (
            id,
            name
          )
        `)
        .order('name', { ascending: true });

      if (error) throw error;
      console.log('Products fetched with relations:', data);
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleNewProduct = () => {
    setEditingProduct(null);
    setShowForm(true);
  };

  const handleEdit = (product: Product) => {
    console.log('Editing product:', product);
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleDelete = (product: Product) => {
    setProductToDelete(product);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingProduct(null);
    fetchProducts();
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productToDelete.id);

      if (error) throw error;

      toast.success('Produto excluído com sucesso');
      setProductToDelete(null);
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Erro ao excluir produto');
    }
  };

  return {
    products,
    filteredProducts,
    categories,
    loading,
    showForm,
    editingProduct,
    productToDelete,
    searchTerm,
    categoryFilter,
    setSearchTerm,
    setCategoryFilter,
    setProductToDelete,
    handleNewProduct,
    handleEdit,
    handleDelete,
    handleFormClose,
    handleFormSuccess,
    handleDeleteConfirm,
  };
};
