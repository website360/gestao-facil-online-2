import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar, Download, FileSpreadsheet, User } from 'lucide-react';
import { toast } from '@/components/ui/sonner';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency, formatDate } from '@/lib/formatters';
import * as XLSX from 'xlsx';

interface SalespersonReportData {
  salesperson_id: string;
  salesperson_name: string;
  total_sales: number;
  total_amount: number;
  total_discount: number;
  sales_details: {
    sale_id: string;
    client_name: string;
    sale_date: string;
    amount: number;
    discount_percentage: number;
    discount_amount: number;
  }[];
}

const SalesBySalespersonReport = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState<SalespersonReportData[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const generateReport = async () => {
    if (!startDate || !endDate) {
      toast.error('Por favor, selecione as datas de início e fim');
      return;
    }

    setIsGenerating(true);
    
    try {
      // Buscar vendas no período
      const { data: sales, error } = await supabase
        .from('sales')
        .select(`
          id,
          total_amount,
          discount_percentage,
          created_at,
          created_by,
          budget_id,
          clients!inner(
            id,
            name
          ),
          budgets(
            created_by,
            discount_percentage
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

      // Buscar profiles dos vendedores
      const allUserIds = [...new Set([
        ...sales?.map(sale => sale.created_by).filter(Boolean) || [],
        ...sales?.map(sale => sale.budgets?.created_by).filter(Boolean) || []
      ])];

      let profilesData: any[] = [];
      if (allUserIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name, role')
          .in('id', allUserIds);
        profilesData = profiles || [];
      }

      // Agrupar vendas por vendedor
      const groupedData: { [key: string]: SalespersonReportData } = {};

      sales?.forEach((sale: any) => {
        let salespersonId = 'cliente';
        let salespersonName = 'Cliente';

        // Determinar o vendedor responsável
        // Primeiro, verificar se a venda foi criada por um funcionário
        const saleCreatorProfile = profilesData.find(p => p.id === sale.created_by);
        if (saleCreatorProfile && saleCreatorProfile.role !== 'cliente') {
          salespersonId = saleCreatorProfile.id;
          salespersonName = saleCreatorProfile.name;
        } 
        // Senão, verificar se o orçamento foi criado por um funcionário
        else if (sale.budgets?.created_by) {
          const budgetCreatorProfile = profilesData.find(p => p.id === sale.budgets.created_by);
          if (budgetCreatorProfile && budgetCreatorProfile.role !== 'cliente') {
            salespersonId = budgetCreatorProfile.id;
            salespersonName = budgetCreatorProfile.name;
          }
        }

        if (!groupedData[salespersonId]) {
          groupedData[salespersonId] = {
            salesperson_id: salespersonId,
            salesperson_name: salespersonName,
            total_sales: 0,
            total_amount: 0,
            total_discount: 0,
            sales_details: []
          };
        }

        const saleAmount = parseFloat(sale.total_amount);
        const discountPercentage = parseFloat(sale.discount_percentage || sale.budgets?.discount_percentage || 0);
        const discountAmount = (saleAmount * discountPercentage) / 100;
        
        groupedData[salespersonId].total_sales += 1;
        groupedData[salespersonId].total_amount += saleAmount;
        groupedData[salespersonId].total_discount += discountAmount;

        groupedData[salespersonId].sales_details.push({
          sale_id: sale.id,
          client_name: sale.clients.name,
          sale_date: formatDate(sale.created_at),
          amount: saleAmount,
          discount_percentage: discountPercentage,
          discount_amount: discountAmount
        });
      });

      // Filtrar apenas vendedores (não clientes) e ordenar por valor total
      const reportArray = Object.values(groupedData)
        .filter(data => data.salesperson_id !== 'cliente')
        .sort((a, b) => b.total_amount - a.total_amount);

      setReportData(reportArray);
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

    const workbook = XLSX.utils.book_new();

    // Planilha resumo por vendedor
    const summaryData: any[] = [];
    summaryData.push([
      'Vendedor',
      'Total de Vendas',
      'Valor Total das Vendas',
      'Desconto Total Concedido',
      'Valor Líquido'
    ]);

    reportData.forEach((data) => {
      const valorLiquido = data.total_amount - data.total_discount;
      summaryData.push([
        data.salesperson_name,
        data.total_sales,
        data.total_amount,
        data.total_discount,
        valorLiquido
      ]);
    });

    // Adicionar totais gerais
    const totalVendas = reportData.reduce((total, data) => total + data.total_sales, 0);
    const totalValor = reportData.reduce((total, data) => total + data.total_amount, 0);
    const totalDesconto = reportData.reduce((total, data) => total + data.total_discount, 0);
    const valorLiquidoGeral = totalValor - totalDesconto;

    summaryData.push([]); // Linha vazia
    summaryData.push([
      'TOTAIS GERAIS',
      totalVendas,
      totalValor,
      totalDesconto,
      valorLiquidoGeral
    ]);

    const summaryWorksheet = XLSX.utils.aoa_to_sheet(summaryData);
    
    // Definir largura das colunas
    summaryWorksheet['!cols'] = [
      { width: 25 }, // Vendedor
      { width: 15 }, // Total de Vendas
      { width: 18 }, // Valor Total
      { width: 20 }, // Desconto Total
      { width: 18 }  // Valor Líquido
    ];

    XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Resumo por Vendedor');

    // Planilha detalhada - TODAS as vendas individuais
    const detailData: any[] = [];
    detailData.push([
      'ID da Venda',
      'Vendedor',
      'Cliente',
      'Data da Venda',
      'Valor da Venda',
      '% Desconto',
      'Valor do Desconto',
      'Valor Líquido da Venda'
    ]);

    reportData.forEach((data) => {
      data.sales_details.forEach((detail) => {
        // Formatar ID da venda para ficar mais legível
        const formattedSaleId = `#V${detail.sale_id.substring(0, 8).toUpperCase()}`;
        const valorLiquido = detail.amount - detail.discount_amount;
        
        detailData.push([
          formattedSaleId,
          data.salesperson_name,
          detail.client_name,
          detail.sale_date,
          detail.amount,
          `${detail.discount_percentage}%`,
          detail.discount_amount,
          valorLiquido
        ]);
      });
    });

    const detailWorksheet = XLSX.utils.aoa_to_sheet(detailData);
    
    // Definir largura das colunas para a planilha detalhada
    detailWorksheet['!cols'] = [
      { width: 15 }, // ID da Venda
      { width: 25 }, // Vendedor
      { width: 30 }, // Cliente
      { width: 12 }, // Data
      { width: 15 }, // Valor da Venda
      { width: 12 }, // % Desconto
      { width: 18 }, // Valor do Desconto
      { width: 18 }  // Valor Líquido
    ];

    XLSX.utils.book_append_sheet(workbook, detailWorksheet, 'Vendas Individuais');

    // Planilha por vendedor (uma aba para cada vendedor)
    reportData.forEach((vendedor) => {
      const vendedorData: any[] = [];
      vendedorData.push([
        `VENDEDOR: ${vendedor.salesperson_name}`
      ]);
      vendedorData.push([
        `Total de Vendas: ${vendedor.total_sales}`,
        `Valor Total: R$ ${vendedor.total_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        `Desconto Total: R$ ${vendedor.total_discount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
      ]);
      vendedorData.push([]); // Linha vazia

      vendedorData.push([
        'ID da Venda',
        'Cliente',
        'Data',
        'Valor da Venda',
        '% Desconto',
        'Valor do Desconto',
        'Valor Líquido'
      ]);

      vendedor.sales_details.forEach((venda) => {
        const formattedSaleId = `#V${venda.sale_id.substring(0, 8).toUpperCase()}`;
        const valorLiquido = venda.amount - venda.discount_amount;
        
        vendedorData.push([
          formattedSaleId,
          venda.client_name,
          venda.sale_date,
          venda.amount,
          `${venda.discount_percentage}%`,
          venda.discount_amount,
          valorLiquido
        ]);
      });

      const vendedorWorksheet = XLSX.utils.aoa_to_sheet(vendedorData);
      
      // Definir largura das colunas
      vendedorWorksheet['!cols'] = [
        { width: 15 }, // ID da Venda
        { width: 30 }, // Cliente
        { width: 12 }, // Data
        { width: 15 }, // Valor da Venda
        { width: 12 }, // % Desconto
        { width: 18 }, // Valor do Desconto
        { width: 18 }  // Valor Líquido
      ];

      // Nome da aba limitado a 31 caracteres
      const sheetName = vendedor.salesperson_name.length > 25 
        ? vendedor.salesperson_name.substring(0, 25) + '...'
        : vendedor.salesperson_name;
      
      XLSX.utils.book_append_sheet(workbook, vendedorWorksheet, sheetName);
    });

    // Salvar arquivo
    const fileName = `relatorio-vendas-vendedores-${startDate}-${endDate}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    toast.success('Planilha exportada com sucesso!');
  };

  const getTotalGeneral = () => {
    return reportData.reduce((total, salesperson) => total + salesperson.total_amount, 0);
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
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
            <Button onClick={exportToXLS} variant="outline" className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4" />
              Exportar Excel
            </Button>
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-600">Total de Vendedores</p>
                <p className="text-2xl font-bold text-blue-600">{reportData.length}</p>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-600">Total de Vendas</p>
                <p className="text-2xl font-bold text-green-600">
                  {reportData.reduce((total, data) => total + data.total_sales, 0)}
                </p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <p className="text-sm text-gray-600">Valor Total</p>
                <p className="text-2xl font-bold text-purple-600">{formatCurrency(getTotalGeneral())}</p>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <p className="text-sm text-gray-600">Desconto Total</p>
                <p className="text-2xl font-bold text-orange-600">
                  {formatCurrency(reportData.reduce((total, data) => total + data.total_discount, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabela de Resultados */}
      {reportData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Vendas por Vendedor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendedor</TableHead>
                    <TableHead className="text-center">Total de Vendas</TableHead>
                    <TableHead className="text-right">Valor Total</TableHead>
                    <TableHead className="text-right">Desconto Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {reportData.map((data, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium flex items-center gap-2">
                        <User className="w-4 h-4" />
                        {data.salesperson_name}
                      </TableCell>
                      <TableCell className="text-center">{data.total_sales}</TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(data.total_amount)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(data.total_discount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vendas Detalhadas por Vendedor */}
      {reportData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Vendas Individuais Detalhadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {reportData.map((vendedor) => (
                <div key={vendedor.salesperson_id} className="border rounded-lg p-4">
                  <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <User className="w-5 h-5" />
                    {vendedor.salesperson_name}
                  </h3>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID da Venda</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Cliente</TableHead>
                          <TableHead className="text-right">Valor da Venda</TableHead>
                          <TableHead className="text-center">% Desconto</TableHead>
                          <TableHead className="text-right">Valor Desconto</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {vendedor.sales_details.map((venda, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-mono text-sm">
                              #{venda.sale_id.substring(0, 8).toUpperCase()}
                            </TableCell>
                            <TableCell>{venda.sale_date}</TableCell>
                            <TableCell>{venda.client_name}</TableCell>
                            <TableCell className="text-right font-medium">
                              {formatCurrency(venda.amount)}
                            </TableCell>
                            <TableCell className="text-center">
                              {venda.discount_percentage > 0 ? `${venda.discount_percentage}%` : '-'}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              {venda.discount_amount > 0 ? formatCurrency(venda.discount_amount) : '-'}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {reportData.length === 0 && !isGenerating && (
        <Card>
          <CardContent className="text-center py-8">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">Selecione um período e clique em "Gerar Relatório" para visualizar os dados</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SalesBySalespersonReport;