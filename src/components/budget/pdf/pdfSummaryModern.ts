import jsPDF from 'jspdf';
import type { LocalBudget } from '@/hooks/useBudgetManagement';
import type { PDFConfig } from './pdfConfigLoader';

export const addModernFinancialSummary = (doc: jsPDF, budget: LocalBudget, yPosition: number, config: PDFConfig) => {
  const pageWidth = doc.internal.pageSize.width;
  const primaryColor = hexToRgb(config.colors.primary);
  const darkColor = hexToRgb(config.colors.dark);
  const grayColor = hexToRgb(config.colors.gray);

  // Calcular totais
  const subtotal = budget.budget_items?.reduce((sum, item) => {
    return sum + (item.quantity * item.unit_price);
  }, 0) || 0;

  const totalDiscounts = budget.budget_items?.reduce((sum, item) => {
    const itemSubtotal = item.quantity * item.unit_price;
    const itemDiscountPercentage = item.discount_percentage || 0;
    return sum + (itemSubtotal * (itemDiscountPercentage / 100));
  }, 0) || 0;

  const totalWithDiscounts = subtotal - totalDiscounts;
  const shippingCost = budget.shipping_cost || 0;
  const finalTotal = totalWithDiscounts + shippingCost;

  // Card moderno para resumo financeiro
  const cardWidth = 200;
  const cardHeight = 80;
  const cardX = pageWidth - cardWidth - 25;
  
  // Background do card
  doc.setFillColor(248, 250, 252);
  doc.rect(cardX, yPosition, cardWidth, cardHeight, 'F');
  
  // Borda
  doc.setDrawColor(230, 230, 230);
  doc.setLineWidth(0.5);
  doc.rect(cardX, yPosition, cardWidth, cardHeight);

  // Header do card
  doc.setFillColor(primaryColor.r, primaryColor.g, primaryColor.b);
  doc.rect(cardX, yPosition, cardWidth, 15, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('RESUMO FINANCEIRO', cardX + 10, yPosition + 10);

  // Conteúdo do resumo
  let summaryY = yPosition + 25;
  doc.setTextColor(darkColor.r, darkColor.g, darkColor.b);
  doc.setFontSize(9);

  // Subtotal
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', cardX + 10, summaryY);
  doc.text(formatCurrency(subtotal), cardX + cardWidth - 10, summaryY, { align: 'right' });

  // Descontos (se houver)
  if (totalDiscounts > 0) {
    summaryY += 8;
    doc.text('Descontos:', cardX + 10, summaryY);
    doc.text(`-${formatCurrency(totalDiscounts)}`, cardX + cardWidth - 10, summaryY, { align: 'right' });
  }

  // Frete (se houver)
  if (shippingCost > 0) {
    summaryY += 8;
    doc.text('Frete:', cardX + 10, summaryY);
    doc.text(formatCurrency(shippingCost), cardX + cardWidth - 10, summaryY, { align: 'right' });
  }

  // Linha separadora
  summaryY += 10;
  doc.setDrawColor(primaryColor.r, primaryColor.g, primaryColor.b);
  doc.setLineWidth(1);
  doc.line(cardX + 10, summaryY, cardX + cardWidth - 10, summaryY);

  // Total final
  summaryY += 8;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
  doc.text('TOTAL:', cardX + 10, summaryY);
  doc.text(formatCurrency(finalTotal), cardX + cardWidth - 10, summaryY, { align: 'right' });

  return Math.max(yPosition + cardHeight + 20, summaryY + 20);
};

const formatCurrency = (value: number): string => {
  return value.toLocaleString('pt-BR', { 
    style: 'currency', 
    currency: 'BRL', 
    minimumFractionDigits: 2,
    maximumFractionDigits: 2 
  });
};

// Helper function to convert hex color to RGB
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 31, g: 41, b: 55 };
}