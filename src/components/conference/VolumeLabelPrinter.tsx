import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Printer, CheckCircle } from 'lucide-react';

interface VolumeLabelPrinterProps {
  clientName: string;
  totalVolumes: number;
  onPrint: () => void;
  onClose: () => void;
}

const VolumeLabelPrinter: React.FC<VolumeLabelPrinterProps> = ({
  clientName,
  totalVolumes,
  onPrint,
  onClose
}) => {
  const printRef = useRef<HTMLDivElement>(null);
  const currentDate = new Date().toLocaleDateString('pt-BR');

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Por favor, permita pop-ups para imprimir as etiquetas.');
      return;
    }

    // Gerar etiquetas para cada volume
    const labelsHTML = Array.from({ length: totalVolumes }, (_, index) => {
      const volumeNumber = index + 1;
      return `
        <div class="label">
          <div class="label-content">
            <div class="client-name">${clientName}</div>
            <div class="volume-info">
              <span class="volume-label">Volume</span>
              <span class="volume-number">${volumeNumber}/${totalVolumes}</span>
            </div>
            <div class="date">${currentDate}</div>
          </div>
        </div>
      `;
    }).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Etiquetas de Volume</title>
          <style>
            @page {
              size: 100mm 60mm;
              margin: 0;
            }
            
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: 'Arial', sans-serif;
              background: white;
            }
            
            .label {
              width: 100mm;
              height: 60mm;
              padding: 5mm;
              page-break-after: always;
              display: flex;
              align-items: center;
              justify-content: center;
            }
            
            .label:last-child {
              page-break-after: avoid;
            }
            
            .label-content {
              width: 100%;
              height: 100%;
              border: 2px solid #000;
              border-radius: 4mm;
              padding: 4mm;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              align-items: center;
              text-align: center;
            }
            
            .client-name {
              font-size: 14pt;
              font-weight: bold;
              text-transform: uppercase;
              line-height: 1.2;
              max-height: 20mm;
              overflow: hidden;
              word-wrap: break-word;
            }
            
            .volume-info {
              display: flex;
              flex-direction: column;
              align-items: center;
              gap: 1mm;
            }
            
            .volume-label {
              font-size: 10pt;
              color: #666;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            
            .volume-number {
              font-size: 24pt;
              font-weight: bold;
            }
            
            .date {
              font-size: 10pt;
              color: #333;
            }
            
            @media print {
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          ${labelsHTML}
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    
    // Aguardar um pouco antes de imprimir para garantir que o conteúdo foi carregado
    setTimeout(() => {
      printWindow.print();
      onPrint();
    }, 250);
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

        {/* Preview das etiquetas */}
        <div className="border rounded-lg p-4 bg-gray-50">
          <p className="text-sm text-gray-600 mb-3 text-center">
            Prévia das etiquetas (10cm x 6cm):
          </p>
          <div 
            ref={printRef}
            className="flex flex-wrap gap-3 justify-center max-h-64 overflow-y-auto"
          >
            {Array.from({ length: Math.min(totalVolumes, 6) }, (_, index) => {
              const volumeNumber = index + 1;
              return (
                <div 
                  key={volumeNumber}
                  className="w-[150px] h-[90px] border-2 border-gray-800 rounded-md p-2 bg-white flex flex-col justify-between items-center text-center"
                >
                  <div className="text-[10px] font-bold uppercase leading-tight line-clamp-2">
                    {clientName}
                  </div>
                  <div className="flex flex-col items-center">
                    <span className="text-[8px] text-gray-500 uppercase tracking-wide">Volume</span>
                    <span className="text-lg font-bold">{volumeNumber}/{totalVolumes}</span>
                  </div>
                  <div className="text-[8px] text-gray-600">
                    {currentDate}
                  </div>
                </div>
              );
            })}
            {totalVolumes > 6 && (
              <div className="w-[150px] h-[90px] border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center bg-gray-100">
                <span className="text-gray-500 text-sm">
                  +{totalVolumes - 6} etiquetas
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-3">
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
