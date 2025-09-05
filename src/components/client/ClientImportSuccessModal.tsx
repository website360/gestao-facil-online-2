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
import { CheckCircle } from 'lucide-react';

interface ClientImportSuccessModalProps {
  open: boolean;
  onClose: () => void;
  totalImported: number;
}

const ClientImportSuccessModal: React.FC<ClientImportSuccessModalProps> = ({
  open,
  onClose,
  totalImported
}) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <DialogTitle>Importação Concluída</DialogTitle>
          </div>
          <DialogDescription>
            A importação de clientes foi concluída com sucesso.
          </DialogDescription>
        </DialogHeader>

        <div className="text-center py-4">
          <div className="text-3xl font-bold text-green-600 mb-2">
            {totalImported}
          </div>
          <p className="text-gray-600">
            {totalImported === 1 ? 'cliente importado' : 'clientes importados'}
          </p>
        </div>

        <DialogFooter>
          <Button onClick={onClose} className="w-full">
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ClientImportSuccessModal;