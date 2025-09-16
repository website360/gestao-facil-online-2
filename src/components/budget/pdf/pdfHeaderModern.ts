
import jsPDF from 'jspdf';
import type { LocalBudget } from '@/hooks/useBudgetManagement';
import type { PDFConfig } from './pdfConfigLoader';
import { formatBudgetId } from '@/lib/budgetFormatter';

export const addModernPDFHeader = async (doc: jsPDF, budget: LocalBudget, config: PDFConfig) => {
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  let yPosition = 20;

  // Cores
  const primaryColor = hexToRgb(config.colors.primary);
  const darkColor = hexToRgb(config.colors.dark);
  const grayColor = hexToRgb(config.colors.gray);

  // Header moderno com fundo colorido
  doc.setFillColor(primaryColor.r, primaryColor.g, primaryColor.b);
  doc.rect(0, 0, pageWidth, 45, 'F');

  // Logo placeholder ou nome da empresa (lado esquerdo)
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(config.header.companyName, 25, 22);

  // Título "PROPOSTA COMERCIAL" centralizado
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  const titleText = config.header.titleText || 'PROPOSTA COMERCIAL';
  const titleWidth = doc.getTextWidth(titleText);
  doc.text(titleText, (pageWidth - titleWidth) / 2, 32);

  // Número do orçamento (lado direito)
  const budgetNumber = formatBudgetId(budget.id, budget.created_at);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  const numberWidth = doc.getTextWidth(budgetNumber);
  doc.text(budgetNumber, pageWidth - 25 - numberWidth, 22);

  // Data (lado direito, abaixo do número)
  const dateText = new Date(budget.created_at).toLocaleDateString('pt-BR');
  const dateWidth = doc.getTextWidth(dateText);
  doc.text(dateText, pageWidth - 25 - dateWidth, 32);

  yPosition = 55;

  // Linha decorativa
  doc.setDrawColor(primaryColor.r, primaryColor.g, primaryColor.b);
  doc.setLineWidth(2);
  doc.line(25, yPosition, pageWidth - 25, yPosition);

  // Informações do vendedor (abaixo da linha)
  yPosition += 12;
  doc.setTextColor(grayColor.r, grayColor.g, grayColor.b);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const vendedorName = budget.creator_profile?.name || 'Vendedor não identificado';
  doc.text(`Responsável: ${vendedorName}`, 25, yPosition);

  return yPosition + 15;
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
