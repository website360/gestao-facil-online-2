
import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, Edit, Trash2, Package, TrashIcon } from 'lucide-react';
import { useProductManagement } from '@/hooks/useProductManagement';
import { useProductExcel } from '@/hooks/product/useProductExcel';
import { useBulkSelection } from '@/hooks/useBulkSelection';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAuth } from '@/hooks/useAuth';
import ProductManagementHeader from './product/ProductManagementHeader';
import ProductFormDialog from './ProductFormDialog';
import ProductDeleteDialog from './ProductDeleteDialog';
import ProductImportConflictDialog from './product/ProductImportConflictDialog';
import ProductImportProgressModal from './product/ProductImportProgressModal';
import ProductImportSuccessModal from './product/ProductImportSuccessModal';
import ProductFilters from './product/ProductFilters';
import ProductTable from './product/ProductTable';
import ProductPagination from './product/ProductPagination';
import BulkStockEntryModal from './BulkStockEntryModal';
import BulkStockImportModal from './BulkStockImportModal';
import BulkDeleteDialog from './common/BulkDeleteDialog';
import EmptyState from '@/components/ui/empty-state';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

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

const ProductManagement = () => {
  const [showBulkStockEntry, setShowBulkStockEntry] = useState(false);
  const [showBulkStockImport, setShowBulkStockImport] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [deletingBulk, setDeletingBulk] = useState(false);
  
  const { user, isClient } = useAuth();
  const { userProfile } = useUserProfile();
  const {
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
  } = useProductManagement();

  // Pagination state (default 100 per page)
  const itemsPerPage = 100;
  const [currentPage, setCurrentPage] = useState(1);
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter]);
  const totalItems = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

  const {
    selectedItems,
    isAllSelected,
    isPartiallySelected,
    toggleItem,
    toggleAll,
    clearSelection,
    selectedCount
  } = useBulkSelection(paginatedProducts.map(p => p.id));

  const {
    isProcessing,
    conflicts,
    showConflictDialog,
    setShowConflictDialog,
    exportToExcel,
    processImportFile,
    importProducts,
    importProgress,
    importStatus,
    showProgressModal,
    showSuccessModal,
    totalImported,
    handleSuccessModalClose
  } = useProductExcel();

  const handleExportExcel = () => {
    exportToExcel(filteredProducts);
  };

  const handleImportExcel = (file: File) => {
    processImportFile(file);
  };

  const handleConflictResolve = async (replaceProducts: any[], ignoreProducts: any[]) => {
    const newProducts = conflicts
      .map(c => c.imported)
      .filter(p => !replaceProducts.includes(p) && !ignoreProducts.includes(p));
    
    const success = await importProducts([...newProducts], replaceProducts);
    if (success) {
      handleFormSuccess(); // Refresh the product list
    }
  };

  const handleBulkDelete = async () => {
    setDeletingBulk(true);
    
    try {
      const selectedIds = Array.from(selectedItems);
      
      // Executar exclusão em paralelo para melhor performance
      const deletePromises = selectedIds.map(async (productId) => {
        const { error } = await supabase
          .from('products')
          .delete()
          .eq('id', productId);
          
        if (error) {
          return { productId, error: error.message };
        }
        
        return { productId, success: true };
      });
      
      const results = await Promise.all(deletePromises);
      const successful = results.filter(r => r.success);
      const failed = results.filter(r => r.error);
      
      if (successful.length > 0) {
        toast.success(`${successful.length} produto(s) excluído(s) com sucesso!`);
      }
      
      if (failed.length > 0) {
        toast.error(`${failed.length} produto(s) falharam na exclusão.`);
        console.error('Produtos que falharam:', failed);
      }
      
      clearSelection();
      setShowBulkDeleteDialog(false);
      handleFormSuccess(); // Atualizar a lista
      
    } catch (error) {
      console.error('Erro na exclusão em massa:', error);
      toast.error('Erro inesperado na exclusão em massa');
    } finally {
      setDeletingBulk(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-6 bg-transparent">
        <Card className="bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="text-center">Carregando produtos...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-transparent">
      <Card className="bg-white shadow-sm">
        <CardContent className="p-6 space-y-6">
          <ProductManagementHeader 
            onNewProduct={handleNewProduct}
            onExportExcel={handleExportExcel}
            onImportExcel={handleImportExcel}
            onBulkStockEntry={() => setShowBulkStockEntry(true)}
            onBulkStockImport={() => setShowBulkStockImport(true)}
            userRole={userProfile?.role}
          />

          <ProductFilters
            searchTerm={searchTerm}
            categoryFilter={categoryFilter}
            filteredProductsCount={filteredProducts.length}
            categories={categories}
            onSearchChange={setSearchTerm}
            onCategoryFilterChange={setCategoryFilter}
          />

          {selectedCount > 0 && userProfile?.role !== 'vendas' && (
            <div className="flex items-center justify-between bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-blue-900">
                  {selectedCount} produto(s) selecionado(s)
                </span>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowBulkDeleteDialog(true)}
                className="h-8"
              >
                <TrashIcon className="h-4 w-4 mr-2" />
                Excluir Selecionados
              </Button>
            </div>
          )}

          {filteredProducts.length === 0 ? (
            <EmptyState
              title="Nenhum produto encontrado"
              description="Os produtos aparecerão aqui quando forem cadastrados."
              icon={Package}
            />
          ) : (
            <div className="space-y-4">
              <ProductTable
                products={paginatedProducts}
                onEdit={handleEdit}
                onDelete={handleDelete}
                selectedItems={selectedItems}
                onItemSelect={toggleItem}
                onSelectAll={toggleAll}
                isAllSelected={isAllSelected}
                isPartiallySelected={isPartiallySelected}
                userRole={userProfile?.role}
              />
              <ProductPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredProducts.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </CardContent>
      </Card>

      <ProductFormDialog
        showForm={showForm}
        editingProduct={editingProduct}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
        readOnly={userProfile?.role === 'vendas'}
      />

      <ProductDeleteDialog
        productToDelete={productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirm={handleDeleteConfirm}
      />

      <BulkDeleteDialog
        open={showBulkDeleteDialog}
        onOpenChange={setShowBulkDeleteDialog}
        onConfirm={handleBulkDelete}
        itemCount={selectedCount}
        itemType="produto"
        loading={deletingBulk}
      />

      <ProductImportConflictDialog
        open={showConflictDialog}
        onOpenChange={setShowConflictDialog}
        conflicts={conflicts}
        onResolve={handleConflictResolve}
        isProcessing={isProcessing}
      />

      <ProductImportProgressModal
        open={showProgressModal}
        progress={importProgress}
        status={importStatus}
      />

      <ProductImportSuccessModal
        open={showSuccessModal}
        totalImported={totalImported}
        onClose={handleSuccessModalClose}
      />

      <BulkStockEntryModal
        open={showBulkStockEntry}
        onClose={() => setShowBulkStockEntry(false)}
        onSuccess={handleFormSuccess}
      />

      <BulkStockImportModal
        open={showBulkStockImport}
        onClose={() => setShowBulkStockImport(false)}
        onSuccess={handleFormSuccess}
      />
    </div>
  );
};

export default ProductManagement;
