
import { useState, useEffect } from 'react';
import type { LocalBudget } from './useBudgetManagement';

export const useBudgetFilters = (budgets: LocalBudget[], userRole?: string) => {
  const [filteredBudgets, setFilteredBudgets] = useState<LocalBudget[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    let filtered = budgets;

    // Exibir todos os orçamentos por padrão; o filtro de status controla a visualização
    // Removido filtro que ocultava convertidos para vendedores para evitar listas vazias


    if (searchTerm) {
      filtered = filtered.filter(budget =>
        budget.clients?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(budget => budget.status === statusFilter);
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
