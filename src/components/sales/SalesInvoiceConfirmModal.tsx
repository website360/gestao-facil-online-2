
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
import { Loader2 } from 'lucide-react';

interface SalesInvoiceConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  saleId: string;
  clientName: string;
  isConfirming: boolean;
}

const SalesInvoiceConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  saleId,
  clientName,
  isConfirming
}: SalesInvoiceConfirmModalProps) => {
  return (
    <AlertDialog open={isOpen} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar Geração de Nota Fiscal</AlertDialogTitle>
          <AlertDialogDescription>
            Tem certeza que deseja confirmar a geração da nota fiscal para a venda{' '}
            <strong>{saleId}</strong> do cliente <strong>{clientName}</strong>?
            <br />
            <br />
            Esta ação finalizará a venda e não poderá ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isConfirming}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isConfirming}
            className="bg-green-600 hover:bg-green-700"
          >
            {isConfirming ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Confirmando...
              </>
            ) : (
              'Confirmar Nota Fiscal'
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default SalesInvoiceConfirmModal;
