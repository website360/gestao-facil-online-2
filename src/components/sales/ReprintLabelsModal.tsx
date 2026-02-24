import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Printer } from 'lucide-react';
import { formatSaleId } from '@/lib/budgetFormatter';
import VolumeLabelPrinter from '@/components/conference/VolumeLabelPrinter';
import { toast } from 'sonner';

interface Sale {
  id: string;
  created_at: string;
  total_volumes?: number;
  invoice_number?: string;
  clients?: { name: string } | null;
}

interface ReprintLabelsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sale: Sale | null | undefined;
}

const ReprintLabelsModal: React.FC<ReprintLabelsModalProps> = ({
  isOpen,
  onClose,
  sale
}) => {
  if (!sale) return null;

  const handlePrint = () => {
    toast.success('Etiquetas enviadas para impressão!');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="w-5 h-5" />
            Reimprimir Etiquetas de Volume
            <Badge variant="outline" className="ml-2 font-mono">
              {formatSaleId(sale.id, sale.created_at)}
            </Badge>
          </DialogTitle>
          <DialogDescription>
            Imprima etiquetas de volume para o pacote selecionado
          </DialogDescription>
        </DialogHeader>

        <VolumeLabelPrinter
          clientName={sale.clients?.name || 'Cliente'}
          totalVolumes={sale.total_volumes || 0}
          invoiceNumber={sale.invoice_number}
          onPrint={handlePrint}
          onClose={onClose}
        />
      </DialogContent>
    </Dialog>
  );
};

export default ReprintLabelsModal;
