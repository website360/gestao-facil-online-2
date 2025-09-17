import { supabase } from '@/integrations/supabase/client';

// Helper functions to convert IDs to readable text by fetching from database
export const getPaymentMethodText = async (paymentMethodId: string | null) => {
  if (!paymentMethodId) return 'Não informado';
  
  try {
    const { data, error } = await supabase
      .from('payment_methods')
      .select('name')
      .eq('id', paymentMethodId)
      .single();
    
    if (error || !data) return paymentMethodId;
    return data.name;
  } catch {
    return paymentMethodId;
  }
};

export const getPaymentTypeText = async (paymentTypeId: string | null) => {
  if (!paymentTypeId) return 'Não informado';
  
  try {
    const { data, error } = await supabase
      .from('payment_types')
      .select('name')
      .eq('id', paymentTypeId)
      .single();
    
    if (error || !data) return paymentTypeId;
    return data.name;
  } catch {
    return paymentTypeId;
  }
};

export const getShippingOptionText = async (shippingOptionId: string | null) => {
  if (!shippingOptionId) return 'Não informado';
  
  try {
    const { data, error } = await supabase
      .from('shipping_options')
      .select('name')
      .eq('id', shippingOptionId)
      .single();
    
    if (error || !data) return shippingOptionId;
    return data.name;
  } catch {
    return shippingOptionId;
  }
};