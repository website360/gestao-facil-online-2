import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UseDashboardRealtimeProps {
  onBudgetChange: () => void;
  onSaleChange: () => void;
  onProductChange: () => void;
  enabled?: boolean;
}

export const useDashboardRealtime = ({
  onBudgetChange,
  onSaleChange,
  onProductChange,
  enabled = true
}: UseDashboardRealtimeProps) => {
  useEffect(() => {
    if (!enabled) return;

    // Canal para mudanças em orçamentos
    const budgetChannel = supabase
      .channel('dashboard-budgets')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'budgets'
        },
        (payload) => {
          onBudgetChange();
        }
      )
      .subscribe();

    // Canal para mudanças em vendas
    const salesChannel = supabase
      .channel('dashboard-sales')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sales'
        },
        (payload) => {
          onSaleChange();
        }
      )
      .subscribe();

    // Canal para mudanças em produtos (para alertas de estoque)
    const productsChannel = supabase
      .channel('dashboard-products')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'products'
        },
        (payload) => {
          onProductChange();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(budgetChannel);
      supabase.removeChannel(salesChannel);
      supabase.removeChannel(productsChannel);
    };
  }, [enabled, onBudgetChange, onSaleChange, onProductChange]);
};