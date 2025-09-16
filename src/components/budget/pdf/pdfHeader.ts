
import jsPDF from 'jspdf';
import type { LocalBudget } from '@/hooks/useBudgetManagement';
import type { PDFConfig } from './pdfConfigLoader';
import { formatBudgetId } from '@/lib/budgetFormatter';

export const addPDFHeader = async (doc: jsPDF, budget: LocalBudget, config: PDFConfig) => {
  const pageWidth = doc.internal.pageSize.width;
  let yPosition = 15;

  // Minimal top bar instead of full banner
  const headerColor = hexToRgb(config.header.backgroundColor);
  const barHeight = Math.max(4, Math.min(8, Math.round(config.header.height / 3)));
  doc.setFillColor(headerColor.r, headerColor.g, headerColor.b);
  doc.rect(0, 0, pageWidth, barHeight, 'F');
  
  // Company name (clean header)
  const headerTextColor = hexToRgb(config.colors.gray);
  doc.setTextColor(headerTextColor.r, headerTextColor.g, headerTextColor.b);
  doc.setFontSize(config.fonts.small + 1);
  doc.setFont('helvetica', 'bold');
  doc.text(config.header.companyName, 20, barHeight + 8);

  // Conteúdo abaixo do cabeçalho
  yPosition = config.header.height + 12;

  // Cores principais
  const primaryColor = hexToRgb(config.colors.primary);
  const darkColor = hexToRgb(config.colors.dark);
  const grayColor = hexToRgb(config.colors.gray);

  // Badge com o número do orçamento (pill à direita)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  const pillText = `ORÇAMENTO ${formatBudgetId(budget.id, budget.created_at)}`;
  const pillPaddingX = 3;
  const pillHeight = 8;
  const pillTextWidth = doc.getTextWidth(pillText);
  const pillWidth = pillTextWidth + pillPaddingX * 2;
  const pillX = pageWidth - 20 - pillWidth;
  const pillY = yPosition - 3;
  doc.setFillColor(primaryColor.r, primaryColor.g, primaryColor.b);
  doc.rect(pillX, pillY, pillWidth, pillHeight, 'F');
  doc.setTextColor(255, 255, 255);
  doc.text(pillText, pillX + pillPaddingX, pillY + 6);
  doc.text(pillText, pillX + pillPaddingX, pillY + 6);

  // Título e metadados
  doc.setTextColor(darkColor.r, darkColor.g, darkColor.b);
  doc.setFontSize(config.fonts.title);
  doc.setFont('helvetica', 'bold');
  doc.text('Proposta Comercial', 20, yPosition);

  yPosition += 7;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(config.fonts.small);
  doc.setTextColor(grayColor.r, grayColor.g, grayColor.b);
  const vendedorName = budget.creator_profile?.name || 'Vendedor não identificado';
  doc.text(`Vendedor: ${vendedorName}`, 20, yPosition);
  doc.text(`Data: ${new Date(budget.created_at).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })}`, pageWidth - 20, yPosition, { align: 'right' });

  return yPosition + 10;
};

// Helper function to add logo to header
const addLogoToHeader = async (doc: jsPDF, logoUrl: string, pageWidth: number, headerHeight: number): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        // Calculate logo dimensions to fit within header
        const maxLogoHeight = headerHeight - 4; // Leave some padding
        const maxLogoWidth = 60; // Maximum width for logo
        
        let logoWidth = img.width;
        let logoHeight = img.height;
        
        // Scale logo to fit within constraints
        if (logoHeight > maxLogoHeight) {
          const scale = maxLogoHeight / logoHeight;
          logoHeight = maxLogoHeight;
          logoWidth = logoWidth * scale;
        }
        
        if (logoWidth > maxLogoWidth) {
          const scale = maxLogoWidth / logoWidth;
          logoWidth = maxLogoWidth;
          logoHeight = logoHeight * scale;
        }
        
        // Position logo on the left side of the header
        const logoX = 20;
        const logoY = (headerHeight - logoHeight) / 2 + 2; // Center vertically with slight adjustment
        
        // Add the logo to the PDF
        doc.addImage(img, 'JPEG', logoX, logoY, logoWidth, logoHeight);
        resolve();
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load logo image'));
    };
    
    // Load the image
    img.src = logoUrl;
  });
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
