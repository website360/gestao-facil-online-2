
import { useState } from 'react';
import { ProductFormState, Product } from './types';

export const useProductFormState = () => {
  const [name, setName] = useState('');
  const [internalCode, setInternalCode] = useState('');
  const [barcode, setBarcode] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [stockUnit, setStockUnit] = useState('Peça');
  const [weight, setWeight] = useState('');
  const [weightUnit, setWeightUnit] = useState('kg');
  const [categoryId, setCategoryId] = useState('');
  const [supplierId, setSupplierId] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [size, setSize] = useState('');
  const [composition, setComposition] = useState('');
  const [color, setColor] = useState('');
  const [box, setBox] = useState('');
  const [width, setWidth] = useState('');
  const [length, setLength] = useState('');
  const [height, setHeight] = useState('');
  const [observation, setObservation] = useState('');

  const resetForm = () => {
    setName('');
    setInternalCode('');
    setBarcode('');
    setPrice('');
    setStock('');
    setStockUnit('Peça');
    setWeight('');
    setWeightUnit('kg');
    setCategoryId('');
    setSupplierId('');
    setPhotoUrl('');
    setSize('');
    setComposition('');
    setColor('');
    setBox('');
    setWidth('');
    setLength('');
    setHeight('');
    setObservation('');
  };

  const loadProductData = (product: Product) => {
    console.log('Loading product for edit:', product);
    setName(product.name);
    setInternalCode(product.internal_code);
    setBarcode(product.barcode || '');
    setPrice(product.price?.toString() || '');
    setStock(product.stock?.toString() || '');
    setStockUnit(product.stock_unit || 'Peça');
    setWeight(product.weight?.toString() || '');
    setWeightUnit(product.weight_unit || 'kg');
    
    // Set category and supplier IDs correctly
    const categoryIdToSet = product.category_id || '';
    const supplierIdToSet = product.supplier_id || '';
    
    console.log('Setting categoryId to:', categoryIdToSet);
    console.log('Setting supplierId to:', supplierIdToSet);
    
    setCategoryId(categoryIdToSet);
    setSupplierId(supplierIdToSet);
    
    // Handle photo URL - accept all URLs for editing, including blob URLs
    console.log('Product photo_url:', product.photo_url);
    if (product.photo_url) {
      setPhotoUrl(product.photo_url);
      console.log('Photo URL set to:', product.photo_url);
    } else {
      setPhotoUrl('');
      console.log('No photo URL found, setting empty');
    }
    
    setSize(product.size || '');
    setComposition(product.composition || '');
    setColor(product.color || '');
    setBox(product.box || '');
    setWidth(product.width?.toString() || '');
    setLength(product.length?.toString() || '');
    setHeight(product.height?.toString() || '');
    setObservation(product.observation || '');
  };

  return {
    // Basic info
    name, setName,
    internalCode, setInternalCode,
    barcode, setBarcode,
    // Price and stock
    price, setPrice,
    stock, setStock,
    stockUnit, setStockUnit,
    weight, setWeight,
    weightUnit, setWeightUnit,
    categoryId, setCategoryId,
    supplierId, setSupplierId,
    photoUrl, setPhotoUrl,
    size, setSize,
    composition, setComposition,
    color, setColor,
    box, setBox,
    width, setWidth,
    length, setLength,
    height, setHeight,
    observation, setObservation,
    
    // Functions
    resetForm,
    loadProductData
  };
};
