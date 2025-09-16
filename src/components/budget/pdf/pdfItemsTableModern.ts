import jsPDF from 'jspdf';
import type { LocalBudget } from '@/hooks/useBudgetManagement';
import type { PDFConfig } from './pdfConfigLoader';

export const addModernItemsTable = (doc: jsPDF, budget: LocalBudget, yPosition: number, config: PDFConfig) => {
  const pageWidth = doc.internal.pageSize.width;
  const primaryColor = hexToRgb(config.colors.primary);
  const darkColor = hexToRgb(config.colors.dark);
  const grayColor = hexToRgb(config.colors.gray);

  const tableConfig = config.table || {
    showColumns: { quantity: true, unitPrice: true, discount: true, total: true },
    columnWidths: { item: 65, quantity: 10, unitPrice: 15, discount: 10, total: 15 }
  };

  // Título da seção
  doc.setTextColor(darkColor.r, darkColor.g, darkColor.b);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('ITENS DO ORÇAMENTO', 25, yPosition);

  yPosition += 15;

  // Cabeçalho da tabela moderno
  const headerHeight = 12;
  doc.setFillColor(primaryColor.r, primaryColor.g, primaryColor.b);
  doc.rect(25, yPosition, pageWidth - 50, headerHeight, 'F');

  // Definir posições das colunas baseado na configuração
  const totalWidth = pageWidth - 50;
  const itemWidth = (totalWidth * tableConfig.columnWidths.item) / 100;
  const qtyWidth = tableConfig.showColumns.quantity ? (totalWidth * tableConfig.columnWidths.quantity) / 100 : 0;
  const priceWidth = tableConfig.showColumns.unitPrice ? (totalWidth * tableConfig.columnWidths.unitPrice) / 100 : 0;
  const discountWidth = tableConfig.showColumns.discount ? (totalWidth * tableConfig.columnWidths.discount) / 100 : 0;

  let xPos = 25;
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');

  // Headers
  doc.text('PRODUTO/SERVIÇO', xPos + 5, yPosition + 8);
  xPos += itemWidth;

  if (tableConfig.showColumns.quantity) {
    doc.text('QTD', xPos + 5, yPosition + 8);
    xPos += qtyWidth;
  }

  if (tableConfig.showColumns.unitPrice) {
    doc.text('VALOR UNIT.', xPos + 5, yPosition + 8);
    xPos += priceWidth;
  }

  if (tableConfig.showColumns.discount) {
    doc.text('DESC.', xPos + 5, yPosition + 8);
    xPos += discountWidth;
  }

  if (tableConfig.showColumns.total) {
    doc.text('TOTAL', pageWidth - 50, yPosition + 8, { align: 'right' });
  }

  yPosition += headerHeight;

  // Linhas da tabela
  const rowHeight = 15;
  budget.budget_items?.forEach((item, index) => {
    // Verificar se precisa de nova página
    if (yPosition + rowHeight > 250) {
      doc.addPage();
      yPosition = 20;
      
      // Recriar cabeçalho na nova página
      doc.setFillColor(primaryColor.r, primaryColor.g, primaryColor.b);
      doc.rect(25, yPosition, pageWidth - 50, headerHeight, 'F');
      
      let xPosHeader = 25;
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      
      doc.text('PRODUTO/SERVIÇO', xPosHeader + 5, yPosition + 8);
      xPosHeader += itemWidth;
      
      if (tableConfig.showColumns.quantity) {
        doc.text('QTD', xPosHeader + 5, yPosition + 8);
        xPosHeader += qtyWidth;
      }
      
      if (tableConfig.showColumns.unitPrice) {
        doc.text('VALOR UNIT.', xPosHeader + 5, yPosition + 8);
        xPosHeader += priceWidth;
      }
      
      if (tableConfig.showColumns.discount) {
        doc.text('DESC.', xPosHeader + 5, yPosition + 8);
        xPosHeader += discountWidth;
      }
      
      if (tableConfig.showColumns.total) {
        doc.text('TOTAL', pageWidth - 50, yPosition + 8, { align: 'right' });
      }
      
      yPosition += headerHeight;
    }

    // Alternar cor de fundo das linhas
    if (index % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(25, yPosition, pageWidth - 50, rowHeight, 'F');
    }

    // Borda sutil
    doc.setDrawColor(240, 240, 240);
    doc.setLineWidth(0.2);
    doc.rect(25, yPosition, pageWidth - 50, rowHeight);

    // Conteúdo da linha
    doc.setTextColor(darkColor.r, darkColor.g, darkColor.b);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');

    let xPosContent = 25;
    
    // Nome do produto
    const productName = item.products?.name || 'Produto não encontrado';
    const splitName = doc.splitTextToSize(productName, itemWidth - 10);
    doc.text(splitName[0], xPosContent + 5, yPosition + 6);
    if (splitName.length > 1) {
      doc.text(splitName[1], xPosContent + 5, yPosition + 11);
    }
    xPosContent += itemWidth;

    // Quantidade
    if (tableConfig.showColumns.quantity) {
      doc.text(item.quantity.toString(), xPosContent + 5, yPosition + 8);
      xPosContent += qtyWidth;
    }

    // Preço unitário
    if (tableConfig.showColumns.unitPrice) {
      doc.text(formatCurrency(item.unit_price), xPosContent + 5, yPosition + 8);
      xPosContent += priceWidth;
    }

    // Desconto
    if (tableConfig.showColumns.discount) {
      const discount = item.discount_percentage || 0;
      doc.text(`${discount}%`, xPosContent + 5, yPosition + 8);
      xPosContent += discountWidth;
    }

    // Total
    if (tableConfig.showColumns.total) {
      const itemSubtotal = item.quantity * item.unit_price;
      const itemDiscountPercentage = item.discount_percentage || 0;
      const itemDiscount = itemSubtotal * (itemDiscountPercentage / 100);
      const itemTotal = itemSubtotal - itemDiscount;
      doc.text(formatCurrency(itemTotal), pageWidth - 30, yPosition + 8, { align: 'right' });
    }

    yPosition += rowHeight;
  });

  return yPosition + 10;
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