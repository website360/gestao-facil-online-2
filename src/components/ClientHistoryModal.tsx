
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { FileText, ShoppingCart, Calendar, DollarSign, Eye } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import BudgetDetailModal from './BudgetDetailModal';
import SalesDetailModal from './SalesDetailModal';
import type { Database } from '@/integrations/supabase/types';

interface Budget {
  id: string;
  client_id: string;
  created_by: string;
  status: Database['public']['Enums']['budget_status'];
  total_amount: number;
  created_at: string;
  notes: string | null;
}

interface Sale {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
  notes: string | null;
  budget_id: string | null;
}

import { formatBudgetId } from '@/lib/budgetFormatter';

interface ClientHistoryModalProps {
  clientId: string;
  clientName: string;
  isOpen: boolean;
  onClose: () => void;
}

const ClientHistoryModal: React.FC<ClientHistoryModalProps> = ({
  clientId,
  clientName,
  isOpen,
  onClose,
}) => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBudgetId, setSelectedBudgetId] = useState<string | null>(null);
  const [budgetDetailOpen, setBudgetDetailOpen] = useState(false);
  const [selectedSaleId, setSelectedSaleId] = useState<string | null>(null);
  const [saleDetailOpen, setSaleDetailOpen] = useState(false);

  useEffect(() => {
    if (isOpen && clientId) {
      fetchClientHistory();
    }
  }, [isOpen, clientId]);

  const fetchClientHistory = async () => {
    try {
      setLoading(true);

      // Buscar vendas do cliente
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (salesError) throw salesError;

      // Buscar orçamentos do cliente
      const { data: budgetsData, error: budgetsError } = await supabase
        .from('budgets')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (budgetsError) throw budgetsError;

      // Filtrar orçamentos que foram convertidos em vendas
      const convertedBudgetIds = (salesData || [])
        .filter(sale => sale.budget_id)
        .map(sale => sale.budget_id);

      const filteredBudgets = (budgetsData || []).filter(
        budget => !convertedBudgetIds.includes(budget.id)
      );

      setBudgets(filteredBudgets);
      setSales(salesData || []);
    } catch (error) {
      console.error('Erro ao buscar histórico do cliente:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: { [key: string]: string } = {
      'aguardando': 'Aguardando',
      'enviado': 'Enviado',
      'convertido': 'Convertido',
      'separacao': 'Separação',
      'conferencia': 'Conferência',
      'nota_fiscal': 'Nota Fiscal',
      'finalizado': 'Finalizado'
    };
    return labels[status] || status;
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'aguardando':
        return 'secondary';
      case 'enviado':
        return 'default';
      case 'convertido':
        return 'outline';
      case 'separacao':
        return 'destructive';
      case 'conferencia':
        return 'destructive';
      case 'nota_fiscal':
        return 'destructive';
      case 'finalizado':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const handleViewBudget = (budgetId: string) => {
    setSelectedBudgetId(budgetId);
    setBudgetDetailOpen(true);
  };

  const handleViewSale = (saleId: string) => {
    setSelectedSaleId(saleId);
    setSaleDetailOpen(true);
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[95vw] md:max-w-6xl w-full max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg md:text-xl">Carregando histórico...</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-[95vw] md:max-w-6xl w-full max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg md:text-xl">
              <Calendar className="h-5 w-5" />
              Histórico - {clientName}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Orçamentos</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{budgets.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Vendas</CardTitle>
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{sales.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Valor Total Orçamentos</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(budgets.reduce((sum, budget) => sum + budget.total_amount, 0))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Valor Total Vendas</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(sales.reduce((sum, sale) => sum + sale.total_amount, 0))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Tabs com histórico detalhado */}
            <Tabs defaultValue="budgets" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="budgets">
                  Orçamentos ({budgets.length})
                </TabsTrigger>
                <TabsTrigger value="sales">
                  Vendas ({sales.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="budgets" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Histórico de Orçamentos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {budgets.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Data</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead>Observações</TableHead>
                            <TableHead>Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {budgets.map((budget, index) => (
                            <TableRow key={budget.id}>
                              <TableCell className="font-mono text-sm">
                                {formatBudgetId(budget.id, budget.created_at)}
                              </TableCell>
                              <TableCell>
                                {new Date(budget.created_at).toLocaleDateString('pt-BR')}
                              </TableCell>
                              <TableCell>
                                <Badge variant={getStatusVariant(budget.status)}>
                                  {getStatusLabel(budget.status)}
                                </Badge>
                              </TableCell>
                              <TableCell>{formatCurrency(budget.total_amount)}</TableCell>
                              <TableCell className="max-w-xs truncate">
                                {budget.notes || '-'}
                              </TableCell>
                              <TableCell>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      onClick={() => handleViewBudget(budget.id)}
                                    >
                                      <Eye className="h-4 w-4 text-black" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Ver</TooltipContent>
                                </Tooltip>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        Nenhum orçamento encontrado para este cliente.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="sales" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Histórico de Vendas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {sales.length > 0 ? (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>ID</TableHead>
                            <TableHead>Data</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Valor</TableHead>
                            <TableHead>Observações</TableHead>
                            <TableHead>Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {sales.map((sale) => (
                            <TableRow key={sale.id}>
                              <TableCell className="font-mono text-sm">
                                {sale.id.slice(0, 8)}
                              </TableCell>
                              <TableCell>
                                {new Date(sale.created_at).toLocaleDateString('pt-BR')}
                              </TableCell>
                              <TableCell>
                                <Badge variant={getStatusVariant(sale.status)}>
                                  {getStatusLabel(sale.status)}
                                </Badge>
                              </TableCell>
                              <TableCell>{formatCurrency(sale.total_amount)}</TableCell>
                              <TableCell className="max-w-xs truncate">
                                {sale.notes || '-'}
                              </TableCell>
                              <TableCell>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      onClick={() => handleViewSale(sale.id)}
                                    >
                                      <Eye className="h-4 w-4 text-black" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Ver</TooltipContent>
                                </Tooltip>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        Nenhuma venda encontrada para este cliente.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de visualização do orçamento */}
      <BudgetDetailModal
        isOpen={budgetDetailOpen}
        onClose={() => setBudgetDetailOpen(false)}
        budgetId={selectedBudgetId}
      />

      {/* Modal de visualização da venda */}
      <SalesDetailModal
        isOpen={saleDetailOpen}
        onClose={() => setSaleDetailOpen(false)}
        saleId={selectedSaleId}
      />
    </>
  );
};

export default ClientHistoryModal;
