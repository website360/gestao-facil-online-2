import jsPDF from 'jspdf';

/**
 * Generates a PDF with volume labels at exact 100mm x 60mm per page.
 * Uses vector drawing for sharp printing on thermal printers.
 * Optimized for maximum darkness on thermal printers with triple-strike,
 * inverted labels, and thick strokes.
 */

interface LabelData {
  clientName: string;
  totalVolumes: number;
  invoiceNumber?: string;
}

// Triple-strike: draw text 3 times with offsets for maximum thermal density
function boldText(doc: jsPDF, text: string, x: number, y: number, opts?: any) {
  const offsets = [
    [0, 0],
    [0.15, 0],
    [0.3, 0.1],
  ];
  for (const [dx, dy] of offsets) {
    doc.text(text, x + dx, y + dy, opts);
  }
}

// Draw an inverted label (black bg, white text) for field names
function invertedLabel(doc: jsPDF, text: string, x: number, y: number, w: number, h: number) {
  doc.setFillColor(0, 0, 0);
  doc.rect(x, y, w, h, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  boldText(doc, text, x + 1, y + h - 1.5);
  // Reset to black
  doc.setTextColor(0, 0, 0);
}

function drawLabel(
  doc: jsPDF,
  clientName: string,
  invoiceNumber: string,
  volumeNumber: number,
  totalVolumes: number,
  date: string
) {
  const W = 100;
  const H = 60;
  const BORDER = 1.5;
  const MARGIN_X = 3;

  // Force pure black
  doc.setTextColor(0, 0, 0);
  doc.setDrawColor(0, 0, 0);
  doc.setFillColor(0, 0, 0);

  // Outer border - extra thick
  doc.setLineWidth(2.0);
  doc.rect(BORDER, BORDER, W - BORDER * 2, H - BORDER * 2);

  // === HEADER ===
  const headerY = 7;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);

  const centerX = W / 2;

  boldText(doc, 'IRMAOS', centerX - 24, headerY, { align: 'right' });
  boldText(doc, 'MANTOVANI', centerX + 2, headerY, { align: 'left' });

  doc.setFontSize(11);
  boldText(doc, 'TEXTIL', centerX + 2 + doc.getTextWidth('MANTOVANI '), headerY);

  // Separator line
  const sepY = 10;
  doc.setLineWidth(1.2);
  doc.line(MARGIN_X + 1, sepY, W - MARGIN_X - 1, sepY);

  // === CLIENTE field ===
  const clienteLabelY = 15;
  const clienteLabelW = 20;
  const clienteLabelH = 6;
  const clienteBoxX = clienteLabelW + MARGIN_X + 1;
  const clienteBoxW = W - MARGIN_X - clienteBoxX - 1;
  const clienteBoxH = 11;

  // Inverted "CLIENTE" label
  doc.setFontSize(11);
  invertedLabel(doc, 'CLIENTE', MARGIN_X + 1, clienteLabelY, clienteLabelW, clienteLabelH);

  // Client data box
  doc.setLineWidth(1.4);
  doc.setDrawColor(0, 0, 0);
  doc.rect(clienteBoxX, clienteLabelY - 1, clienteBoxW, clienteBoxH);

  // Client name
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  const maxWidth = clienteBoxW - 3;
  const clientText = clientName.toUpperCase();

  if (doc.getTextWidth(clientText) > maxWidth) {
    const words = clientText.split(' ');
    let line1 = '';
    let line2 = '';
    let onLine1 = true;

    for (const word of words) {
      const test = line1 + (line1 ? ' ' : '') + word;
      if (onLine1 && doc.getTextWidth(test) <= maxWidth) {
        line1 = test;
      } else {
        onLine1 = false;
        line2 += (line2 ? ' ' : '') + word;
      }
    }

    boldText(doc, line1, clienteBoxX + 1.5, clienteLabelY + 3);
    if (line2) {
      const truncatedLine2 = line2.length > 35 ? line2.substring(0, 35) + '...' : line2;
      boldText(doc, truncatedLine2, clienteBoxX + 1.5, clienteLabelY + 7.5);
    }
  } else {
    boldText(doc, clientText, clienteBoxX + 1.5, clienteLabelY + 5.5);
  }

  // Extra separator
  const sep2Y = clienteLabelY + clienteBoxH + 1;
  doc.setLineWidth(0.6);
  doc.setDrawColor(0, 0, 0);
  doc.line(MARGIN_X + 1, sep2Y, W - MARGIN_X - 1, sep2Y);

  // === NOTA FISCAL field ===
  const nfLabelY = 29;
  const nfLabelW = 24;
  const nfLabelH = 6;
  const nfBoxX = nfLabelW + MARGIN_X + 1;
  const nfBoxW = W - MARGIN_X - nfBoxX - 1;
  const nfBoxH = 9;

  // Inverted "NOTA FISCAL" label
  doc.setFontSize(10);
  invertedLabel(doc, 'NOTA FISCAL', MARGIN_X + 1, nfLabelY, nfLabelW, nfLabelH);

  doc.setLineWidth(1.4);
  doc.setDrawColor(0, 0, 0);
  doc.rect(nfBoxX, nfLabelY - 1, nfBoxW, nfBoxH);

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  boldText(doc, (invoiceNumber || '').toUpperCase(), nfBoxX + 1.5, nfLabelY + 4.5);

  // Extra separator
  const sep3Y = nfLabelY + nfBoxH + 1;
  doc.setLineWidth(0.6);
  doc.setDrawColor(0, 0, 0);
  doc.line(MARGIN_X + 1, sep3Y, W - MARGIN_X - 1, sep3Y);

  // === VOLUME and DATA fields ===
  const bottomY = 42;
  const volLabelW = 18;
  const volLabelH = 6;
  const volBoxX = volLabelW + MARGIN_X + 1;
  const volBoxW = 16;
  const bottomBoxH = 9;

  const dataLabelX = volBoxX + volBoxW + 2;
  const dataLabelW = 12;
  const dataLabelH = 6;
  const dataBoxX = dataLabelX + dataLabelW + 1;
  const dataBoxW = W - MARGIN_X - dataBoxX - 1;

  // Inverted "VOLUME" label
  doc.setFontSize(10);
  invertedLabel(doc, 'VOLUME', MARGIN_X + 1, bottomY, volLabelW, volLabelH);

  doc.setLineWidth(1.4);
  doc.setDrawColor(0, 0, 0);
  doc.rect(volBoxX, bottomY - 1, volBoxW, bottomBoxH);

  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  const volText = `${volumeNumber}/${totalVolumes}`;
  const volTextW = doc.getTextWidth(volText);
  boldText(doc, volText, volBoxX + (volBoxW - volTextW) / 2, bottomY + 4.5);

  // Inverted "DATA" label
  doc.setFontSize(10);
  invertedLabel(doc, 'DATA', dataLabelX, bottomY, dataLabelW, dataLabelH);

  doc.setLineWidth(1.4);
  doc.setDrawColor(0, 0, 0);
  doc.rect(dataBoxX, bottomY - 1, dataBoxW, bottomBoxH);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  const dateTextW = doc.getTextWidth(date);
  boldText(doc, date, dataBoxX + (dataBoxW - dateTextW) / 2, bottomY + 4.5);
}

export function generateVolumeLabelsPDF(data: LabelData): jsPDF {
  const { clientName, totalVolumes, invoiceNumber = '' } = data;
  const currentDate = new Date().toLocaleDateString('pt-BR');

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [100, 60],
  });

  for (let i = 0; i < totalVolumes; i++) {
    if (i > 0) {
      doc.addPage([100, 60], 'landscape');
    }
    drawLabel(doc, clientName, invoiceNumber, i + 1, totalVolumes, currentDate);
  }

  return doc;
}

export function downloadVolumeLabelsPDF(data: LabelData, autoPrint: boolean = false): void {
  const doc = generateVolumeLabelsPDF(data);
  const safeName = data.clientName
    .replace(/[^a-zA-Z0-9]/g, '_')
    .substring(0, 20);
  
  if (autoPrint) {
    // Adiciona script JavaScript no PDF para abrir diálogo de impressão automaticamente
    doc.autoPrint();
  }
  
  doc.save(`etiquetas_${safeName}_${data.totalVolumes}vol.pdf`);
}
