import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { RefreshCw, Send, CheckCircle2, XCircle, FlaskConical } from 'lucide-react';

interface BlingLog {
  id: string;
  sale_id: string | null;
  success: boolean;
  dry_run: boolean;
  bling_order_id: string | null;
  bling_order_number: string | null;
  error_message: string | null;
  created_at: string;
}

const BlingSyncLogs = () => {
  const [logs, setLogs] = useState<BlingLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [retrying, setRetrying] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('bling_sync_logs')
        .select('id, sale_id, success, dry_run, bling_order_id, bling_order_number, error_message, created_at')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      setLogs((data ?? []) as BlingLog[]);
    } catch (error) {
      console.error('Erro ao carregar logs do Bling:', error);
      toast.error('Erro ao carregar log de envios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const handleRetry = async (saleId: string) => {
    setRetrying(saleId);
    try {
      const { data, error } = await supabase.functions.invoke('send-to-bling', {
        body: { sale_id: saleId },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
      } else if (data?.dry_run) {
        toast.success(data?.message || 'Dry-run: pedido validado, não enviado.');
      } else {
        toast.success(data?.message || 'Pedido reenviado ao Bling com sucesso!');
      }
      fetchLogs();
    } catch (error) {
      console.error('Erro ao reenviar para Bling:', error);
      toast.error('Erro ao reenviar para o Bling');
    } finally {
      setRetrying(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Log de envios ao Bling</CardTitle>
            <CardDescription>Últimas 50 tentativas de envio de pedidos ao Bling</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {logs.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Nenhum envio registrado ainda.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Pedido Bling</TableHead>
                  <TableHead>Detalhe</TableHead>
                  <TableHead className="text-right">Ação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap text-sm">
                      {new Date(log.created_at).toLocaleString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      {log.dry_run ? (
                        <Badge variant="outline" className="gap-1 text-amber-600 border-amber-300">
                          <FlaskConical className="h-3 w-3" /> Dry-run
                        </Badge>
                      ) : log.success ? (
                        <Badge variant="outline" className="gap-1 text-green-600 border-green-300">
                          <CheckCircle2 className="h-3 w-3" /> Sucesso
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1 text-red-600 border-red-300">
                          <XCircle className="h-3 w-3" /> Erro
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-sm">
                      {log.bling_order_number
                        ? `Nº ${log.bling_order_number}`
                        : log.bling_order_id
                        ? `ID ${log.bling_order_id}`
                        : '—'}
                    </TableCell>
                    <TableCell className="max-w-xs">
                      {log.error_message ? (
                        <span className="text-xs text-red-600 line-clamp-2" title={log.error_message}>
                          {log.error_message}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {!log.success && !log.dry_run && log.sale_id && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleRetry(log.sale_id!)}
                          disabled={retrying === log.sale_id}
                        >
                          <Send className="h-3.5 w-3.5 mr-1.5" />
                          {retrying === log.sale_id ? 'Reenviando...' : 'Reenviar'}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BlingSyncLogs;
