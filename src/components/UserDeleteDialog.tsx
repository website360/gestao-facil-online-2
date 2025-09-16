
import React from 'react';
import { mapRole, isVendorOrOldVendasRole, type OldRole } from '@/utils/roleMapper';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface User {
  id: string;
  name: string;
  email: string;
  role: OldRole;
  created_at: string;
}

interface UserDeleteDialogProps {
  userToDelete: User | null;
  onClose: () => void;
  onConfirm: () => void;
  currentUserRole?: string;
}

const UserDeleteDialog = ({ userToDelete, onClose, onConfirm, currentUserRole }: UserDeleteDialogProps) => {
  if (!userToDelete) return null;

  const getWarningMessage = () => {
    if (userToDelete.role === 'admin' && currentUserRole === 'gerente') {
      return 'Você não tem permissão para excluir um administrador.';
    }
    return `Tem certeza que deseja excluir o usuário "${userToDelete.name}"? Esta ação não pode ser desfeita.`;
  };

  const canDelete = !(userToDelete.role === 'admin' && currentUserRole === 'gerente');

  return (
    <Dialog open={!!userToDelete} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar Exclusão</DialogTitle>
          <DialogDescription className={!canDelete ? 'text-red-600' : ''}>
            {getWarningMessage()}
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>
            {canDelete ? 'Cancelar' : 'Fechar'}
          </Button>
          {canDelete && (
            <Button variant="destructive" onClick={onConfirm}>
              Excluir
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserDeleteDialog;
