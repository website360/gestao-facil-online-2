import jsPDF from 'jspdf';
import type { LocalBudget } from '@/hooks/useBudgetManagement';
import type { PDFConfig } from './pdfConfigLoader';

export const addItemsTable = (doc: jsPDF, budget: LocalBudget, yPosition: number, config: PDFConfig) => {
  const pageWidth = doc.internal.pageSize.width;
  const { tableHeaders } = config.sections;

  // Table headers with configurable styling
  const headerHeight = 10;
  const headerColor = hexToRgb(config.table?.headerBackgroundColor || config.colors.primary);
  doc.setFillColor(headerColor.r, headerColor.g, headerColor.b);
  doc.rect(15, yPosition - 2, pageWidth - 30, headerHeight, 'F');

  // Header text with vertical centering and white color
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(tableHeaders.fontSize);
  doc.setFont('helvetica', 'bold');

  const headerVerticalCenter = yPosition + (headerHeight / 2) - 2;
  
  // Dynamic column positioning based on configuration
  const showColumns = config.table?.showColumns || { quantity: true, unitPrice: true, discount: true, total: true };
  const columnWidths = config.table?.columnWidths || { item: 65, quantity: 10, unitPrice: 15, discount: 10, total: 15 };
  let currentX = 20;
  
  doc.text('Item', currentX, headerVerticalCenter);
  currentX += (columnWidths.item || 65) * 2;
  
  if (showColumns.quantity !== false) {
    doc.text('Qtd', currentX, headerVerticalCenter, { align: 'center' });
    currentX += (columnWidths.quantity || 10) * 2;
  }
  
  if (showColumns.unitPrice !== false) {
    doc.text('Valor Unit.', currentX, headerVerticalCenter, { align: 'center' });
    currentX += (columnWidths.unitPrice || 15) * 2;
  }
  
  if (showColumns.discount !== false) {
    doc.text('Desc.', currentX, headerVerticalCenter, { align: 'center' });
    currentX += (columnWidths.discount || 10) * 2;
  }
  
  if (showColumns.total !== false) {
    doc.text('Total', pageWidth - 20, headerVerticalCenter, { align: 'right' });
  }
  
  yPosition += headerHeight;
  
  // Table content
  const darkColor = hexToRgb(config.colors.dark);
  doc.setTextColor(darkColor.r, darkColor.g, darkColor.b);
  doc.setFontSize(config.fonts.normal);
  doc.setFont('helvetica', 'normal');
  
  const formatCurrency = (n: number) => `R$ ${n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  budget.budget_items?.forEach((item, index) => {
    // Check if we need a new page and redraw table header on new page
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;

      // Redraw header on new page
      doc.setFillColor(headerColor.r, headerColor.g, headerColor.b);
      doc.rect(15, yPosition - 2, pageWidth - 30, headerHeight, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(tableHeaders.fontSize);
      doc.setFont('helvetica', 'bold');
      const headerVerticalCenterNew = yPosition + (headerHeight / 2) - 2;
      
      // Redraw dynamic columns
      let currentXNew = 20;
      doc.text('Item', currentXNew, headerVerticalCenterNew);
      currentXNew += (columnWidths.item || 65) * 2;
      
      if (showColumns.quantity !== false) {
        doc.text('Qtd', currentXNew, headerVerticalCenterNew, { align: 'center' });
        currentXNew += (columnWidths.quantity || 10) * 2;
      }
      
      if (showColumns.unitPrice !== false) {
        doc.text('Valor Unit.', currentXNew, headerVerticalCenterNew, { align: 'center' });
        currentXNew += (columnWidths.unitPrice || 15) * 2;
      }
      
      if (showColumns.discount !== false) {
        doc.text('Desc.', currentXNew, headerVerticalCenterNew, { align: 'center' });
        currentXNew += (columnWidths.discount || 10) * 2;
      }
      
      if (showColumns.total !== false) {
        doc.text('Total', pageWidth - 20, headerVerticalCenterNew, { align: 'right' });
      }
      yPosition += headerHeight;

      // Reset text style for rows
      const darkColorNew = hexToRgb(config.colors.dark);
      doc.setTextColor(darkColorNew.r, darkColorNew.g, darkColorNew.b);
      doc.setFontSize(config.fonts.normal);
      doc.setFont('helvetica', 'normal');
    }
    
    const rowHeight = config.table?.rowHeight || 8;
    
    // Alternate row background with configurable color
    if (index % 2 === 0) {
      const zebraColor = hexToRgb(config.table?.zebraColor || '#F8F8F8');
      doc.setFillColor(zebraColor.r, zebraColor.g, zebraColor.b);
      doc.rect(15, yPosition - 2, pageWidth - 30, rowHeight, 'F');
    }
    
    const productName = item.products?.name || 'Produto não encontrado';
    const splitProductName = doc.splitTextToSize(productName, pageWidth - 100);
    
    // Vertical centering for row content
    const rowVerticalCenter = yPosition + (rowHeight / 2) - 2;
    
    // Dynamic column content positioning
    let currentXData = 20;
    doc.text(splitProductName[0], currentXData, rowVerticalCenter);
    currentXData += (columnWidths.item || 65) * 2;
    
    if (showColumns.quantity !== false) {
      doc.text(item.quantity.toString(), currentXData, rowVerticalCenter, { align: 'center' });
      currentXData += (columnWidths.quantity || 10) * 2;
    }
    
    if (showColumns.unitPrice !== false) {
      doc.text(formatCurrency(item.unit_price), currentXData, rowVerticalCenter, { align: 'center' });
      currentXData += (columnWidths.unitPrice || 15) * 2;
    }
    
    if (showColumns.discount !== false) {
      const discountText = (item.discount_percentage || 0) > 0 ? `${(item.discount_percentage || 0)}%` : '—';
      doc.text(discountText, currentXData, rowVerticalCenter, { align: 'center' });
      currentXData += (columnWidths.discount || 10) * 2;
    }
    
    if (showColumns.total !== false) {
      doc.text(formatCurrency(item.total_price), pageWidth - 20, rowVerticalCenter, { align: 'right' });
    }
    
    yPosition += rowHeight;
    
    // Add additional lines for long product names
    if (splitProductName.length > 1) {
      for (let i = 1; i < splitProductName.length; i++) {
        doc.text(splitProductName[i], 20, yPosition);
        yPosition += 4;
      }
    }
  });

  return yPosition + 5;
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