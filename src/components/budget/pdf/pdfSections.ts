import jsPDF from 'jspdf';
import type { LocalBudget } from '@/hooks/useBudgetManagement';
import type { PDFConfig } from './pdfConfigLoader';

// Financial Summary Section
export const addFinancialSummary = (doc: jsPDF, budget: LocalBudget, yPosition: number, config: PDFConfig) => {
  const pageWidth = doc.internal.pageSize.width;
  const { financialSummary } = config.sections;
  
  // Utility function for BRL currency formatting
  const formatBRL = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Financial summary calculations
  const subtotal = budget.budget_items?.reduce((sum, item) => {
    return sum + (item.quantity * item.unit_price);
  }, 0) || 0;

  const totalWithDiscounts = budget.budget_items?.reduce((sum, item) => {
    const itemSubtotal = item.quantity * item.unit_price;
    const itemDiscountPercentage = item.discount_percentage || 0;
    const itemDiscount = itemSubtotal * (itemDiscountPercentage / 100);
    return sum + (itemSubtotal - itemDiscount);
  }, 0) || 0;

  const shippingCost = budget.shipping_cost || 0;
  const invoicePercentage = budget.invoice_percentage || 0;
  const invoiceValue = totalWithDiscounts * (invoicePercentage / 100);
  const finalTotal = totalWithDiscounts + shippingCost + invoiceValue;

  // Section title
  const darkColor = hexToRgb(config.colors.dark);
  doc.setTextColor(darkColor.r, darkColor.g, darkColor.b);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(config.fonts.subtitle);
  doc.text('RESUMO FINANCEIRO', 20, yPosition);
  yPosition += 6;

  // Summary background
  doc.setFillColor(249, 249, 249);
  doc.rect(15, yPosition - 1, pageWidth - 30, 24, 'F');
  
  // Summary texts
  doc.setTextColor(darkColor.r, darkColor.g, darkColor.b);
  doc.setFontSize(financialSummary.fontSize);
  doc.setFont('helvetica', 'normal');
  
  // Subtotal (without discounts)
  doc.setFont('helvetica', 'bold');
  doc.text('Subtotal (sem descontos): ', 20, yPosition + 4);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(financialSummary.labelFontSize);
  doc.text(formatBRL(subtotal), pageWidth - 15, yPosition + 4, { align: 'right' });
  yPosition += financialSummary.lineSpacing;
  
  // Total with Individual Discounts
  doc.setFontSize(financialSummary.fontSize);
  doc.setFont('helvetica', 'bold');
  doc.text('Total com Descontos Individuais: ', 20, yPosition + 4);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(financialSummary.labelFontSize);
  doc.text(formatBRL(totalWithDiscounts), pageWidth - 15, yPosition + 4, { align: 'right' });
  yPosition += financialSummary.lineSpacing;
  
  // Shipping cost (if any)
  if (shippingCost > 0) {
    doc.setFontSize(financialSummary.fontSize);
    doc.setFont('helvetica', 'bold');
    doc.text('Custo de Frete: ', 20, yPosition + 4);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(financialSummary.labelFontSize);
    doc.text(formatBRL(shippingCost), pageWidth - 15, yPosition + 4, { align: 'right' });
    yPosition += financialSummary.lineSpacing;
  }
  
  yPosition += 3;

  // Total General - highlighted in primary color
  const primaryColor = hexToRgb(config.colors.primary);
  doc.setFillColor(primaryColor.r, primaryColor.g, primaryColor.b);
  const totalBoxHeight = 10;
  doc.rect(15, yPosition - 1, pageWidth - 30, totalBoxHeight, 'F');
  const totalColor = hexToRgb(financialSummary.totalColor);
  doc.setTextColor(totalColor.r, totalColor.g, totalColor.b);
  doc.setFontSize(financialSummary.totalFontSize);
  doc.setFont('helvetica', 'bold');
  
  const textVerticalCenter = yPosition + (totalBoxHeight / 2) - 1;
  doc.text('Total Geral:', 20, textVerticalCenter);
  doc.text(formatBRL(finalTotal), pageWidth - 15, textVerticalCenter, { align: 'right' });

  return yPosition + 14;
};

// Notes Section
export const addNotesSection = (doc: jsPDF, budget: LocalBudget, yPosition: number, config: PDFConfig) => {
  if (!budget.notes) return yPosition;

  const pageWidth = doc.internal.pageSize.width;
  const primaryColor = hexToRgb(config.colors.primary);
  const darkColor = hexToRgb(config.colors.dark);
  const grayColor = hexToRgb(config.colors.gray);

  // Card moderno para observações
  const notesText = budget.notes;
  const maxWidth = pageWidth - 70;
  const splitNotes = doc.splitTextToSize(notesText, maxWidth);
  const cardHeight = 35 + (splitNotes.length * 5);
  
  // Background do card
  doc.setFillColor(255, 248, 220); // Cor amarelo suave para destacar
  doc.rect(25, yPosition, pageWidth - 50, cardHeight, 'F');
  
  // Borda sutil
  doc.setDrawColor(250, 204, 21); // Borda dourada
  doc.setLineWidth(0.5);
  doc.rect(25, yPosition, pageWidth - 50, cardHeight);

  // Barra lateral colorida
  doc.setFillColor(250, 204, 21);
  doc.rect(25, yPosition, 4, cardHeight, 'F');

  // Título da seção
  doc.setTextColor(darkColor.r, darkColor.g, darkColor.b);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('OBSERVAÇÕES IMPORTANTES', 35, yPosition + 15);

  // Conteúdo das observações
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(darkColor.r, darkColor.g, darkColor.b);
  doc.text(splitNotes, 35, yPosition + 28);

  return yPosition + cardHeight + 15;
};

// Helper function to convert hex color to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 31, g: 41, b: 55 }; // Default dark color
}