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
  // Page: 100x60mm. Printer clips ~30mm top & left.
  const ML = 30;  // left margin (non-printable zone)
  const MR = 2;   // right margin
  const MT = 30;  // top margin (non-printable zone)
  const MB = 2;   // bottom margin
  const PW = 100; // page width
  const PH = 70;  // page height (extra 10mm to avoid bottom clipping)
  const contentW = PW - ML - MR; // ~68mm
  const contentH = PH - MT - MB;  // ~38mm

  doc.setTextColor(0, 0, 0);
  doc.setDrawColor(0, 0, 0);

  // Outer border
  doc.setLineWidth(0.5);
  doc.rect(ML, MT, contentW, contentH);

  // === ROW HEIGHTS (total ~38mm) ===
  const headerH = 6;    // company name
  const clientH = 14;   // client name
  const bottomH = contentH - headerH - clientH; // ~18mm for NF + VOL + DATA

  const headerY = MT;
  const clientY = MT + headerH;
  const bottomY = clientY + clientH;

  // === HEADER: Company name ===
  doc.setLineWidth(0.3);
  doc.line(ML, clientY, ML + contentW, clientY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('IRMAOS MANTOVANI TEXTIL', ML + contentW / 2, headerY + 4, { align: 'center' });

  // === CLIENT ROW ===
  doc.line(ML, bottomY, ML + contentW, bottomY);

  const lblW = 12; // label column width
  doc.line(ML + lblW, clientY, ML + lblW, bottomY);

  doc.setFontSize(7);
  doc.text('CLIENTE', ML + 1, clientY + clientH / 2 + 1);

  doc.setFontSize(9);
  const clientText = clientName.toUpperCase();
  const maxW = contentW - lblW - 2;
  const dataX = ML + lblW + 1;

  if (doc.getTextWidth(clientText) > maxW) {
    const words = clientText.split(' ');
    let line1 = '', line2 = '', onL1 = true;
    for (const w of words) {
      const test = line1 + (line1 ? ' ' : '') + w;
      if (onL1 && doc.getTextWidth(test) <= maxW) { line1 = test; }
      else { onL1 = false; line2 += (line2 ? ' ' : '') + w; }
    }
    doc.text(line1, dataX, clientY + 5);
    if (line2) {
      const trunc = line2.length > 30 ? line2.substring(0, 30) + '...' : line2;
      doc.text(trunc, dataX, clientY + 10);
    }
  } else {
    doc.text(clientText, dataX, clientY + clientH / 2 + 1.5);
  }

  // === BOTTOM ROW: 3 columns — NF | VOLUME | DATA ===
  const col1W = contentW * 0.38; // Nota Fiscal
  const col2W = contentW * 0.30; // Volume
  const col3W = contentW - col1W - col2W; // Data

  const col1X = ML;
  const col2X = ML + col1W;
  const col3X = col2X + col2W;

  doc.setLineWidth(0.3);
  doc.line(col2X, bottomY, col2X, MT + contentH);
  doc.line(col3X, bottomY, col3X, MT + contentH);

  const midBot = bottomY + bottomH / 2;

  // NF
  doc.setFontSize(5);
  doc.text('NOTA FISCAL', col1X + 1, bottomY + 3);
  doc.setFontSize(7);
  doc.text((invoiceNumber || 'S/N').toUpperCase(), col1X + 1, midBot + 2.5);

  // VOLUME
  doc.setFontSize(5);
  doc.text('VOLUME', col2X + 1, bottomY + 3);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  const volText = `${volumeNumber}/${totalVolumes}`;
  doc.text(volText, col2X + col2W / 2, midBot + 2.5, { align: 'center' });

  // DATA
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5);
  doc.text('DATA', col3X + 1, bottomY + 3);
  doc.setFontSize(6.5);
  doc.text(date, col3X + col3W / 2, midBot + 2.5, { align: 'center' });
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
