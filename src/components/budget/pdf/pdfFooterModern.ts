
import jsPDF from 'jspdf';
import type { PDFConfig } from './pdfConfigLoader';

export const addModernPDFFooter = (doc: jsPDF, config: PDFConfig) => {
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const primaryColor = hexToRgb(config.colors.primary);
  const grayColor = hexToRgb(config.colors.gray);

  let yPosition = pageHeight - 35;

  // Linha decorativa superior
  doc.setDrawColor(primaryColor.r, primaryColor.g, primaryColor.b);
  doc.setLineWidth(1);
  doc.line(25, yPosition, pageWidth - 25, yPosition);

  yPosition += 8;

  // Texto de validade
  doc.setTextColor(grayColor.r, grayColor.g, grayColor.b);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(config.footer.validityText, 25, yPosition);

  yPosition += 8;

  // Copyright centralizado
  const copyrightText = config.footer.copyrightText;
  const copyrightWidth = doc.getTextWidth(copyrightText);
  doc.setFontSize(8);
  doc.text(copyrightText, (pageWidth - copyrightWidth) / 2, yPosition);

  // Decoração simples no canto (sem opacity)
  doc.setFillColor(primaryColor.r, primaryColor.g, primaryColor.b);
  doc.rect(pageWidth - 30, pageHeight - 30, 30, 30, 'F');
};

// Helper function to convert hex color to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 107, g: 114, b: 128 };
}
