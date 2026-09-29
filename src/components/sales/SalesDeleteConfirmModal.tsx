
import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import { shouldAskAboutStock } from '@/utils/salePermissions';

interface SalesDeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (returnStock: boolean) => void;
  saleId: string;
  clientName: string;
  saleStatus?: string;
  isDeleting?: boolean;
}

const SalesDeleteConfirmModal = ({
  isOpen,
  onClose,
  onConfirm,
  saleId,
  clientName,
  saleStatus = '',
  isDeleting = false
}: SalesDeleteConfirmModalProps) => {
  // Depois da nota fiscal a mercadoria já saiu, então devolver ao estoque vira
  // uma escolha — e o padrão é não devolver.
  const askAboutStock = shouldAskAboutStock(saleStatus);
  const [returnStock, setReturnStock] = useState(!askAboutStock);

  useEffect(() => {
    if (isOpen) setReturnStock(!askAboutStock);
  }, [isOpen, askAboutStock]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center text-red-600">
            <AlertTriangle className="mr-2 h-5 w-5" />
            Confirmar Exclusão
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="h-8 w-8 text-red-600" />
            </div>
            <p className="text-gray-700 mb-2">
              Tem certeza que deseja excluir esta venda?
            </p>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="font-medium text-gray-900">{saleId}</p>
              <p className="text-sm text-gray-600">Cliente: {clientName}</p>
            </div>
          </div>

          <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-800">
              ⚠️ Esta ação não pode ser desfeita. Todos os dados da venda serão permanentemente removidos.
            </p>
          </div>

          {askAboutStock && (
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <Checkbox
                  checked={returnStock}
                  onCheckedChange={(checked) => setReturnStock(checked === true)}
                  disabled={isDeleting}
                  className="mt-0.5"
                />
                <span className="text-sm text-orange-900">
                  <strong>Devolver os itens ao estoque</strong>
                  <span className="block text-orange-800 mt-1">
                    Esta venda já passou pela nota fiscal. Se a mercadoria já saiu, deixe
                    desmarcado — marcar somaria de volta produtos que não estão no depósito.
                  </span>
                </span>
              </label>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isDeleting}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => onConfirm(returnStock)}
              className="flex-1"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              {isDeleting ? 'Excluindo...' : 'Excluir'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SalesDeleteConfirmModal;
