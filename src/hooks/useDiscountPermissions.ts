import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useUserProfile } from './useUserProfile';

export const useDiscountPermissions = () => {
  const { isClient } = useAuth();
  const { userProfile } = useUserProfile();
  const [maxDiscount, setMaxDiscount] = useState(0); // Será carregado da configuração
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDiscountConfig();
  }, [userProfile?.role]); // Adicionar dependência para recarregar quando o perfil mudar

  // Expor função para recarregar quando necessário
  const refreshConfig = () => {
    fetchDiscountConfig();
  };

  const fetchDiscountConfig = async () => {
    try {
      console.log('=== FETCHING DISCOUNT CONFIG ===');
      console.log('User profile:', userProfile);
      const { data, error } = await supabase
        .from('system_configurations')
        .select('key, value')
        .eq('key', 'max_discount_sales');

      console.log('Raw query result:', { data, error });

      if (error) {
        console.error('Error fetching discount config:', error);
        throw error;
      }

      if (data && data.length > 0) {
        const rawValue = data[0].value;
        console.log('Raw value from DB:', rawValue, 'type:', typeof rawValue);
        
        // Agora o campo é text, então deve vir como string
        const newValue = Number(rawValue);
        
        console.log('Processed value:', newValue);
        console.log('Setting maxDiscount to:', newValue);
        
        if (isNaN(newValue)) {
          console.error('Could not parse discount value:', rawValue);
          setMaxDiscount(10);
        } else {
          setMaxDiscount(newValue);
        }
      } else {
        console.log('No discount config found, using default');
        setMaxDiscount(10);
      }
      console.log('=== END FETCHING DISCOUNT CONFIG ===');
    } catch (error) {
      console.error('Error fetching discount config:', error);
      setMaxDiscount(10);
    } finally {
      setLoading(false);
    }
  };

  // Definir permissões baseado no tipo de usuário
  const canEditDiscount = !isClient; // Clientes não podem editar desconto
  const isAdminOrManager = userProfile?.role === 'admin' || userProfile?.role === 'gerente';
  const isSales = userProfile?.role === 'vendedor_externo' || userProfile?.role === 'vendedor_interno';

  // Verificar se um valor de desconto é válido
  const isValidGeneralDiscount = (value: number): boolean => {
    console.log('=== VALIDATING GENERAL DISCOUNT ===');
    console.log('Value:', value, 'MaxDiscount:', maxDiscount, 'UserProfile:', userProfile);
    console.log('isClient:', isClient, 'isAdminOrManager:', isAdminOrManager, 'isSales:', isSales);
    
    if (isClient) {
      console.log('Blocked: User is client');
      return false; // Clientes não podem aplicar desconto
    }
    if (isAdminOrManager) {
      const result = value >= 0 && value <= 100;
      console.log('Admin/Manager validation result:', result);
      return result; // Admin/gerente sem limite específico
    }
    if (isSales) {
      const result = value >= 0 && value <= maxDiscount;
      console.log('Sales validation result:', result, '(0 <=', value, '<=', maxDiscount, ')');
      return result; // Vendedor com limite único
    }
    console.log('No role matched, returning false');
    return false;
  };

  const isValidIndividualDiscount = (value: number): boolean => {
    console.log('=== VALIDATING INDIVIDUAL DISCOUNT ===');
    console.log('Value:', value, 'MaxDiscount:', maxDiscount, 'UserProfile:', userProfile);
    console.log('isClient:', isClient, 'isAdminOrManager:', isAdminOrManager, 'isSales:', isSales);
    
    if (isClient) {
      console.log('Blocked: User is client');
      return false; // Clientes não podem aplicar desconto
    }
    if (isAdminOrManager) {
      const result = value >= 0 && value <= 100;
      console.log('Admin/Manager validation result:', result);
      return result; // Admin/gerente sem limite específico
    }
    if (isSales) {
      const result = value >= 0 && value <= maxDiscount;
      console.log('Sales validation result:', result, '(0 <=', value, '<=', maxDiscount, ')');
      return result; // Vendedor com o mesmo limite
    }
    console.log('No role matched, returning false');
    return false;
  };

  // Obter o limite máximo para cada tipo de desconto
  const getMaxGeneralDiscount = (): number => {
    if (isClient) return 0;
    if (isAdminOrManager) return 100;
    if (isSales) return maxDiscount; // Valor único
    return 0;
  };

  const getMaxIndividualDiscount = (): number => {
    if (isClient) return 0;
    if (isAdminOrManager) return 100;
    if (isSales) return maxDiscount; // Mesmo valor para ambos
    return 0;
  };

  // Obter mensagem de erro personalizada
  const getDiscountErrorMessage = (type: 'general' | 'individual', value: number): string => {
    if (isClient) {
      return 'Clientes não têm permissão para aplicar desconto';
    }
    
    const maxDiscount = type === 'general' ? getMaxGeneralDiscount() : getMaxIndividualDiscount();
    const discountType = type === 'general' ? 'geral' : 'individual';
    
    if (isSales) {
      return `Vendedores podem aplicar no máximo ${maxDiscount}% de desconto ${discountType}`;
    }
    
    return `O desconto deve estar entre 0% e ${maxDiscount}%`;
  };

  return {
    canEditDiscount,
    isAdminOrManager,
    isSales,
    isClient,
    maxDiscount,
    loading,
    refreshConfig,
    isValidGeneralDiscount,
    isValidIndividualDiscount,
    getMaxGeneralDiscount,
    getMaxIndividualDiscount,
    getDiscountErrorMessage,
  };
};