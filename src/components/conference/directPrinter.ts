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
          <div class="inner">
            <div class="row">
              <div class="field-label">VOLUME</div>
              <div class="field-value">${volText}</div>
            </div>
          </div>
        </div>
        <div class="col">
          <div class="inner">
            <div class="row">
              <div class="field-label">DATA</div>
              <div class="field-value">${date}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function generatePrintStyles(): string {
  return `
    <style>
      @page {
        size: 4in 2.4in;
        margin: 0;
      }
      
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
        font-family: Arial, Helvetica, sans-serif;
      }
      
      html, body {
        width: 4in;
        height: 2.4in;
        margin: 0;
        padding: 0;
        background: white;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
        color-adjust: exact !important;
      }
      
      .label {
        width: 4in;
        height: 2.4in;
        padding: 0.08in;
        border: 3px solid #000;
        background: white;
        page-break-after: always;
        page-break-inside: avoid;
        overflow: hidden;
      }
      
      .label:last-child {
        page-break-after: auto;
      }
      
      .header {
        text-align: center;
        font-size: 16pt;
        font-weight: 900;
        padding: 0.05in 0;
        color: #000;
      }
      
      .separator {
        border-bottom: 3px solid #000;
        margin: 0.03in 0;
      }
      
      .row {
        display: table;
        width: 100%;
        margin: 0.05in 0;
        table-layout: fixed;
      }
      
      .field-label {
        display: table-cell;
        background-color: #000 !important;
        color: #fff !important;
        font-weight: 900;
        font-size: 10pt;
        padding: 0.05in 0.08in;
        vertical-align: middle;
        width: 0.9in;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      
      .field-value {
        display: table-cell;
        border: 3px solid #000;
        font-weight: 900;
        font-size: 12pt;
        padding: 0.05in 0.08in;
        vertical-align: middle;
        color: #000;
      }
      
      .field-value.client {
        font-size: 11pt;
        word-break: break-word;
      }
      
      .row-bottom {
        display: table;
        width: 100%;
        margin-top: 0.05in;
        table-layout: fixed;
      }
      
      .col {
        display: table-cell;
        width: 50%;
        padding-right: 0.05in;
      }
      
      .col:last-child {
        padding-right: 0;
        padding-left: 0.05in;
      }
      
      .col .inner {
        display: table;
        width: 100%;
        table-layout: fixed;
      }
      
      .col .field-label {
        width: 0.7in;
      }
      
      .col .field-value {
        text-align: center;
      }
      
      @media print {
        html, body {
          width: 4in !important;
          height: 2.4in !important;
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
