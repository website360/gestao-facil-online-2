
export interface Product {
  id: string;
  name: string;
  internal_code: string;
  price: number;
  stock: number;
  stock_unit?: string;
  weight?: number;
  weight_unit?: string;
  category_id?: string;
  barcode?: string;
  photo_url?: string;
  size?: string;
  composition?: string;
  color?: string;
  box?: string;
  observation?: string;
  width?: number;
  length?: number;
  height?: number;
  supplier_id?: string;
  categories?: { name: string };
  created_at: string;
}

export interface ProductFormState {
  name: string;
  internalCode: string;
  barcode: string;
  price: string;
  stock: string;
  stockUnit: string;
  weight: string;
  weightUnit: string;
  categoryId: string;
  supplierId: string;
  photoUrl: string;
  size: string;
  composition: string;
  color: string;
  box: string;
  width: string;
  length: string;
  height: string;
  observation: string;
}
