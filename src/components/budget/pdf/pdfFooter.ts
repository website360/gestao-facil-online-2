
import jsPDF from 'jspdf';
import type { PDFConfig } from './pdfConfigLoader';

export const addPDFFooter = (doc: jsPDF, config: PDFConfig) => {
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  let yPosition = pageHeight - config.footer.height;

  doc.setDrawColor(200, 200, 200);
  doc.line(20, yPosition, pageWidth - 20, yPosition);
  yPosition += 5;

  // Convert gray color to RGB
  const grayColor = hexToRgb(config.colors.gray);
  doc.setTextColor(grayColor.r, grayColor.g, grayColor.b);
  doc.setFontSize(config.fonts.small);
  doc.text(config.footer.validityText, 20, yPosition);
  yPosition += 5;
  doc.text(config.footer.copyrightText, 20, yPosition);
};

// Helper function to convert hex color to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 107, g: 114, b: 128 }; // Default gray color
}
