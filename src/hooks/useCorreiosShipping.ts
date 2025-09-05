import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ShippingCalculation {
  cep_destino: string;
  peso: number;
  altura: number;
  largura: number;
  comprimento: number;
}

interface ShippingOption {
  service_name: string;
  service_code: string;
  price: number;
  delivery_time: number;
  error?: string;
}

export const useCorreiosShipping = () => {
  const [loading, setLoading] = useState(false);

  const calculateShipping = async (params: ShippingCalculation): Promise<ShippingOption[]> => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('calculate-shipping', {
        body: params
      });

      if (error) {
        console.error('Error calculating shipping:', error);
        toast.error('Erro ao calcular frete');
        return [];
      }

      if (!data.success) {
        toast.error(data.error || 'Erro ao calcular frete');
        return [];
      }

      return data.shipping_options || [];
    } catch (error) {
      console.error('Error calculating shipping:', error);
      toast.error('Erro ao calcular frete');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const isCorreiosEnabled = async (): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from('system_configurations')
        .select('value')
        .eq('key', 'correios_config')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking Correios config:', error);
        return false;
      }

      if (!data?.value) {
        return false;
      }

      // Parse o valor se for string JSON
      const config = typeof data.value === 'string' 
        ? JSON.parse(data.value) 
        : data.value;

      return config?.enabled || false;
    } catch (error) {
      console.error('Error checking Correios config:', error);
      return false;
    }
  };

  return {
    calculateShipping,
    isCorreiosEnabled,
    loading
  };
};