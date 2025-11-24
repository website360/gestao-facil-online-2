import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { AlertTriangle, CheckCircle, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface StockIntegrityData {
  product_id: string;
  product_code: string;
  product_name: string;
  system_stock: number;
  calculated_stock: number;
  difference: number;
  total_entries: number;
  total_exits: number;
  orphaned_movements: number;
}

export function StockAuditReport() {
  const [loading, setLoading] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [auditData, setAuditData] = useState<StockIntegrityData[]>([]);

  const runAudit = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('validate_stock_integrity');

      if (error) throw error;

      setAuditData(data || []);
      
      if (data && data.length > 0) {
        toast({
          title: 'Auditoria concluída',
          description: `Encontradas ${data.length} inconsistências no estoque`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Auditoria concluída',
          description: 'Nenhuma inconsistência encontrada no estoque',
        });
      }
    } catch (error) {
      console.error('Erro ao executar auditoria:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao executar auditoria de estoque',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const cleanOrphanedMovements = async () => {
    setCleaning(true);
    try {
      const { data, error } = await supabase.rpc('clean_orphaned_stock_movements');

      if (error) throw error;

      const result = data?.[0];
      if (result) {
        toast({
          title: 'Limpeza concluída',
          description: `${result.deleted_count} movimentações órfãs removidas (${result.total_quantity} unidades)`,
        });
        // Reexecutar auditoria após limpeza
        await runAudit();
      }
    } catch (error) {
      console.error('Erro ao limpar movimentações órfãs:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao limpar movimentações órfãs',
        variant: 'destructive',
      });
    } finally {
      setCleaning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Auditoria de Estoque</h2>
          <p className="text-muted-foreground">
            Identifique e corrija inconsistências no estoque
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={cleanOrphanedMovements}
            disabled={cleaning || loading}
            variant="destructive"
          >
            {cleaning ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Limpando...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Limpar Movimentações Órfãs
              </>
            )}
          </Button>
          <Button onClick={runAudit} disabled={loading || cleaning}>
            {loading ? (
              <>
                <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                Auditando...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Executar Auditoria
              </>
            )}
          </Button>
        </div>
      </div>

      {auditData.length === 0 && !loading ? (
        <Card className="p-8 text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2">Estoque Íntegro</h3>
          <p className="text-muted-foreground">
            Execute a auditoria para verificar a integridade do estoque
          </p>
        </Card>
      ) : (
        <Card>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead className="text-right">Estoque Sistema</TableHead>
                  <TableHead className="text-right">Estoque Calculado</TableHead>
                  <TableHead className="text-right">Diferença</TableHead>
                  <TableHead className="text-right">Total Entradas</TableHead>
                  <TableHead className="text-right">Total Saídas</TableHead>
                  <TableHead className="text-right">Mov. Órfãs</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {auditData.map((item) => (
                  <TableRow key={item.product_id}>
                    <TableCell className="font-medium">
                      {item.product_code}
                    </TableCell>
                    <TableCell>{item.product_name}</TableCell>
                    <TableCell className="text-right">
                      {Number(item.system_stock).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      {Number(item.calculated_stock).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={
                          Number(item.difference) !== 0
                            ? 'text-destructive font-semibold'
                            : ''
                        }
                      >
                        {Number(item.difference) > 0 ? '+' : ''}
                        {Number(item.difference).toLocaleString('pt-BR')}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {Number(item.total_entries).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      {Number(item.total_exits).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right">
                      {item.orphaned_movements > 0 ? (
                        <span className="flex items-center justify-end gap-1 text-destructive">
                          <AlertTriangle className="h-4 w-4" />
                          {item.orphaned_movements}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">0</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      {auditData.length > 0 && (
        <Card className="p-4 bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-500 mt-0.5" />
            <div className="space-y-2">
              <h4 className="font-semibold text-yellow-900 dark:text-yellow-100">
                Inconsistências Detectadas
              </h4>
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Foram encontradas inconsistências no estoque. Use o botão "Limpar Movimentações Órfãs" 
                para remover automaticamente movimentações de vendas deletadas.
              </p>
              <ul className="text-sm text-yellow-800 dark:text-yellow-200 list-disc list-inside space-y-1">
                <li>
                  <strong>Diferença:</strong> Diferença entre estoque do sistema e calculado pelas movimentações
                </li>
                <li>
                  <strong>Mov. Órfãs:</strong> Movimentações de vendas que foram deletadas mas não limpas
                </li>
              </ul>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
