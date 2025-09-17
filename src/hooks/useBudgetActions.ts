
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import type { LocalBudget } from './useBudgetManagement';

export const useBudgetActions = (fetchBudgets: () => void) => {
  const [budgetToDelete, setBudgetToDelete] = useState<LocalBudget | null>(null);
  const [budgetToConvert, setBudgetToConvert] = useState<LocalBudget | null>(null);
  const navigate = useNavigate();

  const handleDeleteConfirm = async () => {
    if (!budgetToDelete) return;

    try {
      const { error } = await supabase
        .from('budgets')
        .delete()
        .eq('id', budgetToDelete.id);

      if (error) throw error;
      toast.success('Orçamento excluído com sucesso!');
      fetchBudgets();
    } catch (error) {
      console.error('Erro ao excluir orçamento:', error);
      toast.error('Erro ao excluir orçamento');
    } finally {
      setBudgetToDelete(null);
    }
  };

  const updateProductStock = async (productId: string, quantitySold: number, saleId?: string) => {
    console.log(`Updating stock for product ${productId}: reducing by ${quantitySold}`);
    
    // Get current product stock
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('stock')
      .eq('id', productId)
      .single();

    if (fetchError) {
      console.error('Error fetching product stock:', fetchError);
      throw new Error(`Erro ao buscar estoque do produto: ${fetchError.message}`);
    }

    const currentStock = product.stock;
    const newStock = currentStock - quantitySold;

    if (newStock < 0) {
      throw new Error(`Estoque insuficiente para o produto. Disponível: ${currentStock}, Solicitado: ${quantitySold}`);
    }

    // Update product stock
    const { error: updateError } = await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', productId);

    if (updateError) {
      console.error('Error updating product stock:', updateError);
      throw new Error(`Erro ao atualizar estoque: ${updateError.message}`);
    }

    // Get current user for stock movement
    const { data: { user } } = await supabase.auth.getUser();
    if (user && saleId) {
      // Register stock movement
      try {
        await supabase.rpc('register_stock_movement', {
          p_product_id: productId,
          p_user_id: user.id,
          p_movement_type: 'saida',
          p_quantity: quantitySold,
          p_previous_stock: currentStock,
          p_new_stock: newStock,
          p_reason: 'venda',
          p_reference_id: saleId,
          p_notes: 'Estoque baixado devido à conversão de orçamento em venda'
        });
        console.log(`Stock movement registered for product ${productId}`);
      } catch (movementError) {
        console.error('Error registering stock movement:', movementError);
        // Não bloquear a conversão se houver erro no movimento
      }
    }

    console.log(`Stock updated successfully: ${currentStock} -> ${newStock}`);
  };

  const handleConvertToSaleConfirm = async (updatedBudget?: LocalBudget, attachments?: any[]) => {
    const budgetToUse = updatedBudget || budgetToConvert;
    if (!budgetToUse) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Usuário não autenticado');
        return;
      }

      console.log('Starting budget conversion to sale...');
      console.log('Budget items:', budgetToUse.budget_items);
      console.log('Attachments:', attachments);

      // Validate stock availability before proceeding
      for (const item of budgetToUse.budget_items) {
        const { data: product, error: productError } = await supabase
          .from('products')
          .select('stock, name')
          .eq('id', item.product_id)
          .single();

        if (productError) {
          console.error('Error fetching product:', productError);
          toast.error('Erro ao verificar estoque dos produtos');
          return;
        }

        if (product.stock < item.quantity) {
          toast.error(`Estoque insuficiente para ${product.name}. Disponível: ${product.stock}, Necessário: ${item.quantity}`);
          return;
        }
      }

      // Create sale with original budget creation date and conversion timestamp
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert({
          client_id: budgetToUse.client_id,
          budget_id: budgetToUse.id,
          created_by: budgetToUse.created_by, // Preservar o vendedor original que criou o orçamento
          // Usar a data atual da conversão para o número da venda seguir o novo padrão
          converted_from_budget_at: new Date().toISOString(), // Data atual da conversão
          total_amount: budgetToUse.total_amount,
          notes: budgetToUse.notes,
          status: 'separacao',
          payment_method_id: budgetToUse.payment_method_id,
          payment_type_id: budgetToUse.payment_type_id,
          shipping_option_id: budgetToUse.shipping_option_id,
          shipping_cost: budgetToUse.shipping_cost || 0,
          installments: budgetToUse.installments || 1,
          discount_percentage: budgetToUse.discount_percentage || 0,
          invoice_percentage: budgetToUse.invoice_percentage || 0,
          local_delivery_info: budgetToUse.local_delivery_info
        })
        .select()
        .single();

      if (saleError) throw saleError;

      console.log('Sale created successfully:', saleData);

      // Upload attachments if provided
      if (attachments && attachments.length > 0) {
        console.log('Uploading payment receipts...');
        
        for (const attachment of attachments) {
          try {
            // Upload file to storage
            const fileExt = attachment.file.name.split('.').pop();
            const filePath = `${saleData.id}/${attachment.generatedName}`;
            
            const { error: uploadError } = await supabase.storage
              .from('payment-receipts')
              .upload(filePath, attachment.file);

            if (uploadError) {
              console.error('Error uploading file:', uploadError);
              throw uploadError;
            }

            // Save attachment metadata
            const { error: attachmentError } = await supabase
              .from('sale_attachments')
              .insert({
                sale_id: saleData.id,
                original_filename: attachment.file.name,
                stored_filename: attachment.generatedName,
                file_path: filePath,
                file_size: attachment.file.size,
                mime_type: attachment.file.type,
                uploaded_by: user.id
              });

            if (attachmentError) {
              console.error('Error saving attachment metadata:', attachmentError);
              throw attachmentError;
            }
          } catch (attachmentError) {
            console.error('Error processing attachment:', attachmentError);
            toast.error(`Erro ao processar comprovante: ${attachment.file.name}`);
            // Continue with other attachments
          }
        }
        
        console.log('All payment receipts uploaded successfully');
      }

      // Create sale items from budget items
      const saleItems = budgetToUse.budget_items.map(item => ({
        sale_id: saleData.id,
        product_id: item.product_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);

      if (itemsError) throw itemsError;

      console.log('Sale items created successfully');

      // Update product stock for each item
      for (const item of budgetToUse.budget_items) {
        await updateProductStock(item.product_id, item.quantity, saleData.id);
      }

      console.log('Stock updated successfully for all products');

      // Update budget status to 'convertido'
      const { error: updateError } = await supabase
        .from('budgets')
        .update({ status: 'convertido' })
        .eq('id', budgetToUse.id);

      if (updateError) throw updateError;

      toast.success('Orçamento convertido em venda com sucesso! Comprovantes anexados.');
      fetchBudgets();
      navigate('/'); // Navigate to sales page
    } catch (error) {
      console.error('Erro ao converter orçamento:', error);
      toast.error(error instanceof Error ? error.message : 'Erro ao converter orçamento em venda');
    } finally {
      setBudgetToConvert(null);
    }
  };

  const handleView = (budget: LocalBudget, index: number) => {
    // Esta função será sobrescrita no componente pai
    console.log('Viewing budget:', budget, 'at index:', index);
  };

  const handleDuplicate = (budget: LocalBudget) => {
    console.log('Duplicating budget:', budget);
    // Implementar duplicação do orçamento
  };

  const handleSend = (budget: LocalBudget) => {
    console.log('Sending budget:', budget);
    // Implementar envio do orçamento
  };

  return {
    budgetToDelete,
    setBudgetToDelete,
    budgetToConvert,
    setBudgetToConvert,
    handleDeleteConfirm,
    handleConvertToSaleConfirm,
    handleView,
    handleDuplicate,
    handleSend
  };
};
