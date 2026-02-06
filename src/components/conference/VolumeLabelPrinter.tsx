import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Printer, CheckCircle } from 'lucide-react';

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
          <!-- Header com logo -->
          <div class="header">
            <span class="company-left">IRMÃOS</span>
            <div class="logo">
              <svg width="24" height="28" viewBox="0 0 24 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 0L24 8V20L12 28L0 20V8L12 0Z" fill="#000" opacity="0.8"/>
                <circle cx="12" cy="10" r="3" fill="#fff"/>
                <ellipse cx="12" cy="18" rx="6" ry="4" fill="#fff" opacity="0.5"/>
              </svg>
            </div>
            <span class="company-right">MANTOVANI<span class="textil">TÊXTIL</span></span>
          </div>
          
          <!-- Cliente -->
          <div class="field-row">
            <span class="field-label">CLIENTE</span>
            <div class="field-box client-box">${clientName}</div>
          </div>
          
          <!-- Nota Fiscal -->
          <div class="field-row">
            <span class="field-label">NOTA FISCAL</span>
            <div class="field-box nf-box">${invoiceNumber || ''}</div>
          </div>
          
          <!-- Volume e Data -->
          <div class="field-row bottom-row">
            <div class="volume-group">
              <span class="field-label">VOLUME</span>
              <div class="field-box volume-box">${volumeNumber}/${totalVolumes}</div>
            </div>
            <div class="date-group">
              <span class="field-label">DATA</span>
              <div class="field-box date-box">${currentDate}</div>
            </div>
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
              font-family: 'Arial Black', 'Arial', sans-serif;
              background: white;
            }
            
            .label {
              width: 100mm;
              height: 60mm;
              padding: 3mm 4mm;
              page-break-after: always;
              display: flex;
              flex-direction: column;
              background: white;
            }
            
            .label:last-child {
              page-break-after: avoid;
            }
            
            .header {
              display: flex;
              align-items: center;
              justify-content: center;
              gap: 2mm;
              margin-bottom: 2mm;
              padding-bottom: 1mm;
            }
            
            .company-left {
              font-size: 11pt;
              font-weight: 900;
              letter-spacing: 0.5px;
            }
            
            .company-right {
              font-size: 11pt;
              font-weight: 900;
              letter-spacing: 0.5px;
            }
            
            .textil {
              font-weight: 400;
              font-size: 10pt;
            }
            
            .logo {
              display: flex;
              align-items: center;
              justify-content: center;
            }
            
            .field-row {
              display: flex;
              align-items: center;
              margin-bottom: 1.5mm;
            }
            
            .field-label {
              font-size: 9pt;
              font-weight: 900;
              min-width: 22mm;
              text-transform: uppercase;
            }
            
            .field-box {
              border: 1.5px solid #000;
              flex: 1;
              height: 8mm;
              display: flex;
              align-items: center;
              padding: 0 2mm;
              font-size: 9pt;
              font-weight: bold;
              text-transform: uppercase;
            }
            
            .client-box {
              height: 10mm;
              font-size: 10pt;
            }
            
            .nf-box {
              height: 7mm;
            }
            
            .bottom-row {
              display: flex;
              gap: 3mm;
              margin-top: auto;
            }
            
            .volume-group {
              display: flex;
              align-items: center;
            }
            
            .volume-group .field-label {
              min-width: 18mm;
            }
            
            .volume-box {
              width: 16mm;
              height: 8mm;
              flex: none;
              justify-content: center;
              font-size: 10pt;
            }
            
            .date-group {
              display: flex;
              align-items: center;
              flex: 1;
            }
            
            .date-group .field-label {
              min-width: 12mm;
            }
            
            .date-box {
              flex: 1;
              height: 8mm;
              justify-content: center;
              font-size: 9pt;
              letter-spacing: 1px;
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
            className="flex flex-wrap gap-3 justify-center max-h-80 overflow-y-auto"
          >
            {Array.from({ length: Math.min(totalVolumes, 4) }, (_, index) => {
              const volumeNumber = index + 1;
              return (
                <div 
                  key={volumeNumber}
                  className="w-[220px] h-[132px] bg-white border border-gray-300 rounded p-2 flex flex-col text-[10px] shadow-sm"
                >
                  {/* Header */}
                  <div className="flex items-center justify-center gap-1 mb-1 pb-1 border-b border-gray-200">
                    <span className="font-black text-[9px]">IRMÃOS</span>
                    <div className="w-5 h-5 bg-gray-800 rounded-sm flex items-center justify-center">
                      <span className="text-white text-[6px]">IM</span>
                    </div>
                    <span className="font-black text-[9px]">MANTOVANI<span className="font-normal text-[8px]">TÊXTIL</span></span>
                  </div>
                  
                  {/* Cliente */}
                  <div className="flex items-center mb-1">
                    <span className="font-black min-w-[50px] text-[8px]">CLIENTE</span>
                    <div className="flex-1 border border-gray-800 h-5 px-1 flex items-center">
                      <span className="font-bold uppercase text-[8px] truncate">{clientName}</span>
                    </div>
                  </div>
                  
                  {/* Nota Fiscal */}
                  <div className="flex items-center mb-1">
                    <span className="font-black min-w-[50px] text-[8px]">NOTA FISCAL</span>
                    <div className="flex-1 border border-gray-800 h-4 px-1 flex items-center">
                      <span className="font-bold text-[8px]">{invoiceNumber || ''}</span>
                    </div>
                  </div>
                  
                  {/* Volume e Data */}
                  <div className="flex items-center gap-2 mt-auto">
                    <div className="flex items-center">
                      <span className="font-black min-w-[40px] text-[8px]">VOLUME</span>
                      <div className="border border-gray-800 w-9 h-4 flex items-center justify-center">
                        <span className="font-bold text-[9px]">{volumeNumber}/{totalVolumes}</span>
                      </div>
                    </div>
                    <div className="flex items-center flex-1">
                      <span className="font-black min-w-[25px] text-[8px]">DATA</span>
                      <div className="flex-1 border border-gray-800 h-4 flex items-center justify-center">
                        <span className="font-bold text-[8px]">{currentDate}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {totalVolumes > 4 && (
              <div className="w-[220px] h-[132px] border-2 border-dashed border-gray-300 rounded flex items-center justify-center bg-gray-100">
                <span className="text-gray-500 text-sm">
                  +{totalVolumes - 4} etiquetas
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
