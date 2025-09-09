import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Loader2 } from 'lucide-react';

interface ClientImportProgressModalProps {
  open: boolean;
  progress: number;
  status: string;
}

const ClientImportProgressModal: React.FC<ClientImportProgressModalProps> = ({
  open,
  progress,
  status
}) => {
  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            <DialogTitle>Importando Clientes</DialogTitle>
          </div>
          <DialogDescription>
            Por favor, aguarde enquanto os clientes são importados.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Progress value={progress} className="w-full" />
          <div className="text-center">
            <p className="text-sm text-gray-600">{status}</p>
            <p className="text-xs text-gray-500 mt-1">{progress}% concluído</p>
            <p className="text-xs text-gray-400 mt-2">
              Planilhas grandes podem levar alguns minutos. Não feche esta janela.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ClientImportProgressModal;