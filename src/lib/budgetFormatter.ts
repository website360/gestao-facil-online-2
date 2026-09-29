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

/**
 * Inverso de formatSaleId: o ID exibido (#V + DDMMYY + HHMM) não existe no banco,
 * é derivado do created_at. Esta função o converte de volta no intervalo de um
 * minuto em que a venda foi criada, permitindo buscar a venda direto no banco
 * mesmo quando ela está fora do período carregado na tela.
 *
 * Retorna null quando o termo não é um ID de venda completo — aí a busca comum
 * (cliente, vendedor, nota) segue valendo.
 */
export const parseSaleIdToRange = (term: string): { start: Date; end: Date } | null => {
  const cleaned = term.trim().toUpperCase().replace(/[#\s-]/g, '');
  const match = /^V?(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/.exec(cleaned);

  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = 2000 + Number(match[3]);
  const hours = Number(match[4]);
  const minutes = Number(match[5]);

  // Mesmo fuso usado por formatSaleId (getDate/getHours), então o round-trip fecha
  const start = new Date(year, month - 1, day, hours, minutes, 0, 0);

  // O Date faz rollover silencioso (32/09 vira 02/10), então conferimos de volta
  if (
    start.getDate() !== day ||
    start.getMonth() !== month - 1 ||
    start.getFullYear() !== year ||
    start.getHours() !== hours ||
    start.getMinutes() !== minutes
  ) {
    return null;
  }

  const end = new Date(start);
  end.setSeconds(59, 999);

  return { start, end };
};