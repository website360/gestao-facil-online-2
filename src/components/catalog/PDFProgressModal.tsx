import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';

interface PDFProgressModalProps {
  isOpen: boolean;
  progress: number;
  currentPage: number;
  totalPages: number;
  status: string;
}

export const PDFProgressModal = ({ 
  isOpen, 
  progress, 
  currentPage, 
  totalPages,
  status 
}: PDFProgressModalProps) => {
  return (
    <Dialog open={isOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Gerando PDF do Catálogo</DialogTitle>
          <DialogDescription>
            Por favor, aguarde enquanto o PDF está sendo gerado...
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <Progress value={progress} className="w-full" />
          <div className="text-sm text-center text-muted-foreground">
            <p className="font-medium">{status}</p>
            <p className="mt-1">
              Página {currentPage} de {totalPages}
            </p>
            <p className="mt-1 text-xs">
              {Math.round(progress)}% concluído
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
