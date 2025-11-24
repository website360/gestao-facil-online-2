import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TopProduct {
  product_id: string;
  product_name: string;
  internal_code: string;
  photo_url: string | null;
  current_stock: number;
  quantity_sold: number;
}

interface DateRange {
  startDate?: Date;
  endDate?: Date;
}

export const useDashboardTopProducts = (dateRange?: DateRange) => {
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);

  const fetchTopProducts = useCallback(async () => {
    try {
      // Determinar o início e fim do período
      let startDate: string | null = null;
      let endDate: string | null = null;

      if (dateRange?.startDate && dateRange?.endDate) {
        // Se ambas as datas foram fornecidas, usar período customizado
        startDate = dateRange.startDate.toISOString();
        endDate = new Date(dateRange.endDate.setHours(23, 59, 59, 999)).toISOString();
      } else if (!dateRange?.startDate && !dateRange?.endDate) {
        // Se nenhuma data foi fornecida, usar o mês atual
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        
        startDate = firstDay.toISOString();
        endDate = lastDay.toISOString();
      }

      const { data, error } = await supabase.rpc('get_top_selling_products', {
        p_start_date: startDate,
        p_end_date: endDate
      });

      if (error) throw error;
      
      setTopProducts(data || []);
    } catch (error) {
      console.error('Error fetching top products:', error);
      toast.error('Erro ao carregar produtos mais vendidos');
      setTopProducts([]);
    }
  }, [dateRange]);

  return {
    topProducts,
    fetchTopProducts
  };
};
