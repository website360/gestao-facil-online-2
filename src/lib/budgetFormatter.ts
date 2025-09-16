/**
 * Formatador centralizado para IDs de orçamento
 * Garante consistência entre interface e PDF
 */

export const formatBudgetId = (budgetId: string, createdAt?: string): string => {
  // Usar os primeiros 8 caracteres do UUID para garantir unicidade
  // mas de forma mais legível, convertendo para números
  const uuid = budgetId.replace(/-/g, '');
  const hashCode = uuid.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  // Converter para número positivo e pegar 8 dígitos
  const sequentialNumber = Math.abs(hashCode).toString().slice(-8).padStart(8, '0');
  
  return `#O${sequentialNumber}`;
};

export const formatSaleId = (saleId: string, createdAt?: string): string => {
  // Usar os primeiros 8 caracteres do UUID para garantir unicidade
  const uuid = saleId.replace(/-/g, '');
  const hashCode = uuid.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  // Converter para número positivo e pegar 8 dígitos
  const sequentialNumber = Math.abs(hashCode).toString().slice(-8).padStart(8, '0');
  
  return `#V${sequentialNumber}`;
};