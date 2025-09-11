
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
  const [requiresReceipts, setRequiresReceipts] = useState(false);
  
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

        // Verificar se requer comprovantes
        await checkRequiresReceipts(budget || budgetToConvert);
      } catch (error) {
        console.error('Error fetching budget:', error);
        setCurrentBudget(budgetToConvert);
      } finally {
        setLoading(false);
      }
    };

    const checkRequiresReceipts = async (budget: LocalBudget) => {
      try {
        let needsReceipts = false;

        // Verificar meio de pagamento
        if (budget.payment_method_id) {
          const { data: paymentMethod } = await supabase
            .from('payment_methods')
            .select('requires_receipt')
            .eq('id', budget.payment_method_id)
            .single();
          
          if (paymentMethod?.requires_receipt) {
            needsReceipts = true;
          }
        }

        // Verificar tipo de pagamento
        if (budget.payment_type_id && !needsReceipts) {
          const { data: paymentType } = await supabase
            .from('payment_types')
            .select('requires_receipt')
            .eq('id', budget.payment_type_id)
            .single();
          
          if (paymentType?.requires_receipt) {
            needsReceipts = true;
          }
        }

        setRequiresReceipts(needsReceipts);
      } catch (error) {
        console.error('Error checking receipt requirements:', error);
        setRequiresReceipts(false);
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
    if (requiresReceipts && attachments.length === 0) {
      toast.error('É obrigatório adicionar pelo menos um comprovante de pagamento');
      return;
    }
    onConfirm(currentBudget || budgetToConvert || undefined, requiresReceipts ? attachments : []);
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
            {requiresReceipts ? (
              <>
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
              </>
            ) : (
              <>
                Tem certeza que deseja converter este orçamento em venda?
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
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {displayBudget && requiresReceipts && (
            <PaymentReceiptsUpload
              clientName={displayBudget.clients?.name || 'cliente'}
              onFilesChange={handleFilesChange}
              disabled={loading}
            />
          )}
          
          {!requiresReceipts && (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                Este orçamento não requer comprovantes de pagamento.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={loading || (requiresReceipts && attachments.length === 0)}
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
