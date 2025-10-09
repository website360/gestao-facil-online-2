import jsPDF from 'jspdf';
import type { LocalBudget } from '@/hooks/useBudgetManagement';
import { getPaymentMethodText, getPaymentTypeText, getShippingOptionText } from './pdfHelpers';
import { formatBudgetId } from '@/lib/budgetFormatter';

export const generateSimpleBudgetPDF = async (budget: LocalBudget, calculateBudgetTotal: (budget: LocalBudget) => number) => {
  console.log('🚀 FUNÇÃO PDF EXECUTADA!');
  console.log('📊 Budget recebido:', budget);
  console.log('👤 Cliente no budget:', budget.clients);
  console.log('🏷️ Tipo do cliente:', budget.clients?.client_type);
  
  try {
    console.log('=== GERANDO PDF SIMPLES ===');
    console.log('Budget completo:', JSON.stringify(budget, null, 2));
    console.log('Cliente direto:', budget.clients);
    console.log('Tipo do cliente:', typeof budget.clients);
    console.log('Keys do cliente:', budget.clients ? Object.keys(budget.clients) : 'null');
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    let yPosition = 16; // Margem de 16px no topo

    console.log('Dimensões da página:', { pageWidth, pageHeight });

    // Cores do tema
    const primaryColor = { r: 59, g: 130, b: 246 }; // Blue-500
    const grayColor = { r: 107, g: 114, b: 128 }; // Gray-500
    const darkColor = { r: 31, g: 41, b: 55 }; // Gray-800

    // ===========================================
    // HEADER SIMPLES E ELEGANTE
    // ===========================================
    // Título principal com ID do orçamento
    doc.setTextColor(darkColor.r, darkColor.g, darkColor.b);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    const titleText = `ORÇAMENTO ${formatBudgetId(budget.id, budget.created_at)}`;
    doc.text(titleText, 16, yPosition);

    // Data alinhada à direita
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const dateText = `Data: ${new Date(budget.created_at).toLocaleDateString('pt-BR')}`;
    const dateWidth = doc.getTextWidth(dateText);
    doc.text(dateText, pageWidth - 16 - dateWidth, yPosition);

    // Linha decorativa
    yPosition += 10;
    doc.setDrawColor(primaryColor.r, primaryColor.g, primaryColor.b);
    doc.setLineWidth(2);
    doc.line(16, yPosition, pageWidth - 16, yPosition);

    yPosition += 12;

    // ===========================================
    // DADOS DO CLIENTE
    // ===========================================
    doc.setTextColor(darkColor.r, darkColor.g, darkColor.b);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('DADOS DO CLIENTE', 16, yPosition);

    yPosition += 12;
    
    // Informações do cliente em lista
    doc.setFontSize(10);
    
    const client = budget.clients;
    console.log('Dados do cliente para exibir:', client);
    
    // SEMPRE mostrar os campos principais, mesmo que vazios
    // Nome
    doc.setFont('helvetica', 'bold');
    const nomeLabel = 'Nome:';
    doc.text(nomeLabel, 16, yPosition);
    doc.setFont('helvetica', 'normal');
    const nomeLabelWidth = doc.getTextWidth(nomeLabel);
    const nomeSpacing = doc.getTextWidth('  '); // Dois espaços
    doc.text(client?.name || 'Não informado', 16 + nomeLabelWidth + nomeSpacing, yPosition);
    yPosition += 6;

    // Email
    doc.setFont('helvetica', 'bold');
    const emailLabel = 'Email:';
    doc.text(emailLabel, 16, yPosition);
    doc.setFont('helvetica', 'normal');
    const emailLabelWidth = doc.getTextWidth(emailLabel);
    const emailSpacing = doc.getTextWidth('  '); // Dois espaços
    doc.text(client?.email || 'Não informado', 16 + emailLabelWidth + emailSpacing, yPosition);
    yPosition += 6;

    // Telefone e documento em linha compacta
    doc.setFont('helvetica', 'bold');
    const telefoneLabel = 'Telefone:';
    doc.text(telefoneLabel, 16, yPosition);
    doc.setFont('helvetica', 'normal');
    const telefoneLabelWidth = doc.getTextWidth(telefoneLabel);
    const telefoneSpacing = doc.getTextWidth('  '); // Dois espaços
    doc.text(client?.phone || 'Não informado', 16 + telefoneLabelWidth + telefoneSpacing, yPosition);
    
    // CPF/CNPJ na mesma linha do telefone
    if (client?.cpf) {
      doc.setFont('helvetica', 'bold');
      const cpfLabel = 'CPF:';
      doc.text(cpfLabel, 120, yPosition);
      doc.setFont('helvetica', 'normal');
      const cpfLabelWidth = doc.getTextWidth(cpfLabel);
      const cpfSpacing = doc.getTextWidth('  '); // Dois espaços
      doc.text(client.cpf, 120 + cpfLabelWidth + cpfSpacing, yPosition);
    } else if (client?.cnpj) {
      doc.setFont('helvetica', 'bold');
      const cnpjLabel = 'CNPJ:';
      doc.text(cnpjLabel, 120, yPosition);
      doc.setFont('helvetica', 'normal');
      const cnpjLabelWidth = doc.getTextWidth(cnpjLabel);
      const cnpjSpacing = doc.getTextWidth('  '); // Dois espaços
      doc.text(client.cnpj, 120 + cnpjLabelWidth + cnpjSpacing, yPosition);
    }
    yPosition += 6;

    // Razão Social (apenas se for PJ e tiver valor)
    if (client?.client_type === 'pj' && client?.razao_social) {
      doc.setFont('helvetica', 'bold');
      const razaoLabel = 'Razão Social:';
      doc.text(razaoLabel, 16, yPosition);
      doc.setFont('helvetica', 'normal');
      const razaoLabelWidth = doc.getTextWidth(razaoLabel);
      const razaoSpacing = doc.getTextWidth('  '); // Dois espaços
      doc.text(client.razao_social, 16 + razaoLabelWidth + razaoSpacing, yPosition);
      yPosition += 6;
    }

    // Endereço compacto (apenas se tiver dados)
    const hasAddress = client?.cep || client?.street || client?.city || client?.state;
    if (hasAddress) {
      yPosition += 2;
      
      // Linha 1: CEP e Cidade/Estado
      if (client?.cep || client?.city || client?.state) {
        doc.setFont('helvetica', 'bold');
        const cepLabel = 'CEP:';
        doc.text(cepLabel, 16, yPosition);
        doc.setFont('helvetica', 'normal');
        const cepLabelWidth = doc.getTextWidth(cepLabel);
        const cepSpacing = doc.getTextWidth('  '); // Dois espaços
        doc.text(client?.cep || 'N/I', 16 + cepLabelWidth + cepSpacing, yPosition);
        
        if (client?.city || client?.state) {
          doc.setFont('helvetica', 'bold');
          const cidadeLabel = 'Cidade/UF:';
          doc.text(cidadeLabel, 80, yPosition);
          doc.setFont('helvetica', 'normal');
          const cidadeLabelWidth = doc.getTextWidth(cidadeLabel);
          const cidadeSpacing = doc.getTextWidth('  '); // Dois espaços
          const cityState = `${client?.city || 'N/I'}/${client?.state || 'N/I'}`;
          doc.text(cityState, 80 + cidadeLabelWidth + cidadeSpacing, yPosition);
        }
        yPosition += 6;
      }
      
      // Linha 2: Endereço completo
      if (client?.street || client?.number || client?.neighborhood) {
        doc.setFont('helvetica', 'bold');
        const enderecoLabel = 'Endereço:';
        doc.text(enderecoLabel, 16, yPosition);
        doc.setFont('helvetica', 'normal');
        const enderecoLabelWidth = doc.getTextWidth(enderecoLabel);
        const enderecoSpacing = doc.getTextWidth('  '); // Dois espaços
        const addressParts = [];
        if (client?.street) addressParts.push(client.street);
        if (client?.number) addressParts.push(client.number);
        if (client?.neighborhood) addressParts.push(client.neighborhood);
        const fullAddress = addressParts.join(', ') || 'Não informado';
        doc.text(fullAddress, 16 + enderecoLabelWidth + enderecoSpacing, yPosition);
        yPosition += 6;
      }
    }

    yPosition += 10;

    // ===========================================
    // TABELA DE PRODUTOS
    // ===========================================
    doc.setTextColor(darkColor.r, darkColor.g, darkColor.b);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('ITENS DO ORÇAMENTO', 16, yPosition);

    yPosition += 10;

    // Cabeçalho da tabela
    const headerHeight = 10;
    doc.setFillColor(primaryColor.r, primaryColor.g, primaryColor.b);
    doc.rect(16, yPosition, pageWidth - 32, headerHeight, 'F');

    // Colunas da tabela
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('PRODUTO', 18, yPosition + 6.5);
    doc.text('QTD', 80, yPosition + 6.5, { align: 'center' });
    doc.text('PREÇO UN', 100, yPosition + 6.5, { align: 'center' });
    doc.text('DESC.', 128, yPosition + 6.5, { align: 'center' });
    doc.text('PREÇO UN DESC', 150, yPosition + 6.5, { align: 'center' });
    doc.text('TOTAL', pageWidth - 18, yPosition + 6.5, { align: 'right' });

    yPosition += headerHeight;

    // Linhas dos produtos
    let rowHeight = 10;
    let subtotal = 0;
    let totalDiscount = 0;

    console.log('Iniciando produtos. Total de itens:', budget.budget_items?.length);
    console.log('yPosition inicial dos produtos:', yPosition);

    budget.budget_items?.forEach((item, index) => {
      console.log(`Processando item ${index + 1}/${budget.budget_items?.length}: ${item.products?.name}`);
      console.log('yPosition atual:', yPosition, 'pageHeight:', pageHeight, 'espaço restante:', pageHeight - yPosition);
      
      // Calcular quebras e altura dinâmica da linha com base no nome do produto
      const colXQty = 80;
      const colXUnit = 100;
      const colXDesc = 128;
      const colXUnitDesc = 150;
      const nameStartX = 18;
      const nameMaxWidth = colXQty - nameStartX - 5;

      const productName = item.products?.name || "Produto não encontrado";
      const nameLines = doc.splitTextToSize(productName, nameMaxWidth);
      rowHeight = Math.max(10, 6 + (nameLines.length - 1) * 4);
      
      // Verificar se precisa de nova página - usar margem menor para aproveitar mais espaço
      if (yPosition + rowHeight > pageHeight - 15) { // Margem reduzida de 25 para 15
        console.log('CRIANDO NOVA PÁGINA - yPosition:', yPosition, 'espaço restante:', pageHeight - yPosition);
        doc.addPage();
        yPosition = 15; // Margem superior menor na nova página
        
        // Recriar cabeçalho na nova página
        doc.setFillColor(primaryColor.r, primaryColor.g, primaryColor.b);
        doc.rect(16, yPosition, pageWidth - 32, headerHeight, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('PRODUTO', 18, yPosition + 6.5);
        doc.text('QTD', 80, yPosition + 6.5, { align: 'center' });
        doc.text('PREÇO UN', 100, yPosition + 6.5, { align: 'center' });
        doc.text('DESC.', 128, yPosition + 6.5, { align: 'center' });
        doc.text('PREÇO UN DESC', 150, yPosition + 6.5, { align: 'center' });
        doc.text('TOTAL', pageWidth - 18, yPosition + 6.5, { align: 'right' });
        
        yPosition += headerHeight;
        console.log('Nova página criada. yPosition após cabeçalho:', yPosition);
      }

      // Fundo alternado
      if (index % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(16, yPosition, pageWidth - 32, rowHeight, 'F');
      }

      // Conteúdo da linha
      doc.setTextColor(darkColor.r, darkColor.g, darkColor.b);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');

      // Nome do produto (quebra em múltiplas linhas)
      nameLines.forEach((line: string, lineIndex: number) => {
        if (lineIndex < 4) {
          doc.text(line, 18, yPosition + 5 + (lineIndex * 4));
        }
      });
      
      // Outras colunas
      doc.text(item.quantity.toString(), colXQty, yPosition + 5, { align: 'center' });
      doc.text(formatCurrency(item.unit_price), colXUnit, yPosition + 5, { align: 'center' });
      
      const discount = item.discount_percentage || 0;
      doc.text(`${discount}%`, colXDesc, yPosition + 5, { align: 'center' });

      // Nova coluna: Preço Un Desc (preço unitário com desconto aplicado)
      const priceWithDiscount = item.unit_price * (1 - discount / 100);
      doc.text(formatCurrency(priceWithDiscount), colXUnitDesc, yPosition + 5, { align: 'center' });

      // Cálculos
      const itemSubtotal = item.quantity * item.unit_price;
      const itemDiscount = itemSubtotal * (discount / 100);
      const itemTotal = itemSubtotal - itemDiscount;
      
      subtotal += itemSubtotal;
      totalDiscount += itemDiscount;

      doc.text(formatCurrency(itemTotal), pageWidth - 18, yPosition + 5, { align: 'right' });

      yPosition += rowHeight;
      console.log('Item processado. Nova yPosition:', yPosition);
    });

    console.log('Todos os produtos processados. yPosition final:', yPosition);

    // ===========================================
    // RESUMO FINANCEIRO CONTINUANDO A TABELA
    // ===========================================
    
    // Verificar se precisa de nova página para o resumo apenas se não houver espaço suficiente
    const resumoMinimo = 50; // Espaço reduzido para resumo (era 60)
    
    if (yPosition + resumoMinimo > pageHeight - 15) { // Margem reduzida para 15 (era 25)
      console.log('CRIANDO NOVA PÁGINA PARA RESUMO - yPosition:', yPosition);
      doc.addPage();
      yPosition = 15; // Margem menor na nova página
    }
    
    // Continuar diretamente após os produtos, sem separação
    const shippingCost = budget.shipping_cost || 0;
    const finalTotal = subtotal - totalDiscount + shippingCost;

    // Buscar nomes dos métodos de pagamento
    const paymentMethodName = await getPaymentMethodText(budget.payment_method_id);
    const paymentTypeName = await getPaymentTypeText(budget.payment_type_id);
    const shippingOptionName = await getShippingOptionText(budget.shipping_option_id);

    // Linha do Subtotal (mesmo estilo dos produtos)
    const currentIndex = budget.budget_items?.length || 0;
    
    if (currentIndex % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(16, yPosition, pageWidth - 32, rowHeight, 'F');
    }
    
    doc.setTextColor(darkColor.r, darkColor.g, darkColor.b);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('SUBTOTAL', 20, yPosition + 5);
    doc.text(formatCurrency(subtotal), pageWidth - 20, yPosition + 5, { align: 'right' });
    
    yPosition += rowHeight;
    
    // Linha do Desconto (se houver)
    if (totalDiscount > 0) {
      if ((currentIndex + 1) % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(16, yPosition, pageWidth - 32, rowHeight, 'F');
      }
      
      doc.setFont('helvetica', 'bold');
      doc.text('DESCONTO', 20, yPosition + 5);
      doc.setTextColor(220, 38, 127); // Cor vermelha para desconto
      doc.text(`-${formatCurrency(totalDiscount)}`, pageWidth - 20, yPosition + 5, { align: 'right' });
      doc.setTextColor(darkColor.r, darkColor.g, darkColor.b); // Voltar cor normal
      yPosition += rowHeight;
    }
    
    // Linha do Frete (se houver)
    if (shippingCost > 0) {
      const freightIndex = totalDiscount > 0 ? currentIndex + 2 : currentIndex + 1;
      if (freightIndex % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(16, yPosition, pageWidth - 32, rowHeight, 'F');
      }
      
      doc.setFont('helvetica', 'bold');
      doc.text('FRETE', 20, yPosition + 5);
      doc.text(formatCurrency(shippingCost), pageWidth - 20, yPosition + 5, { align: 'right' });
      yPosition += rowHeight;
    }
    
    // Linha do Total (destacada com cor de fundo azul)
    doc.setFillColor(primaryColor.r, primaryColor.g, primaryColor.b);
    doc.rect(16, yPosition, pageWidth - 32, rowHeight, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL GERAL', 20, yPosition + 5);
    doc.text(formatCurrency(finalTotal), pageWidth - 20, yPosition + 5, { align: 'right' });
    
    yPosition += rowHeight;

    yPosition += 15;

    // ===========================================
    // INFORMAÇÕES DE PAGAMENTO EM LISTA
    // ===========================================
    doc.setTextColor(darkColor.r, darkColor.g, darkColor.b);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMAÇÕES ADICIONAIS', 16, yPosition);

    yPosition += 12;

    // Meio de Pagamento
    if (budget.payment_method_id) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      const pagamentoLabel = 'Meio de Pagamento:';
      doc.text(pagamentoLabel, 16, yPosition);
      doc.setFont('helvetica', 'normal');
      const pagamentoLabelWidth = doc.getTextWidth(pagamentoLabel);
      const pagamentoSpacing = doc.getTextWidth('  '); // Dois espaços
      doc.text(paymentMethodName, 16 + pagamentoLabelWidth + pagamentoSpacing, yPosition);
      yPosition += 6;
    }

    // Tipo de Pagamento
    if (budget.payment_type_id) {
      doc.setFont('helvetica', 'bold');
      const tipoLabel = 'Tipo de Pagamento:';
      doc.text(tipoLabel, 16, yPosition);
      doc.setFont('helvetica', 'normal');
      const tipoLabelWidth = doc.getTextWidth(tipoLabel);
      const tipoSpacing = doc.getTextWidth('  '); // Dois espaços
      doc.text(paymentTypeName, 16 + tipoLabelWidth + tipoSpacing, yPosition);
      yPosition += 6;
    }

    // Opções de Frete
    if (budget.shipping_option_id) {
      doc.setFont('helvetica', 'bold');
      const freteLabel = 'Opção de Frete:';
      doc.text(freteLabel, 16, yPosition);
      doc.setFont('helvetica', 'normal');
      const freteLabelWidth = doc.getTextWidth(freteLabel);
      const freteSpacing = doc.getTextWidth('  '); // Dois espaços
      doc.text(shippingOptionName, 16 + freteLabelWidth + freteSpacing, yPosition);
      yPosition += 6;
    }

    // Nota Fiscal
    const invoicePercentage = budget.invoice_percentage || 0;
    if (invoicePercentage > 0) {
      const invoiceValue = finalTotal * (invoicePercentage / 100);
      doc.setFont('helvetica', 'bold');
      const notaLabel = 'Nota Fiscal:';
      doc.text(notaLabel, 16, yPosition);
      doc.setFont('helvetica', 'normal');
      const notaLabelWidth = doc.getTextWidth(notaLabel);
      const notaSpacing = doc.getTextWidth('  '); // Dois espaços
      doc.text(`${invoicePercentage}% (${formatCurrency(invoiceValue)})`, 16 + notaLabelWidth + notaSpacing, yPosition);
      yPosition += 6;
    }

    yPosition += 15;

    // ===========================================
    // INFORMAÇÕES DE PAGAMENTO E FRETE (REMOVIDAS - JÁ INCLUÍDAS ACIMA)
    // ===========================================

    // ===========================================
    // OBSERVAÇÕES
    // ===========================================
    if (budget.notes) {
      // Calcular o espaço necessário para as observações
      const splitNotes = doc.splitTextToSize(budget.notes, pageWidth - 32);
      const notesHeight = 15 + (splitNotes.length * 5) + 10; // Título + linhas + espaço extra
      
      // Só criar nova página se realmente não couber - ser mais conservador
      const spaceLeft = pageHeight - yPosition;
      console.log('Espaço restante para observações:', spaceLeft, 'Espaço necessário:', notesHeight);
      
      // Apenas quebrar página se o espaço restante for menor que o necessário
      if (spaceLeft < notesHeight) {
        console.log('CRIANDO NOVA PÁGINA PARA OBSERVAÇÕES - Não cabe na página atual');
        doc.addPage();
        yPosition = 15;
      } else {
        console.log('MANTENDO OBSERVAÇÕES NA PÁGINA ATUAL - Cabe perfeitamente');
      }

      doc.setTextColor(darkColor.r, darkColor.g, darkColor.b);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('OBSERVAÇÕES', 16, yPosition);

      yPosition += 10;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(grayColor.r, grayColor.g, grayColor.b);
      
      doc.text(splitNotes, 16, yPosition);
      yPosition += (splitNotes.length * 5) + 15;
    }

    console.log('PDF finalizado. Total de páginas:', doc.getNumberOfPages());

    // Salvar o PDF
    const clientName = budget.clients?.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Cliente';
    const date = new Date().toISOString().split('T')[0];
    const filename = `Orcamento_${clientName}_${date}.pdf`;

    console.log('Salvando PDF:', filename);
    doc.save(filename);
    console.log('PDF gerado com sucesso!');

  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    throw error;
  }
};

// Helper function para formatação de moeda
const formatCurrency = (value: number): string => {
  return value.toLocaleString('pt-BR', { 
    style: 'currency', 
    currency: 'BRL', 
    minimumFractionDigits: 2,
    maximumFractionDigits: 2 
  });
};