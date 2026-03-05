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
  // Etiqueta física: 100x60mm
  // Área não-imprimível aproximada da Datamax: 30mm topo/esquerda + margem de segurança maior no fundo
  const ML = 30;
  const MR = 2;
  const MT = 30;
  const MB = 14;
  const PW = 100;
  const PH = 78;
  const contentW = PW - ML - MR; // ~68mm
  const contentH = PH - MT - MB; // 16mm úteis

  doc.setTextColor(0, 0, 0);
  doc.setDrawColor(0, 0, 0);

  // Borda externa
  doc.setLineWidth(0.45);
  doc.rect(ML, MT, contentW, contentH);

  // Distribuição vertical compacta com faixa inferior mais alta (evita corte do VOLUME)
  const headerH = 5;
  const clientH = 6;
  const bottomH = contentH - headerH - clientH; // 5mm

  const headerY = MT;
  const clientY = MT + headerH;
  const bottomY = clientY + clientH;
  const contentBottomY = MT + contentH;

  // === HEADER ===
  doc.setLineWidth(0.35);
  doc.line(ML, clientY, ML + contentW, clientY);

  if (logoBase64) {
    try {
      const logoW = 4.4;
      const logoH = 4.4;
      const logoX = ML + 1.2;
      const logoY = headerY + (headerH - logoH) / 2;
      doc.addImage(logoBase64, 'JPEG', logoX, logoY, logoW, logoH);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.8);
      doc.text('IRMAOS MANTOVANI TEXTIL', ML + 6.8, headerY + headerH / 2 + 0.6);
    } catch {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.9);
      doc.text('IRMAOS MANTOVANI TEXTIL', ML + contentW / 2, headerY + headerH / 2 + 0.6, { align: 'center' });
    }
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(5.9);
    doc.text('IRMAOS MANTOVANI TEXTIL', ML + contentW / 2, headerY + headerH / 2 + 0.6, { align: 'center' });
  }

  // === CLIENTE ===
  doc.line(ML, bottomY, ML + contentW, bottomY);

  const lblW = 11;
  doc.line(ML + lblW, clientY, ML + lblW, bottomY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.7);
  doc.text('CLIENTE', ML + 0.8, clientY + clientH / 2 + 0.6);

  doc.setFontSize(6.6);
  const clientText = clientName.toUpperCase();
  const maxW = contentW - lblW - 1.6;
  const dataX = ML + lblW + 0.8;

  if (doc.getTextWidth(clientText) > maxW) {
    const words = clientText.split(' ');
    let line1 = '';
    let line2 = '';
    let onL1 = true;

    for (const w of words) {
      const test = line1 + (line1 ? ' ' : '') + w;
      if (onL1 && doc.getTextWidth(test) <= maxW) {
        line1 = test;
      } else {
        onL1 = false;
        line2 += (line2 ? ' ' : '') + w;
      }
    }

    doc.text(line1, dataX, clientY + 2.5);
    if (line2) {
      const trunc = line2.length > 24 ? `${line2.substring(0, 24)}...` : line2;
      doc.text(trunc, dataX, clientY + 5.0);
    }
  } else {
    doc.text(clientText, dataX, clientY + clientH / 2 + 0.8);
  }

  // === LINHA INFERIOR: NF | VOLUME | DATA ===
  const col1W = contentW * 0.38;
  const col2W = contentW * 0.30;
  const col3W = contentW - col1W - col2W;

  const col1X = ML;
  const col2X = ML + col1W;
  const col3X = col2X + col2W;

  doc.setLineWidth(0.35);
  doc.line(col2X, bottomY, col2X, contentBottomY);
  doc.line(col3X, bottomY, col3X, contentBottomY);

  // Cabeçalhos da linha inferior
  const labelY = bottomY + 1.6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(5.4);
  doc.text('NOTA FISCAL', col1X + 0.8, labelY);
  doc.text('VOLUME', col2X + 0.8, labelY);
  doc.text('DATA', col3X + 0.8, labelY);

  // Valores da linha inferior (subidos para evitar corte)
  const valueY = bottomY + bottomH - 0.8;

  doc.setFontSize(6.3);
  doc.text((invoiceNumber || 'S/N').toUpperCase(), col1X + 0.8, valueY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  const volText = `${volumeNumber}/${totalVolumes}`;
  doc.text(volText, col2X + col2W / 2, valueY, { align: 'center' });

  doc.setFontSize(5.8);
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
    format: [100, 60],
  });

  for (let i = 0; i < totalVolumes; i++) {
    if (i > 0) {
      doc.addPage([100, 60], 'landscape');
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
