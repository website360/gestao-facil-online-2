import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Printer, CheckCircle, Download, Loader2, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { printVolumeLabelsDirect, downloadVolumeLabelsPDF, downloadCalibrationPDF } from './pdfLabelGenerator';

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
  const [showCalibration, setShowCalibration] = useState(false);

  const handlePrint = async () => {
    if (printing || totalVolumes <= 0) return;

    setPrinting(true);
    try {
      const result = await printVolumeLabelsDirect({ clientName, totalVolumes, invoiceNumber });

      if (result.success) {
        toast.success(result.message || 'Etiquetas enviadas via PDF para a impressora.');
        onPrint();
      } else {
        toast.error(result.message || 'Não foi possível imprimir via PDF. Use "Baixar PDF" abaixo.');
      }
    } catch {
      toast.error('Erro ao enviar impressão para a impressora.');
    } finally {
      setPrinting(false);
    }
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      await downloadVolumeLabelsPDF({ clientName, totalVolumes, invoiceNumber });
      toast.success('PDF baixado! Abra e imprima na impressora térmica.');
      onPrint();
    } catch {
      toast.error('Erro ao gerar PDF.');
    } finally {
      setDownloading(false);
    }
  };

  const handleCalibration = async () => {
    try {
      await downloadCalibrationPDF({ clientName, totalVolumes, invoiceNumber });
      toast.success('PDF de calibração baixado. Imprima e verifique se o retângulo aparece inteiro.');
    } catch {
      toast.error('Erro ao gerar PDF de calibração.');
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
            {printing ? 'Enviando...' : `Imprimir ${totalVolumes} Etiqueta${totalVolumes > 1 ? 's' : ''}`}
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

        {/* Calibration section */}
        <div className="border-t pt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCalibration(!showCalibration)}
            className="w-full text-muted-foreground text-xs"
          >
            <Settings2 className="w-3.5 h-3.5 mr-1.5" />
            {showCalibration ? 'Ocultar calibração' : 'Calibração da impressora'}
          </Button>

          {showCalibration && (
            <div className="mt-2 space-y-2 bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground">
              <p>Etiqueta: 100×60mm | Área útil: ~83×48mm (escala 92%)</p>
              <p>Se o conteúdo estiver cortado, imprima a página de calibração abaixo e ajuste a impressora até o retângulo aparecer 100% visível.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCalibration}
                className="w-full text-xs"
              >
                <Download className="w-3.5 h-3.5 mr-1.5" />
                Baixar PDF de Calibração (100×60)
              </Button>
            </div>
          )}
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
