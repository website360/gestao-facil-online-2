
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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
