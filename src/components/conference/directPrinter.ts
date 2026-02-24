/**
 * Impressão direta de etiquetas via window.print()
 * Usa HTML/CSS formatado para etiquetas térmicas 100mm x 60mm
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
  const clientText = clientName.toUpperCase().substring(0, 40);
  const volText = `${volumeNumber}/${totalVolumes}`;
  const nf = invoiceNumber || 'S/N';

  return `
    <div class="label">
      <div class="header">IRMAOS MANTOVANI TEXTIL</div>
      <div class="separator"></div>
      
      <div class="row">
        <div class="field-label">CLIENTE</div>
        <div class="field-value client">${clientText}</div>
      </div>
      
      <div class="row">
        <div class="field-label">NOTA FISCAL</div>
        <div class="field-value">${nf}</div>
      </div>
      
      <div class="row-bottom">
        <div class="col">
          <div class="field-label">VOLUME</div>
          <div class="field-value">${volText}</div>
        </div>
        <div class="col">
          <div class="field-label">DATA</div>
          <div class="field-value">${date}</div>
        </div>
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
      
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }
      
      body {
        font-family: Arial, Helvetica, sans-serif;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      
      .label {
        width: 100mm;
        height: 60mm;
        padding: 2mm;
        border: 2px solid black;
        page-break-after: always;
        page-break-inside: avoid;
      }
      
      .label:last-child {
        page-break-after: auto;
      }
      
      .header {
        text-align: center;
        font-size: 14pt;
        font-weight: bold;
        padding: 2mm 0;
        letter-spacing: 0.5px;
      }
      
      .separator {
        border-bottom: 2px solid black;
        margin: 1mm 0;
      }
      
      .row {
        display: flex;
        align-items: stretch;
        margin: 2mm 0;
        min-height: 10mm;
      }
      
      .field-label {
        background: black;
        color: white;
        font-weight: bold;
        font-size: 9pt;
        padding: 2mm 3mm;
        display: flex;
        align-items: center;
        min-width: 22mm;
      }
      
      .field-value {
        border: 2px solid black;
        font-weight: bold;
        font-size: 11pt;
        padding: 2mm 3mm;
        flex: 1;
        display: flex;
        align-items: center;
      }
      
      .field-value.client {
        font-size: 10pt;
        word-break: break-word;
      }
      
      .row-bottom {
        display: flex;
        gap: 3mm;
        margin-top: 2mm;
      }
      
      .col {
        flex: 1;
        display: flex;
      }
      
      .col .field-label {
        min-width: 18mm;
      }
      
      .col .field-value {
        text-align: center;
        justify-content: center;
      }
      
      @media print {
        body {
          width: 100mm;
        }
        
        .label {
          border-width: 3px;
        }
        
        .field-label {
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
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
