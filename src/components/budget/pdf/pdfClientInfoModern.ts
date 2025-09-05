import jsPDF from 'jspdf';
import type { LocalBudget } from '@/hooks/useBudgetManagement';
import type { PDFConfig } from './pdfConfigLoader';

export const addModernClientInfo = (doc: jsPDF, budget: LocalBudget, yPosition: number, config: PDFConfig) => {
  const pageWidth = doc.internal.pageSize.width;
  const primaryColor = hexToRgb(config.colors.primary);
  const darkColor = hexToRgb(config.colors.dark);
  const grayColor = hexToRgb(config.colors.gray);

  // Card moderno para informações do cliente
  const cardPadding = 20;
  const cardHeight = 65;
  
  // Background do card com sombra simulada
  doc.setFillColor(250, 250, 250);
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
  doc.text('DADOS DO CLIENTE', 35, yPosition + 15);

  const contentY = yPosition + 25;
  const leftColumn = 35;
  const rightColumn = (pageWidth / 2) + 10;

  // Layout em duas colunas
  doc.setFontSize(10);
  doc.setTextColor(darkColor.r, darkColor.g, darkColor.b);

  // Coluna esquerda
  if (budget.clients?.name) {
    doc.setFont('helvetica', 'bold');
    doc.text('Nome:', leftColumn, contentY);
    doc.setFont('helvetica', 'normal');
    doc.text(budget.clients.name, leftColumn, contentY + 8);
  }

  if (budget.clients?.phone) {
    doc.setFont('helvetica', 'bold');
    doc.text('Telefone:', leftColumn, contentY + 20);
    doc.setFont('helvetica', 'normal');
    doc.text(budget.clients.phone, leftColumn, contentY + 28);
  }

  // Coluna direita
  if (budget.clients?.email) {
    doc.setFont('helvetica', 'bold');
    doc.text('E-mail:', rightColumn, contentY);
    doc.setFont('helvetica', 'normal');
    doc.text(budget.clients.email, rightColumn, contentY + 8);
  }

  // Endereço (linha completa na parte inferior)
  if (budget.clients) {
    const client = budget.clients as any;
    const addressParts = [];
    if (client.street) addressParts.push(client.street);
    if (client.number) addressParts.push(`nº ${client.number}`);
    if (client.neighborhood) addressParts.push(client.neighborhood);
    if (client.city && client.state) addressParts.push(`${client.city}/${client.state}`);
    if (client.cep) addressParts.push(`CEP: ${client.cep}`);
    
    if (addressParts.length > 0) {
      const addressText = addressParts.join(' • ');
      doc.setFont('helvetica', 'bold');
      doc.text('Endereço:', leftColumn, contentY + 40);
      doc.setFont('helvetica', 'normal');
      
      // Quebrar texto se necessário
      const maxWidth = pageWidth - 70;
      const splitAddress = doc.splitTextToSize(addressText, maxWidth);
      doc.text(splitAddress, leftColumn + 40, contentY + 40);
    }
  }

  return yPosition + cardHeight + 20;
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