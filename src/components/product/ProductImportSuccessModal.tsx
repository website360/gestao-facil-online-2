import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

interface ProductImportSuccessModalProps {
  open: boolean;
  totalImported: number;
  onClose: () => void;
}

const ProductImportSuccessModal = ({
  open,
  totalImported,
  onClose
}: ProductImportSuccessModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Importação Concluída
          </DialogTitle>
          <DialogDescription>
            A importação foi realizada com sucesso!
          </DialogDescription>
        </DialogHeader>

        <div className="text-center space-y-4">
          <div className="text-2xl font-bold text-green-600">
            {totalImported}
          </div>
          <p className="text-muted-foreground">
            produto(s) importado(s) com sucesso
          </p>
          
          <Button onClick={onClose} className="w-full">
            OK
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductImportSuccessModal;