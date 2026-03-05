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
  // Centralized printable area (balanced offsets on all sides)
  const ML = 4;   // left margin
  const MR = 4;   // right margin
  const MT = 4;   // top margin
  const MB = 4;   // bottom margin
  const contentW = W - ML - MR;
  const contentH = H - MT - MB;

  doc.setTextColor(0, 0, 0);
  doc.setDrawColor(0, 0, 0);

  // Outer border
  doc.setLineWidth(0.6);
  doc.rect(ML, MT, contentW, contentH);

  // === HEADER ===
  const headerY = MT + 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('IRMAOS MANTOVANI TEXTIL', ML + contentW / 2, headerY, { align: 'center' });

  // Header separator
  const sepY = MT + 9;
  doc.setLineWidth(0.4);
  doc.line(ML, sepY, ML + contentW, sepY);

  // === Layout rows ===
  const labelColW = 24;        // column for field labels
  const dataX = ML + labelColW; // where data values start

  const row1Y = sepY;           // CLIENTE row
  const row1H = 15;
  const row2Y = row1Y + row1H;  // NOTA FISCAL row
  const row2H = 12;
  const row3Y = row2Y + row2H;  // VOLUME + DATA row
  const row3H = H - MB - row3Y; // fill remaining space

  // === CLIENTE row ===
  doc.setLineWidth(0.4);
  doc.line(ML, row2Y, ML + contentW, row2Y);
  doc.line(dataX, row1Y, dataX, row2Y);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('CLIENTE', ML + 3, row1Y + row1H / 2 + 1.5);

  doc.setFontSize(11);
  const clientText = clientName.toUpperCase();
  const maxClientW = contentW - labelColW - 4;

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
    doc.text(line1, dataX + 2, row1Y + 5.5);
    if (line2) {
      const truncated = line2.length > 28 ? line2.substring(0, 28) + '...' : line2;
      doc.text(truncated, dataX + 2, row1Y + 11);
    }
  } else {
    doc.text(clientText, dataX + 2, row1Y + row1H / 2 + 1.5);
  }

  // === NOTA FISCAL row ===
  doc.setLineWidth(0.4);
  doc.line(ML, row3Y, ML + contentW, row3Y);
  doc.line(dataX, row2Y, dataX, row3Y);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('NOTA FISCAL', ML + 3, row2Y + row2H / 2 + 1.5);

  doc.setFontSize(11);
  doc.text((invoiceNumber || 'S/N').toUpperCase(), dataX + 2, row2Y + row2H / 2 + 1.5);

  // === VOLUME + DATA row (side by side) ===
  const halfContentW = contentW / 2;
  const volLabelW = 20;
  const volDataX = ML + volLabelW;
  const dataColStart = ML + halfContentW;
  const dataLabelW = 14;
  const dateDataX = dataColStart + dataLabelW;

  // Vertical separators
  doc.line(volDataX, row3Y, volDataX, MT + contentH);
  doc.line(dataColStart, row3Y, dataColStart, MT + contentH);
  doc.line(dateDataX, row3Y, dateDataX, MT + contentH);

  // VOLUME
  doc.setFontSize(10);
  doc.text('VOLUME', ML + 3, row3Y + row3H / 2 + 1.5);
  doc.setFontSize(11);
  const volText = `${volumeNumber}/${totalVolumes}`;
  const volCenterX = volDataX + (dataColStart - volDataX) / 2;
  doc.text(volText, volCenterX, row3Y + row3H / 2 + 1.5, { align: 'center' });

  // DATA
  doc.setFontSize(10);
  doc.text('DATA', dataColStart + 2, row3Y + row3H / 2 + 1.5);
  doc.setFontSize(11);
  const dateCenterX = dateDataX + (ML + contentW - dateDataX) / 2;
  doc.text(date, dateCenterX, row3Y + row3H / 2 + 1.5, { align: 'center' });
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
