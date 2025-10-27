
import { useState, useEffect } from 'react';
import type { LocalBudget } from './useBudgetManagement';

export const useBudgetFilters = (budgets: LocalBudget[], userRole?: string) => {
  const [filteredBudgets, setFilteredBudgets] = useState<LocalBudget[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    let filtered = budgets;

    // Aplicar filtro de status primeiro
    if (statusFilter === 'all') {
      // Quando "Todos", sempre excluir convertidos
      filtered = filtered.filter(budget => budget.status !== 'convertido');
    } else if (statusFilter === 'convertido') {
      // Se filtrar especificamente por "convertido", mostrar só esses
      filtered = filtered.filter(budget => budget.status === 'convertido');
    } else {
      // Para qualquer outro status específico, aplicar o filtro
      filtered = filtered.filter(budget => budget.status === statusFilter);
    }

    // Aplicar busca por nome
    if (searchTerm) {
      filtered = filtered.filter(budget =>
        budget.clients?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredBudgets(filtered);
  }, [budgets, searchTerm, statusFilter, userRole]);

  return {
    filteredBudgets,
    searchTerm,
    setSearchTerm,
    statusFilter,
    setStatusFilter
  };
};
