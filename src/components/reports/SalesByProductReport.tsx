import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Download, Search } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface ProductSalesData {
  internal_code: string;
  product_name: string;
  category_name: string;
  quantity_sold: number;
  total_value: number;
  average_ticket: number;
}

export const SalesByProductReport = () => {
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ProductSalesData[]>([]);

  const fetchReport = async () => {
    if (!startDate || !endDate) {
      toast.error('Selecione o período para gerar o relatório');
      return;
    }

    setLoading(true);
    try {
      // Buscar vendas no período
      const { data: salesData, error: salesError } = await supabase
        .from('sales')
        .select(`
          id,
          created_at,
          sale_items (
            product_id,
            quantity,
            total_price
          )
        `)
        .gte('created_at', format(startDate, 'yyyy-MM-dd'))
        .lte('created_at', format(endDate, 'yyyy-MM-dd') + 'T23:59:59');

      if (salesError) throw salesError;

      // Buscar produtos e categorias
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select(`
          id,
          internal_code,
          name,
          category_id,
          categories (
            name
          )
        `);

      if (productsError) throw productsError;

      // Processar dados
      const productMap = new Map<string, ProductSalesData>();

      salesData?.forEach((sale) => {
        sale.sale_items?.forEach((item: any) => {
          const product = productsData?.find((p) => p.id === item.product_id);
          if (!product) return;

          const key = product.id;
          const existing = productMap.get(key);

          if (existing) {
            existing.quantity_sold += item.quantity;
            existing.total_value += Number(item.total_price);
          } else {
            productMap.set(key, {
              internal_code: product.internal_code,
              product_name: product.name,
              category_name: product.categories?.name || 'Sem categoria',
              quantity_sold: item.quantity,
              total_value: Number(item.total_price),
              average_ticket: 0,
            });
          }
        });
      });

      // Calcular ticket médio
      const result = Array.from(productMap.values()).map((item) => ({
        ...item,
        average_ticket: item.total_value / item.quantity_sold,
      }));

      // Ordenar por valor total vendido (decrescente)
      result.sort((a, b) => b.total_value - a.total_value);

      setReportData(result);
      toast.success('Relatório gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast.error('Erro ao gerar relatório');
    } finally {
      setLoading(false);
    }
  };

  const exportToExcel = () => {
    if (reportData.length === 0) {
      toast.error('Não há dados para exportar');
      return;
    }

    const worksheet = XLSX.utils.json_to_sheet(
      reportData.map((item) => ({
        'Código Interno': item.internal_code,
        'Nome do Produto': item.product_name,
        'Categoria': item.category_name,
        'Quantidade Vendida': item.quantity_sold,
        'Valor Total Vendido': item.total_value.toFixed(2),
        'Ticket Médio': item.average_ticket.toFixed(2),
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Vendas por Produto');
    XLSX.writeFile(
      workbook,
      `relatorio_vendas_produto_${format(new Date(), 'dd-MM-yyyy')}.xlsx`
    );

    toast.success('Relatório exportado com sucesso!');
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-4 items-end">
        <div className="flex-1 min-w-[200px]">
          <label className="text-sm font-medium mb-2 block">Data Início</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !startDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {startDate ? format(startDate, 'PPP', { locale: ptBR }) : 'Selecione'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={setStartDate}
                initialFocus
                locale={ptBR}
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex-1 min-w-[200px]">
          <label className="text-sm font-medium mb-2 block">Data Fim</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !endDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, 'PPP', { locale: ptBR }) : 'Selecione'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={setEndDate}
                initialFocus
                locale={ptBR}
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
        </div>

        <Button onClick={fetchReport} disabled={loading}>
          <Search className="mr-2 h-4 w-4" />
          {loading ? 'Gerando...' : 'Gerar Relatório'}
        </Button>

        {reportData.length > 0 && (
          <Button onClick={exportToExcel} variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar Excel
          </Button>
        )}
      </div>

      {reportData.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código Interno</TableHead>
                <TableHead>Nome do Produto</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead className="text-right">Qtd. Vendida</TableHead>
                <TableHead className="text-right">Valor Total</TableHead>
                <TableHead className="text-right">Ticket Médio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {reportData.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="font-mono">{item.internal_code}</TableCell>
                  <TableCell>{item.product_name}</TableCell>
                  <TableCell>{item.category_name}</TableCell>
                  <TableCell className="text-right">{item.quantity_sold}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(item.total_value)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.average_ticket)}
                  </TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-muted/50 font-bold">
                <TableCell colSpan={3}>TOTAL</TableCell>
                <TableCell className="text-right">
                  {reportData.reduce((sum, item) => sum + item.quantity_sold, 0)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(reportData.reduce((sum, item) => sum + item.total_value, 0))}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(
                    reportData.reduce((sum, item) => sum + item.total_value, 0) /
                      reportData.reduce((sum, item) => sum + item.quantity_sold, 0)
                  )}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}

      {reportData.length === 0 && !loading && (
        <div className="text-center py-8 text-muted-foreground">
          Selecione o período e clique em "Gerar Relatório" para visualizar os dados
        </div>
      )}
    </div>
  );
};
