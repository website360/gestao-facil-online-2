import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Printer, CheckCircle, Download, Info } from 'lucide-react';
import { toast } from 'sonner';
import { downloadVolumeLabelsPDF } from './pdfLabelGenerator';

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
  const handleDownloadPDF = () => {
    try {
      downloadVolumeLabelsPDF({ clientName, totalVolumes, invoiceNumber });
      toast.success('PDF baixado! Abra o arquivo e imprima pelo Adobe Reader.');
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

        <div className="flex flex-col justify-center gap-3 pt-2">
          <Button
            onClick={handleDownloadPDF}
            className="bg-blue-600 hover:bg-blue-700"
            size="lg"
          >
            <Download className="w-5 h-5 mr-2" />
            Baixar Etiquetas PDF ({totalVolumes} etiqueta{totalVolumes > 1 ? 's' : ''})
          </Button>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
            <p className="font-bold flex items-center gap-1 mb-1">
              <Info className="w-3.5 h-3.5" />
              Como imprimir:
            </p>
            <ol className="list-decimal list-inside space-y-0.5 ml-1">
              <li>Abra o arquivo PDF baixado com o <strong>Adobe Reader</strong></li>
              <li>Vá em <strong>Arquivo → Imprimir</strong></li>
              <li>Selecione a impressora <strong>Datamax E-4204B</strong></li>
              <li>Em "Dimensionamento da página", selecione <strong>"Tamanho real"</strong></li>
              <li>Clique em <strong>Imprimir</strong></li>
            </ol>
          </div>

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
