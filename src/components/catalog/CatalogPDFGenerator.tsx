import jsPDF from 'jspdf';

interface Product {
  id: string;
  name: string;
  internal_code: string;
  barcode: string | null;
  price: number;
  stock: number;
  photo_url: string | null;
  size: string | null;
  composition: string | null;
  color: string | null;
  box: string | null;
  observation: string | null;
  stock_unit: string | null;
  width: number | null;
  length: number | null;
  thickness: number | null;
  diameter: number | null;
  categories?: {
    name: string;
  };
}

interface ElementConfig {
  id: string;
  type: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontWeight: string;
  color: string;
  visible: boolean;
  padding: number;
  borderWidth: number;
  margin: number;
  zIndex: number;
  rotation: number;
  borderRadius: number;
  backgroundColor: string;
  textAlign: 'left' | 'center' | 'right';
  opacity: number;
  borderColor: string;
}

interface LayoutConfig {
  elements: ElementConfig[];
  cardWidth: number;
  cardHeight: number;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  rows: number;
  columns: number;
  gridSize: number;
  showGrid: boolean;
  snapToGrid: boolean;
  scale: number;
}

interface LayoutTemplate {
  id: string;
  name: string;
  description: string;
  layoutConfig: LayoutConfig;
  catalogConfig: any;
  createdAt: string;
}

export class CatalogPDFGenerator {
  private doc: jsPDF;
  private customLayout: LayoutConfig | null = null;
  private catalogConfig: any = null;
  private userType: string = 'admin'; // Default to admin for backward compatibility

  constructor(userType: string = 'admin') {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    this.userType = userType;
    this.loadCustomLayout();
    this.loadCatalogConfiguration();
  }

  private loadCustomLayout() {
    const saved = localStorage.getItem('catalog-layout');
    if (saved) {
      try {
        this.customLayout = JSON.parse(saved);
        console.log('Layout personalizado carregado:', this.customLayout);
      } catch (error) {
        console.error('Erro ao carregar layout personalizado:', error);
      }
    }
  }

  private loadCatalogConfiguration() {
    const saved = localStorage.getItem('catalog-configuration');
    if (saved) {
      try {
        this.catalogConfig = JSON.parse(saved);
        console.log('Configuração do catálogo carregada:', this.catalogConfig);
      } catch (error) {
        console.error('Erro ao carregar configuração do catálogo:', error);
      }
    }
  }

  async generatePDF(products: Product[]) {
    console.log('Gerando PDF com produtos:', products.length, products);
    
    // Usar configurações personalizadas se disponíveis
    if (this.catalogConfig) {
      console.log('Usando configurações personalizadas:', this.catalogConfig);
      
      // Configurar o documento baseado nas configurações
      this.doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
    } else {
      this.doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
    }
    
    // Verificar se temos produtos para gerar
    if (!products || products.length === 0) {
      console.error('Nenhum produto foi fornecido para gerar o PDF');
      return;
    }
    
    // Adicionar capa com imagem de fundo
    await this.addCoverPage();
    
    // Organizar produtos por categoria e ordem alfabética
    const organizedProducts = this.organizeProductsByCategory(products);
    console.log('Produtos organizados por categoria:', organizedProducts);
    
    // Nova página para os produtos
    this.doc.addPage();
    
    let currentPage = 1;
    let currentY = this.catalogConfig?.page?.marginTop || 20;
    
    for (const categoryGroup of organizedProducts) {
      console.log(`=== INICIANDO CATEGORIA: ${categoryGroup.categoryName} ===`);
      console.log(`currentY inicial: ${currentY}, página: ${currentPage}`);
      
      // Verificar se há espaço para o título da categoria
      const pageHeight = this.doc.internal.pageSize.height;
      const bottomMargin = this.catalogConfig?.page?.marginBottom || 20;
      
      if (currentY > pageHeight - bottomMargin - 80) { // Espaço para título + pelo menos um card
        console.log(`Não há espaço suficiente para categoria, criando nova página`);
        this.doc.addPage();
        currentPage++;
        currentY = this.catalogConfig?.page?.marginTop || 20;
      }
      
      // Adicionar título da categoria
      const titleY = this.addCategoryTitle(categoryGroup.categoryName, currentY);
      console.log(`Título adicionado, novo Y: ${titleY}`);
      
      // Adicionar produtos da categoria - SEMPRE começar nova contagem de cards por categoria
      const result = await this.addCategoryProducts(categoryGroup.products, titleY, currentPage, true); // true = reset card count
      currentY = result.finalY;
      currentPage = result.currentPage;
      
      console.log(`=== CATEGORIA ${categoryGroup.categoryName} FINALIZADA ===`);
      console.log(`currentY final: ${currentY}, página final: ${currentPage}`);
    }
    
    
    // Download do PDF
    this.doc.save(`catalogo-produtos-${new Date().toISOString().split('T')[0]}.pdf`);
  }

  async generatePDFWithMultipleTemplates(products: Product[], categoryTemplates: Record<string, string>) {
    console.log('Gerando PDF com múltiplos templates:', products.length, products);
    console.log('Templates por categoria:', categoryTemplates);
    
    // Carregar templates salvos
    const savedTemplates = localStorage.getItem('catalog-templates');
    if (!savedTemplates) {
      throw new Error('Nenhum template encontrado');
    }
    
    const templates: LayoutTemplate[] = JSON.parse(savedTemplates);
    const templateMap = new Map(templates.map((t: LayoutTemplate) => [t.id, t]));
    
    // Usar configurações personalizadas se disponíveis
    if (this.catalogConfig) {
      console.log('Usando configurações personalizadas:', this.catalogConfig);
      
      // Configurar o documento baseado nas configurações
      this.doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
    } else {
      this.doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });
    }
    
    // Verificar se temos produtos para gerar
    if (!products || products.length === 0) {
      console.error('Nenhum produto foi fornecido para gerar o PDF');
      return;
    }
    
    // Adicionar capa com imagem de fundo
    await this.addCoverPage();
    
    // Organizar produtos por categoria e ordem alfabética
    const organizedProducts = this.organizeProductsByCategory(products);
    console.log('Produtos organizados por categoria:', organizedProducts);
    
    // Nova página para os produtos
    this.doc.addPage();
    
    let currentPage = 1;
    let currentY = this.catalogConfig?.page?.marginTop || 20;
    
    for (const categoryGroup of organizedProducts) {
      console.log(`=== INICIANDO CATEGORIA: ${categoryGroup.categoryName} ===`);
      console.log(`currentY inicial: ${currentY}, página: ${currentPage}`);
      
      // Obter template para esta categoria
      const templateId = categoryTemplates[categoryGroup.categoryName];
      if (!templateId) {
        console.warn(`Nenhum template definido para categoria: ${categoryGroup.categoryName}`);
        continue;
      }
      
      const template = templateMap.get(templateId);
      if (!template) {
        console.warn(`Template não encontrado: ${templateId}`);
        continue;
      }
      
      // Temporariamente usar o layout do template específico
      const originalLayout = this.customLayout;
      const originalCatalogConfig = this.catalogConfig;
      
      this.customLayout = template.layoutConfig;
      this.catalogConfig = { ...this.catalogConfig, ...template.catalogConfig };
      
      console.log(`Usando template "${template.name}" para categoria "${categoryGroup.categoryName}"`);
      
      // Verificar se há espaço para o título da categoria
      const pageHeight = this.doc.internal.pageSize.height;
      const bottomMargin = this.catalogConfig?.page?.marginBottom || 20;
      
      if (currentY > pageHeight - bottomMargin - 80) { // Espaço para título + pelo menos um card
        console.log(`Não há espaço suficiente para categoria, criando nova página`);
        this.doc.addPage();
        currentPage++;
        currentY = this.catalogConfig?.page?.marginTop || 20;
      }
      
      // Adicionar título da categoria
      const titleY = this.addCategoryTitle(categoryGroup.categoryName, currentY);
      console.log(`Título adicionado, novo Y: ${titleY}`);
      
      // Adicionar produtos da categoria com o template específico
      const result = await this.addCategoryProducts(categoryGroup.products, titleY, currentPage, true);
      currentY = result.finalY;
      currentPage = result.currentPage;
      
      // Restaurar configurações originais
      this.customLayout = originalLayout;
      this.catalogConfig = originalCatalogConfig;
      
      console.log(`=== CATEGORIA ${categoryGroup.categoryName} FINALIZADA ===`);
      console.log(`currentY final: ${currentY}, página final: ${currentPage}`);
    }
    
    // Download do PDF
    this.doc.save(`catalogo-multiplos-templates-${new Date().toISOString().split('T')[0]}.pdf`);
  }

  async generatePreview(products: Product[]) {
    this.doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });
    
    if (!this.customLayout || this.customLayout.elements.length === 0) {
      console.warn('Nenhum layout personalizado encontrado');
      return;
    }

    console.log('Gerando preview com layout:', this.customLayout);
    
    // Calcular tamanho do card no PDF
    const pageWidth = this.doc.internal.pageSize.width;
    const pageHeight = this.doc.internal.pageSize.height;
    const margin = 20;
    
    // Usar as dimensões definidas no layout ou calcular automaticamente
    const cardWidth = Math.min(this.customLayout.cardWidth * 0.75, pageWidth - margin * 2);
    const cardHeight = Math.min(this.customLayout.cardHeight * 0.75, pageHeight - margin * 2);
    
    const x = (pageWidth - cardWidth) / 2;
    const y = margin + 20;
    
    console.log(`Card no PDF: ${cardWidth}x${cardHeight} na posição (${x}, ${y})`);
    
    // Renderizar um card de exemplo
    if (products.length > 0) {
      await this.addProductCard(products[0], x, y, cardWidth, cardHeight);
    }
    
    // Download do PDF
    this.doc.save(`preview-catalogo-${new Date().toISOString().split('T')[0]}.pdf`);
  }

  private organizeProductsByCategory(products: Product[]) {
    // Agrupar produtos por categoria
    const productsByCategory = products.reduce((acc, product) => {
      const categoryName = product.categories?.name || 'Sem Categoria';
      if (!acc[categoryName]) {
        acc[categoryName] = [];
      }
      acc[categoryName].push(product);
      return acc;
    }, {} as Record<string, Product[]>);

    // Ordenar categorias alfabeticamente e produtos dentro de cada categoria
    return Object.keys(productsByCategory)
      .sort()
      .map(categoryName => ({
        categoryName,
        products: productsByCategory[categoryName].sort((a, b) => a.name.localeCompare(b.name))
      }));
  }

  private addCategoryTitle(categoryName: string, currentY: number): number {
    // Usar configurações personalizadas para título de categoria
    const categoryTitleConfig = this.catalogConfig?.categoryTitle || {
      fontSize: 22,
      fontColor: '#1e3a8a',
      fontWeight: 'bold',
      alignment: 'center',
      marginBottom: 25
    };

    // Título da categoria
    this.doc.setFontSize(categoryTitleConfig.fontSize);
    this.doc.setFont('helvetica', categoryTitleConfig.fontWeight);
    
    const rgb = this.hexToRgb(categoryTitleConfig.fontColor);
    this.doc.setTextColor(rgb.r, rgb.g, rgb.b);
    
    const pageWidth = this.doc.internal.pageSize.width;
    let xPosition = pageWidth / 2; // center por padrão
    let align: 'left' | 'center' | 'right' = 'center';
    
    if (categoryTitleConfig.alignment === 'left') {
      xPosition = this.catalogConfig?.page?.marginLeft || 20;
      align = 'left';
    } else if (categoryTitleConfig.alignment === 'right') {
      xPosition = pageWidth - (this.catalogConfig?.page?.marginRight || 20);
      align = 'right';
    }
    
    this.doc.text(categoryName.toUpperCase(), xPosition, currentY, { align });
    
    // Linha decorativa
    this.doc.setDrawColor(rgb.r, rgb.g, rgb.b);
    this.doc.setLineWidth(1.5);
    const lineStartX = this.catalogConfig?.page?.marginLeft || 20;
    const lineEndX = pageWidth - (this.catalogConfig?.page?.marginRight || 20);
    this.doc.line(lineStartX, currentY + 4, lineEndX, currentY + 4);
    
    return currentY + categoryTitleConfig.marginBottom;
  }

  private async addCategoryProducts(products: Product[], startY: number, startPage: number, resetCardCount: boolean = false) {
    const pageWidth = this.doc.internal.pageSize.width;
    const pageHeight = this.doc.internal.pageSize.height;
    const margin = this.catalogConfig?.page?.marginLeft || 15;
    const bottomMargin = this.catalogConfig?.page?.marginBottom || 30;
    
    // Usar configurações do catálogo se disponível
    let cardWidth, cardHeight, maxCardsPerPage, rows, columns;
    
    if (this.catalogConfig?.layout) {
      rows = this.catalogConfig.layout.rows;
      columns = this.catalogConfig.layout.columns;
      maxCardsPerPage = rows * columns;
      
      // Calcular dimensões dos cards baseado no espaço disponível e configurações
      const availableWidth = pageWidth - (margin * 2);
      const availableHeight = pageHeight - startY - bottomMargin;
      
      const cardSpacing = this.catalogConfig.layout.cardSpacing || 5;
      const verticalSpacing = this.catalogConfig.layout.rowSpacing || 10;
      
      // Calcular largura e altura dos cards para caber perfeitamente
      cardWidth = (availableWidth - (cardSpacing * (columns - 1))) / columns;
      cardHeight = Math.min(
        (availableHeight - (verticalSpacing * (rows - 1))) / rows,
        80 // Altura máxima para evitar cards muito altos
      );
      
      console.log('Layout PDF com configurações:', {
        rows,
        columns,
        maxCardsPerPage,
        cardWidth: cardWidth.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
        cardHeight: cardHeight.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
        pageWidth: pageWidth.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
        pageHeight: pageHeight.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
        availableWidth: availableWidth.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
        availableHeight: availableHeight.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
        startY,
        cardSpacing,
        verticalSpacing
      });
    } else {
      // Layout padrão: 8 produtos por página (4 linhas x 2 colunas)
      cardWidth = (pageWidth - margin * 3) / 2;
      cardHeight = 65;
      rows = 4;
      columns = 2;
      maxCardsPerPage = 8;
    }
    
    let currentY = startY;
    let currentPage = startPage;
    let cardsOnCurrentPage = resetCardCount ? 0 : 0; // Sempre resetar para nova categoria
    
    console.log(`Iniciando categoria com startY: ${startY}, página: ${startPage}, resetCardCount: ${resetCardCount}`);
    
    const cardSpacing = this.catalogConfig?.layout?.cardSpacing || 5;
    const verticalSpacing = this.catalogConfig?.layout?.rowSpacing || 10;
    
    for (let i = 0; i < products.length; i++) {
      const product = products[i];
      
      // Calcular posição baseada no grid ANTES de verificar se precisa de nova página
      const row = Math.floor(cardsOnCurrentPage / columns);
      const col = cardsOnCurrentPage % columns;
      
      const x = margin + col * (cardWidth + cardSpacing);
      const y = currentY + row * (cardHeight + verticalSpacing);
      
      // Verificar se o card vai ultrapassar a página
      if (y + cardHeight > pageHeight - bottomMargin) {
        console.log(`Card ${i + 1} ultrapassaria a página (y: ${y.toFixed(1)} + height: ${cardHeight} > limit: ${pageHeight - bottomMargin}), criando nova página`);
        this.doc.addPage();
        currentPage++;
        currentY = this.catalogConfig?.page?.marginTop || 20;
        cardsOnCurrentPage = 0;
        
        // Recalcular posição na nova página
        const newRow = Math.floor(cardsOnCurrentPage / columns);
        const newCol = cardsOnCurrentPage % columns;
        const newX = margin + newCol * (cardWidth + cardSpacing);
        const newY = currentY + newRow * (cardHeight + verticalSpacing);
        
        console.log(`NOVA PÁGINA - Produto ${i + 1} (${product.name}): linha ${newRow + 1}, coluna ${newCol + 1}, posição (${newX.toFixed(1)}, ${newY.toFixed(1)}), card ${cardsOnCurrentPage + 1}/${maxCardsPerPage}, currentY base: ${currentY}`);
        
        await this.addProductCard(product, newX, newY, cardWidth, cardHeight);
      } else {
        console.log(`Produto ${i + 1} (${product.name}): linha ${row + 1}, coluna ${col + 1}, posição (${x.toFixed(1)}, ${y.toFixed(1)}), card ${cardsOnCurrentPage + 1}/${maxCardsPerPage}, currentY base: ${currentY}`);
        
        await this.addProductCard(product, x, y, cardWidth, cardHeight);
      }
      
      cardsOnCurrentPage++;
      
      // Se completou uma página, criar nova página para próximos produtos
      if (cardsOnCurrentPage >= maxCardsPerPage && i < products.length - 1) {
        console.log(`Página completa (${maxCardsPerPage} cards), criando nova página`);
        this.doc.addPage();
        currentPage++;
        currentY = this.catalogConfig?.page?.marginTop || 20;
        cardsOnCurrentPage = 0;
      }
    }
    
    // Calcular Y final para a próxima categoria de forma mais robusta
    let finalY: number;
    if (cardsOnCurrentPage === 0) {
      // Se não há cards na página atual, usar currentY
      finalY = currentY + 30; // Espaço extra entre categorias
    } else {
      // Se há cards, calcular baseado na última linha
      const lastRow = Math.floor((cardsOnCurrentPage - 1) / columns);
      const lastRowY = currentY + lastRow * (cardHeight + verticalSpacing);
      finalY = lastRowY + cardHeight + 30; // Espaço extra entre categorias
    }
    
    console.log(`Categoria finalizada - cardsOnCurrentPage: ${cardsOnCurrentPage}, finalY calculado: ${finalY}`);
    
    return { finalY, currentPage };
  }

  private async addCoverPage() {
    const pageWidth = this.doc.internal.pageSize.width;
    const pageHeight = this.doc.internal.pageSize.height;
    
    // Verificar se há imagem de fundo personalizada
    if (this.catalogConfig?.cover?.backgroundImage) {
      try {
        await this.loadAndAddImage(
          this.catalogConfig.cover.backgroundImage, 
          0, 0, pageWidth, pageHeight
        );
      } catch (error) {
        console.error('Erro ao carregar imagem de fundo da capa:', error);
        // Fallback para gradiente padrão
        this.addDefaultCoverBackground(pageWidth, pageHeight);
      }
    } else {
      // Fundo gradiente padrão
      this.addDefaultCoverBackground(pageWidth, pageHeight);
    }
    
    // Configurações de texto da capa
    const coverConfig = this.catalogConfig?.cover || {};
    const titlePosition = coverConfig.titlePosition || 'center';
    const titleFont = coverConfig.titleFont || 'helvetica';
    const titleSize = coverConfig.titleSize || 32;
    const titleColor = coverConfig.titleColor || '#1e3a8a';
    
    const subtitleFont = coverConfig.subtitleFont || 'helvetica';
    const subtitleSize = coverConfig.subtitleSize || 16;
    const subtitleColor = coverConfig.subtitleColor || '#475569';
    
    // Calcular posições baseadas na configuração
    let titleY, subtitleY, dateY;
    if (titlePosition === 'top') {
      titleY = pageHeight * 0.25;
      subtitleY = titleY + 20;
      dateY = pageHeight - 20;
    } else if (titlePosition === 'bottom') {
      titleY = pageHeight * 0.75;
      subtitleY = titleY + 20;
      dateY = pageHeight - 40;
    } else { // center
      titleY = pageHeight/2 - 20;
      subtitleY = pageHeight/2;
      dateY = pageHeight - 20;
    }
    
    // Título principal
    this.doc.setFontSize(titleSize);
    this.doc.setFont(titleFont, 'bold');
    const titleRgb = this.hexToRgb(titleColor);
    this.doc.setTextColor(titleRgb.r, titleRgb.g, titleRgb.b);
    const title = coverConfig.title || 'CATÁLOGO DE PRODUTOS';
    this.doc.text(title, pageWidth / 2, titleY, { align: 'center' });
    
    // Subtítulo
    this.doc.setFontSize(subtitleSize);
    this.doc.setFont(subtitleFont, 'normal');
    const subtitleRgb = this.hexToRgb(subtitleColor);
    this.doc.setTextColor(subtitleRgb.r, subtitleRgb.g, subtitleRgb.b);
    const subtitle = coverConfig.subtitle || 'Sistema de Gestão';
    this.doc.text(subtitle, pageWidth / 2, subtitleY, { align: 'center' });
    
    // Data no rodapé
    const dateFont = coverConfig.dateFont || 'helvetica';
    const dateSize = coverConfig.dateSize || 12;
    const dateColor = coverConfig.dateColor || '#64748b';
    const dateRgb = this.hexToRgb(dateColor);
    
    this.doc.setFontSize(dateSize);
    this.doc.setFont(dateFont, 'normal');
    this.doc.setTextColor(dateRgb.r, dateRgb.g, dateRgb.b);
    this.doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, pageWidth / 2, dateY, { align: 'center' });
  }

  private addDefaultCoverBackground(pageWidth: number, pageHeight: number) {
    // Fundo gradiente
    this.doc.setFillColor(240, 248, 255);
    this.doc.rect(0, 0, pageWidth, pageHeight, 'F');
    
    // Gradiente overlay
    this.doc.setFillColor(59, 130, 246, 0.1);
    this.doc.rect(0, 0, pageWidth, pageHeight, 'F');
  }

  private async addProductCard(product: Product, x: number, y: number, width: number, height: number) {
    // Se há layout personalizado, usa ele; caso contrário, usa o layout padrão
    if (this.customLayout && this.customLayout.elements.length > 0) {
      await this.addCustomProductCard(product, x, y, width, height);
    } else {
      await this.addDefaultProductCard(product, x, y, width, height);
    }
  }

  private async addCustomProductCard(product: Product, x: number, y: number, width: number, height: number) {
    const layout = this.customLayout!;
    
    // Usar configurações do catálogo para borda do card se disponível
    const cardConfig = this.catalogConfig?.layout || {};
    const borderWidth = cardConfig.cardBorderWidth ?? layout.borderWidth;
    const borderColor = cardConfig.cardBorderColor || layout.borderColor;
    const backgroundColor = cardConfig.cardBackgroundColor || layout.backgroundColor;
    const borderRadius = cardConfig.cardBorderRadius ?? 0;
    
    // Box do produto usando configurações personalizadas
    this.doc.setDrawColor(this.hexToRgb(borderColor).r, this.hexToRgb(borderColor).g, this.hexToRgb(borderColor).b);
    this.doc.setLineWidth(borderWidth); 
    this.doc.setFillColor(this.hexToRgb(backgroundColor).r, this.hexToRgb(backgroundColor).g, this.hexToRgb(backgroundColor).b);
    
    if (borderRadius > 0) {
      // Simular bordas arredondadas com múltiplos retângulos menores (simplificado)
      this.doc.rect(x, y, width, height, 'FD');
    } else {
      this.doc.rect(x, y, width, height, 'FD');
    }
    
    console.log(`Renderizando card personalizado em (${x}, ${y}) com ${layout.elements.length} elementos`);
    
    // Renderizar elementos ordenados por zIndex
    const sortedElements = layout.elements
      .filter(element => element.visible)
      .sort((a, b) => a.zIndex - b.zIndex);
    
    for (const element of sortedElements) {
      // Calcular posições EXATAS baseadas nas coordenadas do designer
      const scaleX = width / layout.cardWidth;
      const scaleY = height / layout.cardHeight;
      
      const elementX = x + (element.x * scaleX);
      const elementY = y + (element.y * scaleY);
      const elementWidth = element.width * scaleX;
      const elementHeight = element.height * scaleY;
      
      console.log(`Elemento ${element.id}: designer(${element.x}, ${element.y}, ${element.width}x${element.height}) -> PDF(${elementX.toFixed(1)}, ${elementY.toFixed(1)}, ${elementWidth.toFixed(1)}x${elementHeight.toFixed(1)})`);
      
      await this.renderElement(product, element, elementX, elementY, elementWidth, elementHeight);
    }
  }

  private async renderElement(product: Product, element: ElementConfig, x: number, y: number, width: number, height: number) {
    console.log(`Renderizando elemento ${element.type} em (${x.toFixed(1)}, ${y.toFixed(1)})`);
    
    // Configurar cores e opacidade
    const colorRgb = this.hexToRgb(element.color);
    const bgColorRgb = element.backgroundColor !== 'transparent' ? this.hexToRgb(element.backgroundColor) : null;
    
    // Renderizar fundo se necessário
    if (bgColorRgb && element.backgroundColor !== 'transparent') {
      this.doc.setFillColor(bgColorRgb.r, bgColorRgb.g, bgColorRgb.b);
      if (element.borderRadius > 0) {
        this.doc.roundedRect(x, y, width, height, element.borderRadius, element.borderRadius, 'F');
      } else {
        this.doc.rect(x, y, width, height, 'F');
      }
    }
    
    
    // Para elementos de imagem - não renderizar borda aqui pois será feita na própria imagem circular
    if (element.type === 'image') {
      const imageSize = Math.min(width - (element.padding * 2), height - (element.padding * 2));
      const imageX = x + element.padding;
      const imageY = y + element.padding;
      
      if (product.photo_url) {
        try {
          await this.loadAndAddCircularImage(product.photo_url, imageX, imageY, imageSize, element);
        } catch (error) {
          this.addCircularPhotoPlaceholder(imageX, imageY, imageSize);
        }
      } else {
        this.addCircularPhotoPlaceholder(imageX, imageY, imageSize);
      }
      return;
    }
    
    // Renderizar borda apenas para elementos que não são imagem
    if (element.borderWidth > 0) {
      const borderColorRgb = this.hexToRgb(element.borderColor);
      this.doc.setDrawColor(borderColorRgb.r, borderColorRgb.g, borderColorRgb.b);
      this.doc.setLineWidth(element.borderWidth);
      if (element.borderRadius > 0) {
        this.doc.roundedRect(x, y, width, height, element.borderRadius, element.borderRadius, 'S');
      } else {
        this.doc.rect(x, y, width, height, 'S');
      }
    }
    
    // Configurar texto
    this.doc.setTextColor(colorRgb.r, colorRgb.g, colorRgb.b);
    this.doc.setFontSize(element.fontSize);
    
    let content = this.getElementContent(product, element);
    
    if (content) {
      // Calcular posição do texto com padding
      const textX = x + element.padding;
      const textY = y + element.padding + (element.fontSize * 0.8); // Ajuste para baseline do texto
      const textWidth = width - (element.padding * 2);
      
      // Processar texto com formatação de negrito
      if (content.includes('**')) {
        this.renderTextWithBold(content, textX, textY, element);
      } else {
        this.doc.setFont('helvetica', element.fontWeight === 'bold' ? 'bold' : 'normal');
        
        // Quebrar texto se necessário
        const splitText = this.doc.splitTextToSize(content, textWidth);
        
        // Renderizar texto com alinhamento
        if (element.textAlign === 'center') {
          this.doc.text(splitText, x + (width / 2), textY, { align: 'center' });
        } else if (element.textAlign === 'right') {
          this.doc.text(splitText, x + width - element.padding, textY, { align: 'right' });
        } else {
          this.doc.text(splitText, textX, textY);
        }
      }
    }
  }

  private getElementContent(product: Product, element: ElementConfig): string {
    // Identificar tipo do elemento pelo ID base (removendo timestamp)
    const baseId = element.id.split('-').slice(0, -1).join('-');
    
    switch (baseId) {
      case 'product-name':
        return product.name;
      case 'internal-code':
        return `**Cod.:** ${product.internal_code}`;
      case 'category':
        return product.categories?.name || 'Sem Categoria';
      case 'price':
        return `${product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`;
      case 'stock':
        // Não mostrar estoque para cliente, vendedor externo ou público
        if (this.userType === 'public' || this.userType === 'client' || this.userType === 'seller_external') {
          return '';
        }
        return `**Estoque:** ${product.stock}`;
      case 'unit':
        return `**Unidade:** ${product.stock_unit || 'Un'}`;
      case 'size':
        return product.size ? `**Tamanho:** ${product.size}` : '';
      case 'color':
        return product.color ? `**Cor:** ${product.color}` : '';
      case 'composition':
        return product.composition ? `**Composição:** ${product.composition}` : '';
      case 'width':
        return product.width ? `**Largura:** ${product.width}cm` : '';
      case 'length':
        return product.length ? `**Comprimento:** ${product.length}cm` : '';
      case 'thickness':
        return product.thickness ? `**Espessura:** ${product.thickness}mm` : '';
      case 'diameter':
        return product.diameter ? `**Diâmetro:** ${product.diameter}cm` : '';
      case 'observations':
        return product.observation ? `**Observações:** ${product.observation}` : '';
      default:
        return element.label;
    }
  }

  private async addDefaultProductCard(product: Product, x: number, y: number, width: number, height: number) {
    // Box do produto com configurações personalizadas
    const borderColor = this.catalogConfig?.styles?.cardBorderColor || '#e5e7eb';
    const backgroundColor = this.catalogConfig?.styles?.cardBackgroundColor || '#ffffff';
    const borderWidth = this.catalogConfig?.styles?.cardBorderWidth || 1;
    
    const borderRgb = this.hexToRgb(borderColor);
    const bgRgb = this.hexToRgb(backgroundColor);
    
    this.doc.setDrawColor(borderRgb.r, borderRgb.g, borderRgb.b);
    this.doc.setLineWidth(borderWidth);
    this.doc.setFillColor(bgRgb.r, bgRgb.g, bgRgb.b);
    this.doc.rect(x, y, width, height, 'FD');
    
    // Espaço para foto circular (lado esquerdo)
    const photoSize = Math.min(height - 8, width * 0.3);
    const photoX = x + 4;
    const photoY = y + (height - photoSize) / 2;
    
    if (product.photo_url) {
      try {
        await this.loadAndAddCircularImage(product.photo_url, photoX, photoY, photoSize);
      } catch (error) {
        this.addCircularPhotoPlaceholder(photoX, photoY, photoSize);
      }
    } else {
      this.addCircularPhotoPlaceholder(photoX, photoY, photoSize);
    }
    
    // Área de texto (lado direito)
    const textX = photoX + photoSize + 6;
    const textY = y + 10;
    const textWidth = width - photoSize - 14;
    
    // Nome do produto
    const titleSize = this.catalogConfig?.fonts?.titleSize || 10;
    this.doc.setFontSize(titleSize);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(0, 0, 0);
    const nameText = this.doc.splitTextToSize(product.name, textWidth);
    this.doc.text(nameText, textX, textY);
    
    let currentTextY = textY + (nameText.length * 6);
    
    // Código interno
    const subtitleSize = this.catalogConfig?.fonts?.subtitleSize || 8;
    this.doc.setFontSize(subtitleSize);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(100, 100, 100);
    this.doc.text(`Código: ${product.internal_code}`, textX, currentTextY);
    currentTextY += 8;
    
    // Preço
    this.doc.setFontSize(titleSize + 2);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(0, 128, 0);
    this.doc.text(`${product.price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`, textX, currentTextY);
    currentTextY += 10;
    
    // Informações adicionais em fonte menor
    const bodySize = this.catalogConfig?.fonts?.bodySize || 7;
    this.doc.setFontSize(bodySize);
    this.doc.setFont('helvetica', 'normal');
    
    // Todas as informações disponíveis do produto
    const productInfo = [];
    
    if (product.stock !== undefined && 
        !(this.userType === 'public' || this.userType === 'client' || this.userType === 'seller_external')) {
      productInfo.push(`Estoque: ${product.stock}${product.stock_unit ? ' ' + product.stock_unit : ''}`);
    }
    
    if (product.categories?.name) {
      productInfo.push(`Categoria: ${product.categories.name}`);
    }
    
    if (product.barcode) {
      productInfo.push(`Código de Barras: ${product.barcode}`);
    }
    
    if (product.size) {
      productInfo.push(`Tamanho: ${product.size}`);
    }
    
    if (product.color) {
      productInfo.push(`Cor: ${product.color}`);
    }
    
    if (product.composition) {
      productInfo.push(`Composição: ${product.composition}`);
    }
    
    // Dimensões
    const dimensions = [];
    if (product.width) dimensions.push(`L:${product.width}`);
    if (product.length) dimensions.push(`C:${product.length}`);
    if (product.thickness) dimensions.push(`E:${product.thickness}`);
    if (product.diameter) dimensions.push(`D:${product.diameter}`);
    if (dimensions.length > 0) {
      productInfo.push(`Dimensões: ${dimensions.join(' x ')}`);
    }
    
    if (product.box) {
      productInfo.push(`Embalagem: ${product.box}`);
    }
    
    if (product.observation) {
      productInfo.push(`Obs: ${product.observation}`);
    }
    
    // Renderizar informações respeitando o espaço disponível
    this.doc.setTextColor(60, 60, 60);
    const maxY = y + height - 4;
    
    for (const info of productInfo) {
      if (currentTextY + 6 <= maxY) {
        const infoText = this.doc.splitTextToSize(info, textWidth);
        this.doc.text(infoText, textX, currentTextY);
        currentTextY += infoText.length * 6;
      } else {
        break; // Não há mais espaço
      }
    }
  }

  private addPhotoPlaceholder(x: number, y: number, size: number) {
    // Fundo cinza claro
    this.doc.setFillColor(245, 245, 245);
    this.doc.rect(x, y, size, size, 'F');
    
    // Borda
    this.doc.setDrawColor(200, 200, 200);
    this.doc.setLineWidth(0.5);
    this.doc.rect(x, y, size, size, 'S');
    
    // Ícone de imagem (texto)
    this.doc.setFontSize(8);
    this.doc.setTextColor(150, 150, 150);
    this.doc.text('SEM', x + size/2, y + size/2 - 2, { align: 'center' });
    this.doc.text('FOTO', x + size/2, y + size/2 + 4, { align: 'center' });
  }

  private addCircularPhotoPlaceholder(x: number, y: number, size: number) {
    const centerX = x + size/2;
    const centerY = y + size/2;
    const radius = size/2;
    
    // Fundo cinza claro circular
    this.doc.setFillColor(245, 245, 245);
    this.doc.circle(centerX, centerY, radius, 'F');
    
    // Borda circular
    this.doc.setDrawColor(200, 200, 200);
    this.doc.setLineWidth(0.5);
    this.doc.circle(centerX, centerY, radius, 'S');
    
    // Ícone de imagem (texto)
    this.doc.setFontSize(7);
    this.doc.setTextColor(150, 150, 150);
    this.doc.text('SEM', centerX, centerY - 2, { align: 'center' });
    this.doc.text('FOTO', centerX, centerY + 4, { align: 'center' });
  }

  private async loadAndAddImage(imageUrl: string, x: number, y: number, width: number, height: number) {
    return new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Não foi possível criar contexto do canvas'));
            return;
          }
          
          canvas.width = width * 3;
          canvas.height = height * 3;
          
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
          this.doc.addImage(dataUrl, 'JPEG', x, y, width, height);
          resolve();
        } catch (error) {
          console.error('Erro ao processar imagem:', error);
          reject(error);
        }
      };
      
      img.onerror = () => {
        console.error('Erro ao carregar imagem:', imageUrl);
        reject(new Error('Falha ao carregar imagem'));
      };
      
      // Se for uma URL http/https, usar diretamente
      if (imageUrl.startsWith('http')) {
        img.src = imageUrl;
      } else {
        // Se for base64 ou blob, usar diretamente
        img.src = imageUrl;
      }
    });
  }

  private async loadAndAddCircularImage(imageUrl: string, x: number, y: number, size: number, element?: ElementConfig): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) {
            reject(new Error('Não foi possível criar contexto do canvas'));
            return;
          }
          
          canvas.width = size * 3;
          canvas.height = size * 3;
          
          // Limpar canvas (transparente)
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          // Criar máscara circular
          const centerX = canvas.width / 2;
          const centerY = canvas.height / 2;
          const radius = Math.min(canvas.width, canvas.height) / 2 - 3; // -3 para borda de 1px (com margem para resolução)
          
          ctx.save();
          ctx.beginPath();
          ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
          ctx.closePath();
          ctx.clip();
          
          // Calcular dimensões para preencher completamente o círculo (cover)
          const aspectRatio = img.width / img.height;
          let drawWidth, drawHeight;
          
          if (aspectRatio > 1) {
            // Imagem mais larga que alta
            drawHeight = canvas.height;
            drawWidth = drawHeight * aspectRatio;
          } else {
            // Imagem mais alta que larga
            drawWidth = canvas.width;
            drawHeight = drawWidth / aspectRatio;
          }
          
          // Centralizar a imagem
          const offsetX = (canvas.width - drawWidth) / 2;
          const offsetY = (canvas.height - drawHeight) / 2;
          
          // Desenhar a imagem preenchendo todo o círculo
          ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
          ctx.restore();
          
          // Adicionar borda personalizada se elemento foi fornecido
          if (element && element.borderWidth > 0) {
            ctx.save();
            ctx.strokeStyle = element.borderColor;
            ctx.lineWidth = element.borderWidth * 3; // multiplicar por 3 pois canvas é 3x maior
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
            ctx.stroke();
            ctx.restore();
          }
          
          const dataUrl = canvas.toDataURL('image/png');
          this.doc.addImage(dataUrl, 'PNG', x, y, size, size);
          resolve();
        } catch (error) {
          console.error('Erro ao processar imagem:', error);
          reject(error);
        }
      };
      
      img.onerror = () => {
        console.error('Erro ao carregar imagem:', imageUrl);
        reject(new Error('Falha ao carregar imagem'));
      };
      
      // Se for uma URL http/https, usar diretamente
      if (imageUrl.startsWith('http')) {
        img.src = imageUrl;
      } else {
        // Se for base64 ou blob, usar diretamente
        img.src = imageUrl;
      }
    });
  }

  private renderTextWithBold(content: string, x: number, y: number, element: ElementConfig) {
    // Dividir o texto em partes normais e negrito
    const parts = content.split(/(\*\*.*?\*\*)/);
    let currentX = x;
    
    for (const part of parts) {
      if (part.startsWith('**') && part.endsWith('**')) {
        // Texto em negrito
        const boldText = part.slice(2, -2);
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(boldText, currentX, y, { align: element.textAlign });
        currentX += this.doc.getTextWidth(boldText);
      } else if (part) {
        // Texto normal
        this.doc.setFont('helvetica', element.fontWeight === 'bold' ? 'bold' : 'normal');
        this.doc.text(part, currentX, y, { align: element.textAlign });
        currentX += this.doc.getTextWidth(part);
      }
    }
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
  }

}

export default CatalogPDFGenerator;