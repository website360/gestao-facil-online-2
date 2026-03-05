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

    // Fundo branco para evitar transparência problemática em impressoras térmicas
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

function drawLabel(
  doc: jsPDF,
  clientName: string,
  invoiceNumber: string,
  volumeNumber: number,
  totalVolumes: number,
  date: string,
  logoBase64: string | null
) {
  // Etiqueta física: 100x78mm
  // Área segura agressiva para Datamax (evita corte superior/direito)
  const ML = 4;
  const MR = 12;
  const MT = 10;
  const MB = 6;
  const PW = 100;
  const PH = 78;
  const contentW = PW - ML - MR; // 84mm
  const contentH = PH - MT - MB; // 62mm

  doc.setTextColor(0, 0, 0);
  doc.setDrawColor(0, 0, 0);

  // Borda externa
  doc.setLineWidth(0.5);
  doc.rect(ML, MT, contentW, contentH);

  // Distribuição vertical equilibrada (rodapé mais compacto)
  const headerH = 10;
  const clientH = 30;
  const bottomH = contentH - headerH - clientH; // 22mm

  const headerY = MT;
  const clientY = MT + headerH;
  const bottomY = clientY + clientH;
  const contentBottomY = MT + contentH;

  // === HEADER ===
  doc.setLineWidth(0.35);
  doc.line(ML, clientY, ML + contentW, clientY);

  if (logoBase64) {
    try {
      const logoW = 8;
      const logoH = 8;
      const logoX = ML + 2;
      const logoY = headerY + (headerH - logoH) / 2;
      doc.addImage(logoBase64, 'JPEG', logoX, logoY, logoW, logoH);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('IRMAOS MANTOVANI TEXTIL', ML + 11.5, headerY + headerH / 2 + 0.8);
    } catch {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.2);
      doc.text('IRMAOS MANTOVANI TEXTIL', ML + contentW / 2, headerY + headerH / 2 + 0.8, { align: 'center' });
    }
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.2);
    doc.text('IRMAOS MANTOVANI TEXTIL', ML + contentW / 2, headerY + headerH / 2 + 0.8, { align: 'center' });
  }

  // === CLIENTE ===
  doc.line(ML, bottomY, ML + contentW, bottomY);

  const lblW = 15;
  doc.line(ML + lblW, clientY, ML + lblW, bottomY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('CLIENTE', ML + 1.8, clientY + clientH / 2 + 0.8);

  doc.setFontSize(8.8);
  const clientText = clientName.toUpperCase();
  const maxW = contentW - lblW - 5;
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

    const lineSpacing = 3.4;
    const totalTextH = (line3 ? 3 : line2 ? 2 : 1) * lineSpacing;
    const startY = clientY + (clientH - totalTextH) / 2 + 2.6;

    doc.text(line1, dataX, startY);
    if (line2) doc.text(line2, dataX, startY + lineSpacing);
    if (line3) {
      const trunc = line3.length > 32 ? `${line3.substring(0, 32)}...` : line3;
      doc.text(trunc, dataX, startY + lineSpacing * 2);
    }
  } else {
    doc.text(clientText, dataX, clientY + clientH / 2 + 0.8);
  }

  // === LINHA INFERIOR: NF | VOLUME | DATA ===
  const col1W = contentW * 0.37;
  const col2W = contentW * 0.30;
  const col3W = contentW - col1W - col2W;

  const col1X = ML;
  const col2X = ML + col1W;
  const col3X = col2X + col2W;

  doc.setLineWidth(0.35);
  doc.line(col2X, bottomY, col2X, contentBottomY);
  doc.line(col3X, bottomY, col3X, contentBottomY);

  // Cabeçalhos da linha inferior
  const labelY = bottomY + 3.8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.text('NOTA FISCAL', col1X + 1.8, labelY);
  doc.text('VOLUME', col2X + 1.8, labelY);
  doc.text('DATA', col3X + 1.8, labelY);

  // Valores reduzidos para evitar excesso visual na 3ª linha
  const valueY = bottomY + bottomH / 2 + 2.6;

  doc.setFontSize(7.2);
  doc.text((invoiceNumber || 'S/N').toUpperCase(), col1X + 1.8, valueY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.8);
  const volText = `${volumeNumber}/${totalVolumes}`;
  doc.text(volText, col2X + col2W / 2, valueY, { align: 'center' });

  doc.setFontSize(6.8);
  doc.text(date, col3X + col3W / 2, valueY, { align: 'center' });
}

export async function generateVolumeLabelsPDF(data: LabelData): Promise<jsPDF> {
  const { clientName, totalVolumes, invoiceNumber = '' } = data;
  const currentDate = new Date().toLocaleDateString('pt-BR');

  // Load logo
  const logoBase64 = await loadLogoBase64();

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [100, 78],
  });

  for (let i = 0; i < totalVolumes; i++) {
    if (i > 0) {
      doc.addPage([100, 78], 'landscape');
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
