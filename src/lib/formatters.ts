
// Configurações de localização para o Brasil
const BRAZIL_LOCALE = 'pt-BR';
const BRAZIL_TIMEZONE = 'America/Sao_Paulo'; // GMT-3 (considerando horário de verão)

// Formatador de moeda brasileira
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat(BRAZIL_LOCALE, {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

// Formatador de data brasileira (dd/mm/aaaa)
export const formatDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat(BRAZIL_LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    timeZone: BRAZIL_TIMEZONE,
  }).format(dateObj);
};

// Formatador de data e hora brasileira (dd/mm/aaaa às HH:mm)
export const formatDateTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat(BRAZIL_LOCALE, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: BRAZIL_TIMEZONE,
  }).format(dateObj);
};

// Formatador apenas de hora (HH:mm)
export const formatTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  return new Intl.DateTimeFormat(BRAZIL_LOCALE, {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: BRAZIL_TIMEZONE,
  }).format(dateObj);
};

// Função utilitária para converter data para o fuso horário do Brasil
export const toBrazilTime = (date: string | Date): Date => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  // Converte para o fuso horário de Brasília
  const brazilTime = new Date(dateObj.toLocaleString('en-US', { timeZone: BRAZIL_TIMEZONE }));
  return brazilTime;
};

// Função para formatar números (sem moeda)
export const formatNumber = (value: number, decimals: number = 2): string => {
  return new Intl.NumberFormat(BRAZIL_LOCALE, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
};
