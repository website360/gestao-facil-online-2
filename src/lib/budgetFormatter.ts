/**
 * Formatador centralizado para IDs de orçamento
 * Garante consistência entre interface e PDF
 */

export const formatBudgetId = (budgetId: string, createdAt?: string): string => {
  if (createdAt) {
    // Usar a data de criação no formato solicitado: DDMMYY + HHMM
    const date = new Date(createdAt);
    
    // Obter componentes da data
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2); // Últimos 2 dígitos do ano
    
    // Obter componentes da hora
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    // Formato: #O + DDMMYY + HHMM
    const formattedNumber = `${day}${month}${year}${hours}${minutes}`;
    
    return `#O${formattedNumber}`;
  }
  
  // Fallback para quando não há data (manter compatibilidade)
  const uuid = budgetId.replace(/-/g, '');
  const hashCode = uuid.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const sequentialNumber = Math.abs(hashCode).toString().slice(-8).padStart(8, '0');
  return `#O${sequentialNumber}`;
};

export const formatSaleId = (saleId: string, createdAt?: string): string => {
  if (createdAt) {
    // Usar a data de criação no formato solicitado: DDMMYY + HHMM
    const date = new Date(createdAt);
    
    // Obter componentes da data
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear().toString().slice(-2); // Últimos 2 dígitos do ano
    
    // Obter componentes da hora
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    
    // Formato: #V + DDMMYY + HHMM
    const formattedNumber = `${day}${month}${year}${hours}${minutes}`;
    
    return `#V${formattedNumber}`;
  }
  
  // Fallback para quando não há data (manter compatibilidade)
  const uuid = saleId.replace(/-/g, '');
  const hashCode = uuid.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const sequentialNumber = Math.abs(hashCode).toString().slice(-8).padStart(8, '0');
  return `#V${sequentialNumber}`;
};