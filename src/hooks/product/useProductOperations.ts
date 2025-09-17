
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

  const parsePrice = (priceInput: string | number): number => {
    // Conversão robusta para lidar com formatos BR (1.234,56), US (1,234.56) e simples (63.16 / 6316)
    if (priceInput === null || priceInput === undefined) return 0;
    if (typeof priceInput === 'number' && !isNaN(priceInput)) return priceInput;

    // Normaliza: remove símbolo R$, espaços comuns e NBSP
    let s = String(priceInput)
      .replace(/R\$/g, '')
      .replace(/\u00A0/g, ' ')
      .replace(/\s+/g, '')
      .trim();

    const hasComma = s.includes(',');
    const hasDot = s.includes('.');

    if (hasComma && hasDot) {
      // Se o último separador é vírgula, decimal é vírgula (BR)
      // Ex: 1.234,56 -> 1234.56
      // Caso contrário, decimal é ponto (US): 1,234.56 -> 1234.56
      if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
        s = s.replace(/\./g, '').replace(',', '.');
      } else {
        s = s.replace(/,/g, '');
      }
    } else if (hasComma) {
      // Só vírgula: tratar como decimal BR
      s = s.replace(',', '.');
    } else {
      // Só ponto ou sem separadores: deixar como está (ponto é decimal)
      // Não remover pontos aqui para não transformar 63.16 em 6316
    }

    // Remover qualquer caractere inválido restante
    s = s.replace(/[^0-9.\-]/g, '');

    const parsed = parseFloat(s);
    return isNaN(parsed) ? 0 : parsed;
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
