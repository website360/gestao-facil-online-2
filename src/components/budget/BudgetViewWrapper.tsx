import React from 'react';
import BudgetViewForm from './BudgetViewForm';
import type { LocalBudget } from '@/hooks/useBudgetManagement';
import { useBudgetFormData } from '@/hooks/useBudgetFormData';
import { useBudgetFormState } from '@/hooks/useBudgetFormState';

interface BudgetViewWrapperProps {
  budget: LocalBudget;
  onClose: () => void;
}

const BudgetViewWrapper = ({ budget, onClose }: BudgetViewWrapperProps) => {
  const { clients, products, dataLoaded } = useBudgetFormData();
  const { formData } = useBudgetFormState(budget);

  // Show loading state while data is being fetched
  if (!dataLoaded) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <BudgetViewForm
      formData={formData}
      clients={clients}
      products={products}
      editingBudget={budget}
      onClose={onClose}
    />
  );
};

export default BudgetViewWrapper;