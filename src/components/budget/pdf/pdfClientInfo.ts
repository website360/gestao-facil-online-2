
import jsPDF from 'jspdf';
import type { LocalBudget } from '@/hooks/useBudgetManagement';
import type { PDFConfig } from './pdfConfigLoader';

export const addClientInfo = (doc: jsPDF, budget: LocalBudget, yPosition: number, config: PDFConfig) => {
  const pageWidth = doc.internal.pageSize.width;
  const { clientInfo } = config.sections;

  // Client Information Section with configurable styling
  const bgColor = hexToRgb(clientInfo.backgroundColor);
  const primaryColor = hexToRgb(config.colors.primary);
  
  // Calculate section height based on content and padding
  const sectionHeight = 30 + clientInfo.padding.top + clientInfo.padding.bottom;
  
  // Card background
  doc.setFillColor(bgColor.r, bgColor.g, bgColor.b);
  doc.rect(15, yPosition - 2, pageWidth - 30, sectionHeight, 'F');
  
  // Optional border
  if (clientInfo.showBorder) {
    const borderColor = hexToRgb(clientInfo.borderColor);
    doc.setDrawColor(borderColor.r, borderColor.g, borderColor.b);
    doc.setLineWidth(clientInfo.borderWidth);
    doc.rect(15, yPosition - 2, pageWidth - 30, sectionHeight);
  }
  
  // Accent left stripe
  doc.setFillColor(primaryColor.r, primaryColor.g, primaryColor.b);
  doc.rect(15, yPosition - 2, 3, sectionHeight, 'F');
  
  // Section title with configurable margin
  doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
  doc.setFontSize(config.fonts.subtitle);
  doc.setFont('helvetica', 'bold');
  doc.text('DADOS DO CLIENTE', 20 + clientInfo.padding.left, yPosition + 3 + clientInfo.titleMargin.top);
  
  yPosition += clientInfo.titleMargin.top + clientInfo.titleMargin.bottom + 8;
  doc.setFontSize(clientInfo.fontSize);
  
  // Primeira linha: Cliente (esquerda) e E-mail (direita)
  const leftX = 20 + clientInfo.padding.left;
  const rightX = pageWidth / 2 + 5;

  doc.setFont('helvetica', 'bold');
  doc.text('Cliente: ', leftX, yPosition);
  const clientLabelWidth = doc.getTextWidth('Cliente: ');
  doc.setFont('helvetica', 'normal');
  doc.text(budget.clients?.name || 'N/A', leftX + clientLabelWidth, yPosition);

  if (budget.clients?.email) {
    doc.setFont('helvetica', 'bold');
    doc.text('E-mail: ', rightX, yPosition);
    const emailLabelWidth = doc.getTextWidth('E-mail: ');
    doc.setFont('helvetica', 'normal');
    doc.text(budget.clients.email, rightX + emailLabelWidth, yPosition);
  }
  yPosition += clientInfo.lineSpacing;
  
  if (budget.clients?.phone) {
    doc.setFont('helvetica', 'bold');
    doc.text('Telefone: ', 20 + clientInfo.padding.left, yPosition);
    const phoneLabelWidth = doc.getTextWidth('Telefone: ');
    doc.setFont('helvetica', 'normal');
    doc.text(budget.clients.phone, 20 + clientInfo.padding.left + phoneLabelWidth, yPosition);
    yPosition += clientInfo.lineSpacing;
  }

  // Address information - compact format with bold label
  if (budget.clients) {
    const client = budget.clients as any;
    const addressParts = [];
    if (client.street) addressParts.push(client.street);
    if (client.number) addressParts.push(client.number);
    if (client.neighborhood) addressParts.push(client.neighborhood);
    if (client.city) addressParts.push(client.city);
    if (client.state) addressParts.push(client.state);
    if (client.cep) addressParts.push(`CEP: ${client.cep}`);
    
    if (addressParts.length > 0) {
      const addressText = addressParts.join(', ');
      const splitAddress = doc.splitTextToSize(addressText, pageWidth - 40 - clientInfo.padding.left - clientInfo.padding.right);
      
      doc.setFont('helvetica', 'bold');
      doc.text('Endereço: ', 20 + clientInfo.padding.left, yPosition);
      const addressLabelWidth = doc.getTextWidth('Endereço: ');
      doc.setFont('helvetica', 'normal');
      doc.text(splitAddress[0], 20 + clientInfo.padding.left + addressLabelWidth, yPosition);
      
      if (splitAddress.length > 1) {
        yPosition += clientInfo.lineSpacing;
        doc.text(splitAddress.slice(1).join(' '), 20 + clientInfo.padding.left, yPosition);
      }
      yPosition += clientInfo.lineSpacing;
    }
  }

  return yPosition + 8 + clientInfo.padding.bottom;
};

// Helper function to convert hex color to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 240, g: 240, b: 240 }; // Default gray color
}
