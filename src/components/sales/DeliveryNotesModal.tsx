import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { PackageCheck } from 'lucide-react';
import { formatSaleId } from '@/lib/budgetFormatter';

interface DeliveryNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: any | null;
  deliveryNotes: string;
}

const DeliveryNotesModal: React.FC<DeliveryNotesModalProps> = ({
  isOpen,
  onClose,
  sale,
  deliveryNotes
}) => {
  if (!sale) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PackageCheck className="w-5 h-5 text-green-600" />
            Detalhes da Entrega
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="text-sm text-gray-600">
              <strong>Venda:</strong> {formatSaleId(sale.id, sale.created_at)}
            </div>
            <div className="text-sm text-gray-600 mt-1">
              <strong>Cliente:</strong> {sale.clients?.name || 'N/A'}
            </div>
            <div className="text-sm text-gray-600 mt-1 flex items-center gap-2">
              <strong>Status:</strong> 
              <Badge className="bg-green-100 text-green-800">
                Entrega Realizada
              </Badge>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Observações da Entrega:</h4>
            <p className="text-sm text-blue-800 whitespace-pre-wrap">
              {deliveryNotes || 'Nenhuma observação registrada.'}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DeliveryNotesModal;