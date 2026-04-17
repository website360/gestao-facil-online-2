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

// Minimal margins => usable area: 94 x 56 mm
const ML = 3;
const MR = 3;
const MT = 2;
const MB = 2;

const CONTENT_W = PAGE_W - ML - MR;
const CONTENT_H = PAGE_H - MT - MB;

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
  // Draw directly in the usable area (94x56mm) with no scaling
  const headerH = 10;
  const clientH = 28;
  const bottomH = CONTENT_H - headerH - clientH; // 18mm

  const headerY = MT;
  const clientY = MT + headerH;
  const bottomY = clientY + clientH;

  doc.setTextColor(0, 0, 0);
  doc.setDrawColor(0, 0, 0);

  // Outer border around entire label usable area
  doc.setLineWidth(0.4);
  doc.rect(ML, MT, CONTENT_W, CONTENT_H);

  // Font sizes (real, no scaling)
  const fontCompany = 9;
  const fontLabel = 7;
  const fontClient = 15; // +2pt
  const fontFooterLabel = 6;
  const fontFooterValue = 8;
  const fontVolume = 14; // +4pt
  const fontDate = 11; // +4pt

  // --- Header ---
  doc.setLineWidth(0.3);
  doc.line(ML, clientY, ML + CONTENT_W, clientY);

  if (logoBase64) {
    try {
      const logoW = 7;
      const logoH = 7;
      const logoX = ML + 1;
      const logoY = headerY + (headerH - logoH) / 2;
      doc.addImage(logoBase64, 'JPEG', logoX, logoY, logoW, logoH);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(fontCompany);
      doc.text('IRMAOS MANTOVANI TEXTIL', ML + logoW + 3, headerY + headerH / 2 + 1);
    } catch {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(fontCompany);
      doc.text('IRMAOS MANTOVANI TEXTIL', ML + CONTENT_W / 2, headerY + headerH / 2 + 1, { align: 'center' });
    }
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(fontCompany);
    doc.text('IRMAOS MANTOVANI TEXTIL', ML + CONTENT_W / 2, headerY + headerH / 2 + 1, { align: 'center' });
  }

  // --- Client section ---
  doc.line(ML, bottomY, ML + CONTENT_W, bottomY);

  const lblW = 14;
  doc.line(ML + lblW, clientY, ML + lblW, bottomY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(fontLabel);
  doc.text('CLIENTE', ML + 1, clientY + clientH / 2 + 1);

  doc.setFontSize(fontClient);
  const clientText = clientName.toUpperCase();
  const maxW = CONTENT_W - lblW - 4;
  const dataX = ML + lblW + 2;

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

    const lineSpacing = 4;
    const numLines = line3 ? 3 : line2 ? 2 : 1;
    const totalTextH = numLines * lineSpacing;
    const startY = clientY + (clientH - totalTextH) / 2 + 2;

    doc.text(line1, dataX, startY);
    if (line2) doc.text(line2, dataX, startY + lineSpacing);
    if (line3) {
      const trunc = line3.length > 30 ? `${line3.substring(0, 30)}...` : line3;
      doc.text(trunc, dataX, startY + lineSpacing * 2);
    }
  } else {
    doc.text(clientText, dataX, clientY + clientH / 2 + 1);
  }

  // --- Footer: NF | VOLUME | DATA ---
  const col1W = CONTENT_W * 0.37;
  const col2W = CONTENT_W * 0.30;
  const col3W = CONTENT_W - col1W - col2W;

  const col1X = ML;
  const col2X = ML + col1W;
  const col3X = col2X + col2W;
  const contentBottomY = MT + CONTENT_H;

  doc.setLineWidth(0.3);
  doc.line(col2X, bottomY, col2X, contentBottomY);
  doc.line(col3X, bottomY, col3X, contentBottomY);

  const labelY = bottomY + 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(fontFooterLabel);
  doc.text('NOTA FISCAL', col1X + 2, labelY);
  doc.text('VOLUME', col2X + 2, labelY);
  doc.text('DATA', col3X + 2, labelY);

  const valueY = bottomY + bottomH / 2 + 3;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(fontVolume);
  doc.text((invoiceNumber || 'S/N').toUpperCase(), col1X + 2, valueY);

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

/**
 * Generate a single-label PDF (1 page) for a specific volume number.
 * Used for batched printing to avoid overflowing the printer buffer.
 */
async function getSingleLabelPDFBase64(
  data: LabelData,
  volumeNumber: number,
  logoBase64: string | null
): Promise<string> {
  const { clientName, totalVolumes, invoiceNumber = '' } = data;
  const currentDate = new Date().toLocaleDateString('pt-BR');

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [PAGE_W, PAGE_H],
  });

  drawLabel(doc, clientName, invoiceNumber, volumeNumber, totalVolumes, currentDate, logoBase64);

  const dataUri = doc.output('datauristring');
  return dataUri.split(',')[1];
}

/**
 * Print volume labels in small batches (1 label per job) to avoid
 * overflowing the Datamax printer buffer on large quantities.
 * A short delay between jobs lets the firmware process each label.
 */
export async function printVolumeLabelsDirect(
  data: LabelData
): Promise<{ success: boolean; message: string }> {
  try {
    const { totalVolumes } = data;
    if (totalVolumes <= 0) {
      return { success: false, message: 'Nenhum volume para imprimir.' };
    }

    // Pre-load the logo once and reuse for all labels
    const logoBase64 = await loadLogoBase64();

    const DELAY_BETWEEN_LABELS_MS = 700;
    const failures: string[] = [];

    for (let i = 1; i <= totalVolumes; i++) {
      const singlePdf = await getSingleLabelPDFBase64(data, i, logoBase64);
      const result = await printPdfDirect(singlePdf);

      if (!result.success) {
        failures.push(`Etiqueta ${i}/${totalVolumes}: ${result.message}`);
        // Stop on first failure to avoid spamming the printer
        break;
      }

      // Give the printer time to process before sending the next job
      if (i < totalVolumes) {
        await new Promise((r) => setTimeout(r, DELAY_BETWEEN_LABELS_MS));
      }
    }

    if (failures.length > 0) {
      return {
        success: false,
        message: `Falha na impressão em lote. ${failures.join(' | ')}`,
      };
    }

    return {
      success: true,
      message: `${totalVolumes} etiqueta${totalVolumes > 1 ? 's' : ''} enviada${totalVolumes > 1 ? 's' : ''} para a impressora.`,
    };
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
