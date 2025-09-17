import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { formatSaleId } from '@/lib/budgetFormatter';
import { Settings, AlertTriangle, User } from 'lucide-react';

interface StatusChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: any | null;
  onStatusChanged: () => void;
}

const StatusChangeModal: React.FC<StatusChangeModalProps> = ({
  isOpen,
  onClose,
  sale,
  onStatusChanged
}) => {
  const [newStatus, setNewStatus] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const statusOptions = [
    { value: 'separacao', label: 'Separação', description: 'Produtos sendo separados' },
    { value: 'conferencia', label: 'Conferência', description: 'Produtos sendo conferidos' },
    { value: 'nota_fiscal', label: 'Nota Fiscal', description: 'Aguardando geração de NF' },
    { value: 'aguardando_entrega', label: 'Aguardando Entrega', description: 'Pronto para entrega' },
    { value: 'entrega_realizada', label: 'Entrega Realizada', description: 'Venda concluída' },
    { value: 'atencao', label: 'Atenção', description: 'Requer atenção especial' }
  ];

  const getCurrentStatusLabel = (status: string) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option ? option.label : status;
  };

  const handleStatusChange = async () => {
    if (!newStatus) {
      toast.error('Selecione um status');
      return;
    }

    if (!notes.trim()) {
      toast.error('Adicione uma observação explicando a mudança de status');
      return;
    }

    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não encontrado');

      // Atualizar o status da venda
      const updateData: any = {
        status: newStatus,
        updated_at: new Date().toISOString()
      };

      // Se for mudança para um status específico, adicionar campos relacionados
      if (newStatus === 'separacao') {
        updateData.separation_user_id = user.id;
        updateData.separation_completed_at = null;
        updateData.conference_user_id = null;
        updateData.conference_completed_at = null;
        updateData.invoice_user_id = null;
        updateData.invoice_completed_at = null;
        updateData.delivery_user_id = null;
        updateData.delivery_completed_at = null;
      } else if (newStatus === 'conferencia') {
        // Se pulou a separação, marcar como feita pelo admin
        if (!sale.separation_user_id) {
          updateData.separation_user_id = user.id;
        }
        updateData.separation_completed_at = updateData.separation_completed_at || new Date().toISOString();
        updateData.conference_user_id = user.id;
        updateData.conference_completed_at = null;
        updateData.invoice_user_id = null;
        updateData.invoice_completed_at = null;
        updateData.delivery_user_id = null;
        updateData.delivery_completed_at = null;
      } else if (newStatus === 'nota_fiscal') {
        // Se pulou etapas anteriores, marcar como feitas pelo admin
        if (!sale.separation_user_id) {
          updateData.separation_user_id = user.id;
        }
        if (!sale.conference_user_id) {
          updateData.conference_user_id = user.id;
        }
        updateData.separation_completed_at = updateData.separation_completed_at || new Date().toISOString();
        updateData.conference_completed_at = updateData.conference_completed_at || new Date().toISOString();
        updateData.invoice_user_id = user.id;
        updateData.invoice_completed_at = null;
        updateData.delivery_user_id = null;
        updateData.delivery_completed_at = null;
      } else if (newStatus === 'aguardando_entrega') {
        // Se pulou etapas anteriores, marcar como feitas pelo admin
        if (!sale.separation_user_id) {
          updateData.separation_user_id = user.id;
        }
        if (!sale.conference_user_id) {
          updateData.conference_user_id = user.id;
        }
        if (!sale.invoice_user_id) {
          updateData.invoice_user_id = user.id;
        }
        updateData.separation_completed_at = updateData.separation_completed_at || new Date().toISOString();
        updateData.conference_completed_at = updateData.conference_completed_at || new Date().toISOString();
        updateData.invoice_completed_at = updateData.invoice_completed_at || new Date().toISOString();
        updateData.delivery_user_id = user.id;
        updateData.delivery_completed_at = null;
      } else if (newStatus === 'entrega_realizada') {
        // Se pulou etapas anteriores, marcar como feitas pelo admin
        if (!sale.separation_user_id) {
          updateData.separation_user_id = user.id;
        }
        if (!sale.conference_user_id) {
          updateData.conference_user_id = user.id;
        }
        if (!sale.invoice_user_id) {
          updateData.invoice_user_id = user.id;
        }
        if (!sale.delivery_user_id) {
          updateData.delivery_user_id = user.id;
        }
        updateData.separation_completed_at = updateData.separation_completed_at || new Date().toISOString();
        updateData.conference_completed_at = updateData.conference_completed_at || new Date().toISOString();
        updateData.invoice_completed_at = updateData.invoice_completed_at || new Date().toISOString();
        updateData.delivery_completed_at = updateData.delivery_completed_at || new Date().toISOString();
      }

      // Atualizar venda
      const { error } = await supabase
        .from('sales')
        .update(updateData)
        .eq('id', sale.id);

      if (error) throw error;

      // Registrar log da mudança de status com a observação
      await supabase
        .from('sale_status_logs')
        .insert({
          sale_id: sale.id,
          previous_status: sale.status as any,
          new_status: newStatus as any,
          user_id: user.id,
          reason: notes
        });

      toast.success(`Status alterado para "${getCurrentStatusLabel(newStatus)}" com sucesso!`);
      onStatusChanged();
      onClose();
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      toast.error('Erro ao alterar status da venda');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setNewStatus('');
    setNotes('');
    onClose();
  };

  if (!sale) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Alterar Status da Venda
            <Badge variant="outline" className="ml-2">
              {formatSaleId(sale.id, sale.created_at)}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="w-5 h-5" />
              Informações da Venda
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <strong>Cliente:</strong> {sale.clients?.name || 'N/A'}
              </div>
              <div>
                <strong>Status Atual:</strong> 
                <Badge className="ml-2">{getCurrentStatusLabel(sale.status)}</Badge>
              </div>
              <div>
                <strong>Total:</strong> R$ {parseFloat(sale.total_amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <div>
                <strong>Criado em:</strong> {new Date(sale.created_at).toLocaleDateString('pt-BR')}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Alteração de Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800 text-sm">
                <AlertTriangle className="w-4 h-4" />
                <strong>Atenção:</strong>
              </div>
              <p className="text-yellow-700 text-sm mt-1">
                Esta ação permite alterar o status da venda para qualquer etapa do processo. 
                Use apenas quando necessário e sempre documente o motivo da alteração.
              </p>
            </div>

            <div>
              <Label htmlFor="new-status">Novo Status</Label>
              <Select onValueChange={setNewStatus} value={newStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o novo status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((option) => (
                    <SelectItem 
                      key={option.value} 
                      value={option.value}
                      disabled={option.value === sale.status}
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{option.label}</span>
                        <span className="text-xs text-gray-600">{option.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="change-notes">Motivo da Alteração *</Label>
              <Textarea
                id="change-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Explique o motivo da alteração de status (obrigatório)"
                rows={3}
                className="mt-1"
              />
              <p className="text-xs text-gray-600 mt-1">
                Este comentário será registrado no histórico da venda
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={handleClose}>
                Cancelar
              </Button>
              <Button
                onClick={handleStatusChange}
                disabled={!newStatus || !notes.trim() || saving}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {saving ? 'Alterando...' : 'Alterar Status'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
};

export default StatusChangeModal;