import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Download, Truck, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/formatters';

interface ShippingOption {
  id: string;
  name: string;
  description?: string;
  price: number;
}

interface ShippingRecord {
  id: string;
  created_at: string;
  total_amount: number;
  shipping_cost: number;
  type: 'budget' | 'sale';
  client_name: string;
  shipping_option: {
    id: string;
    name: string;
    description?: string;
  };
}

const ShippingReport = () => {
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [records, setRecords] = useState<ShippingRecord[]>([]);
  const [selectedShippingType, setSelectedShippingType] = useState<string>('all');
  const [selectedRecordType, setSelectedRecordType] = useState<string>('all');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchShippingOptions();
  }, []);

  useEffect(() => {
    fetchRecords();
  }, [selectedShippingType, selectedRecordType, startDate, endDate]);

  const fetchShippingOptions = async () => {
    try {
      const { data, error } = await supabase
        .from('shipping_options')
        .select('*')
        .eq('active', true)
        .order('name');

      if (error) throw error;
      setShippingOptions(data || []);
    } catch (error: any) {
      console.error('Error fetching shipping options:', error);
      toast.error('Erro ao carregar opções de frete');
    }
  };

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const records: ShippingRecord[] = [];

      // Não buscar orçamentos (apenas vendas enviadas para nota fiscal são válidas)
      if (false) { // selectedRecordType === 'all' || selectedRecordType === 'budget'
        let budgetQuery = supabase
          .from('budgets')
          .select(`
            id,
            created_at,
            total_amount,
            shipping_cost,
            shipping_option_id,
            client:clients(name)
          `)
          .not('shipping_option_id', 'is', null)
          .gt('shipping_cost', 0)
          .order('created_at', { ascending: false });

        // Filtros
        if (selectedShippingType !== 'all') {
          budgetQuery = budgetQuery.eq('shipping_option_id', selectedShippingType);
        }

        if (startDate) {
          budgetQuery = budgetQuery.gte('created_at', startDate.toISOString());
        }

        if (endDate) {
          const endOfDay = new Date(endDate);
          endOfDay.setHours(23, 59, 59, 999);
          budgetQuery = budgetQuery.lte('created_at', endOfDay.toISOString());
        }

        const { data: budgetsData, error: budgetsError } = await budgetQuery;

        if (budgetsError) throw budgetsError;

        // Buscar informações das opções de frete para orçamentos
        const budgetShippingIds = [...new Set(budgetsData?.map(b => b.shipping_option_id).filter(Boolean) || [])];
        let budgetShippingOptions: any[] = [];
        
        if (budgetShippingIds.length > 0) {
          const { data: shippingData, error: shippingError } = await supabase
            .from('shipping_options')
            .select('id, name, description')
            .in('id', budgetShippingIds);
          
          if (!shippingError) {
            budgetShippingOptions = shippingData || [];
          }
        }

        budgetsData?.forEach(budget => {
          const shippingOption = budgetShippingOptions.find(so => so.id === budget.shipping_option_id);
          if (shippingOption) {
            records.push({
              id: budget.id,
              created_at: budget.created_at,
              total_amount: budget.total_amount,
              shipping_cost: budget.shipping_cost,
              type: 'budget',
              client_name: budget.client?.name || 'Cliente não informado',
              shipping_option: {
                id: shippingOption.id,
                name: shippingOption.name,
                description: shippingOption.description || undefined
              }
            });
          }
        });
      }

      // Buscar vendas com frete (apenas vendas que foram enviadas para nota fiscal ou finalizadas)
      if (selectedRecordType === 'all' || selectedRecordType === 'sale') {
        let salesQuery = supabase
          .from('sales')
          .select(`
            id,
            created_at,
            total_amount,
            shipping_cost,
            shipping_option_id,
            status,
            client:clients(name)
          `)
          .not('shipping_option_id', 'is', null)
          .gt('shipping_cost', 0)
          .in('status', ['nota_fiscal', 'aguardando_entrega', 'entrega_realizada', 'finalizada'])
          .order('created_at', { ascending: false });

        // Filtros
        if (selectedShippingType !== 'all') {
          salesQuery = salesQuery.eq('shipping_option_id', selectedShippingType);
        }

        if (startDate) {
          salesQuery = salesQuery.gte('created_at', startDate.toISOString());
        }

        if (endDate) {
          const endOfDay = new Date(endDate);
          endOfDay.setHours(23, 59, 59, 999);
          salesQuery = salesQuery.lte('created_at', endOfDay.toISOString());
        }

        const { data: salesData, error: salesError } = await salesQuery;

        if (salesError) throw salesError;

        // Buscar informações das opções de frete para vendas
        const salesShippingIds = [...new Set(salesData?.map(s => s.shipping_option_id).filter(Boolean) || [])];
        let salesShippingOptions: any[] = [];
        
        if (salesShippingIds.length > 0) {
          const { data: shippingData, error: shippingError } = await supabase
            .from('shipping_options')
            .select('id, name, description')
            .in('id', salesShippingIds);
          
          if (!shippingError) {
            salesShippingOptions = shippingData || [];
          }
        }

        salesData?.forEach(sale => {
          const shippingOption = salesShippingOptions.find(so => so.id === sale.shipping_option_id);
          if (shippingOption) {
            records.push({
              id: sale.id,
              created_at: sale.created_at,
              total_amount: sale.total_amount,
              shipping_cost: sale.shipping_cost,
              type: 'sale',
              client_name: sale.client?.name || 'Cliente não informado',
              shipping_option: {
                id: shippingOption.id,
                name: shippingOption.name,
                description: shippingOption.description || undefined
              }
            });
          }
        });
      }

      // Ordenar por data (mais recente primeiro)
      records.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setRecords(records);
    } catch (error: any) {
      console.error('Error fetching records:', error);
      toast.error('Erro ao carregar dados de frete');
    } finally {
      setLoading(false);
    }
  };

  const getTypeLabel = (type: string) => {
    return type === 'budget' ? 'Orçamento' : 'Venda';
  };

  const getTypeIcon = (type: string) => {
    return type === 'budget' ? '📄' : '💰';
  };

  const getTotalShippingValue = () => {
    return records.reduce((total, record) => total + record.shipping_cost, 0);
  };

  const getShippingStats = () => {
    const stats = shippingOptions.map(option => {
      const optionRecords = records.filter(record => record.shipping_option.id === option.id);
      const totalValue = optionRecords.reduce((sum, record) => sum + record.shipping_cost, 0);
      return {
        name: option.name,
        count: optionRecords.length,
        totalValue
      };
    });

    return stats.filter(stat => stat.count > 0);
  };

  const exportToExcel = () => {
    if (records.length === 0) {
      toast.error('Nenhum dado para exportar');
      return;
    }

    const data = records.map(record => ({
      'Data': formatDate(record.created_at),
      'Hora': format(new Date(record.created_at), 'HH:mm', { locale: ptBR }),
      'Tipo': getTypeLabel(record.type),
      'Cliente': record.client_name,
      'Tipo de Frete': record.shipping_option.name,
      'Descrição do Frete': record.shipping_option.description || '',
      'Valor do Frete': record.shipping_cost,
      'Valor Total': record.total_amount,
      'ID': record.id
    }));

    // Adicionar estatísticas
    const statsData = [
      { 'Estatística': 'Total de Registros', 'Valor': records.length },
      { 'Estatística': 'Valor Total em Frete', 'Valor': formatCurrency(getTotalShippingValue()) },
      { 'Estatística': '', 'Valor': '' }, // linha em branco
      { 'Estatística': 'RESUMO POR TIPO DE FRETE', 'Valor': '' },
    ];

    getShippingStats().forEach(stat => {
      statsData.push({
        'Estatística': `${stat.name} - Quantidade`,
        'Valor': stat.count
      });
      statsData.push({
        'Estatística': `${stat.name} - Valor Total`,
        'Valor': formatCurrency(stat.totalValue)
      });
    });

    const wb = XLSX.utils.book_new();
    
    // Planilha principal com dados
    const ws1 = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws1, 'Relatório de Frete');

    // Planilha com estatísticas
    const ws2 = XLSX.utils.json_to_sheet(statsData);
    XLSX.utils.book_append_sheet(wb, ws2, 'Estatísticas');

    const fileName = `relatorio_frete_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    toast.success('Relatório exportado com sucesso!');
  };

  const clearFilters = () => {
    setSelectedShippingType('all');
    setSelectedRecordType('all');
    setStartDate(undefined);
    setEndDate(undefined);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Relatório de Frete</h1>
        <p className="text-muted-foreground">
          Visualize fretes de vendas enviadas para nota fiscal e finalizadas
        </p>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Truck className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Registros</p>
                <p className="text-2xl font-bold">{records.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Valor Total em Frete</p>
                <p className="text-2xl font-bold">{formatCurrency(getTotalShippingValue())}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Truck className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tipos de Frete Ativos</p>
                <p className="text-2xl font-bold">{shippingOptions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <CardTitle>Filtros de Busca</CardTitle>
              <CardDescription>
                Filtre os dados por tipo de frete e período
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={clearFilters} size="sm" className="flex-shrink-0">
                <span className="hidden sm:inline">Limpar Filtros</span>
                <span className="sm:hidden">Limpar</span>
              </Button>
              <Button onClick={exportToExcel} variant="default" size="sm" disabled={records.length === 0} className="flex-shrink-0">
                <Download className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Exportar Relatório</span>
                <span className="sm:hidden">Exportar</span>
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Frete</Label>
              <Select value={selectedShippingType} onValueChange={setSelectedShippingType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {shippingOptions.map((option) => (
                    <SelectItem key={option.id} value={option.id}>
                      {option.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Data Inicial</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !startDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={startDate}
                    onSelect={setStartDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Data Final</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !endDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={endDate}
                    onSelect={setEndDate}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumo por Tipo de Frete */}
      {getShippingStats().length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resumo por Tipo de Frete</CardTitle>
            <CardDescription>
              Estatísticas agrupadas por tipo de frete
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {getShippingStats().map((stat, index) => (
                <div key={index} className="p-4 border rounded-lg overflow-hidden">
                  <h4 className="font-semibold mb-2 break-words">{stat.name}</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-xs sm:text-sm">Quantidade:</span>
                      <span className="font-medium">{stat.count}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-xs sm:text-sm">Valor Total:</span>
                      <span className="font-medium text-xs sm:text-sm">{formatCurrency(stat.totalValue)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista de Registros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Registros de Frete
          </CardTitle>
          <CardDescription>
            {records.length} registro(s) encontrado(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Carregando dados...</div>
          ) : records.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum registro de frete encontrado para os filtros selecionados
            </div>
          ) : (
            <div className="space-y-3">
              {records.map((record) => (
                <div key={record.id} className="border rounded-lg p-3 hover:bg-muted/50 overflow-hidden">
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start gap-3">
                      <div className="text-xl flex-shrink-0">
                        {getTypeIcon(record.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                          <span className="font-medium text-sm truncate">{record.client_name}</span>
                          <span className={cn(
                            "text-xs px-2 py-1 rounded font-medium w-fit flex-shrink-0",
                            record.type === 'budget' 
                              ? "bg-blue-100 text-blue-800" 
                              : "bg-green-100 text-green-800"
                          )}>
                            {getTypeLabel(record.type)}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground break-words">
                          {record.shipping_option.name}
                          {record.shipping_option.description && (
                            <span> - {record.shipping_option.description}</span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          📅 {formatDateTime(record.created_at)}
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                      <div>
                        <div className="text-xs text-muted-foreground">Frete:</div>
                        <div className="font-semibold text-green-600 break-all">
                          {formatCurrency(record.shipping_cost)}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Total:</div>
                        <div className="text-sm font-medium break-all">
                          {formatCurrency(record.total_amount)}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ShippingReport;