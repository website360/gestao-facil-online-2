import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Check, Circle, Loader2, Truck, FileText } from 'lucide-react';
import { formatCurrency } from '@/lib/formatters';
import { formatBudgetId, formatSaleId } from '@/lib/budgetFormatter';
import { buildClientOrderTimeline, getClientOrderStatusInfo } from '@/lib/clientOrderStatus';

interface ClientOrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    displayId: string;
    createdAt: string;
    total: number;
    budget?: any | null;
    sale?: any | null;
    trackingCode?: string | null;
  } | null;
}

const formatDateTime = (value?: string | null) => {
  if (!value) return null;
  return new Date(value).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const ClientOrderTrackingModal = ({ isOpen, onClose, order }: ClientOrderTrackingModalProps) => {
  if (!order) return null;

  const { budget, sale } = order;
  const status = getClientOrderStatusInfo(budget?.status, sale?.status);
  const timeline = buildClientOrderTimeline(budget, sale);
  const items = sale?.sale_items?.length ? sale.sale_items : budget?.budget_items || [];
  const trackingCode = order.trackingCode?.trim();

  const openTrackingPage = () => {
    if (!trackingCode) return;
    window.open(
      `https://www2.correios.com.br/sistemas/rastreamento/resultado.cfm?objeto=${trackingCode}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            Pedido {order.displayId}
            <Badge className={status.color}>{status.label}</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <p className="text-sm text-muted-foreground">{status.description}</p>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Data do pedido</p>
                <p className="font-medium">{formatDateTime(order.createdAt)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Valor total</p>
                <p className="font-medium">{formatCurrency(order.total)}</p>
              </div>
              {sale?.id && (
                <div>
                  <p className="text-muted-foreground">Nº da venda</p>
                  <p className="font-medium">{formatSaleId(sale.id, sale.created_at)}</p>
                </div>
              )}
              {budget?.id && (
                <div>
                  <p className="text-muted-foreground">Nº do orçamento</p>
                  <p className="font-medium">{formatBudgetId(budget.id, budget.created_at)}</p>
                </div>
              )}
              {sale?.invoice_number && (
                <div>
                  <p className="text-muted-foreground">Nota fiscal</p>
                  <p className="font-medium">{sale.invoice_number}</p>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Linha do tempo das etapas */}
          <div>
            <h4 className="font-semibold mb-3">Acompanhamento</h4>
            <ol className="space-y-0">
              {timeline.map((step, index) => {
                const isLast = index === timeline.length - 1;
                return (
                  <li key={step.key} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-full border-2 ${
                          step.state === 'done'
                            ? 'border-green-500 bg-green-500 text-white'
                            : step.state === 'current'
                            ? 'border-blue-500 bg-blue-50 text-blue-600'
                            : 'border-gray-200 bg-white text-gray-300'
                        }`}
                      >
                        {step.state === 'done' ? (
                          <Check className="h-4 w-4" />
                        ) : step.state === 'current' ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Circle className="h-3 w-3" />
                        )}
                      </div>
                      {!isLast && (
                        <div
                          className={`w-0.5 flex-1 min-h-[22px] ${
                            step.state === 'done' ? 'bg-green-500' : 'bg-gray-200'
                          }`}
                        />
                      )}
                    </div>
                    <div className={`pb-4 ${isLast ? 'pb-0' : ''}`}>
                      <p
                        className={`text-sm ${
                          step.state === 'pending' ? 'text-muted-foreground' : 'font-medium'
                        }`}
                      >
                        {step.label}
                      </p>
                      {step.date && (
                        <p className="text-xs text-muted-foreground">{formatDateTime(step.date)}</p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          {trackingCode && (
            <>
              <Separator />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-muted-foreground">Código de rastreio</p>
                  <p className="font-medium">{trackingCode}</p>
                </div>
                <Button variant="outline" size="sm" onClick={openTrackingPage}>
                  <Truck className="h-4 w-4 mr-2" />
                  Rastrear nos Correios
                </Button>
              </div>
            </>
          )}

          {items.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="font-semibold mb-3">Itens do pedido</h4>
                <div className="space-y-2">
                  {items.map((item: any) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between gap-3 rounded-md border p-2 text-sm"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-medium">
                          {item.products?.name || 'Produto'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.products?.internal_code
                            ? `Cód. ${item.products.internal_code} · `
                            : ''}
                          {item.quantity} x {formatCurrency(Number(item.unit_price) || 0)}
                        </p>
                      </div>
                      <p className="whitespace-nowrap font-medium">
                        {formatCurrency(Number(item.total_price) || 0)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {(sale?.notes || budget?.notes) && (
            <>
              <Separator />
              <div>
                <h4 className="flex items-center gap-2 font-semibold mb-2">
                  <FileText className="h-4 w-4" />
                  Observações
                </h4>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {sale?.notes || budget?.notes}
                </p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClientOrderTrackingModal;
