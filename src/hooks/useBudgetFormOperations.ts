
import React from 'react';

interface BudgetItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  discount_percentage: number;
  product_code?: string;
}

interface FormData {
  client_id: string;
  notes: string;
  discount_percentage: number;
  local_delivery_info: string;
  items: BudgetItem[];
  status: 'processando' | 'aguardando_aprovacao' | 'aprovado';
}

interface Product {
  id: string;
  name: string;
  price: number;
  internal_code?: string;
}

export const useBudgetFormOperations = (
  formData: FormData,
  setFormData: React.Dispatch<React.SetStateAction<FormData>>,
  products: Product[]
) => {
  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { 
        product_id: '', 
        quantity: 1, 
        unit_price: 0, 
        discount_percentage: prev.discount_percentage, // Usar desconto geral como padrão
        product_code: ''
      }]
    }));
  };

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const updateItem = (index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map((item, i) => {
        if (i === index) {
          return { ...item, [field]: value };
        }
        return item;
      })
    }));
  };

  // O desconto geral SEMPRE atualiza TODOS os produtos
  const updateGeneralDiscount = (newGeneralDiscount: number) => {
    console.log('=== UPDATING GENERAL DISCOUNT ===');
    console.log('New general discount:', newGeneralDiscount);
    console.log('Current items before update:', formData.items);
    
    setFormData(prev => {
      const updatedItems = prev.items.map((item, index) => {
        console.log(`Updating item ${index} discount from ${item.discount_percentage} to ${newGeneralDiscount}`);
        return {
          ...item,
          discount_percentage: newGeneralDiscount
        };
      });
      
      console.log('Updated items:', updatedItems);
      console.log('=== END UPDATING GENERAL DISCOUNT ===');
      
      return {
        ...prev,
        discount_percentage: newGeneralDiscount,
        items: updatedItems
      };
    });
  };

  const getProductPrice = (productId: string) => {
    const product = products.find(p => p?.id === productId);
    return product?.price || 0;
  };

  const getProductCode = (productId: string) => {
    const product = products.find(p => p?.id === productId);
    return product?.internal_code || '';
  };

  const handleProductChange = (index: number, productId: string) => {
    const price = getProductPrice(productId);
    const code = getProductCode(productId);
    updateItem(index, 'product_id', productId);
    updateItem(index, 'unit_price', price);
    updateItem(index, 'product_code', code);
  };

  return {
    addItem,
    removeItem,
    updateItem,
    updateGeneralDiscount,
    handleProductChange
  };
};
