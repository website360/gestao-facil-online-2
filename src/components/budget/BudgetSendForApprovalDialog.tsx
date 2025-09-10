import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

interface BudgetSendForApprovalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  loading?: boolean;
}

const BudgetSendForApprovalDialog = ({
  open,
  onOpenChange,
  onConfirm,
  loading = false
}: BudgetSendForApprovalDialogProps) => {
  const handleConfirm = () => {
    onConfirm();
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Send className="h-5 w-5 text-blue-600" />
            <DialogTitle>Enviar para Aprovação</DialogTitle>
          </div>
          <DialogDescription>
            Tem certeza que deseja enviar este orçamento para aprovação? 
            Após o envio, apenas administradores e gerentes poderão aprová-lo.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar para Aprovação'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BudgetSendForApprovalDialog;