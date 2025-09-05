
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  client_type: string;
  cpf?: string;
  cnpj?: string;
  created_at: string;
}

interface ClientDeleteDialogProps {
  clientToDelete: Client | null;
  onClose: () => void;
  onConfirm: () => void;
}

const ClientDeleteDialog = ({ clientToDelete, onClose, onConfirm }: ClientDeleteDialogProps) => {
  if (!clientToDelete) return null;

  return (
    <Dialog open={!!clientToDelete} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar Exclusão</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir o cliente "{clientToDelete.name}"?
            Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Excluir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClientDeleteDialog;
