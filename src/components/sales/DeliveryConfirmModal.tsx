import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Truck, CheckCircle } from 'lucide-react';
import { formatSaleId } from '@/lib/budgetFormatter';

interface DeliveryConfirmModalProps {
  // Nova interface
  isOpen?: boolean;
  onClose?: () => void;
  sale?: any | null;
  onDeliveryConfirmed?: () => void;
  
  // Interface existente  
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onConfirm?: () => Promise<void>;
  saleId?: string;
}

const DeliveryConfirmModal: React.FC<DeliveryConfirmModalProps> = ({
  // Nova interface
  isOpen,
  onClose,
  sale,
  onDeliveryConfirmed,
  
  // Interface existente
  open,
  onOpenChange,
  onConfirm,
  saleId
}) => {
  const [observations, setObservations] = useState<string>('');
  const [confirming, setConfirming] = useState(false);

  // Determinar qual interface está sendo usada
  const modalOpen = isOpen !== undefined ? isOpen : (open !== undefined ? open : false);
  const handleModalClose = onClose || (() => onOpenChange && onOpenChange(false));
  
  // Se está usando a interface antiga, não mostra o formulário de observações
  const isLegacyMode = onConfirm !== undefined;

  const handleConfirmDelivery = async () => {
    // Se está no modo legado, apenas chama onConfirm
    if (isLegacyMode && onConfirm) {
      try {
        setConfirming(true);
        await onConfirm();
        handleModalClose();
      } catch (error) {
        console.error('Erro ao confirmar entrega:', error);
      } finally {
        setConfirming(false);
      }
      return;
    }

    // Modo novo - com observações obrigatórias
    if (!observations.trim()) {
      toast.error('Adicione uma observação sobre a entrega');
      return;
    }

    setConfirming(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não encontrado');

      // Atualizar o status da venda para entrega realizada
      const { error } = await supabase
        .from('sales')
        .update({
          status: 'entrega_realizada',
          delivery_user_id: user.id,
          delivery_completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', sale.id);

      if (error) throw error;

      // Registrar log da confirmação de entrega
      await supabase
        .from('sale_status_logs')
        .insert({
          sale_id: sale.id,
          previous_status: 'aguardando_entrega' as any,
          new_status: 'entrega_realizada' as any,
          user_id: user.id,
          reason: observations
        });

      toast.success('Entrega confirmada com sucesso!');
      onDeliveryConfirmed?.();
      handleModalClose();
    } catch (error) {
      console.error('Erro ao confirmar entrega:', error);
      toast.error('Erro ao confirmar entrega');
    } finally {
      setConfirming(false);
    }
  };

  const handleClose = () => {
    setObservations('');
    handleModalClose();
  };

  // Se está no modo legado ou não há venda, não mostra nada
  if (isLegacyMode || !sale) return null;

  return (
    <Dialog open={modalOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-green-600" />
            Confirmar Entrega
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-600">
              <strong>Venda:</strong> {formatSaleId(sale.id, sale.created_at)}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              <strong>Cliente:</strong> {sale.clients?.name || 'N/A'}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              <strong>Frete:</strong> {sale.shipping_option_name || 'N/A'}
            </div>
          </div>

          <div>
            <Label htmlFor="observations">Observações sobre a entrega *</Label>
            <Textarea
              id="observations"
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Descreva detalhes sobre a confirmação da entrega..."
              rows={4}
              className="mt-1"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              onClick={handleConfirmDelivery}
              disabled={!observations.trim() || confirming}
              className="bg-green-600 hover:bg-green-700"
            >
              {confirming ? (
                'Confirmando...'
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirmar Entrega
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeliveryConfirmModal;