import jsPDF from 'jspdf';

/**
 * Generates a PDF with volume labels at exact 100mm x 60mm per page.
 * Uses vector drawing for sharp printing on thermal printers.
 */

interface LabelData {
  clientName: string;
  totalVolumes: number;
  invoiceNumber?: string;
}

function drawLabel(
  doc: jsPDF,
  clientName: string,
  invoiceNumber: string,
  volumeNumber: number,
  totalVolumes: number,
  date: string
) {
  const W = 100; // label width mm
  const H = 60;  // label height mm
  const BORDER = 1.5;
  const MARGIN_X = 3;
  const MARGIN_Y = 2;

  // Outer border
  doc.setLineWidth(0.8);
  doc.setDrawColor(0, 0, 0);
  doc.rect(BORDER, BORDER, W - BORDER * 2, H - BORDER * 2);

  // === HEADER ===
  const headerY = 7;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  
  const headerText = 'IRMAOS   MANTOVANI TEXTIL';
  const headerWidth = doc.getTextWidth(headerText);
  
  // Center the header parts
  const centerX = W / 2;
  
  doc.setFontSize(11);
  doc.text('IRMAOS', centerX - 22, headerY, { align: 'right' });
  doc.text('MANTOVANI', centerX + 2, headerY, { align: 'left' });
  
  doc.setFontSize(9);
  doc.text('TEXTIL', centerX + 2 + doc.getTextWidth('MANTOVANI '), headerY);

  // Separator line
  const sepY = 10;
  doc.setLineWidth(0.3);
  doc.line(MARGIN_X + 1, sepY, W - MARGIN_X - 1, sepY);

  // === CLIENTE field ===
  const clienteLabelY = 16;
  const clienteBoxX = 24;
  const clienteBoxW = W - MARGIN_X - clienteBoxX - 1;
  const clienteBoxH = 10;

  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('CLIENTE', MARGIN_X + 1, clienteLabelY + 4);

  // Client box
  doc.setLineWidth(0.6);
  doc.rect(clienteBoxX, clienteLabelY - 1, clienteBoxW, clienteBoxH);

  // Client name (truncate if needed, support 2 lines)
  doc.setFontSize(9);
  const maxWidth = clienteBoxW - 3;
  const clientText = clientName.toUpperCase();
  
  if (doc.getTextWidth(clientText) > maxWidth) {
    // Split into 2 lines
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
    
    doc.text(line1, clienteBoxX + 1.5, clienteLabelY + 3);
    if (line2) {
      const truncatedLine2 = line2.length > 35 ? line2.substring(0, 35) + '...' : line2;
      doc.text(truncatedLine2, clienteBoxX + 1.5, clienteLabelY + 7);
    }
  } else {
    doc.text(clientText, clienteBoxX + 1.5, clienteLabelY + 5.5);
  }

  // === NOTA FISCAL field ===
  const nfLabelY = 29;
  const nfBoxH = 8;

  doc.setFontSize(8);
  doc.text('NOTA FISCAL', MARGIN_X + 1, nfLabelY + 3.5);

  doc.setLineWidth(0.6);
  doc.rect(clienteBoxX, nfLabelY - 1, clienteBoxW, nfBoxH);

  doc.setFontSize(9);
  doc.text((invoiceNumber || '').toUpperCase(), clienteBoxX + 1.5, nfLabelY + 4);

  // === VOLUME and DATA fields ===
  const bottomY = 41;
  const volBoxX = 20;
  const volBoxW = 16;
  const bottomBoxH = 8;
  const dataLabelX = 42;
  const dataBoxX = 52;
  const dataBoxW = W - MARGIN_X - dataBoxX - 1;

  // VOLUME
  doc.setFontSize(8);
  doc.text('VOLUME', MARGIN_X + 1, bottomY + 3.5);

  doc.setLineWidth(0.6);
  doc.rect(volBoxX, bottomY - 1, volBoxW, bottomBoxH);

  doc.setFontSize(9);
  const volText = `${volumeNumber}/${totalVolumes}`;
  const volTextW = doc.getTextWidth(volText);
  doc.text(volText, volBoxX + (volBoxW - volTextW) / 2, bottomY + 4);

  // DATA
  doc.setFontSize(8);
  doc.text('DATA', dataLabelX, bottomY + 3.5);

  doc.setLineWidth(0.6);
  doc.rect(dataBoxX, bottomY - 1, dataBoxW, bottomBoxH);

  doc.setFontSize(8);
  const dateTextW = doc.getTextWidth(date);
  doc.text(date, dataBoxX + (dataBoxW - dateTextW) / 2, bottomY + 4);
}

export function generateVolumeLabelsPDF(data: LabelData): jsPDF {
  const { clientName, totalVolumes, invoiceNumber = '' } = data;
  const currentDate = new Date().toLocaleDateString('pt-BR');

  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: [100, 60], // exactly 100mm x 60mm
  });

  for (let i = 0; i < totalVolumes; i++) {
    if (i > 0) {
      doc.addPage([100, 60], 'landscape');
    }
    drawLabel(doc, clientName, invoiceNumber, i + 1, totalVolumes, currentDate);
  }

  return doc;
}

export function downloadVolumeLabelsPDF(data: LabelData): void {
  const doc = generateVolumeLabelsPDF(data);
  const safeName = data.clientName
    .replace(/[^a-zA-Z0-9]/g, '_')
    .substring(0, 20);
  doc.save(`etiquetas_${safeName}_${data.totalVolumes}vol.pdf`);
}
