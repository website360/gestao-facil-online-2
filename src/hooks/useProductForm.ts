
import { useEffect } from 'react';
import { useProductFormState } from './product/useProductFormState';
import { useProductData } from './product/useProductData';
import { useProductOperations } from './product/useProductOperations';
import { Product } from './product/types';

export const useProductForm = (editingProduct: Product | null, onSuccess: () => void) => {
  const formState = useProductFormState();
  const { categories, suppliers, fetchCategories, fetchSuppliers } = useProductData();
  
  const { loading, handleSubmit } = useProductOperations(
    {
      name: formState.name,
      internalCode: formState.internalCode,
      barcode: formState.barcode,
      price: formState.price,
      stock: formState.stock,
      stockUnit: formState.stockUnit,
      weight: formState.weight,
      weightUnit: formState.weightUnit,
      categoryId: formState.categoryId,
      supplierId: formState.supplierId,
      photoUrl: formState.photoUrl,
      size: formState.size,
      composition: formState.composition,
      color: formState.color,
      box: formState.box,
      width: formState.width,
      length: formState.length,
      height: formState.height,
      observation: formState.observation,
      ipi: formState.ipi
    },
    editingProduct,
    onSuccess,
    formState.resetForm
  );

  // Load product data when editing
  useEffect(() => {
    if (editingProduct) {
      formState.loadProductData(editingProduct);
    } else {
      formState.resetForm();
    }
  }, [editingProduct]);

  return {
    // Form state
    ...formState,
    
    // Data
    categories,
    suppliers,
    loading,
    
    // Functions
    fetchCategories,
    fetchSuppliers,
    handleSubmit
  };
};
