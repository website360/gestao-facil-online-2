import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Printer, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { printVolumeLabelsPDF } from './pdfLabelGenerator';

interface VolumeLabelPrinterProps {
  clientName: string;
  totalVolumes: number;
  invoiceNumber?: string;
  onPrint: () => void;
  onClose: () => void;
}

const VolumeLabelPrinter: React.FC<VolumeLabelPrinterProps> = ({
  clientName,
  totalVolumes,
  invoiceNumber = '',
  onPrint,
  onClose
}) => {
  const handlePrint = () => {
    try {
      printVolumeLabelsPDF({ clientName, totalVolumes, invoiceNumber });
      toast.success('PDF gerado! Selecione a impressora Datamax na janela de impressão.');
      onPrint();
    } catch (error) {
      toast.error('Erro ao gerar etiquetas.');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2 text-green-700">
          <CheckCircle className="w-5 h-5" />
          Conferência Finalizada com Sucesso!
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <p className="text-green-800 font-medium mb-2">
            Volumes registrados: {totalVolumes}
          </p>
          <p className="text-green-600 text-sm">
            A venda foi enviada para Nota Fiscal.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
          <Button
            onClick={handlePrint}
            className="bg-blue-600 hover:bg-blue-700"
            size="lg"
          >
            <Printer className="w-5 h-5 mr-2" />
            Imprimir {totalVolumes} Etiqueta{totalVolumes > 1 ? 's' : ''}
          </Button>
          <Button
            variant="outline"
            onClick={onClose}
            size="lg"
          >
            Fechar sem Imprimir
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default VolumeLabelPrinter;
