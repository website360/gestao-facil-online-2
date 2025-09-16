/**
 * Formatador centralizado para IDs de orçamento
 * Garante consistência entre interface e PDF
 */

export const formatBudgetId = (budgetId: string, createdAt?: string): string => {
  if (createdAt) {
    // Usar a data de criação para gerar um número sequencial
    const date = new Date(createdAt);
    const baseDate = new Date('2025-01-01'); // Data base para início da contagem
    const daysDiff = Math.floor((date.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Combinar dias + horário para criar sequência única
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const milliseconds = date.getMilliseconds();
    
    // Criar número sequencial baseado na data/hora (máximo 8 dígitos)
    const timeBasedNumber = (daysDiff * 100000) + (hours * 3600) + (minutes * 60) + seconds;
    const sequentialNumber = timeBasedNumber.toString().padStart(8, '0');
    
    return `#O${sequentialNumber}`;
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
    // Usar a data de criação para gerar um número sequencial
    const date = new Date(createdAt);
    const baseDate = new Date('2025-01-01'); // Data base para início da contagem
    const daysDiff = Math.floor((date.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Combinar dias + horário para criar sequência única
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();
    const milliseconds = date.getMilliseconds();
    
    // Criar número sequencial baseado na data/hora (máximo 8 dígitos)
    const timeBasedNumber = (daysDiff * 100000) + (hours * 3600) + (minutes * 60) + seconds;
    const sequentialNumber = timeBasedNumber.toString().padStart(8, '0');
    
    return `#V${sequentialNumber}`;
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