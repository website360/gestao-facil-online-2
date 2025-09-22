import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Package, Truck } from 'lucide-react';

interface ShippingLabelConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  saleId: string;
}

const ShippingLabelConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm,
  saleId 
}: ShippingLabelConfirmModalProps) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-orange-600" />
            Confirmar Geração de Etiqueta
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
            <Truck className="h-8 w-8 text-orange-600" />
            <div>
              <p className="font-medium text-gray-900">
                Gerar etiqueta dos Correios para a venda {saleId}?
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Esta ação irá marcar a etiqueta como gerada e o ícone será removido da lista.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            <Package className="h-4 w-4 mr-2" />
            Gerar Etiqueta
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ShippingLabelConfirmModal;