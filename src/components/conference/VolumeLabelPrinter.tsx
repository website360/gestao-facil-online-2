import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Printer, CheckCircle, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { printVolumeLabelsDirect, downloadVolumeLabelsPDF } from './pdfLabelGenerator';

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
  const [printing, setPrinting] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const handlePrint = () => {
    if (printing || totalVolumes <= 0) return;

    setPrinting(true);
    try {
      printVolumeLabelsDirect({ clientName, totalVolumes, invoiceNumber });
      toast.success('PDF baixado! Abra o arquivo para imprimir automaticamente.');
      onPrint();
    } catch {
      toast.error('Erro ao gerar PDF para impressão.');
    } finally {
      setPrinting(false);
    }
  };

  const handleDownloadPDF = () => {
    setDownloading(true);
    try {
      downloadVolumeLabelsPDF({ clientName, totalVolumes, invoiceNumber });
      toast.success('PDF baixado! Abra e imprima na impressora térmica.');
      onPrint();
    } catch {
      toast.error('Erro ao gerar PDF.');
    } finally {
      setDownloading(false);
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
      <CardContent className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <p className="text-green-800 font-medium mb-1">
            Volumes registrados: {totalVolumes}
          </p>
          <p className="text-green-600 text-sm">
            A venda foi enviada para Nota Fiscal.
          </p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={handlePrint}
            disabled={printing || totalVolumes <= 0}
            className="w-full bg-green-600 hover:bg-green-700"
            size="lg"
          >
            {printing ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Printer className="w-5 h-5 mr-2" />
            )}
            {printing ? 'Gerando...' : `Baixar ${totalVolumes} Etiqueta${totalVolumes > 1 ? 's' : ''} (Auto-Impressão)`}
          </Button>

          <Button
            onClick={handleDownloadPDF}
            disabled={downloading}
            variant="outline"
            className="w-full"
            size="lg"
          >
            {downloading ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Download className="w-5 h-5 mr-2" />
            )}
            {downloading ? 'Gerando...' : 'Baixar PDF (alternativa)'}
          </Button>
        </div>

        <Button
          variant="outline"
          onClick={onClose}
          className="w-full"
          size="lg"
        >
          Fechar sem Imprimir
        </Button>
      </CardContent>
    </Card>
  );
};

export default VolumeLabelPrinter;
