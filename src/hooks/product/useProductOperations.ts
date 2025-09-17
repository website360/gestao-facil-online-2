
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
    console.log('=== PARSING PRICE ===');
    console.log('Input:', priceString, 'Type:', typeof priceString);
    
    // Remove formatação de moeda brasileira e converte para número
    if (!priceString) {
      console.log('Empty price, returning 0');
      return 0;
    }
    
    // Se já é um número, retorna ele
    if (typeof priceString === 'number') {
      console.log('Already a number, returning:', priceString);
      return priceString;
    }
    
    const cleanPrice = priceString
      .replace('R$', '')
      .trim();
    
    console.log('After removing R$ and trim:', cleanPrice);
    
    // Se contém vírgula, assume formato brasileiro (ex: 1.234,56 ou 63,16)
    if (cleanPrice.includes(',')) {
      const parts = cleanPrice.split(',');
      console.log('Parts split by comma:', parts);
      
      if (parts.length === 2) {
        // Remove pontos de milhares da parte inteira
        const integerPart = parts[0].replace(/\./g, '');
        const decimalPart = parts[1];
        const result = parseFloat(`${integerPart}.${decimalPart}`) || 0;
        console.log('Brazilian format result:', result);
        return result;
      }
    }
    
    // Se não tem vírgula, pode ser formato americano ou número sem decimal
    const result = parseFloat(cleanPrice.replace(/\./g, '')) || 0;
    console.log('Non-comma format result:', result);
    console.log('=== END PARSING PRICE ===');
    return result;
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
