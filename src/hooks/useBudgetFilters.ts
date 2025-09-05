
import { useState, useEffect } from 'react';
import type { LocalBudget } from './useBudgetManagement';

export const useBudgetFilters = (budgets: LocalBudget[], userRole?: string) => {
  const [filteredBudgets, setFilteredBudgets] = useState<LocalBudget[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    let filtered = budgets;

    // Para clientes, mostrar todos os seus orçamentos (incluindo convertidos)
    // Para outros usuários, filter out converted budgets - hide them from the list
    if (userRole !== 'cliente') {
      filtered = filtered.filter(budget => budget.status !== 'convertido');
    }

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
