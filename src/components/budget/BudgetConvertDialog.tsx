
import React, { useEffect, useState } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/utils';
import { useBudgetCalculations } from '@/hooks/useBudgetCalculations';
import type { LocalBudget } from '@/hooks/useBudgetManagement';

interface BudgetConvertDialogProps {
  budgetToConvert: LocalBudget | null;
  onClose: () => void;
  onConfirm: (updatedBudget?: LocalBudget) => void;
}

const BudgetConvertDialog = ({ budgetToConvert, onClose, onConfirm }: BudgetConvertDialogProps) => {
  const [currentBudget, setCurrentBudget] = useState<LocalBudget | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Calcula o total atualizado do orçamento
  const { calculateBudgetTotal } = useBudgetCalculations();

  // Busca os dados atualizados do orçamento quando o dialog é aberto
  useEffect(() => {
    const fetchCurrentBudget = async () => {
      if (!budgetToConvert?.id) return;
      
      setLoading(true);
      try {
        const { data: budget, error } = await supabase
          .from('budgets')
          .select(`
            *,
            clients (id, name, email, phone),
            budget_items (
              id,
              budget_id,
              product_id,
              quantity,
              unit_price,
              total_price,
              discount_percentage,
              products (id, name, price, internal_code)
            )
          `)
          .eq('id', budgetToConvert.id)
          .single();

        if (error) {
          console.error('Error fetching updated budget:', error);
          // Se houver erro, usa os dados originais
          setCurrentBudget(budgetToConvert);
        } else {
          // Garante que os budget_items tenham o budget_id correto
          const budgetWithItems = {
            ...budget,
            budget_items: budget.budget_items?.map((item: any) => ({
              ...item,
              budget_id: item.budget_id || budget.id
            })) || []
          };
          setCurrentBudget(budgetWithItems as LocalBudget);
        }
      } catch (error) {
        console.error('Error fetching budget:', error);
        setCurrentBudget(budgetToConvert);
      } finally {
        setLoading(false);
      }
    };

    if (budgetToConvert) {
      fetchCurrentBudget();
    } else {
      setCurrentBudget(null);
    }
  }, [budgetToConvert]);

  const displayBudget = currentBudget || budgetToConvert;
  const totalAmount = displayBudget ? calculateBudgetTotal(displayBudget) : 0;
  
  // Calcula quantidade total de itens
  const totalQuantity = displayBudget?.budget_items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const uniqueProducts = displayBudget?.budget_items?.length || 0;

  const handleConfirm = () => {
    onConfirm(currentBudget || budgetToConvert || undefined);
  };

  return (
    <AlertDialog open={!!budgetToConvert} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Conversão</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja converter este orçamento em venda? O orçamento será marcado como convertido e uma nova venda será criada.
            {displayBudget && (
              <div className="mt-2 p-2 bg-gray-50 rounded">
                <strong>Cliente:</strong> {displayBudget.clients?.name}<br />
                <strong>Valor:</strong> {formatCurrency(totalAmount)}<br />
                <strong>Items:</strong> {uniqueProducts} produto(s) - {totalQuantity} {totalQuantity === 1 ? 'item' : 'itens'}
                {loading && <div className="text-sm text-gray-500 mt-1">Atualizando dados...</div>}
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm} className="bg-green-600 hover:bg-green-700" disabled={loading}>
            Converter em Venda
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default BudgetConvertDialog;
