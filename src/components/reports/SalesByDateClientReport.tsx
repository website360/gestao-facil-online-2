
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Calendar, Download, FileSpreadsheet, Trash2 } from 'lucide-react';
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
  receipt_names: string;
}

const SalesByDateClientReport = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [reportData, setReportData] = useState<SaleReportData[]>([]);
  const [totalSales, setTotalSales] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [salesWithAttachments, setSalesWithAttachments] = useState<string[]>([]);
  const [isExportingAttachments, setIsExportingAttachments] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [attachmentsData, setAttachmentsData] = useState<any[]>([]);

  const getStatusLabel = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'separacao': 'Separação',
      'conferencia': 'Conferência',
      'nota_fiscal': 'Nota Fiscal',
      'aguardando_entrega': 'Aguardando Entrega',
      'entrega_realizada': 'Entrega Realizada',
      'atencao': 'Atenção',
      'finalizada': 'Finalizada'
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
      let query = supabase
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
        .lte('created_at', endDate + 'T23:59:59');

      // Aplicar filtro de status se selecionado
      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter as any);
      }

      const { data: sales, error } = await query.order('created_at', { ascending: false });

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
            invoice_value: 0,
            receipt_names: ''
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

      // Verificar quais vendas têm comprovantes anexados e obter nomes dos comprovantes
      if (sales && sales.length > 0) {
        const saleIds = sales.map(sale => sale.id);
        console.log('IDs das vendas filtradas:', saleIds);
        console.log('Filtros aplicados - Data:', startDate, 'até', endDate, 'Status:', statusFilter || 'todos');
        
        const { data: attachments } = await supabase
          .from('sale_attachments')
          .select('sale_id, stored_filename')
          .in('sale_id', saleIds);
        
        const salesWithAttachmentsIds = [...new Set(attachments?.map(att => att.sale_id) || [])];
        setSalesWithAttachments(salesWithAttachmentsIds);
        
        console.log('Vendas com anexos após filtro:', salesWithAttachmentsIds.length);

        // Agrupar nomes dos comprovantes por venda e adicionar ao relatório
        const attachmentsBySale: { [key: string]: string[] } = {};
        attachments?.forEach(att => {
          if (!attachmentsBySale[att.sale_id]) {
            attachmentsBySale[att.sale_id] = [];
          }
          attachmentsBySale[att.sale_id].push(att.stored_filename);
        });

        // Atualizar dados do relatório com nomes dos comprovantes
        Object.keys(groupedData).forEach(clientId => {
          const clientSales = sales.filter(sale => sale.clients.id === clientId);
          const receiptNames: string[] = [];
          
          clientSales.forEach(sale => {
            if (attachmentsBySale[sale.id]) {
              receiptNames.push(...attachmentsBySale[sale.id]);
            }
          });
          
          groupedData[clientId].receipt_names = receiptNames.join(', ');
        });
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
      'Valor Nota Fiscal',
      'Nome dos Comprovantes'
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
        clientData.invoice_value,
        clientData.receipt_names
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

  const handleExportAttachments = async () => {
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

      // Armazenar dados dos anexos para possível exclusão posterior
      setAttachmentsData(attachments);

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

  const exportAttachments = () => {
    setShowDeleteConfirmation(true);
  };

  const handleExportOnly = async () => {
    setShowDeleteConfirmation(false);
    await handleExportAttachments();
  };

  const handleExportAndDelete = async () => {
    setShowDeleteConfirmation(false);
    await handleExportAttachments();
    
    // Após o download, excluir os comprovantes (apenas os filtrados)
    if (attachmentsData.length > 0) {
      try {
        console.log('Filtros aplicados:');
        console.log('- Data inicial:', startDate);
        console.log('- Data final:', endDate);
        console.log('- Status filtro:', statusFilter);
        console.log('- Vendas com anexos (filtradas):', salesWithAttachments);
        console.log('- Total de anexos a excluir:', attachmentsData.length);
        
        // Verificar se os anexos pertencem realmente às vendas filtradas
        const validAttachments = attachmentsData.filter(att => 
          salesWithAttachments.includes(att.sale_id)
        );
        
        console.log('- Anexos válidos para exclusão:', validAttachments.length);
        
        if (validAttachments.length === 0) {
          toast.error('Nenhum comprovante encontrado para exclusão com os filtros aplicados');
          return;
        }
        
        // Excluir arquivos do storage
        const filesToDelete = validAttachments.map(att => att.file_path);
        const { error: storageError } = await supabase.storage
          .from('payment-receipts')
          .remove(filesToDelete);

        if (storageError) {
          console.error('Erro ao deletar arquivos do storage:', storageError);
        }

        // Excluir registros da tabela
        const attachmentIds = validAttachments.map(att => att.id);
        const { error: dbError } = await supabase
          .from('sale_attachments')
          .delete()
          .in('id', attachmentIds);

        if (dbError) {
          console.error('Erro ao deletar registros do banco:', dbError);
          toast.error('Erro ao excluir comprovantes do banco de dados');
        } else {
          toast.success(`${validAttachments.length} comprovante(s) excluído(s) com sucesso! (Filtros: ${startDate} a ${endDate}${statusFilter && statusFilter !== 'all' ? `, Status: ${statusFilter}` : ''})`);
          // Limpar os dados de anexos
          setSalesWithAttachments([]);
          setAttachmentsData([]);
          
          // Regenerar o relatório para atualizar os dados
          await generateReport();
        }
      } catch (error) {
        console.error('Erro ao excluir comprovantes:', error);
        toast.error('Erro ao excluir comprovantes');
      }
    } else {
      toast.error('Nenhum comprovante encontrado para exclusão');
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
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-end">
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
            <div>
              <Label htmlFor="status-filter">Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="separacao">Separação</SelectItem>
                  <SelectItem value="conferencia">Conferência</SelectItem>
                  <SelectItem value="nota_fiscal">Nota Fiscal</SelectItem>
                  <SelectItem value="aguardando_entrega">Aguardando Entrega</SelectItem>
                  <SelectItem value="entrega_realizada">Entrega Realizada</SelectItem>
                  <SelectItem value="atencao">Atenção</SelectItem>
                  <SelectItem value="finalizada">Finalizada</SelectItem>
                </SelectContent>
              </Select>
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
                    <TableHead>Comprovantes</TableHead>
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
                      <TableCell className="max-w-xs">
                        <div className="truncate" title={clientData.receipt_names}>
                          {clientData.receipt_names || 'Nenhum'}
                        </div>
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
      
      {/* Modal de Confirmação para Exportar Comprovantes */}
      <AlertDialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Exportar Comprovantes</AlertDialogTitle>
            <AlertDialogDescription>
              O que você deseja fazer com os comprovantes do período selecionado?
              <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-800">
                <strong>Filtros aplicados:</strong><br/>
                📅 Período: {startDate} até {endDate}<br/>
                {statusFilter && statusFilter !== 'all' && (
                  <>📊 Status: {statusFilter}<br/></>
                )}
                📎 Comprovantes encontrados: {salesWithAttachments.length}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
            <AlertDialogCancel>
              Cancelar
            </AlertDialogCancel>
            <Button
              variant="outline"
              onClick={handleExportOnly}
              disabled={isExportingAttachments}
              className="flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              Apenas Baixar
            </Button>
            <AlertDialogAction
              onClick={handleExportAndDelete}
              disabled={isExportingAttachments}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600"
            >
              <Trash2 className="w-4 h-4" />
              Baixar e Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SalesByDateClientReport;
