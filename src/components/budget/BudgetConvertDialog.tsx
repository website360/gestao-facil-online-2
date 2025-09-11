
import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/lib/utils';
import { useBudgetCalculations } from '@/hooks/useBudgetCalculations';
import PaymentReceiptsUpload from './PaymentReceiptsUpload';
import { toast } from 'sonner';
import type { LocalBudget } from '@/hooks/useBudgetManagement';

interface FileWithPreview {
  file: File;
  preview: string;
  generatedName: string;
}

interface BudgetConvertDialogProps {
  budgetToConvert: LocalBudget | null;
  onClose: () => void;
  onConfirm: (updatedBudget?: LocalBudget, attachments?: FileWithPreview[]) => void;
}

const BudgetConvertDialog = ({ budgetToConvert, onClose, onConfirm }: BudgetConvertDialogProps) => {
  const [currentBudget, setCurrentBudget] = useState<LocalBudget | null>(null);
  const [loading, setLoading] = useState(false);
  const [attachments, setAttachments] = useState<FileWithPreview[]>([]);
  
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
    if (attachments.length === 0) {
      toast.error('É obrigatório adicionar pelo menos um comprovante de pagamento');
      return;
    }
    onConfirm(currentBudget || budgetToConvert || undefined, attachments);
  };

  const handleFilesChange = (files: FileWithPreview[]) => {
    setAttachments(files);
  };

  return (
    <Dialog open={!!budgetToConvert} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Converter Orçamento em Venda</DialogTitle>
          <DialogDescription>
            Confirme a conversão e anexe os comprovantes de pagamento obrigatórios.
            {displayBudget && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div><strong>Cliente:</strong> {displayBudget.clients?.name}</div>
                  <div><strong>Valor:</strong> {formatCurrency(totalAmount)}</div>
                  <div><strong>Produtos:</strong> {uniqueProducts}</div>
                  <div><strong>Itens:</strong> {totalQuantity}</div>
                </div>
                {loading && <div className="text-sm text-gray-500 mt-2">Atualizando dados...</div>}
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {displayBudget && (
            <PaymentReceiptsUpload
              clientName={displayBudget.clients?.name || 'cliente'}
              onFilesChange={handleFilesChange}
              disabled={loading}
            />
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={loading || attachments.length === 0}
            className="bg-green-600 hover:bg-green-700"
          >
            Converter em Venda
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BudgetConvertDialog;
