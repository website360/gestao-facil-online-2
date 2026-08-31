
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

// Sem console.log aqui de proposito: estas funcoes rodam por item, em cada
// linha da listagem. Os logs anteriores geravam milhares de chamadas por
// renderizacao e travavam a tela de Orcamentos.
export const useBudgetCalculations = () => {
  // Calcula o total de um item SEMPRE usando apenas o desconto individual do item
  const calculateItemTotal = (item: BudgetItem) => {
    const subtotal = item.quantity * item.unit_price;
    const discount = subtotal * (item.discount_percentage / 100);
    return subtotal - discount;
  };

  // Calcula o subtotal SEM nenhum desconto aplicado
  const calculateSubtotal = (items: BudgetItem[]) => {
    return items.reduce((sum, item) => {
      const itemSubtotal = item.quantity * item.unit_price;
      return sum + itemSubtotal;
    }, 0);
  };

  // Calcula o total COM os descontos individuais de cada item aplicados
  const calculateTotalWithDiscount = (items: BudgetItem[]) => {
    return items.reduce((sum, item) => sum + calculateItemTotal(item), 0);
  };

  // Calcula o total final do orçamento (APENAS produtos + frete, SEM nota fiscal)
  const calculateBudgetTotal = (budget: LocalBudget) => {
    if (!budget.budget_items || budget.budget_items.length === 0) {
      return 0;
    }

    // Calcular total usando APENAS os descontos individuais de cada item
    let total = 0;

    budget.budget_items.forEach((item) => {
      const itemSubtotal = item.quantity * item.unit_price;
      const itemDiscountPercentage = item.discount_percentage || 0;
      const itemDiscount = itemSubtotal * (itemDiscountPercentage / 100);
      total += itemSubtotal - itemDiscount;
    });

    // Adicionar frete se houver (SEM incluir nota fiscal)
    const shippingCost = budget.shipping_cost || 0;
    return total + shippingCost;
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
