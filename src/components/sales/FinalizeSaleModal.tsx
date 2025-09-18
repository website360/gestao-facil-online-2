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

interface FinalizeSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  saleId: string;
}

const FinalizeSaleModal = ({ isOpen, onClose, onConfirm, saleId }: FinalizeSaleModalProps) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Finalização da Venda</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja finalizar a venda #{saleId}? 
            <br />
            <br />
            Esta ação mudará o status da venda para "Finalizada" e não poderá ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={onConfirm}
            className="bg-gray-600 hover:bg-gray-700"
          >
            Finalizar Venda
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default FinalizeSaleModal;