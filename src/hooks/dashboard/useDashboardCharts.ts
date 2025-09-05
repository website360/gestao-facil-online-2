
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';

interface SalesData {
  month: string;
  sales: number;
  revenue: number;
}

interface BudgetStatusData {
  status: string;
  count: number;
}

interface DateRange {
  startDate?: Date;
  endDate?: Date;
}

export const useDashboardCharts = (dateRange?: DateRange) => {
  const { user } = useAuth();
  const { userProfile } = useUserProfile();
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [budgetStatusData, setBudgetStatusData] = useState<BudgetStatusData[]>([]);

  const isVendasUser = userProfile?.role === 'vendas';

  const getDateRangeFilters = () => {
    if (dateRange?.startDate && dateRange?.endDate) {
      return {
        startDate: dateRange.startDate.toISOString().split('T')[0],
        endDate: dateRange.endDate.toISOString().split('T')[0]
      };
    }
    
    // Default: current month
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const startOfMonth = `${currentYear}-${currentMonth.toString().padStart(2, '0')}-01`;
    const endOfMonth = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0];
    
    return { startDate: startOfMonth, endDate: endOfMonth };
  };

  const fetchSalesData = async () => {
    try {
      const { startDate, endDate } = getDateRangeFilters();
      
      let salesQuery = supabase
        .from('sales')
        .select('created_at, total_amount')
        .gte('created_at', startDate)
        .lte('created_at', endDate)
        .order('created_at');

      if (isVendasUser && user?.id) {
        salesQuery = salesQuery.eq('created_by', user.id);
      }

      const { data } = await salesQuery;

      const monthsData: { [key: string]: { sales: number; revenue: number } } = {};
      
      data?.forEach((sale) => {
        const month = new Date(sale.created_at).toLocaleDateString('pt-BR', { month: 'short' });
        if (!monthsData[month]) {
          monthsData[month] = { sales: 0, revenue: 0 };
        }
        monthsData[month].sales += 1;
        monthsData[month].revenue += sale.total_amount || 0;
      });

      const salesChartData = Object.entries(monthsData).map(([month, data]) => ({
        month,
        sales: data.sales,
        revenue: data.revenue,
      }));

      setSalesData(salesChartData);
    } catch (error) {
      console.error('Error fetching sales data:', error);
    }
  };

  const fetchBudgetStatusData = async () => {
    try {
      const { startDate, endDate } = getDateRangeFilters();
      
      let budgetStatusQuery = supabase
        .from('budgets')
        .select('status')
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (isVendasUser && user?.id) {
        budgetStatusQuery = budgetStatusQuery.eq('created_by', user.id);
      }

      const { data } = await budgetStatusQuery;

      const statusCount: { [key: string]: number } = {};
      data?.forEach((budget) => {
        statusCount[budget.status] = (statusCount[budget.status] || 0) + 1;
      });

      const statusLabels = {
        aguardando: 'Aguardando',
        enviado: 'Enviado',
        convertido: 'Convertido',
      };

      const budgetChartData = Object.entries(statusCount).map(([status, count]) => ({
        status: statusLabels[status as keyof typeof statusLabels] || status,
        count,
      }));

      setBudgetStatusData(budgetChartData);
    } catch (error) {
      console.error('Error fetching budget status data:', error);
    }
  };

  return {
    salesData,
    budgetStatusData,
    fetchSalesData,
    fetchBudgetStatusData
  };
};
