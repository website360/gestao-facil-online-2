import jsPDF from 'jspdf';
import type { LocalBudget } from '@/hooks/useBudgetManagement';
import type { PDFConfig } from './pdfConfigLoader';

export const addModernPaymentInfo = async (doc: jsPDF, budget: LocalBudget, yPosition: number, config: PDFConfig) => {
  const pageWidth = doc.internal.pageSize.width;
  const primaryColor = hexToRgb(config.colors.primary);
  const darkColor = hexToRgb(config.colors.dark);
  const grayColor = hexToRgb(config.colors.gray);

  // Card moderno para informações de pagamento
  const cardPadding = 20;
  const cardHeight = 75;
  
  // Background do card
  doc.setFillColor(248, 250, 252);
  doc.rect(25, yPosition, pageWidth - 50, cardHeight, 'F');
  
  // Borda sutil
  doc.setDrawColor(230, 230, 230);
  doc.setLineWidth(0.5);
  doc.rect(25, yPosition, pageWidth - 50, cardHeight);

  // Barra lateral colorida
  doc.setFillColor(primaryColor.r, primaryColor.g, primaryColor.b);
  doc.rect(25, yPosition, 4, cardHeight, 'F');

  // Título da seção
  doc.setTextColor(darkColor.r, darkColor.g, darkColor.b);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('CONDIÇÕES DE PAGAMENTO', 35, yPosition + 15);

  const contentY = yPosition + 25;
  const leftColumn = 35;
  const rightColumn = (pageWidth / 2) + 10;

  // Layout em duas colunas
  doc.setFontSize(10);
  doc.setTextColor(darkColor.r, darkColor.g, darkColor.b);

  // Coluna esquerda - Método e Tipo de Pagamento
  if (budget.payment_method_id) {
    doc.setFont('helvetica', 'bold');
    doc.text('Método:', leftColumn, contentY);
    doc.setFont('helvetica', 'normal');
    doc.text(getPaymentMethodText(budget.payment_method_id), leftColumn, contentY + 8);
  }

  if (budget.payment_type_id) {
    doc.setFont('helvetica', 'bold');
    doc.text('Tipo:', leftColumn, contentY + 20);
    doc.setFont('helvetica', 'normal');
    doc.text(getPaymentTypeText(budget.payment_type_id), leftColumn, contentY + 28);
  }

  // Coluna direita - Parcelas e Vencimentos
  if (budget.installments && budget.installments > 1) {
    doc.setFont('helvetica', 'bold');
    doc.text('Parcelas:', rightColumn, contentY);
    doc.setFont('helvetica', 'normal');
    doc.text(`${budget.installments}x`, rightColumn, contentY + 8);
  }

  // Vencimentos
  if (budget.payment_method_id && ['check', 'boleto'].includes(budget.payment_method_id)) {
    const dueDatesText = formatDueDatesText(budget);
    if (dueDatesText) {
      doc.setFont('helvetica', 'bold');
      doc.text('Vencimentos:', rightColumn, contentY + 20);
      doc.setFont('helvetica', 'normal');
      
      const maxWidth = (pageWidth / 2) - 40;
      const splitText = doc.splitTextToSize(dueDatesText, maxWidth);
      doc.text(splitText, rightColumn, contentY + 28);
    }
  }

  // Informações de frete (se houver)
  if (budget.shipping_option_id || budget.shipping_cost) {
    let shippingY = yPosition + cardHeight + 15;
    
    // Card menor para informações de frete
    const shippingCardHeight = 45;
    doc.setFillColor(252, 252, 252);
    doc.rect(25, shippingY, pageWidth - 50, shippingCardHeight, 'F');
    
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.5);
    doc.rect(25, shippingY, pageWidth - 50, shippingCardHeight);

    // Barra lateral para frete (sem opacity)
    doc.setFillColor(primaryColor.r, primaryColor.g, primaryColor.b);
    doc.rect(25, shippingY, 4, shippingCardHeight, 'F');

    // Título do frete
    doc.setTextColor(darkColor.r, darkColor.g, darkColor.b);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('ENTREGA E FRETE', 35, shippingY + 12);

    const shippingContentY = shippingY + 22;

    if (budget.shipping_option_id) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Modalidade:', 35, shippingContentY);
      doc.setFont('helvetica', 'normal');
      doc.text(getShippingOptionText(budget.shipping_option_id), 35, shippingContentY + 8);
    }

    if (budget.shipping_cost && budget.shipping_cost > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text('Valor do Frete:', rightColumn, shippingContentY);
      doc.setFont('helvetica', 'normal');
      doc.text(formatCurrency(budget.shipping_cost), rightColumn, shippingContentY + 8);
    }

    // Entrega local (se disponível)
    if (budget.local_delivery_info) {
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(grayColor.r, grayColor.g, grayColor.b);
      doc.text(`* ${budget.local_delivery_info}`, 35, shippingY + shippingCardHeight - 8);
    }

    return shippingY + shippingCardHeight + 20;
  }

  return yPosition + cardHeight + 20;
};

// Helper functions
const getPaymentMethodText = (method: string): string => {
  const methods: Record<string, string> = {
    'cash': 'Dinheiro',
    'card': 'Cartão',
    'pix': 'PIX',
    'check': 'Cheque',
    'boleto': 'Boleto',
    'transfer': 'Transferência'
  };
  return methods[method] || method;
};

const getPaymentTypeText = (type: string): string => {
  const types: Record<string, string> = {
    'cash': 'À Vista',
    'installments': 'Parcelado'
  };
  return types[type] || type;
};

const getShippingOptionText = (option: string): string => {
  const options: Record<string, string> = {
    'pickup': 'Retirada no Local',
    'delivery': 'Entrega',
    'correios': 'Correios',
    'transportadora': 'Transportadora'
  };
  return options[option] || option;
};

const formatDueDatesText = (budget: LocalBudget): string => {
  // Para cheques
  if (budget.check_due_dates && budget.check_due_dates.length > 0) {
    return budget.check_due_dates
      .map(days => {
        const date = new Date();
        date.setDate(date.getDate() + days);
        return date.toLocaleDateString('pt-BR');
      })
      .join(', ');
  }
  
  // Para boletos
  if (budget.boleto_due_dates && budget.boleto_due_dates.length > 0) {
    return budget.boleto_due_dates
      .map(days => {
        const date = new Date();
        date.setDate(date.getDate() + days);
        return date.toLocaleDateString('pt-BR');
      })
      .join(', ');
  }
  
  return '';
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
  } : { r: 240, g: 240, b: 240 };
}