import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Printer, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

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
  const currentDate = new Date().toLocaleDateString('pt-BR');

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Por favor, permita pop-ups para imprimir as etiquetas.');
      return;
    }

    // Gerar etiquetas para cada volume
    const labelsHTML = Array.from({ length: totalVolumes }, (_, index) => {
      const volumeNumber = index + 1;
      return `
        <div class="label">
          <div class="label-inner">
            <!-- Header com logo -->
            <div class="header">
              <span class="company-left">IRMÃOS</span>
              <div class="logo">
                <svg width="20" height="24" viewBox="0 0 24 28" fill="none" xmlns="http://www.w3.org/2000/svg">
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
              padding: 3mm;
              page-break-after: always;
              background: white;
            }
            
            .label:last-child {
              page-break-after: avoid;
            }
            
            .label-inner {
              width: 100%;
              height: 100%;
              border: 1px solid #ccc;
              padding: 2mm 3mm;
              display: flex;
              flex-direction: column;
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
              font-size: 10pt;
              font-weight: 900;
              letter-spacing: 0.5px;
            }
            
            .company-right {
              font-size: 10pt;
              font-weight: 900;
              letter-spacing: 0.5px;
            }
            
            .textil {
              font-weight: 400;
              font-size: 9pt;
            }
            
            .logo {
              display: flex;
              align-items: center;
              justify-content: center;
            }
            
            .field-row {
              display: flex;
              align-items: stretch;
              margin-bottom: 1.5mm;
            }
            
            .field-label {
              font-size: 8pt;
              font-weight: 900;
              min-width: 20mm;
              text-transform: uppercase;
              display: flex;
              align-items: center;
            }
            
            .field-box {
              border: 1.5px solid #000;
              flex: 1;
              min-height: 7mm;
              display: flex;
              align-items: center;
              padding: 1mm 2mm;
              font-size: 8pt;
              font-weight: bold;
              text-transform: uppercase;
              overflow: hidden;
            }
            
            .client-box {
              min-height: 9mm;
              max-height: 9mm;
              font-size: 9pt;
              line-height: 1.2;
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
              overflow: hidden;
              text-overflow: ellipsis;
              word-break: break-word;
            }
            
            .nf-box {
              min-height: 6mm;
              max-height: 6mm;
            }
            
            .bottom-row {
              display: flex;
              gap: 2mm;
              margin-top: auto;
            }
            
            .volume-group {
              display: flex;
              align-items: center;
            }
            
            .volume-group .field-label {
              min-width: 16mm;
            }
            
            .volume-box {
              width: 14mm;
              min-height: 7mm;
              max-height: 7mm;
              flex: none;
              justify-content: center;
              font-size: 9pt;
            }
            
            .date-group {
              display: flex;
              align-items: center;
              flex: 1;
            }
            
            .date-group .field-label {
              min-width: 11mm;
            }
            
            .date-box {
              flex: 1;
              min-height: 7mm;
              max-height: 7mm;
              justify-content: center;
              font-size: 8pt;
              letter-spacing: 0.5px;
            }
            
            @media print {
              body {
                -webkit-print-color-adjust: exact;
                print-color-adjust: exact;
              }
              
              .label-inner {
                border: none;
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
    }, 300);
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
