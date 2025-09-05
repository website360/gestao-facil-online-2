
import jsPDF from 'jspdf';
import { useBudgetCalculations } from '@/hooks/useBudgetCalculations';
import type { LocalBudget } from '@/hooks/useBudgetManagement';
import { addModernPDFHeader } from './pdfHeaderModern';
import { addModernClientInfo } from './pdfClientInfoModern';
import { addModernItemsTable } from './pdfItemsTableModern';
import { addModernFinancialSummary } from './pdfSummaryModern';
import { addModernPaymentInfo } from './pdfPaymentInfoModern';
import { addModernPDFFooter } from './pdfFooterModern';
import { addNotesSection } from './pdfSections';
import { loadPDFConfig } from './pdfConfigLoader';

export const generateBudgetPDF = async (budget: LocalBudget, calculateBudgetTotal: (budget: LocalBudget) => number) => {
  try {
    console.log('=== GERANDO PDF ===');
    console.log('Budget recebido:', budget);
    
    // Carregar configurações do PDF
    console.log('Carregando configurações do PDF...');
    const config = await loadPDFConfig();
    console.log('Configurações carregadas:', config);
  
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  
  // Apply page margins from config
  const margins = config.page?.margins || { top: 15, right: 15, bottom: 20, left: 15 };

  // Utilitário para moeda BRL
  const formatBRL = (n: number) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Add modern header with config
  let yPosition = await addModernPDFHeader(doc, budget, config);
  
  // Dynamic section ordering based on configuration
  const sectionOrder = config.layout?.sectionOrder || ['clientInfo', 'itemsTable', 'financialSummary', 'paymentInfo', 'notes'];
  const showSections = config.layout?.show || {};
  const sectionSpacing = config.layout?.sectionSpacing || 8;
  
  for (const sectionName of sectionOrder) {
    if (showSections[sectionName] === false) continue;
    
    yPosition += sectionSpacing;
    
    switch (sectionName) {
      case 'clientInfo':
        yPosition = addModernClientInfo(doc, budget, yPosition, config);
        break;
      case 'itemsTable':
        yPosition = addModernItemsTable(doc, budget, yPosition, config);
        break;
      case 'financialSummary':
        yPosition = addModernFinancialSummary(doc, budget, yPosition, config);
        break;
      case 'paymentInfo':
        yPosition = await addModernPaymentInfo(doc, budget, yPosition, config);
        break;
      case 'notes':
        if (budget.notes) {
          yPosition = addNotesSection(doc, budget, yPosition, config);
        }
        break;
    }
  }

  // Invoice information section - moved to after sections but kept for legacy support
  const invoicePercentage = budget.invoice_percentage || 0;
  const totalWithDiscounts = budget.budget_items?.reduce((sum, item) => {
    const itemSubtotal = item.quantity * item.unit_price;
    const itemDiscountPercentage = item.discount_percentage || 0;
    const itemDiscount = itemSubtotal * (itemDiscountPercentage / 100);
    return sum + (itemSubtotal - itemDiscount);
  }, 0) || 0;
  const invoiceValue = totalWithDiscounts * (invoicePercentage / 100);

  if (invoiceValue > 0) {
    const darkColor = hexToRgb(config.colors.dark);
    doc.setTextColor(darkColor.r, darkColor.g, darkColor.b);
    doc.setFontSize(config.fonts.normal + 1);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMAÇÕES DA NOTA FISCAL', 20, yPosition);
    yPosition += 5;
    doc.setFontSize(config.fonts.small);
    doc.setFont('helvetica', 'normal');
    doc.text(`Percentual de Nota Fiscal: ${invoicePercentage}%`, 20, yPosition);
    yPosition += 4;
    doc.text(`Valor da Nota Fiscal: ${formatBRL(invoiceValue)}`, 20, yPosition);
    yPosition += 6;
  }

  // Add modern footer with config
  addModernPDFFooter(doc, config);

    // Generate filename
    const clientName = budget.clients?.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Cliente';
    const date = new Date().toISOString().split('T')[0];
    const filename = `Orcamento_${clientName}_${date}.pdf`;

    console.log('Salvando PDF com nome:', filename);
    doc.save(filename);
    console.log('PDF salvo com sucesso!');
  } catch (error) {
    console.error('Erro detalhado na geração do PDF:', error);
    throw error;
  }
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
