import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Printer, CheckCircle, Download, Loader2, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { generateVolumeLabelsPDF, downloadVolumeLabelsPDF } from './pdfLabelGenerator';
import { connectQZTray, findDatamaxPrinter, printRawDPL, isQZTrayAvailable } from './qzTrayPrinter';

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
  const [qzAvailable, setQzAvailable] = useState(false);
  const [datamaxPrinter, setDatamaxPrinter] = useState<string | null>(null);

  useEffect(() => {
    const checkQZTray = async () => {
      try {
        const available = await isQZTrayAvailable();
        setQzAvailable(available);
        if (available) {
          const printer = await findDatamaxPrinter();
          setDatamaxPrinter(printer);
        }
      } catch {
        setQzAvailable(false);
      }
    };
    checkQZTray();
  }, []);

  const handleDirectPrint = async () => {
    if (!datamaxPrinter) {
      toast.error('Impressora Datamax não encontrada. Verifique se está conectada.');
      return;
    }
    
    setPrintingDirect(true);
    try {
      await connectQZTray();
      await printRawDPL(datamaxPrinter, clientName, totalVolumes, invoiceNumber);
      toast.success(`${totalVolumes} etiqueta${totalVolumes > 1 ? 's' : ''} enviada${totalVolumes > 1 ? 's' : ''} para ${datamaxPrinter}!`);
      onPrint();
    } catch (error) {
      console.error('Erro na impressão direta:', error);
      toast.error('Erro ao imprimir. Tente baixar o PDF.');
    } finally {
      setPrintingDirect(false);
    }
  };

  const handlePrint = () => {
    setPrinting(true);
    try {
      downloadVolumeLabelsPDF({ clientName, totalVolumes, invoiceNumber });
      toast.success(`PDF baixado! Abra o arquivo e imprima na impressora térmica.`);
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
          {qzAvailable && datamaxPrinter && (
            <Button
              onClick={handleDirectPrint}
              disabled={printingDirect}
              className="w-full bg-green-600 hover:bg-green-700"
              size="lg"
            >
              {printingDirect ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Zap className="w-5 h-5 mr-2" />
              )}
              {printingDirect ? 'Imprimindo...' : `Imprimir Direto na Datamax (${totalVolumes} etiqueta${totalVolumes > 1 ? 's' : ''})`}
            </Button>
          )}

          {qzAvailable && datamaxPrinter && (
            <p className="text-xs text-center text-green-600">
              Impressora detectada: {datamaxPrinter}
            </p>
          )}

          {!qzAvailable && (
            <div className="text-xs text-center text-amber-600 bg-amber-50 p-2 rounded">
              QZ Tray não detectado. Instale para impressão direta mais escura.
            </div>
          )}

          <Button
            onClick={handlePrint}
            disabled={printing}
            variant={qzAvailable && datamaxPrinter ? "outline" : "default"}
            className={qzAvailable && datamaxPrinter ? "w-full" : "w-full bg-blue-600 hover:bg-blue-700"}
            size="lg"
          >
            {printing ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Download className="w-5 h-5 mr-2" />
            )}
            {printing ? 'Gerando...' : `Baixar ${totalVolumes} Etiqueta${totalVolumes > 1 ? 's' : ''} (PDF)`}
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
