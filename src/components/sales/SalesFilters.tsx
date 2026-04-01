import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Search, X, Filter, CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SalesFiltersProps {
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  statusFilter: string;
  setStatusFilter: (value: string) => void;
  userRole: string;
  filteredSalesCount: number;
  startDate?: Date;
  endDate?: Date;
  onStartDateChange?: (date: Date | undefined) => void;
  onEndDateChange?: (date: Date | undefined) => void;
  onApplyDateFilter?: () => void;
  onClearDateFilter?: () => void;
  loading?: boolean;
}

const SalesFilters = ({ 
  searchTerm, 
  setSearchTerm,
  statusFilter,
  setStatusFilter,
  userRole,
  filteredSalesCount,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  onApplyDateFilter,
  onClearDateFilter,
  loading = false
}: SalesFiltersProps) => {
  const clearSearch = () => {
    setSearchTerm('');
  };

  return (
    <div className="space-y-4">
      {/* Date range filter */}
      <div className="flex flex-wrap items-center gap-3 p-3 bg-muted/30 rounded-lg border border-border">
        <span className="text-sm font-medium text-foreground">Período:</span>
        
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[160px] justify-start text-left font-normal h-9 text-sm",
                !startDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-3.5 w-3.5" />
              {startDate ? format(startDate, "dd/MM/yyyy", { locale: ptBR }) : "Data inicial"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={onStartDateChange}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
              locale={ptBR}
            />
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[160px] justify-start text-left font-normal h-9 text-sm",
                !endDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-3.5 w-3.5" />
              {endDate ? format(endDate, "dd/MM/yyyy", { locale: ptBR }) : "Data final"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={endDate}
              onSelect={onEndDateChange}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
              locale={ptBR}
              disabled={(date) => startDate ? date < startDate : false}
            />
          </PopoverContent>
        </Popover>

        <Button 
          onClick={onApplyDateFilter}
          disabled={loading}
          size="sm"
          className="bg-primary hover:bg-primary/90 text-primary-foreground h-9"
        >
          {loading ? 'Carregando...' : 'Aplicar'}
        </Button>

        <Button 
          onClick={onClearDateFilter}
          variant="outline"
          size="sm"
          className="h-9"
        >
          <X className="w-3.5 h-3.5 mr-1" />
          Limpar datas
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por cliente, número da venda, vendedor ou número da nota..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0 hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        {(userRole === 'admin' || userRole === 'gerente') && (
          <div className="w-full md:w-48">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full">
                <Filter className="w-4 h-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent className="w-full">
                <SelectItem value="todos">Todos os status</SelectItem>
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
        )}
      </div>
      <div className="text-sm text-muted-foreground">
        {filteredSalesCount} registros encontrados
      </div>
    </div>
  );
};

export default SalesFilters;
