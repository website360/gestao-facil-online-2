
interface BudgetItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  discount_percentage: number;
  product_code?: string;
}

interface LocalBudgetItem {
  id: string;
  budget_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  discount_percentage?: number;
  products: {
    name: string;
    internal_code: string;
  };
}

interface LocalBudget {
  id: string;
  discount_percentage?: number;
  shipping_cost?: number;
  budget_items: LocalBudgetItem[];
}

export const useBudgetCalculations = () => {
  // Calcula o total de um item SEMPRE usando apenas o desconto individual do item
  const calculateItemTotal = (item: BudgetItem) => {
    const subtotal = item.quantity * item.unit_price;
    const discount = subtotal * (item.discount_percentage / 100);
    const total = subtotal - discount;
    
    console.log(`Item calculation:`, {
      quantity: item.quantity,
      unit_price: item.unit_price,
      subtotal,
      discount_percentage: item.discount_percentage,
      discount_amount: discount,
      final_total: total
    });
    
    return total;
  };

  // Calcula o subtotal SEM nenhum desconto aplicado
  const calculateSubtotal = (items: BudgetItem[]) => {
    const subtotal = items.reduce((sum, item) => {
      const itemSubtotal = item.quantity * item.unit_price;
      return sum + itemSubtotal;
    }, 0);
    
    console.log('Subtotal (without any discounts):', subtotal);
    return subtotal;
  };

  // Calcula o total COM os descontos individuais de cada item aplicados
  const calculateTotalWithDiscount = (items: BudgetItem[]) => {
    const total = items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
    console.log('Total with individual item discounts:', total);
    return total;
  };

  // Calcula o total final do orçamento (APENAS produtos + frete, SEM nota fiscal)
  const calculateBudgetTotal = (budget: LocalBudget) => {
    console.log('=== CALCULATING FINAL BUDGET TOTAL ===');
    console.log('Budget ID:', budget.id);
    console.log('Budget items:', budget.budget_items);
    
    if (!budget.budget_items || budget.budget_items.length === 0) {
      console.log('No budget items found, returning 0');
      return 0;
    }
    
    // Calcular total usando APENAS os descontos individuais de cada item
    let total = 0;
    
    budget.budget_items.forEach((item) => {
      const itemSubtotal = item.quantity * item.unit_price;
      const itemDiscountPercentage = item.discount_percentage || 0;
      const itemDiscount = itemSubtotal * (itemDiscountPercentage / 100);
      const itemTotal = itemSubtotal - itemDiscount;
      
      console.log(`Item: ${item.products?.name || 'Unknown'}`);
      console.log(`- Quantity: ${item.quantity}`);
      console.log(`- Unit Price: ${item.unit_price}`);
      console.log(`- Item Subtotal: ${itemSubtotal}`);
      console.log(`- Individual Discount %: ${itemDiscountPercentage}`);
      console.log(`- Discount Amount: ${itemDiscount}`);
      console.log(`- Item Total: ${itemTotal}`);
      
      total += itemTotal;
    });
    
    console.log('Total with individual item discounts applied:', total);
    
    // Adicionar frete se houver (SEM incluir nota fiscal)
    const shippingCost = budget.shipping_cost || 0;
    const finalTotal = total + shippingCost;
    
    console.log('Shipping cost:', shippingCost);
    console.log('FINAL TOTAL (WITHOUT invoice percentage):', finalTotal);
    console.log('=== END FINAL BUDGET TOTAL CALCULATION ===');
    
    return finalTotal;
  };

  const calculateRealDiscountPercentage = (items: BudgetItem[]) => {
    const subtotal = calculateSubtotal(items);
    const totalWithDiscount = calculateTotalWithDiscount(items);
    
    if (subtotal === 0) return 0;
    
    const totalDiscount = subtotal - totalWithDiscount;
    return (totalDiscount / subtotal) * 100;
  };

  const calculateTotalDiscountAmount = (items: BudgetItem[]) => {
    const subtotal = calculateSubtotal(items);
    const totalWithDiscount = calculateTotalWithDiscount(items);
    return subtotal - totalWithDiscount;
  };

  return {
    calculateItemTotal,
    calculateSubtotal,
    calculateTotalWithDiscount,
    calculateBudgetTotal,
    calculateRealDiscountPercentage,
    calculateTotalDiscountAmount
  };
};
