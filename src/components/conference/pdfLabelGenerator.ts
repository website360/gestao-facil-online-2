import jsPDF from 'jspdf';
import { printPdfDirect } from './qzTrayPrinter';

interface LabelData {
  clientName: string;
  totalVolumes: number;
  invoiceNumber?: string;
}

// Logo path in public folder
const LOGO_PATH = '/lovable-uploads/00b0624f-8191-44a2-beb9-c9e0ead49c89.png';

/**
 * Load image as base64 for embedding in PDF
 */
async function loadLogoBase64(): Promise<string | null> {
  try {
    const response = await fetch(LOGO_PATH);
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    console.warn('Could not load logo for label');
    return null;
  }
}

function drawLabel(
  doc: jsPDF,
  clientName: string,
  invoiceNumber: string,
  volumeNumber: number,
  totalVolumes: number,
  date: string,
  logoBase64: string | null
) {
  // Page: 100mm wide x 80mm tall (extra height to prevent bottom clipping)
  // Printer clips ~30mm top & left
  const ML = 30;  // left margin (non-printable zone)
  const MR = 2;   // right margin
  const MT = 30;  // top margin (non-printable zone)
  const PW = 100;
  const PH = 80;
  const contentW = PW - ML - MR; // ~68mm
  const contentH = 45; // total content height

  doc.setTextColor(0, 0, 0);
  doc.setDrawColor(0, 0, 0);

  // Outer border
  doc.setLineWidth(0.5);
  doc.rect(ML, MT, contentW, contentH);

  // === ROW HEIGHTS ===
  const headerH = 10;   // logo + company name
  const clientH = 14;   // client name
  const bottomH = contentH - headerH - clientH; // ~21mm for NF + VOL + DATA

  const headerY = MT;
  const clientY = MT + headerH;
  const bottomY = clientY + clientH;

  // === HEADER: Logo + Company name ===
  doc.setLineWidth(0.3);
  doc.line(ML, clientY, ML + contentW, clientY);

  // Draw logo image if available
  if (logoBase64) {
    try {
      const logoW = 8;
      const logoH = 8;
      const logoX = ML + 2;
      const logoY = headerY + (headerH - logoH) / 2;
      doc.addImage(logoBase64, 'PNG', logoX, logoY, logoW, logoH);
      
      // Company name next to logo
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('IRMAOS MANTOVANI TEXTIL', ML + 12, headerY + headerH / 2 + 1);
    } catch {
      // Fallback to text only
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text('IRMAOS MANTOVANI TEXTIL', ML + contentW / 2, headerY + headerH / 2 + 1, { align: 'center' });
    }
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('IRMAOS MANTOVANI TEXTIL', ML + contentW / 2, headerY + headerH / 2 + 1, { align: 'center' });
  }

  // === CLIENT ROW ===
  doc.line(ML, bottomY, ML + contentW, bottomY);

  const lblW = 12;
  doc.line(ML + lblW, clientY, ML + lblW, bottomY);

  doc.setFont('helvetica', 'bold');
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
  const col1W = contentW * 0.38;
  const col2W = contentW * 0.30;
  const col3W = contentW - col1W - col2W;

  const col1X = ML;
  const col2X = ML + col1W;
  const col3X = col2X + col2W;

  doc.setLineWidth(0.3);
  doc.line(col2X, bottomY, col2X, MT + contentH);
  doc.line(col3X, bottomY, col3X, MT + contentH);

  const midBot = bottomY + bottomH / 2;

  // NF
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.text('NOTA FISCAL', col1X + 1, bottomY + 4);
  doc.setFontSize(9);
  doc.text((invoiceNumber || 'S/N').toUpperCase(), col1X + 1, midBot + 3);

  // VOLUME
  doc.setFontSize(6);
  doc.text('VOLUME', col2X + 1, bottomY + 4);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  const volText = `${volumeNumber}/${totalVolumes}`;
  doc.text(volText, col2X + col2W / 2, midBot + 4, { align: 'center' });

  // DATA
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.text('DATA', col3X + 1, bottomY + 4);
  doc.setFontSize(8);
  doc.text(date, col3X + col3W / 2, midBot + 3, { align: 'center' });
}

export async function generateVolumeLabelsPDF(data: LabelData): Promise<jsPDF> {
  const { clientName, totalVolumes, invoiceNumber = '' } = data;
  const currentDate = new Date().toLocaleDateString('pt-BR');

  // Load logo
  const logoBase64 = await loadLogoBase64();

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [100, 80],
  });

  for (let i = 0; i < totalVolumes; i++) {
    if (i > 0) {
      doc.addPage([100, 80], 'landscape');
    }
    drawLabel(doc, clientName, invoiceNumber, i + 1, totalVolumes, currentDate, logoBase64);
  }

  return doc;
}

export async function getVolumeLabelsPDFBase64(data: LabelData): Promise<string> {
  const doc = await generateVolumeLabelsPDF(data);
  const dataUri = doc.output('datauristring');
  return dataUri.split(',')[1];
}

export async function printVolumeLabelsDirect(
  data: LabelData
): Promise<{ success: boolean; message: string }> {
  try {
    const pdfBase64 = await getVolumeLabelsPDFBase64(data);
    return await printPdfDirect(pdfBase64);
  } catch (error) {
    return {
      success: false,
      message: `Erro ao preparar impressão em PDF: ${(error as Error)?.message || 'falha desconhecida'}`,
    };
  }
}

export async function downloadVolumeLabelsPDF(data: LabelData, autoPrint: boolean = false): Promise<void> {
  const doc = await generateVolumeLabelsPDF(data);
  const safeName = data.clientName
    .replace(/[^a-zA-Z0-9]/g, '_')
    .substring(0, 20);
  
  if (autoPrint) {
    doc.autoPrint();
  }
  
  doc.save(`etiquetas_${safeName}_${data.totalVolumes}vol.pdf`);
}
