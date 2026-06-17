
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Normaliza o número da nota fiscal para exibição em etiquetas.
 * Quando não há número de NF de fato (vazio ou sem dígitos, ex.: "SNF", "S/N"),
 * retorna string vazia para o campo ficar em branco.
 */
export function formatInvoiceNumber(invoiceNumber?: string | null): string {
  const value = (invoiceNumber ?? '').trim();
  return /\d/.test(value) ? value : '';
}

// Re-exportar as funções de formatação para facilitar o uso
export {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatTime,
  formatNumber,
  toBrazilTime
} from './formatters';
