
import React from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import BudgetForm from './BudgetForm';
import type { LocalBudget } from '@/hooks/useBudgetManagement';
import { useBudgetFormData } from '@/hooks/useBudgetFormData';
import { useBudgetFormState } from '@/hooks/useBudgetFormState';
import { useAuth } from '@/hooks/useAuth';
import { BudgetService } from '@/services/budgetService';

interface BudgetFormWrapperProps {
  editingBudget: LocalBudget | null;
  onSuccess: () => void;
  onCancel: () => void;
}

const BudgetFormWrapper = ({ editingBudget, onSuccess, onCancel }: BudgetFormWrapperProps) => {
  const { clients, products, loading, setLoading, dataLoaded } = useBudgetFormData();
  const { formData, setFormData } = useBudgetFormState(editingBudget);
  const { user, isClient, clientData } = useAuth();

  console.log('=== BUDGET FORM WRAPPER RENDER ===');
  console.log('Editing budget ID:', editingBudget?.id || 'none');
  console.log('Data loaded:', dataLoaded);
  console.log('Clients count:', clients.length);
  console.log('Products count:', products.length);
  console.log('Form data client_id:', formData.client_id);
  console.log('Form data items count:', formData.items?.length || 0);
  console.log('=== END BUDGET FORM WRAPPER RENDER ===');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('=== FORM SUBMISSION STARTED ===');
    console.log('Current form data:', formData);
    setLoading(true);

    try {
      let createdBy: string;
      
      if (isClient && clientData) {
        // Para clientes, usar o ID do cliente como created_by
        createdBy = clientData.id;
        console.log('Client creating budget, using client ID:', createdBy);
      } else {
        // Para funcionários, usar o user ID do Supabase
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.error('User not authenticated');
          throw new Error('User not authenticated');
        }
        createdBy = user.id;
        console.log('User authenticated:', createdBy);
      }

      // Log detailed form data before validation
      console.log('Form data details:');
      console.log('- Client ID:', formData.client_id);
      console.log('- Items count:', formData.items?.length || 0);
      console.log('- Items:', formData.items);
      console.log('- Notes:', formData.notes);
      console.log('- Status:', formData.status);

      // Validate required fields
      if (!BudgetService.validateFormData(formData)) {
        console.log('Form validation failed, stopping submission');
        return;
      }

      if (editingBudget) {
        console.log('Updating existing budget with ID:', editingBudget.id);
        await BudgetService.updateBudget(formData, editingBudget, isClient);
      } else {
        console.log('Creating new budget');
        await BudgetService.createBudget(formData, createdBy, isClient);
      }

      console.log('Budget operation completed successfully');
      console.log('=== FORM SUBMISSION COMPLETED ===');
      onSuccess();
    } catch (error) {
      console.error('=== FORM SUBMISSION ERROR ===');
      console.error('Erro ao salvar orçamento:', error);
      console.error('Error details:', {
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint
      });
      toast.error('Erro ao salvar orçamento');
    } finally {
      setLoading(false);
    }
  };

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
    <BudgetForm
      formData={formData}
      setFormData={setFormData}
      clients={clients}
      products={products}
      loading={loading}
      editingBudget={editingBudget}
      onSubmit={handleSubmit}
      onCancel={onCancel}
    />
  );
};

export default BudgetFormWrapper;
