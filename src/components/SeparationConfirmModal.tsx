import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface SeparationConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  itemCount: number;
  loading?: boolean;
}

const SeparationConfirmModal: React.FC<SeparationConfirmModalProps> = ({
  open,
  onOpenChange,
  onConfirm,
  itemCount,
  loading = false
}) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Finalização da Separação</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja finalizar a separação de {itemCount} {itemCount === 1 ? 'item' : 'itens'}?
            <br /><br />
            Após a confirmação, a venda será enviada para a conferência e não será mais possível editar a separação.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm} 
            disabled={loading}
            className="bg-green-600 hover:bg-green-700"
          >
            {loading ? 'Finalizando...' : 'Confirmar Separação'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default SeparationConfirmModal;