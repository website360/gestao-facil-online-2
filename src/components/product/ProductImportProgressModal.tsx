import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';

interface ProductImportProgressModalProps {
  open: boolean;
  progress: number;
  status: string;
}

const ProductImportProgressModal = ({
  open,
  progress,
  status
}: ProductImportProgressModalProps) => {
  return (
    <Dialog open={open}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Importando Produtos</DialogTitle>
          <DialogDescription>
            Aguarde enquanto os produtos são importados...
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Progress value={progress} className="w-full" />
          <div className="text-center">
            <p className="text-sm text-muted-foreground">{status}</p>
            <p className="text-lg font-semibold">{progress}%</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductImportProgressModal;