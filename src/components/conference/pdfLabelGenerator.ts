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
 * Draw bold text by rendering it multiple times with slight offsets.
 * This simulates extra-bold on thermal printers where fonts appear light.
 */
function drawBoldText(doc: jsPDF, text: string, x: number, y: number, options?: any) {
  doc.text(text, x, y, options);
  doc.text(text, x + 0.15, y, options);
  doc.text(text, x, y + 0.15, options);
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

  // Outer border - thicker for visibility
  doc.setLineWidth(0.8);
  doc.rect(BORDER, BORDER, W - BORDER * 2, H - BORDER * 2);

  // === HEADER ===
  const headerY = 7;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);

  const centerX = W / 2;
  drawBoldText(doc, 'IRMAOS', centerX - 24, headerY, { align: 'right' });
  drawBoldText(doc, 'MANTOVANI', centerX + 2, headerY, { align: 'left' });

  doc.setFontSize(10);
  drawBoldText(doc, 'TEXTIL', centerX + 2 + doc.getTextWidth('MANTOVANI '), headerY);

  // Separator line - thicker
  const sepY = 10;
  doc.setLineWidth(0.5);
  doc.line(MARGIN_X + 1, sepY, W - MARGIN_X - 1, sepY);

  // === CLIENTE field ===
  const clienteLabelY = 15;
  const clienteLabelW = 20;
  const clienteBoxX = clienteLabelW + MARGIN_X + 1;
  const clienteBoxW = W - MARGIN_X - clienteBoxX - 1;
  const clienteBoxH = 11;

  // "CLIENTE" label
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  drawBoldText(doc, 'CLIENTE', MARGIN_X + 2, clienteLabelY + 4);

  // Client data box - thicker border
  doc.setLineWidth(0.5);
  doc.rect(clienteBoxX, clienteLabelY - 1, clienteBoxW, clienteBoxH);

  // Client name
  doc.setFontSize(11);
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

    drawBoldText(doc, line1, clienteBoxX + 1.5, clienteLabelY + 3);
    if (line2) {
      const truncatedLine2 = line2.length > 35 ? line2.substring(0, 35) + '...' : line2;
      drawBoldText(doc, truncatedLine2, clienteBoxX + 1.5, clienteLabelY + 7.5);
    }
  } else {
    drawBoldText(doc, clientText, clienteBoxX + 1.5, clienteLabelY + 5.5);
  }

  // === NOTA FISCAL field ===
  const nfLabelY = 29;
  const nfLabelW = 24;
  const nfBoxX = nfLabelW + MARGIN_X + 1;
  const nfBoxW = W - MARGIN_X - nfBoxX - 1;
  const nfBoxH = 9;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  drawBoldText(doc, 'NOTA FISCAL', MARGIN_X + 2, nfLabelY + 4);

  doc.setLineWidth(0.5);
  doc.rect(nfBoxX, nfLabelY - 1, nfBoxW, nfBoxH);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  drawBoldText(doc, (invoiceNumber || '').toUpperCase(), nfBoxX + 1.5, nfLabelY + 4.5);

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

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  drawBoldText(doc, 'VOLUME', MARGIN_X + 2, bottomY + 4);

  doc.setLineWidth(0.5);
  doc.rect(volBoxX, bottomY - 1, volBoxW, bottomBoxH);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  const volText = `${volumeNumber}/${totalVolumes}`;
  const volTextW = doc.getTextWidth(volText);
  drawBoldText(doc, volText, volBoxX + (volBoxW - volTextW) / 2, bottomY + 4.5);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  drawBoldText(doc, 'DATA', dataLabelX + 1, bottomY + 4);

  doc.setLineWidth(0.5);
  doc.rect(dataBoxX, bottomY - 1, dataBoxW, bottomBoxH);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  const dateTextW = doc.getTextWidth(date);
  drawBoldText(doc, date, dataBoxX + (dataBoxW - dateTextW) / 2, bottomY + 4.5);
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
