
import React, { useState } from 'react';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useBudgetManagement } from '@/hooks/useBudgetManagement';
import { useBudgetFilters } from '@/hooks/useBudgetFilters';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import EmptyState from '@/components/ui/empty-state';
import { CheckCircle, Eye, XCircle, ClipboardCheck } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency } from '@/lib/formatters';
import { formatBudgetId } from '@/lib/budgetFormatter';
import type { LocalBudget } from '@/hooks/useBudgetManagement';

const BudgetApproval = () => {
  const { userProfile, isAdmin } = useUserProfile();
  const { budgets, loading, fetchBudgets } = useBudgetManagement(userProfile?.role);
  const { toast } = useToast();
  const [approvalNotes, setApprovalNotes] = useState('');
  const [selectedBudget, setSelectedBudget] = useState<LocalBudget | null>(null);

  // Filter only budgets awaiting approval
  const pendingBudgets = budgets.filter(budget => budget.status === 'aguardando_aprovacao' as any);

  const {
    filteredBudgets,
    searchTerm,
    setSearchTerm
  } = useBudgetFilters(pendingBudgets);

  const handleApprove = async (budgetId: string) => {
    try {
      // First, convert to sale
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .insert({
          client_id: selectedBudget?.client_id,
          budget_id: budgetId,
          created_by: selectedBudget?.created_by,
          status: 'separacao',
          total_amount: selectedBudget?.total_amount,
          payment_method_id: selectedBudget?.payment_method_id,
          payment_type_id: selectedBudget?.payment_type_id,
          shipping_option_id: selectedBudget?.shipping_option_id,
          shipping_cost: selectedBudget?.shipping_cost,
          installments: selectedBudget?.installments,
          check_installments: selectedBudget?.check_installments,
          check_due_dates: selectedBudget?.check_due_dates,
          boleto_installments: selectedBudget?.boleto_installments,
          boleto_due_dates: selectedBudget?.boleto_due_dates,
          discount_percentage: selectedBudget?.discount_percentage,
          invoice_percentage: selectedBudget?.invoice_percentage,
          notes: selectedBudget?.notes,
          local_delivery_info: selectedBudget?.local_delivery_info
        })
        .select()
        .single();

      if (saleError) throw saleError;

      // Copy budget items to sale items
      const { data: budgetItems } = await supabase
        .from('budget_items')
        .select('*')
        .eq('budget_id', budgetId);

      if (budgetItems) {
        const saleItems = budgetItems.map(item => ({
          sale_id: saleData.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total_price: item.total_price
        }));

        const { error: itemsError } = await supabase
          .from('sale_items')
          .insert(saleItems);

        if (itemsError) throw itemsError;
      }

      // Update budget status and approval info
      const { error: budgetError } = await supabase
        .from('budgets')
        .update({
          status: 'convertido',
          approved_by: (userProfile as any)?.id,
          approved_at: new Date().toISOString(),
          approval_notes: approvalNotes
        })
        .eq('id', budgetId);

      if (budgetError) throw budgetError;

      toast({
        title: "Orçamento aprovado",
        description: "O orçamento foi aprovado e convertido em venda com sucesso.",
      });

      setSelectedBudget(null);
      setApprovalNotes('');
      fetchBudgets();
    } catch (error) {
      console.error('Error approving budget:', error);
      toast({
        title: "Erro",
        description: "Erro ao aprovar orçamento.",
        variant: "destructive"
      });
    }
  };

  const handleReject = async (budgetId: string) => {
    try {
      const { error } = await supabase
        .from('budgets')
        .update({
          status: 'aguardando_aprovacao',
          approval_notes: approvalNotes
        })
        .eq('id', budgetId);

      if (error) throw error;

      toast({
        title: "Orçamento rejeitado",
        description: "O orçamento foi rejeitado e retornado para revisão.",
      });

      setSelectedBudget(null);
      setApprovalNotes('');
      fetchBudgets();
    } catch (error) {
      console.error('Error rejecting budget:', error);
      toast({
        title: "Erro",
        description: "Erro ao rejeitar orçamento.",
        variant: "destructive"
      });
    }
  };

  if (!isAdmin && userProfile?.role !== 'gerente') {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">Acesso negado. Apenas administradores e gerentes podem acessar esta página.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="space-y-4">
          <div className="h-8 bg-muted rounded animate-pulse" />
          <div className="h-64 bg-muted rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Aprovação de Orçamentos</h1>
          <p className="text-muted-foreground">
            Gerencie orçamentos aguardando aprovação
          </p>
        </div>
        <Badge variant="secondary" className="text-sm">
          {filteredBudgets.length} aguardando aprovação
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Input
              placeholder="Buscar por cliente..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Vendedor</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="w-40">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBudgets.map((budget, index) => (
                <TableRow key={budget.id}>
                  <TableCell className="font-medium">
                    {formatBudgetId(budget.id, budget.created_at)}
                  </TableCell>
                  <TableCell>
                    <div>
                      <p className="font-medium">{budget.clients?.name}</p>
                      <p className="text-sm text-muted-foreground">{budget.clients?.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    {budget.creator_profile?.name || 'N/A'}
                  </TableCell>
                  <TableCell>
                    {new Date(budget.created_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(budget.total_amount)}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => setSelectedBudget(budget)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Aprovar
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Aprovar Orçamento</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div>
                              <p><strong>Cliente:</strong> {selectedBudget?.clients?.name}</p>
                              <p><strong>Total:</strong> {formatCurrency(selectedBudget?.total_amount || 0)}</p>
                            </div>
                            <div>
                              <label className="text-sm font-medium">Observações (opcional)</label>
                              <Textarea
                                value={approvalNotes}
                                onChange={(e) => setApprovalNotes(e.target.value)}
                                placeholder="Adicione observações sobre a aprovação..."
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button
                                onClick={() => handleApprove(selectedBudget?.id || '')}
                                className="flex-1"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Aprovar Venda
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => handleReject(selectedBudget?.id || '')}
                                className="flex-1"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Rejeitar
                              </Button>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredBudgets.length === 0 && (
            <EmptyState
              title="Nenhum orçamento aguardando aprovação"
              description="Os orçamentos aparecerão aqui quando forem enviados para aprovação."
              icon={ClipboardCheck}
            />
          )}
        </CardContent>
      </Card>

    </div>
  );
};

export default BudgetApproval;
