import jsPDF from 'jspdf';
import { printPdfDirect } from './qzTrayPrinter';

interface LabelData {
  clientName: string;
  totalVolumes: number;
  invoiceNumber?: string;
}

// Logo path in public folder
const LOGO_PATH = '/lovable-uploads/00b0624f-8191-44a2-beb9-c9e0ead49c89.png';

// ── Physical label: 100 x 60 mm (landscape) ──
const PAGE_W = 100;
const PAGE_H = 60;

// Safe-zone margins
const ML = 5;
const MR = 5;
const MT = 4;
const MB = 4;

const CONTENT_W = PAGE_W - ML - MR; // 90mm
const CONTENT_H = PAGE_H - MT - MB; // 52mm

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

    // White background to avoid transparency issues on thermal printers
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

/**
 * Draw a calibration page — a rectangle at the exact usable-area boundary.
 * If the rectangle is fully visible after printing, the printer is calibrated.
 */
function drawCalibrationPage(doc: jsPDF) {
  doc.setTextColor(0, 0, 0);
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);

  // Draw usable-area rectangle
  doc.rect(ML, MT, CONTENT_W, CONTENT_H);

  // Cross-hairs at center
  const cx = PAGE_W / 2;
  const cy = PAGE_H / 2;
  doc.setLineWidth(0.2);
  doc.line(cx - 5, cy, cx + 5, cy);
  doc.line(cx, cy - 5, cx, cy + 5);

  // Info text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.text('PAGINA DE CALIBRACAO', cx, MT + 8, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5);
  doc.text(`Area util: ${CONTENT_W}x${CONTENT_H}mm  |  Pagina: ${PAGE_W}x${PAGE_H}mm`, cx, MT + 12, { align: 'center' });
  doc.text('Se este retangulo estiver 100% visivel,', cx, MT + 18, { align: 'center' });
  doc.text('a calibracao esta correta.', cx, MT + 22, { align: 'center' });

  // Corner markers
  doc.setFontSize(4);
  doc.text('TL', ML + 1, MT + 3);
  doc.text('TR', ML + CONTENT_W - 4, MT + 3);
  doc.text('BL', ML + 1, MT + CONTENT_H - 1);
  doc.text('BR', ML + CONTENT_W - 4, MT + CONTENT_H - 1);
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
  // Section heights within CONTENT_H (52mm)
  const headerH = 8;
  const clientH = 24;
  const bottomH = CONTENT_H - headerH - clientH; // 20mm

  const headerY = MT;
  const clientY = MT + headerH;
  const bottomY = clientY + clientH;

  doc.setTextColor(0, 0, 0);
  doc.setDrawColor(0, 0, 0);

  // ── HEADER ──
  doc.setLineWidth(0.3);
  doc.line(ML, clientY, ML + CONTENT_W, clientY);

  if (logoBase64) {
    try {
      const logoW = 5;
      const logoH = 5;
      const logoX = ML + 1;
      const logoY = headerY + (headerH - logoH) / 2;
      doc.addImage(logoBase64, 'JPEG', logoX, logoY, logoW, logoH);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.text('IRMAOS MANTOVANI TEXTIL', ML + 7.5, headerY + headerH / 2 + 0.6);
    } catch {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7);
      doc.text('IRMAOS MANTOVANI TEXTIL', ML + CONTENT_W / 2, headerY + headerH / 2 + 0.6, { align: 'center' });
    }
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text('IRMAOS MANTOVANI TEXTIL', ML + CONTENT_W / 2, headerY + headerH / 2 + 0.6, { align: 'center' });
  }

  // ── CLIENT ──
  doc.line(ML, bottomY, ML + CONTENT_W, bottomY);

  const lblW = 12;
  doc.line(ML + lblW, clientY, ML + lblW, bottomY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.5);
  doc.text('CLIENTE', ML + 1, clientY + clientH / 2 + 0.6);

  doc.setFontSize(7);
  const clientText = clientName.toUpperCase();
  const maxW = CONTENT_W - lblW - 4;
  const dataX = ML + lblW + 1.5;

  if (doc.getTextWidth(clientText) > maxW) {
    const words = clientText.split(' ');
    let line1 = '';
    let line2 = '';
    let line3 = '';
    let currentLine = 1;

    for (const w of words) {
      if (currentLine === 1) {
        const test = line1 + (line1 ? ' ' : '') + w;
        if (doc.getTextWidth(test) <= maxW) { line1 = test; }
        else { currentLine = 2; line2 = w; }
      } else if (currentLine === 2) {
        const test = line2 + (line2 ? ' ' : '') + w;
        if (doc.getTextWidth(test) <= maxW) { line2 = test; }
        else { currentLine = 3; line3 = w; }
      } else {
        line3 += ' ' + w;
      }
    }

    const lineSpacing = 3;
    const numLines = line3 ? 3 : line2 ? 2 : 1;
    const totalTextH = numLines * lineSpacing;
    const startY = clientY + (clientH - totalTextH) / 2 + 2;

    doc.text(line1, dataX, startY);
    if (line2) doc.text(line2, dataX, startY + lineSpacing);
    if (line3) {
      const trunc = line3.length > 28 ? `${line3.substring(0, 28)}...` : line3;
      doc.text(trunc, dataX, startY + lineSpacing * 2);
    }
  } else {
    doc.text(clientText, dataX, clientY + clientH / 2 + 0.6);
  }

  // ── FOOTER: NF | VOLUME | DATA ──
  const col1W = CONTENT_W * 0.37;
  const col2W = CONTENT_W * 0.30;

  const col1X = ML;
  const col2X = ML + col1W;
  const col3X = col2X + col2W;
  const col3W = CONTENT_W - col1W - col2W;

  const contentBottomY = MT + CONTENT_H;

  doc.setLineWidth(0.3);
  doc.line(col2X, bottomY, col2X, contentBottomY);
  doc.line(col3X, bottomY, col3X, contentBottomY);

  // Labels
  const labelY = bottomY + 3.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5);
  doc.text('NOTA FISCAL', col1X + 1.5, labelY);
  doc.text('VOLUME', col2X + 1.5, labelY);
  doc.text('DATA', col3X + 1.5, labelY);

  // Values
  const valueY = bottomY + bottomH / 2 + 2.5;

  doc.setFontSize(6);
  doc.text((invoiceNumber || 'S/N').toUpperCase(), col1X + 1.5, valueY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  const volText = `${volumeNumber}/${totalVolumes}`;
  doc.text(volText, col2X + col2W / 2, valueY, { align: 'center' });

  doc.setFontSize(5.5);
  doc.text(date, col3X + col3W / 2, valueY, { align: 'center' });
}

export async function generateVolumeLabelsPDF(data: LabelData): Promise<jsPDF> {
  const { clientName, totalVolumes, invoiceNumber = '' } = data;
  const currentDate = new Date().toLocaleDateString('pt-BR');

  const logoBase64 = await loadLogoBase64();

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [PAGE_W, PAGE_H],
  });

  // Page 1: Calibration
  drawCalibrationPage(doc);

  // Pages 2+: Actual labels
  for (let i = 0; i < totalVolumes; i++) {
    doc.addPage([PAGE_W, PAGE_H], 'landscape');
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
