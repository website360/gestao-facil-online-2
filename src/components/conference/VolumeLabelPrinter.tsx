import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Printer, CheckCircle, Download, Loader2, Info, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { getVolumeLabelsPDFBase64, downloadVolumeLabelsPDF } from './pdfLabelGenerator';
import { printPdfDirect } from './qzTrayPrinter';

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
  const [lastError, setLastError] = useState<string | null>(null);

  const handleDirectPrint = async () => {
    if (printing) return; // prevent double-click

    if (totalVolumes <= 0) {
      const msg = 'Nenhum volume registrado para imprimir etiqueta.';
      setLastError(msg);
      toast.error(msg);
      return;
    }

    setPrinting(true);
    setLastError(null);

    try {
      // 1. Generate PDF as base64
      const pdfBase64 = getVolumeLabelsPDFBase64({
        clientName,
        totalVolumes,
        invoiceNumber,
      });

      // 2. Send to printer via QZ Tray
      const result = await printPdfDirect(pdfBase64);

      if (result.success) {
        toast.success(result.message);
        onPrint();
      } else {
        setLastError(result.message);
        toast.error(result.message);
      }
    } catch (error) {
      const msg = `Erro inesperado: ${(error as Error).message}`;
      setLastError(msg);
      toast.error(msg);
    } finally {
      setPrinting(false);
    }
  };

  const handleDownloadPDF = () => {
    setDownloading(true);
    try {
      downloadVolumeLabelsPDF({ clientName, totalVolumes, invoiceNumber });
      toast.success('PDF baixado! Abra e imprima na Datamax.');
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
            onClick={handleDirectPrint}
            disabled={printing || totalVolumes <= 0}
            className="w-full bg-green-600 hover:bg-green-700"
            size="lg"
          >
            {printing ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Printer className="w-5 h-5 mr-2" />
            )}
            {printing ? 'Enviando para impressora...' : `Imprimir ${totalVolumes} Etiqueta${totalVolumes > 1 ? 's' : ''} (Direto)`}
          </Button>

          {lastError && (
            <div className="flex items-start gap-2 text-xs text-red-700 bg-red-50 p-3 rounded border border-red-200">
              <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium mb-1">Impressão direta falhou</p>
                <p>{lastError}</p>
                <p className="mt-1">Use o botão "Baixar PDF" abaixo como alternativa.</p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 p-3 rounded border border-amber-200">
            <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <p className="font-medium mb-1">Requisito: QZ Tray instalado</p>
              <p>Para impressão direta sem diálogo, o <strong>QZ Tray</strong> deve estar rodando.</p>
              <p>Download: <a href="https://qz.io/download" target="_blank" rel="noopener noreferrer" className="underline">qz.io/download</a></p>
            </div>
          </div>

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
