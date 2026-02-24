import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Printer, CheckCircle, Download, Loader2, Info } from 'lucide-react';
import { toast } from 'sonner';
import { downloadVolumeLabelsPDF } from './pdfLabelGenerator';
import { printLabelsDirectly } from './directPrinter';

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
  const [printingDirect, setPrintingDirect] = useState(false);

  const handleDirectPrint = () => {
    setPrintingDirect(true);
    try {
      const success = printLabelsDirectly({ clientName, totalVolumes, invoiceNumber });
      if (success) {
        toast.success('Selecione a impressora Datamax e clique em Imprimir!');
        onPrint();
      } else {
        toast.error('Popup bloqueado. Permita popups para imprimir.');
      }
    } catch (error) {
      console.error('Erro ao imprimir:', error);
      toast.error('Erro ao gerar etiquetas.');
    } finally {
      setPrintingDirect(false);
    }
  };

  const handleDownloadPDF = () => {
    setPrinting(true);
    try {
      downloadVolumeLabelsPDF({ clientName, totalVolumes, invoiceNumber });
      toast.success('PDF baixado! Abra e imprima na Datamax.');
      onPrint();
    } catch {
      toast.error('Erro ao gerar PDF.');
    } finally {
      setPrinting(false);
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
            onClick={handleDirectPrint}
            disabled={printingDirect}
            className="w-full bg-green-600 hover:bg-green-700"
            size="lg"
          >
            {printingDirect ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Printer className="w-5 h-5 mr-2" />
            )}
            {printingDirect ? 'Abrindo...' : `Imprimir ${totalVolumes} Etiqueta${totalVolumes > 1 ? 's' : ''}`}
          </Button>

          <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 p-3 rounded border border-amber-200">
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium mb-1">Para impressão mais escura na Datamax:</p>
              <ol className="list-decimal list-inside space-y-0.5">
                <li>Selecione a impressora Datamax</li>
                <li>Clique em "Preferências" ou "Propriedades"</li>
                <li>Ajuste <strong>Darkness/Heat</strong> para o máximo</li>
                <li>Ajuste <strong>Speed</strong> para o mínimo</li>
              </ol>
            </div>
          </div>

          <Button
            onClick={handleDownloadPDF}
            disabled={printing}
            variant="outline"
            className="w-full"
            size="lg"
          >
            {printing ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Download className="w-5 h-5 mr-2" />
            )}
            {printing ? 'Gerando...' : 'Baixar PDF'}
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
