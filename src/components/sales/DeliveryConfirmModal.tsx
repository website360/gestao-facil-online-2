import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Truck, Package, CheckCircle } from 'lucide-react';

interface DeliveryConfirmModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  saleId: string;
}

const DeliveryConfirmModal = ({ open, onOpenChange, onConfirm, saleId }: DeliveryConfirmModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center space-x-2">
            <Truck className="h-6 w-6 text-blue-600" />
            <DialogTitle>Confirmar Entrega</DialogTitle>
          </div>
        </DialogHeader>
        
        <div className="py-4">
          <div className="flex items-center space-x-3 mb-4">
            <Package className="h-5 w-5 text-gray-500" />
            <span className="text-sm text-gray-600">Venda #{saleId}</span>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <p className="text-sm text-green-800">
                Confirme que a entrega foi realizada com sucesso.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
          >
            Cancelar
          </Button>
          <Button 
            onClick={onConfirm}
            className="bg-green-600 hover:bg-green-700"
          >
            Confirmar Entrega
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeliveryConfirmModal;