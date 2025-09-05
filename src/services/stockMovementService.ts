import { supabase } from '@/integrations/supabase/client';

export interface StockMovementData {
  productId: string;
  userId: string;
  movementType: 'entrada' | 'saida' | 'ajuste';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: 'venda' | 'entrada_estoque' | 'ajuste_manual' | 'entrada_massa';
  referenceId?: string;
  notes?: string;
}

export const registerStockMovement = async (data: StockMovementData): Promise<string | null> => {
  try {
    const { data: result, error } = await supabase.rpc('register_stock_movement', {
      p_product_id: data.productId,
      p_user_id: data.userId,
      p_movement_type: data.movementType,
      p_quantity: data.quantity,
      p_previous_stock: data.previousStock,
      p_new_stock: data.newStock,
      p_reason: data.reason,
      p_reference_id: data.referenceId || null,
      p_notes: data.notes || null
    });

    if (error) {
      console.error('Error registering stock movement:', error);
      throw error;
    }

    return result;
  } catch (error) {
    console.error('Failed to register stock movement:', error);
    return null;
  }
};

export const registerSaleStockMovements = async (
  saleId: string,
  saleItems: Array<{
    product_id: string;
    quantity: number;
    product?: { stock: number };
  }>,
  userId: string
) => {
  try {
    // Para cada item da venda, registrar uma movimentação de saída
    const movements = saleItems.map(async (item) => {
      const currentStock = item.product?.stock || 0;
      const newStock = currentStock - item.quantity;

      return registerStockMovement({
        productId: item.product_id,
        userId,
        movementType: 'saida',
        quantity: item.quantity,
        previousStock: currentStock,
        newStock,
        reason: 'venda',
        referenceId: saleId,
        notes: `Venda ID: ${saleId}`
      });
    });

    await Promise.all(movements);
    console.log('Sale stock movements registered successfully');
  } catch (error) {
    console.error('Error registering sale stock movements:', error);
  }
};

export const registerManualStockAdjustment = async (
  productId: string,
  previousStock: number,
  newStock: number,
  userId: string,
  notes?: string
) => {
  const quantity = Math.abs(newStock - previousStock);
  const movementType = newStock > previousStock ? 'entrada' : newStock < previousStock ? 'saida' : 'ajuste';

  return registerStockMovement({
    productId,
    userId,
    movementType,
    quantity,
    previousStock,
    newStock,
    reason: 'ajuste_manual',
    notes: notes || 'Ajuste manual de estoque'
  });
};