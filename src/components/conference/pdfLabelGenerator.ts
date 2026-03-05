import jsPDF from 'jspdf';
import { printPdfDirect } from './qzTrayPrinter';

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

/**
 * Draw pure black text (single pass).
 */
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
  const MARGIN = 2;

  doc.setTextColor(0, 0, 0);
  doc.setDrawColor(0, 0, 0);

  // Outer border
  doc.setLineWidth(0.8);
  doc.rect(MARGIN, MARGIN, W - MARGIN * 2, H - MARGIN * 2);

  // === HEADER ===
  const headerY = 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('IRMAOS MANTOVANI TEXTIL', W / 2, headerY, { align: 'center' });

  // Header separator
  const sepY = 11;
  doc.setLineWidth(0.5);
  doc.line(MARGIN + 1, sepY, W - MARGIN - 1, sepY);

  // === Row heights ===
  const row1Y = sepY;        // CLIENTE row top
  const row1H = 14;
  const row2Y = row1Y + row1H; // NF row top
  const row2H = 11;
  const row3Y = row2Y + row2H; // VOLUME + DATA row top
  const row3H = 11;

  const labelColW = 22;       // Width for label text column
  const dataX = MARGIN + labelColW;
  const dataW = W - MARGIN * 2 - labelColW;

  // === CLIENTE field ===
  // Horizontal line below CLIENTE row
  doc.setLineWidth(0.4);
  doc.line(MARGIN, row2Y, W - MARGIN, row2Y);
  // Vertical separator
  doc.line(dataX, row1Y, dataX, row2Y);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('CLIENTE', MARGIN + 2, row1Y + row1H / 2 + 1);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  const clientText = clientName.toUpperCase();
  const maxClientW = dataW - 4;

  if (doc.getTextWidth(clientText) > maxClientW) {
    const words = clientText.split(' ');
    let line1 = '';
    let line2 = '';
    let onLine1 = true;
    for (const word of words) {
      const test = line1 + (line1 ? ' ' : '') + word;
      if (onLine1 && doc.getTextWidth(test) <= maxClientW) {
        line1 = test;
      } else {
        onLine1 = false;
        line2 += (line2 ? ' ' : '') + word;
      }
    }
    doc.text(line1, dataX + 2, row1Y + 5);
    if (line2) {
      const truncated = line2.length > 30 ? line2.substring(0, 30) + '...' : line2;
      doc.text(truncated, dataX + 2, row1Y + 10);
    }
  } else {
    doc.text(clientText, dataX + 2, row1Y + row1H / 2 + 1);
  }

  // === NOTA FISCAL field ===
  doc.setLineWidth(0.4);
  doc.line(MARGIN, row3Y, W - MARGIN, row3Y);
  doc.line(dataX, row2Y, dataX, row3Y);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('NOTA FISCAL', MARGIN + 2, row2Y + row2H / 2 + 1);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text((invoiceNumber || 'S/N').toUpperCase(), dataX + 2, row2Y + row2H / 2 + 1);

  // === VOLUME + DATA fields (side by side) ===
  const halfW = (W - MARGIN * 2) / 2;
  const volLabelW = 18;
  const volDataX = MARGIN + volLabelW;
  const dataLabelX = MARGIN + halfW;
  const dataLabelW = 14;
  const dataDataX = dataLabelX + dataLabelW;

  // Vertical separators
  doc.line(volDataX, row3Y, volDataX, row3Y + row3H);
  doc.line(dataLabelX, row3Y, dataLabelX, row3Y + row3H);
  doc.line(dataDataX, row3Y, dataDataX, row3Y + row3H);

  // VOLUME label
  doc.setFontSize(9);
  doc.text('VOLUME', MARGIN + 2, row3Y + row3H / 2 + 1);

  // Volume value
  doc.setFontSize(11);
  const volText = `${volumeNumber}/${totalVolumes}`;
  const volCenterX = volDataX + (dataLabelX - volDataX) / 2;
  doc.text(volText, volCenterX, row3Y + row3H / 2 + 1, { align: 'center' });

  // DATA label
  doc.setFontSize(9);
  doc.text('DATA', dataLabelX + 2, row3Y + row3H / 2 + 1);

  // Date value
  doc.setFontSize(11);
  const dateCenterX = dataDataX + (W - MARGIN - dataDataX) / 2;
  doc.text(date, dateCenterX, row3Y + row3H / 2 + 1, { align: 'center' });
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

export async function printVolumeLabelsDirect(
  data: LabelData
): Promise<{ success: boolean; message: string }> {
  try {
    const pdfBase64 = getVolumeLabelsPDFBase64(data);
    return await printPdfDirect(pdfBase64);
  } catch (error) {
    return {
      success: false,
      message: `Erro ao preparar impressão em PDF: ${(error as Error)?.message || 'falha desconhecida'}`,
    };
  }
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
