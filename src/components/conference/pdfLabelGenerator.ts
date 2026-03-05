import jsPDF from 'jspdf';
import { printPdfDirect } from './qzTrayPrinter';

interface LabelData {
  clientName: string;
  totalVolumes: number;
  invoiceNumber?: string;
}

interface LabelPDFOptions {
  includeCalibrationPage?: boolean;
}

// Logo path in public folder
const LOGO_PATH = '/lovable-uploads/00b0624f-8191-44a2-beb9-c9e0ead49c89.png';

// Physical label: 100 x 60 mm (landscape)
const PAGE_W = 100;
const PAGE_H = 60;

// Safe-zone margins => usable area: 90 x 52 mm
const ML = 5;
const MR = 5;
const MT = 4;
const MB = 4;

const CONTENT_W = PAGE_W - ML - MR;
const CONTENT_H = PAGE_H - MT - MB;

// Datamax compatibility: scale down content to 92% to guarantee 100% visibility
// Effective usable area: ~82.8 x 47.8 mm (centered within the 90x52 safe zone)
const SCALE_PERCENT = 92;
const SCALE = SCALE_PERCENT / 100;

/**
 * Load logo and convert to JPEG data URI for better jsPDF compatibility.
 */
async function loadLogoBase64(): Promise<string | null> {
  try {
    const response = await fetch(LOGO_PATH);
    if (!response.ok) return null;

    const blob = await response.blob();
    const imageUrl = URL.createObjectURL(blob);

    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Erro ao carregar logo'));
      img.src = imageUrl;
    });

    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      URL.revokeObjectURL(imageUrl);
      return null;
    }

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0);

    const jpegDataUrl = canvas.toDataURL('image/jpeg', 0.92);
    URL.revokeObjectURL(imageUrl);
    return jpegDataUrl;
  } catch {
    console.warn('Could not load logo for label');
    return null;
  }
}

function drawCalibrationPage(doc: jsPDF) {
  doc.setTextColor(0, 0, 0);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);

  doc.rect(ML, MT, CONTENT_W, CONTENT_H);

  const cx = PAGE_W / 2;
  const cy = PAGE_H / 2;
  doc.setLineWidth(0.2);
  doc.line(cx - 5, cy, cx + 5, cy);
  doc.line(cx, cy - 5, cx, cy + 5);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.text('PAGINA DE CALIBRACAO', cx, MT + 8, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5);
  doc.text(`Area util: ${CONTENT_W}x${CONTENT_H}mm  |  Pagina: ${PAGE_W}x${PAGE_H}mm`, cx, MT + 12, { align: 'center' });
  doc.text('Se este retangulo estiver 100% visivel,', cx, MT + 18, { align: 'center' });
  doc.text('a calibracao esta correta.', cx, MT + 22, { align: 'center' });
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
  // Apply scale transformation: shrink content by SCALE_PERCENT centered in the safe zone
  // This creates a buffer zone around the content to prevent any clipping
  const scaledW = CONTENT_W * SCALE;
  const scaledH = CONTENT_H * SCALE;
  const offsetX = ML + (CONTENT_W - scaledW) / 2;
  const offsetY = MT + (CONTENT_H - scaledH) / 2;

  // All coordinates below are relative to the scaled content area
  const headerH = 8 * SCALE;
  const clientH = 24 * SCALE;
  const bottomH = scaledH - headerH - clientH;

  const headerY = offsetY;
  const clientY = offsetY + headerH;
  const bottomY = clientY + clientH;

  doc.setTextColor(0, 0, 0);
  doc.setDrawColor(0, 0, 0);

  // Scaled font sizes (base sizes * SCALE)
  const fontCompany = 7 * SCALE;
  const fontLabel = 5.5 * SCALE;
  const fontClient = 7 * SCALE;
  const fontFooterLabel = 5 * SCALE;
  const fontFooterValue = 6 * SCALE;
  const fontVolume = 7 * SCALE;
  const fontDate = 5.5 * SCALE;

  // Header
  doc.setLineWidth(0.3);
  doc.line(offsetX, clientY, offsetX + scaledW, clientY);

  if (logoBase64) {
    try {
      const logoW = 5 * SCALE;
      const logoH = 5 * SCALE;
      const logoX = offsetX + 1;
      const logoY = headerY + (headerH - logoH) / 2;
      doc.addImage(logoBase64, 'JPEG', logoX, logoY, logoW, logoH);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(fontCompany);
      doc.text('IRMAOS MANTOVANI TEXTIL', offsetX + (6 * SCALE) + 1.5, headerY + headerH / 2 + 0.5);
    } catch {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(fontCompany);
      doc.text('IRMAOS MANTOVANI TEXTIL', offsetX + scaledW / 2, headerY + headerH / 2 + 0.5, { align: 'center' });
    }
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(fontCompany);
    doc.text('IRMAOS MANTOVANI TEXTIL', offsetX + scaledW / 2, headerY + headerH / 2 + 0.5, { align: 'center' });
  }

  // Client section
  doc.line(offsetX, bottomY, offsetX + scaledW, bottomY);

  const lblW = 12 * SCALE;
  doc.line(offsetX + lblW, clientY, offsetX + lblW, bottomY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(fontLabel);
  doc.text('CLIENTE', offsetX + 1, clientY + clientH / 2 + 0.5);

  doc.setFontSize(fontClient);
  const clientText = clientName.toUpperCase();
  const maxW = scaledW - lblW - 4;
  const dataX = offsetX + lblW + 1.5;

  if (doc.getTextWidth(clientText) > maxW) {
    const words = clientText.split(' ');
    let line1 = '';
    let line2 = '';
    let line3 = '';
    let currentLine = 1;

    for (const w of words) {
      if (currentLine === 1) {
        const test = line1 + (line1 ? ' ' : '') + w;
        if (doc.getTextWidth(test) <= maxW) {
          line1 = test;
        } else {
          currentLine = 2;
          line2 = w;
        }
      } else if (currentLine === 2) {
        const test = line2 + (line2 ? ' ' : '') + w;
        if (doc.getTextWidth(test) <= maxW) {
          line2 = test;
        } else {
          currentLine = 3;
          line3 = w;
        }
      } else {
        line3 += ' ' + w;
      }
    }

    const lineSpacing = 3 * SCALE;
    const numLines = line3 ? 3 : line2 ? 2 : 1;
    const totalTextH = numLines * lineSpacing;
    const startY = clientY + (clientH - totalTextH) / 2 + 2 * SCALE;

    doc.text(line1, dataX, startY);
    if (line2) doc.text(line2, dataX, startY + lineSpacing);
    if (line3) {
      const trunc = line3.length > 28 ? `${line3.substring(0, 28)}...` : line3;
      doc.text(trunc, dataX, startY + lineSpacing * 2);
    }
  } else {
    doc.text(clientText, dataX, clientY + clientH / 2 + 0.5);
  }

  // Footer: NF | VOLUME | DATA
  const col1W = scaledW * 0.37;
  const col2W = scaledW * 0.30;
  const col3W = scaledW - col1W - col2W;

  const col1X = offsetX;
  const col2X = offsetX + col1W;
  const col3X = col2X + col2W;
  const contentBottomY = offsetY + scaledH;

  doc.setLineWidth(0.3);
  doc.line(col2X, bottomY, col2X, contentBottomY);
  doc.line(col3X, bottomY, col3X, contentBottomY);

  const labelY = bottomY + 3 * SCALE;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(fontFooterLabel);
  doc.text('NOTA FISCAL', col1X + 1.5, labelY);
  doc.text('VOLUME', col2X + 1.5, labelY);
  doc.text('DATA', col3X + 1.5, labelY);

  const valueY = bottomY + bottomH / 2 + 2 * SCALE;

  doc.setFontSize(fontFooterValue);
  doc.text((invoiceNumber || 'S/N').toUpperCase(), col1X + 1.5, valueY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(fontVolume);
  doc.text(`${volumeNumber}/${totalVolumes}`, col2X + col2W / 2, valueY, { align: 'center' });

  doc.setFontSize(fontDate);
  doc.text(date, col3X + col3W / 2, valueY, { align: 'center' });
}

export async function generateVolumeLabelsPDF(
  data: LabelData,
  options: LabelPDFOptions = {}
): Promise<jsPDF> {
  const { clientName, totalVolumes, invoiceNumber = '' } = data;
  const { includeCalibrationPage = false } = options;
  const currentDate = new Date().toLocaleDateString('pt-BR');

  const logoBase64 = await loadLogoBase64();

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [PAGE_W, PAGE_H],
  });

  if (includeCalibrationPage) {
    drawCalibrationPage(doc);
    if (totalVolumes > 0) {
      doc.addPage([PAGE_W, PAGE_H], 'landscape');
    }
  }

  for (let i = 0; i < totalVolumes; i++) {
    if (i > 0 || includeCalibrationPage) {
      if (!(i === 0 && includeCalibrationPage)) {
        doc.addPage([PAGE_W, PAGE_H], 'landscape');
      }
    }
    drawLabel(doc, clientName, invoiceNumber, i + 1, totalVolumes, currentDate, logoBase64);
  }

  return doc;
}

export async function getVolumeLabelsPDFBase64(
  data: LabelData,
  options: LabelPDFOptions = {}
): Promise<string> {
  const doc = await generateVolumeLabelsPDF(data, options);
  const dataUri = doc.output('datauristring');
  return dataUri.split(',')[1];
}

export async function printVolumeLabelsDirect(
  data: LabelData
): Promise<{ success: boolean; message: string }> {
  try {
    const pdfBase64 = await getVolumeLabelsPDFBase64(data, { includeCalibrationPage: false });
    return await printPdfDirect(pdfBase64);
  } catch (error) {
    return {
      success: false,
      message: `Erro ao preparar impressão em PDF: ${(error as Error)?.message || 'falha desconhecida'}`,
    };
  }
}

export async function downloadVolumeLabelsPDF(
  data: LabelData,
  autoPrint: boolean = false,
  includeCalibrationPage: boolean = false
): Promise<void> {
  const doc = await generateVolumeLabelsPDF(data, { includeCalibrationPage });
  const safeName = data.clientName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);

  if (autoPrint) {
    doc.autoPrint();
  }

  doc.save(`etiquetas_${safeName}_${data.totalVolumes}vol.pdf`);
}

export async function downloadCalibrationPDF(data: LabelData): Promise<void> {
  const doc = await generateVolumeLabelsPDF(data, { includeCalibrationPage: true });
  const safeName = data.clientName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
  doc.save(`calibracao_100x60_${safeName}.pdf`);
}
