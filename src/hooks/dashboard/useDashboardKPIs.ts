
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserProfile } from '@/hooks/useUserProfile';

interface DashboardKPIs {
  totalSales: number;
  monthlySales: number;
  pendingBudgets: number;
  sentBudgets: number;
  awaitingApprovalBudgets: number;
  convertedBudgets: number;
  lowStockProducts: number;
  monthlyRevenue: number;
  salesSeparacao: number;
  salesConferencia: number;
  salesNotaFiscal: number;
  salesFinalizado: number;
}

interface DateRange {
  startDate?: Date;
  endDate?: Date;
}

type SaleStatus = 'separacao' | 'conferencia' | 'nota_fiscal' | 'aguardando_entrega' | 'entrega_realizada' | 'atencao';

export const useDashboardKPIs = (dateRange?: DateRange) => {
  const { user } = useAuth();
  const { userProfile, profileLoading } = useUserProfile();
  const [kpis, setKpis] = useState<DashboardKPIs>({
    totalSales: 0,
    monthlySales: 0,
    pendingBudgets: 0,
    sentBudgets: 0,
    awaitingApprovalBudgets: 0,
    convertedBudgets: 0,
    lowStockProducts: 0,
    monthlyRevenue: 0,
    salesSeparacao: 0,
    salesConferencia: 0,
    salesNotaFiscal: 0,
    salesFinalizado: 0,
  });

  const isVendasUser = userProfile?.role === 'vendedor_externo' || userProfile?.role === 'vendedor_interno';

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

  const fetchKPIs = async () => {
    // Só executa se o perfil estiver carregado
    if (profileLoading) {
      return;
    }
    
    try {
      
      const { startDate, endDate } = getDateRangeFilters();
      const hasCustomDateRange = dateRange?.startDate || dateRange?.endDate;

      // Total sales - if has custom date range, filter by date, otherwise get all
      let totalSalesQuery = supabase
        .from('sales')
        .select('*', { count: 'exact', head: true });

      if (isVendasUser && user?.id) {
        totalSalesQuery = totalSalesQuery.eq('created_by', user.id);
      }

      if (hasCustomDateRange) {
        totalSalesQuery = totalSalesQuery
          .gte('created_at', startDate)
          .lte('created_at', endDate);
      }

      const { count: totalSalesCount } = await totalSalesQuery;

      // Monthly sales (filtered by date range)
      let monthlySalesQuery = supabase
        .from('sales')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate)
        .lte('created_at', endDate);

      if (isVendasUser && user?.id) {
        monthlySalesQuery = monthlySalesQuery.eq('created_by', user.id);
      }

      const { count: monthlySalesCount } = await monthlySalesQuery;

      // Sales by status
      const salesByStatusQueries: Array<{ status: SaleStatus; key: keyof DashboardKPIs }> = [
        { status: 'separacao' as SaleStatus, key: 'salesSeparacao' },
        { status: 'conferencia' as SaleStatus, key: 'salesConferencia' },
        { status: 'nota_fiscal' as SaleStatus, key: 'salesNotaFiscal' },
        { status: 'entrega_realizada' as SaleStatus, key: 'salesFinalizado' }
      ];

      const salesByStatusPromises = salesByStatusQueries.map(async ({ status }) => {
        let query = supabase
          .from('sales')
          .select('*', { count: 'exact', head: true })
          .eq('status', status);

        if (isVendasUser && user?.id) {
          query = query.eq('created_by', user.id);
        }

        if (hasCustomDateRange) {
          query = query
            .gte('created_at', startDate)
            .lte('created_at', endDate);
        }

        const { count } = await query;
        return count || 0;
      });

      const [salesSeparacaoCount, salesConferenciaCount, salesNotaFiscalCount, salesFinalizadoCount] = 
        await Promise.all(salesByStatusPromises);

      // Pending budgets (not filtered by date)
      let pendingBudgetsQuery = supabase
        .from('budgets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'aguardando_aprovacao');
      
      if (isVendasUser && user?.id) {
        pendingBudgetsQuery = pendingBudgetsQuery.eq('created_by', user.id);
      }
      
      const { count: pendingBudgetsCount } = await pendingBudgetsQuery;

      // Sent budgets (not filtered by date)
      let sentBudgetsQuery = supabase
        .from('budgets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'aprovado');
      
      if (isVendasUser && user?.id) {
        sentBudgetsQuery = sentBudgetsQuery.eq('created_by', user.id);
      }
      
      const { count: sentBudgetsCount } = await sentBudgetsQuery;

      // Awaiting approval budgets (not filtered by date)
      let awaitingApprovalBudgetsQuery = supabase
        .from('budgets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'aguardando_aprovacao');
      
      if (isVendasUser && user?.id) {
        awaitingApprovalBudgetsQuery = awaitingApprovalBudgetsQuery.eq('created_by', user.id);
      }
      
      const { count: awaitingApprovalBudgetsCount } = await awaitingApprovalBudgetsQuery;

      // Converted budgets (not filtered by date)
      let convertedBudgetsQuery = supabase
        .from('budgets')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'convertido');
      
      if (isVendasUser && user?.id) {
        convertedBudgetsQuery = convertedBudgetsQuery.eq('created_by', user.id);
      }
      
      const { count: convertedBudgetsCount } = await convertedBudgetsQuery;

      // Low stock products (not filtered by date)
      const { count: lowStockCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .lt('stock', 10);

      // Revenue in the selected period
      let revenueQuery = supabase
        .from('sales')
        .select('total_amount');

      if (isVendasUser && user?.id) {
        revenueQuery = revenueQuery.eq('created_by', user.id);
      }

      if (hasCustomDateRange) {
        revenueQuery = revenueQuery
          .gte('created_at', startDate)
          .lte('created_at', endDate);
      } else {
        // For revenue, always use the monthly period even without custom filter
        revenueQuery = revenueQuery
          .gte('created_at', startDate)
          .lte('created_at', endDate);
      }

      const { data: revenueData } = await revenueQuery;
      const monthlyRevenue = revenueData?.reduce((sum, sale) => sum + (sale.total_amount || 0), 0) || 0;


      setKpis({
        totalSales: totalSalesCount || 0,
        monthlySales: monthlySalesCount || 0,
        pendingBudgets: pendingBudgetsCount || 0,
        sentBudgets: sentBudgetsCount || 0,
        awaitingApprovalBudgets: awaitingApprovalBudgetsCount || 0,
        convertedBudgets: convertedBudgetsCount || 0,
        lowStockProducts: lowStockCount || 0,
        monthlyRevenue,
        salesSeparacao: salesSeparacaoCount,
        salesConferencia: salesConferenciaCount,
        salesNotaFiscal: salesNotaFiscalCount,
        salesFinalizado: salesFinalizadoCount,
      });
    } catch (error) {
      console.error('Error fetching KPIs:', error);
    }
  };

  return { kpis, fetchKPIs };
};
