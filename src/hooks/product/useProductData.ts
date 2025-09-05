
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useProductData = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      console.log('Categories fetched:', data);
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('*')
        .order('name');

      if (error) throw error;
      console.log('Suppliers fetched:', data);
      setSuppliers(data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  // Load categories and suppliers on mount
  useEffect(() => {
    fetchCategories();
    fetchSuppliers();
  }, []);

  return {
    categories,
    suppliers,
    fetchCategories,
    fetchSuppliers
  };
};
