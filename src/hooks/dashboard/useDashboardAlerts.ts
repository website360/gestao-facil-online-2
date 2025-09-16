
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';

interface AlertItem {
  id: string;
  type: 'warning' | 'error' | 'info';
  title: string;
  description: string;
}

export const useDashboardAlerts = () => {
  const { user } = useAuth();
  const { userProfile } = useUserProfile();
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  const isVendasUser = userProfile?.role === 'vendedor_externo' || userProfile?.role === 'vendedor_interno';

  const fetchAlerts = async () => {
    try {
      const alertsArray: AlertItem[] = [];

      // Low stock alerts
      const { data: lowStockProducts } = await supabase
        .from('products')
        .select('name, stock')
        .lt('stock', 10);

      lowStockProducts?.forEach((product) => {
        alertsArray.push({
          id: `stock-${product.name}`,
          type: product.stock === 0 ? 'error' : 'warning',
          title: product.stock === 0 ? 'Produto sem estoque' : 'Estoque baixo',
          description: `${product.name} - ${product.stock} unidades`,
        });
      });

      // Old budgets alerts
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      let oldBudgetsQuery = supabase
        .from('budgets')
        .select('id, created_at, clients(name)')
        .eq('status', 'aguardando_aprovacao')
        .lt('created_at', thirtyDaysAgo.toISOString())
        .limit(3);
      
      if (isVendasUser && user?.id) {
        oldBudgetsQuery = oldBudgetsQuery.eq('created_by', user.id);
      }

      const { data: oldBudgets } = await oldBudgetsQuery;

      oldBudgets?.forEach((budget) => {
        alertsArray.push({
          id: `budget-${budget.id}`,
          type: 'info',
          title: 'Orçamento pendente há mais de 30 dias',
          description: `Cliente: ${budget.clients?.name || 'Não identificado'}`,
        });
      });

      setAlerts(alertsArray);
    } catch (error) {
      console.error('Error fetching alerts:', error);
    }
  };

  return { alerts, fetchAlerts };
};
