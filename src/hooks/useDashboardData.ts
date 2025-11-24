
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useUserProfile } from './useUserProfile';
import { useDashboardKPIs } from './dashboard/useDashboardKPIs';
import { useDashboardCharts } from './dashboard/useDashboardCharts';
import { useDashboardAlerts } from './dashboard/useDashboardAlerts';
import { useDashboardRealtime } from './dashboard/useDashboardRealtime';
import { useDashboardTopProducts } from './dashboard/useDashboardTopProducts';

interface DateRange {
  startDate?: Date;
  endDate?: Date;
}

export const useDashboardData = (dateRange?: DateRange) => {
  const { user } = useAuth();
  const { userProfile, profileLoading } = useUserProfile();
  const [loading, setLoading] = useState(true);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);

  const { kpis, fetchKPIs } = useDashboardKPIs(dateRange);
  const { salesData, budgetStatusData, fetchSalesData, fetchBudgetStatusData } = useDashboardCharts(dateRange);
  const { alerts, fetchAlerts } = useDashboardAlerts();
  const { topProducts, fetchTopProducts } = useDashboardTopProducts(dateRange);

  const fetchAllData = useCallback(async () => {
    if (profileLoading) {
      return;
    }
    
    setLoading(true);
    try {
      await Promise.all([
        fetchKPIs(),
        fetchSalesData(),
        fetchBudgetStatusData(),
        fetchAlerts(),
        fetchTopProducts(),
      ]);
      
      if (!hasInitialLoad) {
        setHasInitialLoad(true);
      }
    } catch (error) {
      console.error('Dashboard: Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }, [profileLoading, fetchKPIs, fetchSalesData, fetchBudgetStatusData, fetchAlerts, fetchTopProducts]);

  // Callbacks para real-time updates
  const handleBudgetChange = useCallback(() => {
    fetchKPIs();
    fetchBudgetStatusData();
    fetchAlerts();
  }, [fetchKPIs, fetchBudgetStatusData, fetchAlerts]);

  const handleSaleChange = useCallback(() => {
    fetchKPIs();
    fetchSalesData();
    fetchAlerts();
    fetchTopProducts();
  }, [fetchKPIs, fetchSalesData, fetchAlerts, fetchTopProducts]);

  const handleProductChange = useCallback(() => {
    fetchAlerts();
  }, [fetchAlerts]);

  // Setup real-time subscriptions
  useDashboardRealtime({
    onBudgetChange: handleBudgetChange,
    onSaleChange: handleSaleChange,
    onProductChange: handleProductChange,
    enabled: hasInitialLoad && !!user && !profileLoading
  });

  // Initial data load
  useEffect(() => {
    if (user && !profileLoading && !hasInitialLoad) {
      fetchAllData();
    }
  }, [user, profileLoading, hasInitialLoad]);

  // Handle date range changes
  useEffect(() => {
    if (hasInitialLoad && dateRange) {
      fetchAllData();
    }
  }, [dateRange, hasInitialLoad]);

  return {
    kpis,
    salesData,
    budgetStatusData,
    alerts,
    topProducts,
    loading,
    refetch: fetchAllData,
  };
};
