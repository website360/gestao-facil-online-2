/**
 * Mapeamento de roles antigas para novas
 */

export type OldRole = 'admin' | 'gerente' | 'vendas' | 'separacao' | 'conferencia' | 'nota_fiscal' | 'cliente' | 'entregador' | 'vendedor_externo' | 'vendedor_interno';
export type NewRole = 'admin' | 'gerente' | 'vendedor_externo' | 'vendedor_interno' | 'separacao' | 'conferencia' | 'nota_fiscal' | 'cliente' | 'entregador';

export const mapRole = (oldRole: OldRole): NewRole => {
  if (oldRole === 'vendas') {
    return 'vendedor_externo';
  }
  return oldRole as NewRole;
};

export const isVendorRole = (role: NewRole): boolean => {
  return role === 'vendedor_externo' || role === 'vendedor_interno';
};

export const isVendorOrOldVendasRole = (role: OldRole | NewRole): boolean => {
  return role === 'vendedor_externo' || role === 'vendedor_interno' || role === 'vendas';
};