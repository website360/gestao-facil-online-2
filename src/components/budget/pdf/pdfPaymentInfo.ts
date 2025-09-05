import jsPDF from 'jspdf';
import { getPaymentMethodText, getPaymentTypeText, getShippingOptionText } from './pdfHelpers';
import { formatDueDatesText } from '@/utils/dateCalculations';
import type { LocalBudget } from '@/hooks/useBudgetManagement';
import type { PDFConfig } from './pdfConfigLoader';

export const addPaymentInfo = async (doc: jsPDF, budget: LocalBudget, yPosition: number, config: PDFConfig) => {
  const pageWidth = doc.internal.pageSize.width;
  const { paymentInfo } = config.sections;

  // Payment and Shipping Information Section with configurable styling
  const bgColor = hexToRgb(paymentInfo.backgroundColor);
  const primaryColor = hexToRgb(config.colors.primary);
  
  // Calculate section height based on content and padding
  let sectionHeight = 38 + paymentInfo.padding.top + paymentInfo.padding.bottom;
  
  // Add extra height if local delivery info is present
  if (budget.local_delivery_info) {
    sectionHeight += 12; // Add space for local delivery info
  }
  
  // Card background
  doc.setFillColor(bgColor.r, bgColor.g, bgColor.b);
  doc.rect(15, yPosition - 2, pageWidth - 30, sectionHeight, 'F');
  
  // Optional border
  if (paymentInfo.showBorder) {
    const borderColor = hexToRgb(paymentInfo.borderColor);
    doc.setDrawColor(borderColor.r, borderColor.g, borderColor.b);
    doc.setLineWidth(paymentInfo.borderWidth);
    doc.rect(15, yPosition - 2, pageWidth - 30, sectionHeight);
  }
  
  // Accent left stripe
  doc.setFillColor(primaryColor.r, primaryColor.g, primaryColor.b);
  doc.rect(15, yPosition - 2, 3, sectionHeight, 'F');
  
  // Section title with configurable margin
  doc.setTextColor(primaryColor.r, primaryColor.g, primaryColor.b);
  doc.setFontSize(config.fonts.subtitle);
  doc.setFont('helvetica', 'bold');
  doc.text('INFORMAÇÕES DE PAGAMENTO E FRETE', 20 + paymentInfo.padding.left, yPosition + 3 + paymentInfo.titleMargin.top);
  
  yPosition += paymentInfo.titleMargin.top + paymentInfo.titleMargin.bottom + 8;
  doc.setFontSize(paymentInfo.fontSize);
  
  // Primeira linha: Meio de Pagamento (esq.) e Tipo de Pagamento (dir.)
  const leftX = 20 + paymentInfo.padding.left;
  const rightX = pageWidth / 2 + 5;

  const paymentMethodName = await getPaymentMethodText(budget.payment_method_id);
  doc.setFont('helvetica', 'bold');
  doc.text('Meio de Pagamento: ', leftX, yPosition);
  const paymentMethodLabelWidth = doc.getTextWidth('Meio de Pagamento: ');
  doc.setFont('helvetica', 'normal');
  doc.text(paymentMethodName, leftX + paymentMethodLabelWidth, yPosition);

  const paymentTypeName = await getPaymentTypeText(budget.payment_type_id);
  doc.setFont('helvetica', 'bold');
  doc.text('Tipo de Pagamento: ', rightX, yPosition);
  const paymentTypeLabelWidth = doc.getTextWidth('Tipo de Pagamento: ');
  doc.setFont('helvetica', 'normal');
  doc.text(paymentTypeName, rightX + paymentTypeLabelWidth, yPosition);
  yPosition += paymentInfo.lineSpacing;
  
  // Check which payment method is selected based on the name
  const isCreditCard = paymentMethodName.toLowerCase().includes('cartão de crédito') || 
                      paymentMethodName.toLowerCase().includes('cartao de credito');
  const isCheck = paymentMethodName.toLowerCase().includes('cheque');
  const isBoleto = paymentMethodName.toLowerCase().includes('boleto');
  
  // Show installments only for the selected payment method
  if (isCreditCard && budget.installments && budget.installments > 1) {
    doc.setFont('helvetica', 'bold');
    doc.text('Parcelas: ', 20 + paymentInfo.padding.left, yPosition);
    const installmentsLabelWidth = doc.getTextWidth('Parcelas: ');
    doc.setFont('helvetica', 'normal');
    doc.text(`${budget.installments}x`, 20 + paymentInfo.padding.left + installmentsLabelWidth, yPosition);
    yPosition += paymentInfo.lineSpacing;
  }
  
  if (isCheck && budget.check_installments && budget.check_installments > 1) {
    doc.setFont('helvetica', 'bold');
    doc.text('Parcelas de Cheque: ', 20 + paymentInfo.padding.left, yPosition);
    const checkInstallmentsLabelWidth = doc.getTextWidth('Parcelas de Cheque: ');
    doc.setFont('helvetica', 'normal');
    doc.text(`${budget.check_installments}x`, 20 + paymentInfo.padding.left + checkInstallmentsLabelWidth, yPosition);
    yPosition += paymentInfo.lineSpacing;
    
    if (budget.check_due_dates && budget.check_due_dates.length > 0) {
      const checkDates = formatDueDatesText(budget.created_at, budget.check_due_dates);
      doc.setFont('helvetica', 'bold');
      doc.text('Prazos de Cheque: ', 20 + paymentInfo.padding.left, yPosition);
      const checkDatesLabelWidth = doc.getTextWidth('Prazos de Cheque: ');
      doc.setFont('helvetica', 'normal');
      
      // Handle text wrapping for long dates
      const maxWidth = doc.internal.pageSize.width - 30 - paymentInfo.padding.left - paymentInfo.padding.right - checkDatesLabelWidth;
      const checkDatesLines = doc.splitTextToSize(checkDates, maxWidth);
      
      if (Array.isArray(checkDatesLines)) {
        doc.text(checkDatesLines[0], 20 + paymentInfo.padding.left + checkDatesLabelWidth, yPosition);
        for (let i = 1; i < checkDatesLines.length && i < 3; i++) {
          yPosition += paymentInfo.lineSpacing;
          doc.text(checkDatesLines[i], 20 + paymentInfo.padding.left + checkDatesLabelWidth, yPosition);
        }
      } else {
        doc.text(checkDatesLines, 20 + paymentInfo.padding.left + checkDatesLabelWidth, yPosition);
      }
      yPosition += paymentInfo.lineSpacing;
    }
  }
  
  if (isBoleto && budget.boleto_installments && budget.boleto_installments > 1) {
    doc.setFont('helvetica', 'bold');
    doc.text('Parcelas de Boleto: ', 20 + paymentInfo.padding.left, yPosition);
    const boletoInstallmentsLabelWidth = doc.getTextWidth('Parcelas de Boleto: ');
    doc.setFont('helvetica', 'normal');
    doc.text(`${budget.boleto_installments}x`, 20 + paymentInfo.padding.left + boletoInstallmentsLabelWidth, yPosition);
    yPosition += paymentInfo.lineSpacing;
    
    if (budget.boleto_due_dates && budget.boleto_due_dates.length > 0) {
      const boletoDates = formatDueDatesText(budget.created_at, budget.boleto_due_dates);
      doc.setFont('helvetica', 'bold');
      doc.text('Prazos de Boleto: ', 20 + paymentInfo.padding.left, yPosition);
      const boletoDatesLabelWidth = doc.getTextWidth('Prazos de Boleto: ');
      doc.setFont('helvetica', 'normal');
      
      // Handle text wrapping for long dates
      const maxWidth = doc.internal.pageSize.width - 30 - paymentInfo.padding.left - paymentInfo.padding.right - boletoDatesLabelWidth;
      const boletoDatesLines = doc.splitTextToSize(boletoDates, maxWidth);
      
      if (Array.isArray(boletoDatesLines)) {
        doc.text(boletoDatesLines[0], 20 + paymentInfo.padding.left + boletoDatesLabelWidth, yPosition);
        for (let i = 1; i < boletoDatesLines.length && i < 3; i++) {
          yPosition += paymentInfo.lineSpacing;
          doc.text(boletoDatesLines[i], 20 + paymentInfo.padding.left + boletoDatesLabelWidth, yPosition);
        }
      } else {
        doc.text(boletoDatesLines, 20 + paymentInfo.padding.left + boletoDatesLabelWidth, yPosition);
      }
      yPosition += paymentInfo.lineSpacing;
    }
  }
  
  // Opção de frete (esq.) e Custo de Frete (dir.)
  const shippingOptionName = await getShippingOptionText(budget.shipping_option_id);
  doc.setFont('helvetica', 'bold');
  doc.text('Opção de Frete: ', leftX, yPosition);
  const shippingOptionLabelWidth = doc.getTextWidth('Opção de Frete: ');
  doc.setFont('helvetica', 'normal');
  doc.text(shippingOptionName, leftX + shippingOptionLabelWidth, yPosition);
  
  const shippingCost = budget.shipping_cost || 0;
  const formatBRL = (n: number) => `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  doc.setFont('helvetica', 'bold');
  doc.text('Custo de Frete: ', rightX, yPosition);
  const shippingCostLabelWidth = doc.getTextWidth('Custo de Frete: ');
  doc.setFont('helvetica', 'normal');
  doc.text(formatBRL(shippingCost), rightX + shippingCostLabelWidth, yPosition);
  yPosition += paymentInfo.lineSpacing + 2;

  // Local Delivery Information with bold label (if present)
  if (budget.local_delivery_info) {
    doc.setFont('helvetica', 'bold');
    doc.text('Informações da Entrega: ', 20 + paymentInfo.padding.left, yPosition);
    const localDeliveryLabelWidth = doc.getTextWidth('Informações da Entrega: ');
    doc.setFont('helvetica', 'normal');
    
    // Handle text wrapping for long local delivery info
    const maxWidth = pageWidth - 30 - paymentInfo.padding.left - paymentInfo.padding.right - localDeliveryLabelWidth;
    const localDeliveryLines = doc.splitTextToSize(budget.local_delivery_info, maxWidth);
    
    if (Array.isArray(localDeliveryLines)) {
      doc.text(localDeliveryLines[0], 20 + paymentInfo.padding.left + localDeliveryLabelWidth, yPosition);
      // Add additional lines if needed
      for (let i = 1; i < localDeliveryLines.length && i < 2; i++) {
        yPosition += paymentInfo.lineSpacing;
        doc.text(localDeliveryLines[i], 20 + paymentInfo.padding.left + localDeliveryLabelWidth, yPosition);
      }
    } else {
      doc.text(localDeliveryLines, 20 + paymentInfo.padding.left + localDeliveryLabelWidth, yPosition);
    }
    yPosition += 8;
  }

  return yPosition + paymentInfo.padding.bottom;
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
