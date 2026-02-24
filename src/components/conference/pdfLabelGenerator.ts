import jsPDF from 'jspdf';

/**
 * Generates a PDF with volume labels at exact 100mm x 60mm per page.
 * Uses vector drawing for sharp printing on thermal printers.
 * Simple style with thin borders for reliable thermal printing.
 */

interface LabelData {
  clientName: string;
  totalVolumes: number;
  invoiceNumber?: string;
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

  doc.setTextColor(0, 0, 0);
  doc.setDrawColor(0, 0, 0);

  // Outer border - thin
  doc.setLineWidth(0.5);
  doc.rect(BORDER, BORDER, W - BORDER * 2, H - BORDER * 2);

  // === HEADER ===
  const headerY = 7;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);

  const centerX = W / 2;
  doc.text('IRMAOS', centerX - 24, headerY, { align: 'right' });
  doc.text('MANTOVANI', centerX + 2, headerY, { align: 'left' });

  doc.setFontSize(9);
  doc.text('TEXTIL', centerX + 2 + doc.getTextWidth('MANTOVANI '), headerY);

  // Separator line
  const sepY = 10;
  doc.setLineWidth(0.3);
  doc.line(MARGIN_X + 1, sepY, W - MARGIN_X - 1, sepY);

  // === CLIENTE field ===
  const clienteLabelY = 15;
  const clienteLabelW = 20;
  const clienteBoxX = clienteLabelW + MARGIN_X + 1;
  const clienteBoxW = W - MARGIN_X - clienteBoxX - 1;
  const clienteBoxH = 11;

  // "CLIENTE" label - simple bold text
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('CLIENTE', MARGIN_X + 2, clienteLabelY + 4);

  // Client data box - thin border
  doc.setLineWidth(0.3);
  doc.rect(clienteBoxX, clienteLabelY - 1, clienteBoxW, clienteBoxH);

  // Client name
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
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

    doc.text(line1, clienteBoxX + 1.5, clienteLabelY + 3);
    if (line2) {
      const truncatedLine2 = line2.length > 35 ? line2.substring(0, 35) + '...' : line2;
      doc.text(truncatedLine2, clienteBoxX + 1.5, clienteLabelY + 7.5);
    }
  } else {
    doc.text(clientText, clienteBoxX + 1.5, clienteLabelY + 5.5);
  }

  // === NOTA FISCAL field ===
  const nfLabelY = 29;
  const nfLabelW = 24;
  const nfBoxX = nfLabelW + MARGIN_X + 1;
  const nfBoxW = W - MARGIN_X - nfBoxX - 1;
  const nfBoxH = 9;

  // "NOTA FISCAL" label - simple bold text
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('NOTA FISCAL', MARGIN_X + 2, nfLabelY + 4);

  // NF data box - thin border
  doc.setLineWidth(0.3);
  doc.rect(nfBoxX, nfLabelY - 1, nfBoxW, nfBoxH);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text((invoiceNumber || '').toUpperCase(), nfBoxX + 1.5, nfLabelY + 4.5);

  // === VOLUME and DATA fields ===
  const bottomY = 42;
  const volLabelW = 18;
  const volBoxX = volLabelW + MARGIN_X + 1;
  const volBoxW = 16;
  const bottomBoxH = 9;

  const dataLabelX = volBoxX + volBoxW + 2;
  const dataLabelW = 12;
  const dataBoxX = dataLabelX + dataLabelW + 1;
  const dataBoxW = W - MARGIN_X - dataBoxX - 1;

  // "VOLUME" label - simple bold text
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('VOLUME', MARGIN_X + 2, bottomY + 4);

  // Volume box - thin border
  doc.setLineWidth(0.3);
  doc.rect(volBoxX, bottomY - 1, volBoxW, bottomBoxH);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  const volText = `${volumeNumber}/${totalVolumes}`;
  const volTextW = doc.getTextWidth(volText);
  doc.text(volText, volBoxX + (volBoxW - volTextW) / 2, bottomY + 4.5);

  // "DATA" label - simple bold text
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.text('DATA', dataLabelX + 1, bottomY + 4);

  // Data box - thin border
  doc.setLineWidth(0.3);
  doc.rect(dataBoxX, bottomY - 1, dataBoxW, bottomBoxH);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  const dateTextW = doc.getTextWidth(date);
  doc.text(date, dataBoxX + (dataBoxW - dateTextW) / 2, bottomY + 4.5);
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

export function getVolumeLabelsPDFBase64(data: LabelData): string {
  const doc = generateVolumeLabelsPDF(data);
  // Returns raw base64 string (no data URI prefix)
  const dataUri = doc.output('datauristring');
  return dataUri.split(',')[1];
}

export function downloadVolumeLabelsPDF(data: LabelData, autoPrint: boolean = false): void {
  const doc = generateVolumeLabelsPDF(data);
  const safeName = data.clientName
    .replace(/[^a-zA-Z0-9]/g, '_')
    .substring(0, 20);
  
  if (autoPrint) {
    doc.autoPrint();
  }
  
  doc.save(`etiquetas_${safeName}_${data.totalVolumes}vol.pdf`);
}
