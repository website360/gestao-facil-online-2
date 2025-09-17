
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Product, ProductFormState } from './types';
import { registerManualStockAdjustment } from '@/services/stockMovementService';

export const useProductOperations = (
  formState: ProductFormState,
  editingProduct: Product | null,
  onSuccess: () => void,
  resetForm: () => void
) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  const parsePrice = (priceString: string): number => {
    // Remove formatação de moeda brasileira e converte para número
    if (!priceString) return 0;
    
    // Se já é um número, retorna ele
    if (typeof priceString === 'number') return priceString;
    
    const cleanPrice = priceString
      .replace('R$', '')
      .trim();
    
    // Se contém vírgula, assume formato brasileiro (ex: 1.234,56 ou 63,16)
    if (cleanPrice.includes(',')) {
      const parts = cleanPrice.split(',');
      if (parts.length === 2) {
        // Remove pontos de milhares da parte inteira
        const integerPart = parts[0].replace(/\./g, '');
        const decimalPart = parts[1];
        return parseFloat(`${integerPart}.${decimalPart}`) || 0;
      }
    }
    
    // Se não tem vírgula, pode ser formato americano ou número sem decimal
    return parseFloat(cleanPrice.replace(/\./g, '')) || 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const productData = {
        name: formState.name,
        internal_code: formState.internalCode,
        barcode: formState.barcode || null,
        price: parsePrice(formState.price),
        stock: parseInt(formState.stock),
        stock_unit: formState.stockUnit,
        weight: formState.weight ? parseFloat(formState.weight) : null,
        weight_unit: formState.weightUnit,
        category_id: formState.categoryId || null,
        supplier_id: formState.supplierId || null,
        photo_url: formState.photoUrl || null,
        size: formState.size || null,
        composition: formState.composition || null,
        color: formState.color || null,
        box: formState.box || null,
        width: formState.width ? parseFloat(formState.width) : null,
        length: formState.length ? parseFloat(formState.length) : null,
        height: formState.height ? parseFloat(formState.height) : null,
        observation: formState.observation || null,
      };

      console.log('Saving product data:', productData);

      if (editingProduct) {
        // Verificar se houve alteração no estoque
        const previousStock = editingProduct.stock;
        const newStock = parseInt(formState.stock);
        
        const { error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', editingProduct.id);

        if (error) throw error;

        // Registrar movimentação de estoque se houve alteração
        if (previousStock !== newStock && user?.id) {
          await registerManualStockAdjustment(
            editingProduct.id,
            previousStock,
            newStock,
            user.id,
            'Ajuste manual via edição de produto'
          );
        }

        toast.success('Produto atualizado com sucesso');
      } else {
        const { error } = await supabase
          .from('products')
          .insert(productData);

        if (error) throw error;
        toast.success('Produto criado com sucesso');
      }

      onSuccess();
      resetForm();
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Erro ao salvar produto');
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    handleSubmit
  };
};
