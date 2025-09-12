
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Download, FileSpreadsheet } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, formatDate } from '@/lib/formatters';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';

interface SaleReportData {
  client_name: string;
  salesperson_name: string;
  sale_date: string;
  status: string;
  payment_method: string;
  payment_type: string;
  installments: number;
  due_dates: string;
  payment_dates: string;
  total_amount: number;
  invoice_percentage: number;
  invoice_value: number;
}

const SalesByDateClientReport = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState<SaleReportData[]>([]);
  const [totalSales, setTotalSales] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [salesWithAttachments, setSalesWithAttachments] = useState<string[]>([]);
  const [isExportingAttachments, setIsExportingAttachments] = useState(false);

  const getStatusLabel = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'separacao': 'Separação',
      'conferencia': 'Conferência',
      'nota_fiscal': 'Nota Fiscal',
      'entrega_realizada': 'Entrega Realizada'
    };
    return statusMap[status] || status;
  };

  const generateReport = async () => {
    if (!startDate || !endDate) {
      toast.error('Por favor, selecione as datas de início e fim');
      return;
    }

    setIsGenerating(true);
    
    try {
      // Buscar vendas no período com informações de pagamento
      const { data: sales, error } = await supabase
        .from('sales')
        .select(`
          id,
          total_amount,
          created_at,
          status,
          budget_id,
          created_by,
          clients!inner(
            id,
            name
          ),
          budgets(
            payment_method_id,
            payment_type_id,
            installments,
            boleto_due_dates,
            check_due_dates,
            boleto_installments,
            check_installments,
            invoice_percentage,
            created_by,
            payment_methods(name),
            payment_types(name)
          )
        `)
        .gte('created_at', startDate + 'T00:00:00')
        .lte('created_at', endDate + 'T23:59:59')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar vendas:', error);
        toast.error('Erro ao gerar relatório');
        return;
      }

      // Buscar profiles dos usuários criadores das vendas e orçamentos
      const allUserIds = [...new Set([
        ...sales?.map(sale => sale.created_by).filter(Boolean) || [],
        ...sales?.map(sale => sale.budgets?.created_by).filter(Boolean) || []
      ])];

      let profilesData: any[] = [];
      if (allUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', allUserIds);
        profilesData = profiles || [];
      }

      // Agrupar vendas por cliente
      const groupedData: { [key: string]: SaleReportData } = {};
      let totalSalesCount = 0;

      sales?.forEach((sale: any) => {
        const clientId = sale.clients.id;
        const budget = sale.budgets;
        const saleDate = new Date(sale.created_at);
        totalSalesCount++;
        
        if (!groupedData[clientId]) {
          // Determinar os prazos baseado no método de pagamento
          let dueDates = '';
          let paymentDates = '';
          let installments = budget?.installments || 1;
          
          if (budget?.payment_methods?.name) {
            const paymentMethodName = budget.payment_methods.name.toLowerCase();
            
            if (paymentMethodName.includes('boleto')) {
              // Se for boleto, usar prazos de boleto
              if (budget?.boleto_due_dates?.length > 0) {
                dueDates = budget.boleto_due_dates.map((days: number) => `${days} dias`).join(', ');
                // Calcular datas de vencimento
                paymentDates = budget.boleto_due_dates.map((days: number) => {
                  const paymentDate = new Date(saleDate);
                  paymentDate.setDate(paymentDate.getDate() + days);
                  return paymentDate.toLocaleDateString('pt-BR');
                }).join(', ');
                installments = budget.boleto_installments || 1;
              }
            } else if (paymentMethodName.includes('cheque')) {
              // Se for cheque, usar prazos de cheque
              if (budget?.check_due_dates?.length > 0) {
                dueDates = budget.check_due_dates.map((days: number) => `${days} dias`).join(', ');
                // Calcular datas de vencimento
                paymentDates = budget.check_due_dates.map((days: number) => {
                  const paymentDate = new Date(saleDate);
                  paymentDate.setDate(paymentDate.getDate() + days);
                  return paymentDate.toLocaleDateString('pt-BR');
                }).join(', ');
                installments = budget.check_installments || 1;
              }
            }
          }

          // Determinar nome do vendedor
          let salespersonName = 'Cliente';
          
          // Primeiro, verificar se a venda foi criada por um funcionário
          const saleCreatorProfile = profilesData.find(p => p.id === sale.created_by);
          if (saleCreatorProfile) {
            salespersonName = saleCreatorProfile.name;
          } 
          // Senão, verificar se o orçamento foi criado por um funcionário
          else if (budget?.created_by && budget.created_by !== sale.clients.id) {
            const budgetCreatorProfile = profilesData.find(p => p.id === budget.created_by);
            if (budgetCreatorProfile) {
              salespersonName = budgetCreatorProfile.name;
            } else {
              salespersonName = 'Vendedor';
            }
          }

          groupedData[clientId] = {
            client_name: sale.clients.name,
            salesperson_name: salespersonName,
            sale_date: saleDate.toLocaleDateString('pt-BR'),
            status: getStatusLabel(sale.status),
            payment_method: budget?.payment_methods?.name || 'N/A',
            payment_type: budget?.payment_types?.name || 'N/A',
            installments: installments,
            due_dates: dueDates,
            payment_dates: paymentDates,
            total_amount: 0,
            invoice_percentage: budget?.invoice_percentage || 0,
            invoice_value: 0
          };
        }

        const saleAmount = parseFloat(sale.total_amount);
        groupedData[clientId].total_amount += saleAmount;
        groupedData[clientId].invoice_value += saleAmount * (groupedData[clientId].invoice_percentage / 100);
      });

      const reportArray = Object.values(groupedData).sort((a, b) => 
        a.client_name.localeCompare(b.client_name)
      );

      setReportData(reportArray);
      setTotalSales(totalSalesCount);

      // Verificar quais vendas têm comprovantes anexados
      if (sales && sales.length > 0) {
        const saleIds = sales.map(sale => sale.id);
        const { data: attachments } = await supabase
          .from('sale_attachments')
          .select('sale_id')
          .in('sale_id', saleIds);
        
        const salesWithAttachmentsIds = [...new Set(attachments?.map(att => att.sale_id) || [])];
        setSalesWithAttachments(salesWithAttachmentsIds);
      }

      toast.success('Relatório gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast.error('Erro ao gerar relatório');
    } finally {
      setIsGenerating(false);
    }
  };

  const exportToXLS = () => {
    if (reportData.length === 0) {
      toast.error('Gere o relatório primeiro');
      return;
    }

    // Preparar dados para a planilha
    const worksheetData: any[] = [];
    
    // Cabeçalho
    worksheetData.push([
      'Cliente',
      'Vendedor',
      'Data da Venda',
      'Status',
      'Meio de Pagamento',
      'Tipo de Pagamento',
      'Parcelas',
      'Prazos (dias)',
      'Datas de Vencimento',
      'Total Final',
      'Nota Fiscal (%)',
      'Valor Nota Fiscal'
    ]);

    // Dados
    reportData.forEach((clientData) => {
      worksheetData.push([
        clientData.client_name,
        clientData.salesperson_name,
        clientData.sale_date,
        clientData.status,
        clientData.payment_method,
        clientData.payment_type,
        clientData.installments,
        clientData.due_dates,
        clientData.payment_dates,
        clientData.total_amount,
        clientData.invoice_percentage + '%',
        clientData.invoice_value
      ]);
    });

    // Criar planilha
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Vendas por Cliente');

    // Salvar arquivo
    XLSX.writeFile(workbook, `relatorio-vendas-${startDate}-${endDate}.xlsx`);
    toast.success('Planilha exportada com sucesso!');
  };

  const exportAttachments = async () => {
    if (salesWithAttachments.length === 0) {
      toast.error('Não há comprovantes de pagamento para exportar neste período');
      return;
    }

    setIsExportingAttachments(true);

    try {
      // Buscar todos os anexos das vendas do período
      const { data: attachments, error } = await supabase
        .from('sale_attachments')
        .select('*')
        .in('sale_id', salesWithAttachments);

      if (error) {
        console.error('Erro ao buscar anexos:', error);
        toast.error('Erro ao buscar comprovantes');
        return;
      }

      if (!attachments || attachments.length === 0) {
        toast.error('Nenhum comprovante encontrado');
        return;
      }

      // Buscar informações das vendas e clientes
      const { data: salesInfo, error: salesError } = await supabase
        .from('sales')
        .select(`
          id,
          clients!inner(
            name
          )
        `)
        .in('id', salesWithAttachments);

      if (salesError) {
        console.error('Erro ao buscar informações das vendas:', salesError);
        toast.error('Erro ao buscar informações das vendas');
        return;
      }

      const zip = new JSZip();
      let processedCount = 0;

      // Processar cada anexo
      for (const attachment of attachments) {
        try {
          // Encontrar informações do cliente
          const saleInfo = salesInfo?.find(s => s.id === attachment.sale_id);
          if (!saleInfo) continue;

          // Baixar o arquivo do storage
          const { data: fileData, error: downloadError } = await supabase.storage
            .from('payment-receipts')
            .download(attachment.file_path);

          if (downloadError) {
            console.error(`Erro ao baixar ${attachment.stored_filename}:`, downloadError);
            continue;
          }

          // Criar nome do arquivo organizado por cliente
          const clientName = saleInfo.clients.name;
          const sanitizedClientName = clientName.replace(/[^a-zA-Z0-9\s]/g, '').trim();
          const fileName = `${sanitizedClientName}/${attachment.stored_filename}`;

          // Adicionar arquivo ao ZIP
          zip.file(fileName, fileData);
          processedCount++;

        } catch (error) {
          console.error(`Erro ao processar anexo ${attachment.id}:`, error);
        }
      }

      if (processedCount === 0) {
        toast.error('Nenhum comprovante pôde ser processado');
        return;
      }

      // Gerar e baixar o ZIP
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `comprovantes-pagamento-${startDate}-${endDate}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`${processedCount} comprovante(s) exportado(s) com sucesso!`);

    } catch (error) {
      console.error('Erro ao exportar anexos:', error);
      toast.error('Erro ao exportar comprovantes');
    } finally {
      setIsExportingAttachments(false);
    }
  };

  const getTotalGeneral = () => {
    return reportData.reduce((total, client) => total + client.total_amount, 0);
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            Filtros do Relatório
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-end">
            <div>
              <Label htmlFor="start-date">Data de Início</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="end-date">Data de Fim</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <Button 
              onClick={generateReport} 
              disabled={isGenerating}
              className="btn-gradient"
            >
              {isGenerating ? 'Gerando...' : 'Gerar Relatório'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Botão de Exportação */}
      {reportData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Exportar Relatório
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button onClick={exportToXLS} variant="outline" className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4" />
                <span className="hidden sm:inline">Exportar Excel</span>
                <span className="sm:hidden">Exportar</span>
              </Button>
              
              {salesWithAttachments.length > 0 && (
                <Button 
                  onClick={exportAttachments} 
                  variant="outline" 
                  disabled={isExportingAttachments}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {isExportingAttachments ? 'Exportando...' : `Exportar Comprovantes (${salesWithAttachments.length})`}
                  </span>
                  <span className="sm:hidden">
                    {isExportingAttachments ? 'Exportando...' : 'Comprovantes'}
                  </span>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resumo Geral */}
      {reportData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resumo Geral</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Total de Clientes</p>
                <p className="text-2xl font-bold text-blue-600">{reportData.length}</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Total de Vendas</p>
                <p className="text-2xl font-bold text-green-600">{totalSales}</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600">Valor Total</p>
                <p className="text-2xl font-bold text-purple-600">{formatCurrency(getTotalGeneral())}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabela de Resultados */}
      {reportData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Vendas por Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Vendedor</TableHead>
                    <TableHead>Data da Venda</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Meio de Pagamento</TableHead>
                    <TableHead>Tipo de Pagamento</TableHead>
                    <TableHead className="text-center">Parcelas</TableHead>
                    <TableHead>Prazos (dias)</TableHead>
                    <TableHead>Datas de Vencimento</TableHead>
                    <TableHead className="text-right">Total Final</TableHead>
                    <TableHead className="text-center">Nota Fiscal (%)</TableHead>
                    <TableHead className="text-right">Valor Nota Fiscal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.map((clientData, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{clientData.client_name}</TableCell>
                      <TableCell>{clientData.salesperson_name}</TableCell>
                      <TableCell>{clientData.sale_date}</TableCell>
                      <TableCell>{clientData.status}</TableCell>
                      <TableCell>{clientData.payment_method}</TableCell>
                      <TableCell>{clientData.payment_type}</TableCell>
                      <TableCell className="text-center">{clientData.installments}</TableCell>
                      <TableCell>{clientData.due_dates || 'À vista'}</TableCell>
                      <TableCell>{clientData.payment_dates || 'À vista'}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(clientData.total_amount)}
                      </TableCell>
                      <TableCell className="text-center">{clientData.invoice_percentage}%</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(clientData.invoice_value)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {reportData.length === 0 && !isGenerating && (
        <Card>
          <CardContent className="text-center py-8">
            <FileSpreadsheet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Selecione um período e clique em "Gerar Relatório" para visualizar os dados</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SalesByDateClientReport;
