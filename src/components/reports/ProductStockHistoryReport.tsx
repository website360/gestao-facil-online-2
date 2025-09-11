import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarIcon, Download, Package, User, ShoppingCart } from 'lucide-react';
import { cn } from '@/lib/utils';
import * as XLSX from 'xlsx';

interface StockMovement {
  id: string;
  product_id: string;
  movement_type: 'entrada' | 'saida' | 'ajuste';
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reason: 'venda' | 'entrada_estoque' | 'ajuste_manual' | 'entrada_massa';
  reference_id?: string;
  notes?: string;
  created_at: string;
  product: {
    name: string;
    internal_code: string;
    stock_unit: string;
  };
  user?: {
    name: string;
    email: string;
  };
  client?: {
    name: string;
  };
}

const ProductStockHistoryReport = () => {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState<Date | undefined>();
  const [endDate, setEndDate] = useState<Date | undefined>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchMovements();
  }, [searchTerm, startDate, endDate]);

  const fetchMovements = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('stock_movements')
        .select(`
          *,
          product:products(name, internal_code, stock_unit)
        `)
        .order('created_at', { ascending: false });

      // Filtro por busca de produto
      if (searchTerm.trim()) {
        const { data: productsData } = await supabase
          .from('products')
          .select('id')
          .or(`name.ilike.%${searchTerm}%,internal_code.ilike.%${searchTerm}%`);
        
        if (productsData && productsData.length > 0) {
          const productIds = productsData.map(p => p.id);
          query = query.in('product_id', productIds);
        } else {
          // Se não encontrou produtos, não retorna nada
          setMovements([]);
          setLoading(false);
          return;
        }
      }

      // Filtros de data
      if (startDate) {
        query = query.gte('created_at', startDate.toISOString());
      }

      if (endDate) {
        const endOfDay = new Date(endDate);
        endOfDay.setHours(23, 59, 59, 999);
        query = query.lte('created_at', endOfDay.toISOString());
      }

      const { data: movementsData, error } = await query;

      if (error) throw error;

      // Buscar informações dos usuários
      const userIds = [...new Set(movementsData?.map(m => m.user_id).filter(Boolean) || [])];
      let usersData: any[] = [];
      
      if (userIds.length > 0) {
        const { data: users, error: usersError } = await supabase
          .from('profiles')
          .select('id, name, email')
          .in('id', userIds);
        
        if (!usersError) {
          usersData = users || [];
        }
      }

      // Buscar informações dos clientes para vendas
      const saleIds = [...new Set(movementsData?.filter(m => m.reason === 'venda' && m.reference_id).map(m => m.reference_id) || [])];
      let clientsData: any[] = [];
      
      if (saleIds.length > 0) {
        const { data: sales, error: salesError } = await supabase
          .from('sales')
          .select(`
            id,
            client:clients(name)
          `)
          .in('id', saleIds);
        
        if (!salesError) {
          clientsData = sales || [];
        }
      }

      // Combinar dados
      const movementsWithUsers = movementsData?.map(movement => ({
        ...movement,
        movement_type: movement.movement_type as 'entrada' | 'saida' | 'ajuste',
        reason: movement.reason as 'venda' | 'entrada_estoque' | 'ajuste_manual' | 'entrada_massa',
        user: usersData.find(user => user.id === movement.user_id),
        client: movement.reason === 'venda' && movement.reference_id 
          ? clientsData.find(sale => sale.id === movement.reference_id)?.client
          : null
      })) || [];

      setMovements(movementsWithUsers as StockMovement[]);
    } catch (error: any) {
      console.error('Error fetching movements:', error);
      toast.error('Erro ao carregar histórico');
    } finally {
      setLoading(false);
    }
  };

  const formatMovementDescription = (movement: StockMovement) => {
    const productName = movement.product?.name || 'Produto';
    const quantity = movement.quantity;
    
    switch (movement.reason) {
      case 'venda':
        const clientName = movement.client?.name || 'Cliente não identificado';
        return `${productName} foi vendido ${quantity} ${movement.product?.stock_unit || 'itens'} para ${clientName}`;
      case 'entrada_estoque':
      case 'entrada_massa':
        return `${productName} teve ${quantity} ${movement.product?.stock_unit || 'itens'} adicionados ao estoque`;
      case 'ajuste_manual':
        const userName = movement.user?.name || 'Sistema';
        const action = movement.movement_type === 'entrada' ? 'adicionados' : 'removidos';
        return `${productName} teve ${quantity} ${movement.product?.stock_unit || 'itens'} ${action} no estoque por ${userName}`;
      default:
        return `${productName} - movimentação de ${quantity} ${movement.product?.stock_unit || 'itens'}`;
    }
  };

  const getMovementIcon = (movement: StockMovement) => {
    if (movement.reason === 'venda') {
      return <ShoppingCart className="h-4 w-4 text-blue-600" />;
    }
    if (movement.reason === 'ajuste_manual') {
      return <User className="h-4 w-4 text-orange-600" />;
    }
    return <Package className="h-4 w-4 text-green-600" />;
  };

  const exportToExcel = () => {
    if (movements.length === 0) {
      toast.error('Nenhum dado para exportar');
      return;
    }
    
    const data = movements.map(movement => ({
      'Data/Hora': format(new Date(movement.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR }),
      'Descrição': formatMovementDescription(movement),
      'Produto': movement.product?.name || 'N/A',
      'Código': movement.product?.internal_code || 'N/A',
      'Quantidade': movement.quantity,
      'Unidade': movement.product?.stock_unit || 'N/A',
      'Estoque Anterior': movement.previous_stock,
      'Estoque Novo': movement.new_stock,
      'Usuário/Cliente': movement.reason === 'venda' 
        ? movement.client?.name || 'Cliente não identificado'
        : movement.user?.name || 'Sistema',
      'Observações': movement.notes || ''
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Histórico de Movimentações');

    const fileName = `historico_movimentacoes_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    toast.success('Relatório exportado com sucesso!');
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStartDate(undefined);
    setEndDate(undefined);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Histórico de Movimentações de Estoque</h1>
        <p className="text-muted-foreground">
          Visualize todas as movimentações de estoque com informações detalhadas
        </p>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <CardTitle>Filtros de Busca</CardTitle>
              <CardDescription>
                Filtre as movimentações por produto e período
              </CardDescription>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <Button variant="outline" onClick={clearFilters} size="sm" className="flex-shrink-0">
                <span className="hidden sm:inline">Limpar Filtros</span>
                <span className="sm:hidden">Limpar</span>
              </Button>
              <Button onClick={exportToExcel} variant="default" size="sm" disabled={movements.length === 0} className="flex-shrink-0">
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
              <Label htmlFor="search">Buscar Produto</Label>
              <Input
                id="search"
                placeholder="Nome ou código do produto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
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

      {/* Histórico */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Histórico de Movimentações
          </CardTitle>
          <CardDescription>
            {movements.length} movimentação(ões) encontrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Carregando histórico...</div>
          ) : movements.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma movimentação encontrada para os filtros selecionados
            </div>
          ) : (
            <div className="space-y-3">
              {movements.map((movement) => (
                <div key={movement.id} className="flex items-start gap-3 p-4 border rounded-lg hover:bg-muted/50">
                  {getMovementIcon(movement)}
                  <div className="flex-1">
                    <p className="font-medium text-sm leading-relaxed">
                      {formatMovementDescription(movement)}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>
                        📅 {format(new Date(movement.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                      </span>
                      <span>
                        📦 Estoque: {movement.previous_stock} → {movement.new_stock}
                      </span>
                      {movement.notes && (
                        <span>
                          📝 {movement.notes}
                        </span>
                      )}
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

export default ProductStockHistoryReport;