/**
 * Impressão direta de etiquetas via window.print()
 * Versão simplificada para máxima compatibilidade com impressoras térmicas
 */

interface LabelData {
  clientName: string;
  totalVolumes: number;
  invoiceNumber?: string;
}

function generateLabelHTML(
  clientName: string,
  invoiceNumber: string,
  volumeNumber: number,
  totalVolumes: number,
  date: string
): string {
  const clientText = clientName.toUpperCase().substring(0, 35);
  const volText = `${volumeNumber}/${totalVolumes}`;
  const nf = invoiceNumber || 'S/N';

  return `
<div style="page-break-after: always; font-family: Arial, sans-serif; width: 100mm; height: 60mm; padding: 3mm; box-sizing: border-box;">
  <div style="text-align: center; font-size: 14pt; font-weight: bold; border-bottom: 2px solid black; padding-bottom: 2mm; margin-bottom: 3mm;">
    IRMAOS MANTOVANI TEXTIL
  </div>
  
  <div style="margin-bottom: 3mm;">
    <span style="font-weight: bold;">CLIENTE:</span> ${clientText}
  </div>
  
  <div style="margin-bottom: 3mm;">
    <span style="font-weight: bold;">NF:</span> ${nf}
  </div>
  
  <div style="display: flex; justify-content: space-between;">
    <div><span style="font-weight: bold;">VOLUME:</span> ${volText}</div>
    <div><span style="font-weight: bold;">DATA:</span> ${date}</div>
  </div>
</div>
  `;
}

function generatePrintStyles(): string {
  return `
    <style>
      @page {
        size: 100mm 60mm;
        margin: 0;
      }
      @media print {
        html, body {
          width: 100mm;
          height: 60mm;
          margin: 0;
          padding: 0;
        }
      }
      body {
        margin: 0;
        padding: 0;
        font-family: Arial, sans-serif;
      }
    </style>
  `;
}

export function printLabelsDirectly(data: LabelData): boolean {
  const { clientName, totalVolumes, invoiceNumber = '' } = data;
  const currentDate = new Date().toLocaleDateString('pt-BR');

  // Gera HTML de todas as etiquetas
  let labelsHTML = '';
  for (let i = 0; i < totalVolumes; i++) {
    labelsHTML += generateLabelHTML(
      clientName,
      invoiceNumber,
      i + 1,
      totalVolumes,
      currentDate
    );
  }

  const fullHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Etiquetas de Volume</title>
      ${generatePrintStyles()}
    </head>
    <body>
      ${labelsHTML}
    </body>
    </html>
  `;

  // Abre janela de impressão
  const printWindow = window.open('', '_blank', 'width=400,height=300');
  
  if (!printWindow) {
    return false;
  }

  printWindow.document.write(fullHTML);
  printWindow.document.close();

  // Aguarda carregar e imprime
  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
    // Fecha após imprimir (com delay para garantir que o diálogo abriu)
    setTimeout(() => {
      printWindow.close();
    }, 1000);
  };

  return true;
}
