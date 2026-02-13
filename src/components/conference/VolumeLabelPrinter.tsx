import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Printer, CheckCircle, Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { generateVolumeLabelsPDF, downloadVolumeLabelsPDF } from './pdfLabelGenerator';

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

  const handlePrint = () => {
    setPrinting(true);
    try {
      const doc = generateVolumeLabelsPDF({ clientName, totalVolumes, invoiceNumber });
      const pdfDataUri = doc.output('bloburl') as unknown as string;
      
      // Criar iframe oculto para imprimir sem popup blocker
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.top = '-10000px';
      iframe.style.left = '-10000px';
      iframe.style.width = '1px';
      iframe.style.height = '1px';
      iframe.src = pdfDataUri;
      
      iframe.onload = () => {
        setTimeout(() => {
          try {
            iframe.contentWindow?.print();
          } catch {
            // Fallback: abrir em nova aba
            window.open(pdfDataUri, '_blank');
          }
          setTimeout(() => {
            document.body.removeChild(iframe);
          }, 5000);
        }, 500);
      };
      
      document.body.appendChild(iframe);
      toast.success(`${totalVolumes} etiqueta${totalVolumes > 1 ? 's' : ''} gerada${totalVolumes > 1 ? 's' : ''}!`);
      onPrint();
    } catch {
      toast.error('Erro ao gerar etiquetas.');
    } finally {
      setPrinting(false);
    }
  };

  const handleDownloadPDF = () => {
    try {
      downloadVolumeLabelsPDF({ clientName, totalVolumes, invoiceNumber });
      toast.success('PDF baixado!');
      onPrint();
    } catch {
      toast.error('Erro ao gerar PDF.');
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
            disabled={printing}
            className="w-full bg-blue-600 hover:bg-blue-700"
            size="lg"
          >
            {printing ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Printer className="w-5 h-5 mr-2" />
            )}
            {printing ? 'Gerando...' : `Imprimir ${totalVolumes} Etiqueta${totalVolumes > 1 ? 's' : ''}`}
          </Button>

          <Button
            variant="outline"
            onClick={handleDownloadPDF}
            className="w-full"
            size="sm"
          >
            <Download className="w-4 h-4 mr-2" />
            Baixar PDF
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
