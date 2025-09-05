import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Printer } from 'lucide-react';
import StockWarningsAlert from './budget/StockWarningsAlert';
import type { Database } from '@/integrations/supabase/types';

interface Budget {
  id: string;
  client_id: string;
  status: Database['public']['Enums']['budget_status'];
  total_amount: number;
  notes: string;
  created_at: string;
  created_by: string;
  client_name?: string;
  created_by_name?: string;
  stock_warnings?: any;
}

interface BudgetItem {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  products?: { name: string; internal_code: string };
}

interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  street?: string;
  number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  cep?: string;
}

interface BudgetViewModalProps {
  budget: Budget | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  budgetIndex: number;
}

const BudgetViewModal: React.FC<BudgetViewModalProps> = ({ 
  budget, 
  open, 
  onOpenChange, 
  budgetIndex 
}) => {
  const [budgetItems, setBudgetItems] = useState<BudgetItem[]>([]);
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    if (budget && open) {
      fetchBudgetDetails();
      getUserRole();
    }
  }, [budget, open]);

  const getUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setUserRole(data.role);
    } catch (error) {
      console.error('Erro ao buscar role do usuário:', error);
    }
  };

  const fetchBudgetDetails = async () => {
    if (!budget) return;
    
    setLoading(true);
    try {
      // Fetch budget items
      const { data: items, error: itemsError } = await supabase
        .from('budget_items')
        .select(`
          *,
          products (name, internal_code)
        `)
        .eq('budget_id', budget.id);

      if (itemsError) throw itemsError;

      // Fetch client details
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', budget.client_id)
        .single();

      if (clientError) throw clientError;

      setBudgetItems(items || []);
      setClient(clientData);
    } catch (error) {
      console.error('Erro ao carregar detalhes do orçamento:', error);
      toast.error('Erro ao carregar detalhes do orçamento');
    } finally {
      setLoading(false);
    }
  };

  const formatBudgetId = (id: string, index: number) => {
    const sequentialNumber = (index + 1).toString().padStart(8, '0');
    return `#O${sequentialNumber}`;
  };

  const formatAddress = (client: Client) => {
    const addressParts = [];
    if (client.street) addressParts.push(client.street);
    if (client.number) addressParts.push(client.number);
    if (client.neighborhood) addressParts.push(client.neighborhood);
    if (client.city) addressParts.push(client.city);
    if (client.state) addressParts.push(client.state);
    if (client.cep) addressParts.push(`CEP: ${client.cep}`);
    
    return addressParts.length > 0 ? addressParts.join(', ') : null;
  };

  const renderTableHeaders = () => {
    if (userRole === 'separacao') {
      return (
        <>
          <TableHead>Código</TableHead>
          <TableHead>Produto</TableHead>
          <TableHead>Quantidade</TableHead>
        </>
      );
    }
    
    if (userRole === 'conferencia') {
      return (
        <>
          <TableHead>Código</TableHead>
          <TableHead>Produto</TableHead>
        </>
      );
    }
    
    // Para admin, vendas, nota_fiscal e outros - mostrar todas as colunas
    return (
      <>
        <TableHead>Produto</TableHead>
        <TableHead>Quantidade</TableHead>
        <TableHead>Valor Unitário</TableHead>
        <TableHead>Valor Total</TableHead>
      </>
    );
  };

  const renderTableCells = (item: BudgetItem) => {
    if (userRole === 'separacao') {
      return (
        <>
          <TableCell>{item.products?.internal_code || 'N/A'}</TableCell>
          <TableCell className="font-medium">{item.products?.name || 'Produto não encontrado'}</TableCell>
          <TableCell>{item.quantity}</TableCell>
        </>
      );
    }
    
    if (userRole === 'conferencia') {
      return (
        <>
          <TableCell>{item.products?.internal_code || 'N/A'}</TableCell>
          <TableCell className="font-medium">{item.products?.name || 'Produto não encontrado'}</TableCell>
        </>
      );
    }
    
    // Para admin, vendas, nota_fiscal e outros - mostrar todas as colunas
    return (
      <>
        <TableCell>{item.products?.name || 'Produto não encontrado'}</TableCell>
        <TableCell>{item.quantity}</TableCell>
        <TableCell>R$ {item.unit_price.toFixed(2)}</TableCell>
        <TableCell>R$ {item.total_price.toFixed(2)}</TableCell>
      </>
    );
  };

  const handlePrint = () => {
    const printContent = document.getElementById('budget-print-content');
    if (!printContent) return;

    const originalContent = document.body.innerHTML;
    const printWindow = window.open('', '_blank');
    
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Orçamento ${formatBudgetId(budget?.id || '', budgetIndex)}</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
              .company-name { font-size: 24px; font-weight: bold; color: #333; }
              .budget-info { margin-bottom: 20px; }
              .info-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
              .info-label { font-weight: bold; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f5f5f5; font-weight: bold; }
              .total-row { font-weight: bold; background-color: #f9f9f9; }
              .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
              @media print {
                body { margin: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            ${printContent.innerHTML}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
      printWindow.close();
    }
  };

  if (!budget) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Visualizar Orçamento {formatBudgetId(budget.id, budgetIndex)}
            <Button onClick={handlePrint} variant="outline" size="sm">
              <Printer className="h-4 w-4 mr-2" />
              Imprimir PDF
            </Button>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div id="budget-print-content">
            <div className="header">
              <div className="company-name">Sistema de Gestão</div>
              <div style={{ fontSize: '18px', marginTop: '10px' }}>
                Orçamento {formatBudgetId(budget.id, budgetIndex)}
              </div>
            </div>

            <div className="budget-info">
              <div className="info-row">
                <span className="info-label">Cliente:</span>
                <span>{client?.name || budget.client_name}</span>
              </div>
              {client?.email && (
                <div className="info-row">
                  <span className="info-label">Email:</span>
                  <span>{client.email}</span>
                </div>
              )}
              {client?.phone && (
                <div className="info-row">
                  <span className="info-label">Telefone:</span>
                  <span>{client.phone}</span>
                </div>
              )}
              {client && formatAddress(client) && (
                <div className="info-row">
                  <span className="info-label">Endereço:</span>
                  <span>{formatAddress(client)}</span>
                </div>
              )}
              <div className="info-row">
                <span className="info-label">Data de Criação:</span>
                <span>{new Date(budget.created_at).toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Responsável:</span>
                <span>{budget.created_by_name}</span>
              </div>
            </div>

            {/* Avisos de estoque para administradores/gerentes */}
            {budget.stock_warnings && Array.isArray(budget.stock_warnings) && budget.stock_warnings.length > 0 && 
             (userRole === 'admin' || userRole === 'gerente') && (
              <div className="mt-4">
                <StockWarningsAlert stockWarnings={budget.stock_warnings} />
              </div>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Itens do Orçamento</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      {renderTableHeaders()}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {budgetItems.map((item, index) => (
                      <TableRow key={index}>
                        {renderTableCells(item)}
                      </TableRow>
                    ))}
                    {userRole !== 'separacao' && userRole !== 'conferencia' && (
                      <TableRow className="total-row">
                        <TableCell colSpan={3} className="text-right font-bold">
                          Total Geral:
                        </TableCell>
                        <TableCell className="font-bold">
                          R$ {budget.total_amount.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {budget.notes && (
              <Card className="mt-4">
                <CardHeader>
                  <CardTitle>Observações</CardTitle>
                </CardHeader>
                <CardContent>
                  <p>{budget.notes}</p>
                </CardContent>
              </Card>
            )}

            <div className="footer">
              <p>Este orçamento tem validade de 30 dias a partir da data de emissão.</p>
              <p>Sistema de Gestão - {new Date().getFullYear()}</p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BudgetViewModal;
