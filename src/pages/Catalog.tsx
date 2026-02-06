import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import { Search, ShoppingBag, Package, Filter, AlertCircle, Printer } from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { PDFProgressModal } from '@/components/catalog/PDFProgressModal';

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

interface Category {
  id: string;
  name: string;
}

const Catalog = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isClient, userProfile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  
  // Verificar se é a versão pública do catálogo
  const isPublicCatalog = location.pathname === '/catalog-public';
  
  // Determinar o tipo de usuário para lógica de estoque
  const getUserType = () => {
    if (!user && !isClient) return 'public'; // Usuário não logado
    if (isClient) return 'client'; // Cliente logado
    if (userProfile?.role === 'vendedor_externo') return 'seller_external'; // Vendedor Externo
    if (userProfile?.role === 'vendedor_interno') return 'seller_internal'; // Vendedor Interno
    if (userProfile?.role === 'admin' || userProfile?.role === 'gerente') return 'admin'; // Admin/Gerente
    return 'seller_external'; // Default para outros roles
  };
  
  const userType = getUserType();
  const shouldUseStockLimit = ['public', 'client', 'seller_external'].includes(userType);
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showOutOfStock, setShowOutOfStock] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [columnsCount, setColumnsCount] = useState<number>(4);
  
  // Estados específicos para Admin/Gerente
  const [showPrice, setShowPrice] = useState<boolean>(true);
  const [discountPercentage, setDiscountPercentage] = useState<number>(0);
  const [minStock, setMinStock] = useState<number>(0);
  const [maxStock, setMaxStock] = useState<number>(999999);

  // Estado para progresso do PDF
  const [pdfProgress, setPdfProgress] = useState({
    isGenerating: false,
    progress: 0,
    currentPage: 0,
    totalPages: 0,
    status: 'Iniciando...'
  });

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [searchTerm, selectedCategories, showOutOfStock, minStock, maxStock]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
      toast.error('Erro ao carregar categorias');
    }
  };

  const fetchProducts = async () => {
    try {
      let query = supabase
        .from('products')
        .select(`
          id,
          name,
          internal_code,
          barcode,
          price,
          stock,
          photo_url,
          size,
          composition,
          color,
          box,
          observation,
          stock_unit,
          width,
          length,
          thickness,
          diameter,
          categories (
            name
          )
        `);

      // Apply search filter
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,internal_code.ilike.%${searchTerm}%`);
      }

      // Apply category filter
      if (selectedCategories.length > 0) {
        query = query.in('category_id', selectedCategories);
      }

      // Apply stock filter
      if (!showOutOfStock) {
        if (shouldUseStockLimit) {
          // Para público, cliente e vendedor externo: produtos com mais de 10 unidades são considerados "em estoque"
          query = query.gt('stock', 10);
        } else {
          // Para admin, gerente e vendedor interno: produtos com 1 ou mais unidades são considerados "em estoque"
          query = query.gte('stock', 1);
        }
      }

      // Aplicar filtro de range de estoque (apenas para admin)
      if (userType === 'admin') {
        if (minStock > 0) {
          query = query.gte('stock', minStock);
        }
        if (maxStock < 999999) {
          query = query.lte('stock', maxStock);
        }
      }

      query = query.order('name');

      const { data, error } = await query;

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      toast.error('Erro ao carregar produtos');
    } finally {
      setLoading(false);
    }
  };

  // Função para calcular preço com desconto
  const calculateDiscountedPrice = (originalPrice: number) => {
    if (discountPercentage <= 0) return originalPrice;
    return originalPrice * (1 - discountPercentage / 100);
  };

  // Função para determinar se produto está em estoque baseado no tipo de usuário
  const isProductInStock = (stock: number) => {
    if (shouldUseStockLimit) {
      return stock > 10; // Público, cliente e vendedor externo: mais de 10 unidades
    }
    return stock > 0; // Admin, gerente e vendedor interno: qualquer quantidade acima de 0
  };

  // Função para obter texto do status de estoque
  const getStockStatusText = (stock: number) => {    
    if (shouldUseStockLimit) {
      if (stock > 10) return `${stock} em estoque`;
      if (stock > 0) return 'Estoque baixo';
      return 'Fora de estoque';
    } else {
      if (stock > 0) return `${stock} em estoque`;
      return 'Fora de estoque';
    }
  };

  // Função para obter cor do badge de estoque
  const getStockBadgeVariant = (stock: number) => {
    if (shouldUseStockLimit) {
      if (stock > 10) return 'default'; // Verde
      if (stock > 0) return 'secondary'; // Amarelo/Warning
      return 'destructive'; // Vermelho
    } else {
      if (stock > 0) return 'default';
      return 'destructive';
    }
  };

  const getGridClasses = () => {
    switch (columnsCount) {
      case 2:
        return "grid grid-cols-1 md:grid-cols-2 gap-6";
      case 3:
        return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6";
      case 4:
        return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6";
      case 5:
        return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6";
      default:
        return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6";
    }
  };

  const getTitleClasses = () => {
    switch (columnsCount) {
      case 2:
        return "text-lg font-bold text-gray-900 line-clamp-2 mb-1 leading-tight";
      case 3:
        return "text-base font-bold text-gray-900 line-clamp-2 mb-1 leading-tight";
      case 4:
        return "text-sm font-bold text-gray-900 line-clamp-2 mb-1 leading-tight";
      case 5:
        return "text-xs font-bold text-gray-900 line-clamp-2 mb-1 leading-tight";
      default:
        return "text-sm font-bold text-gray-900 line-clamp-2 mb-1 leading-tight";
    }
  };

  const getTitleContainerHeight = () => {
    switch (columnsCount) {
      case 2:
        return "min-h-[64px]";
      case 3:
        return "min-h-[58px]";
      case 4:
        return "min-h-[54px]";
      case 5:
        return "min-h-[48px]";
      default:
        return "min-h-[54px]";
    }
  };

  const generatePDF = async () => {
    try {
      // Buscar o elemento que contém os produtos
      const catalogContainer = document.getElementById('catalog-products-grid');
      if (!catalogContainer) {
        toast.error('Erro ao localizar o conteúdo para impressão');
        return;
      }

      // Obter todos os cards de produtos
      const productCards = Array.from(catalogContainer.children) as Element[];
      if (productCards.length === 0) {
        toast.error('Nenhum produto encontrado para impressão');
        return;
      }

      // Configurar produtos por página baseado nas colunas selecionadas
      const ROWS_PER_PAGE = 3;
      const productsPerPage = columnsCount * ROWS_PER_PAGE;
      const totalPages = Math.ceil(productCards.length / productsPerPage);

      // Iniciar modal de progresso
      setPdfProgress({
        isGenerating: true,
        progress: 0,
        currentPage: 0,
        totalPages,
        status: 'Preparando documento...'
      });

      // Aguardar um frame para o modal renderizar
      await new Promise(resolve => requestAnimationFrame(resolve));

      // Preparar estilo para evitar corte de textos durante captura
      const styleEl = document.createElement('style');
      styleEl.id = 'pdf-capture-style';
      styleEl.textContent = `
        .pdf-page-container .line-clamp-2 { -webkit-line-clamp: unset !important; display: block !important; overflow: visible !important; }
        .pdf-page-container .catalog-title { line-height: 1.2 !important; }
        .pdf-page-container .catalog-stock-badge {
          display: inline-flex !important;
          justify-content: flex-start !important;
          align-items: center !important;
          white-space: nowrap !important;
          text-align: left !important;
          font-size: 11px !important;
          font-weight: 600 !important;
          line-height: 1.1 !important;
          padding: 6px 12px !important;
          min-height: 26px !important;
          height: auto !important;
          border-radius: 9999px !important;
          overflow: visible !important;
          box-sizing: border-box !important;
          -webkit-font-smoothing: antialiased !important;
          -moz-osx-font-smoothing: grayscale !important;
          transform: translateZ(0) !important;
          gap: 0 !important;
          margin-top: 6px !important;
        }
        .pdf-page-container .catalog-stock-badge * {
          line-height: 1.1 !important;
        }
        .pdf-page-container .line-through {
          position: relative !important;
          display: inline-block !important;
          text-decoration: none !important;
          line-height: 1.1 !important;
        }
        .pdf-page-container .line-through::after {
          content: '';
          position: absolute;
          left: 0;
          top: calc(54% + 8px) !important;
          transform: translateY(-50%);
          width: 30%;
          height: 1px;
          background: rgb(156, 163, 175);
          pointer-events: none;
        }
        .pdf-page-container .pdf-stock-text { 
          position: relative !important; 
          top: -8px !important; 
          display: inline-block !important; 
        }
      `;
      document.head.appendChild(styleEl);

      // Criar PDF com folha A4 e margem de 1cm (com compressão para reduzir memória)
      const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4', compress: true });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const availableWidth = pageWidth - (margin * 2);
      const availableHeight = pageHeight - (margin * 2);

      // Processar produtos em páginas
      for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
        const startIdx = pageIndex * productsPerPage;
        const endIdx = Math.min(startIdx + productsPerPage, productCards.length);
        const pageProducts = productCards.slice(startIdx, endIdx);

        // Atualizar progresso
        setPdfProgress(prev => ({
          ...prev,
          currentPage: pageIndex + 1,
          progress: ((pageIndex) / totalPages) * 100,
          status: `Processando página ${pageIndex + 1} de ${totalPages}...`
        }));

        // Aguardar um frame para atualizar a UI
        await new Promise(resolve => requestAnimationFrame(resolve));

        // Criar container temporário para esta página
        const pageContainer = document.createElement('div');
        pageContainer.className = 'pdf-page-container';
        pageContainer.style.cssText = `
          position: fixed;
          left: -9999px;
          top: 0;
          width: ${catalogContainer.clientWidth}px;
          display: grid;
          grid-template-columns: repeat(${columnsCount}, minmax(0, 1fr));
          gap: 1rem;
          background: white;
          padding: 1rem;
        `;

        // Clonar os produtos para esta página
        pageProducts.forEach(card => {
          const clone = card.cloneNode(true) as HTMLElement;
          
          // Processar badges de estoque
          const stockBadges = clone.querySelectorAll('.catalog-stock-badge');
          stockBadges.forEach((badge) => {
            if (!(badge as HTMLElement).querySelector('.pdf-stock-text')) {
              const wrapper = document.createElement('span');
              wrapper.className = 'pdf-stock-text';
              while (badge.firstChild) {
                wrapper.appendChild(badge.firstChild);
              }
              badge.appendChild(wrapper);
            }
          });
          
          pageContainer.appendChild(clone);
        });

        document.body.appendChild(pageContainer);

        // Forçar CORS nas imagens e aguardar carregamento
        const images = pageContainer.querySelectorAll('img');
        images.forEach((img) => {
          try {
            const el = img as HTMLImageElement;
            if (el && el.src && !el.src.startsWith('data:')) {
              el.setAttribute('crossorigin', 'anonymous');
              const src = (el.currentSrc || el.src);
              el.src = src; // reatribui para forçar reload com CORS
            }
          } catch (_) {}
        });

        await Promise.all(
          Array.from(images).map(img => {
            if ((img as HTMLImageElement).complete) return Promise.resolve();
            return new Promise(resolve => {
              (img as HTMLImageElement).onload = resolve;
              (img as HTMLImageElement).onerror = resolve;
              setTimeout(resolve, 2000);
            });
          })
        );

        // Capturar esta página
        const canvas = await html2canvas(pageContainer, {
          scale: 1.5,
          useCORS: true,
          logging: false,
          backgroundColor: '#FFFFFF',
          onclone: (clonedDoc) => {
            const clonedContainer = clonedDoc.querySelector('.pdf-page-container');
            if (clonedContainer) {
              (clonedContainer as HTMLElement).style.left = '0';
            }
          }
        });

        // Remover container temporário
        document.body.removeChild(pageContainer);

        // Adicionar página ao PDF
        if (pageIndex > 0) {
          pdf.addPage();
        }

        const imgData = canvas.toDataURL('image/jpeg', 0.85);
        
        // Calcular dimensões
        let finalWidth = availableWidth;
        let finalHeight = availableWidth / (canvas.width / canvas.height);

        // Se a altura ultrapassar o limite, redimensionar pela altura
        if (finalHeight > availableHeight) {
          finalHeight = availableHeight;
          finalWidth = availableHeight * (canvas.width / canvas.height);
        }

        const offsetX = margin;
        const offsetY = margin;

        pdf.addImage(imgData, 'JPEG', offsetX, offsetY, finalWidth, finalHeight);

        // Aguardar um pouco para não travar o navegador
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Limpar estilos
      styleEl.remove();

      // Atualizar para 100%
      setPdfProgress(prev => ({
        ...prev,
        progress: 100,
        status: 'Finalizando PDF...'
      }));

      await new Promise(resolve => setTimeout(resolve, 300));

      // Gerar nome do arquivo com data atual
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];
      const fileName = `catalogo-produtos-${dateStr}.pdf`;
      
      // Fazer download
      pdf.save(fileName);
      
      // Fechar modal de progresso
      setPdfProgress({
        isGenerating: false,
        progress: 0,
        currentPage: 0,
        totalPages: 0,
        status: ''
      });

      toast.success('PDF do catálogo gerado com sucesso!');
      
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      setPdfProgress({
        isGenerating: false,
        progress: 0,
        currentPage: 0,
        totalPages: 0,
        status: ''
      });
      toast.error('Erro ao gerar PDF do catálogo');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ backgroundColor: '#F2F8FF' }}>
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
          <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-gradient-to-br from-yellow-400/10 to-orange-400/10 rounded-full blur-2xl"></div>
        </div>
        <div className="relative z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen relative overflow-hidden ${isPublicCatalog ? 'p-6' : 'p-4'}`} style={{ backgroundColor: '#F2F8FF' }}>
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-gradient-to-br from-yellow-400/10 to-orange-400/10 rounded-full blur-2xl"></div>
      </div>

      <div className={`${isPublicCatalog ? 'w-full px-8 py-6' : 'max-w-7xl px-4'} mx-auto relative z-10`}>
        {/* Header section */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-48 h-28 flex items-center justify-center">
              <img src="/lovable-uploads/a16e0c44-3fe5-4408-861e-2b328ba401ea.png" alt="Irmãos Mantovani Têxtil" className="w-full h-full object-contain" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Catálogo de Produtos</h1>
          <p className="text-gray-600 mb-4">Visualize nossos produtos disponíveis</p>
          
          {/* Indicador do tipo de visualização */}
          {userType !== 'public' && (
            <div className="flex justify-center mb-4">
              <Badge variant="outline" className="text-sm">
                {userType === 'admin' ? 'Visualização Administrativa (estoque real)' : 
                 userType === 'client' ? 'Visualização Cliente' : 
                 userType === 'seller_internal' ? 'Visualização Vendedor Interno' :
                 userType === 'seller_external' ? 'Visualização Vendedor Externo' : 'Visualização Pública'}
              </Badge>
            </div>
          )}
        </div>

        {/* Search and filters section */}
        <Card className="glass mb-6">
          <CardHeader>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      placeholder="Buscar produtos..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 bg-white/50 border-gray-200 rounded-xl h-12 text-lg focus:border-blue-500 focus:ring-blue-500/20 transition-all"
                    />
                  </div>
                </div>
                <div className="w-full md:w-80">
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full bg-white/50 border-gray-200 rounded-xl h-12 focus:border-blue-500 focus:ring-blue-500/20 transition-all justify-start"
                      >
                        <Filter className="w-4 h-4 mr-2 text-gray-500" />
                        {selectedCategories.length === 0 
                          ? "Filtrar por categoria" 
                          : selectedCategories.length === 1
                          ? categories.find(c => c.id === selectedCategories[0])?.name
                          : `${selectedCategories.length} categorias selecionadas`}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-4 bg-white" align="start">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-semibold">Categorias</Label>
                          {selectedCategories.length > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedCategories([])}
                              className="h-auto p-1 text-xs"
                            >
                              Limpar
                            </Button>
                          )}
                        </div>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {categories.map((category) => (
                            <div key={category.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={`category-${category.id}`}
                                checked={selectedCategories.includes(category.id)}
                                onCheckedChange={(checked) => {
                                  if (checked) {
                                    setSelectedCategories([...selectedCategories, category.id]);
                                  } else {
                                    setSelectedCategories(selectedCategories.filter(id => id !== category.id));
                                  }
                                }}
                              />
                              <label
                                htmlFor={`category-${category.id}`}
                                className="text-sm text-gray-700 cursor-pointer flex-1"
                              >
                                {category.name}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="w-full md:w-64">
                  <div className="flex items-center space-x-2 h-12 px-3 bg-white/50 border border-gray-200 rounded-xl">
                    <Checkbox
                      id="show-out-of-stock"
                      checked={showOutOfStock}
                      onCheckedChange={(checked) => setShowOutOfStock(checked as boolean)}
                    />
                    <label htmlFor="show-out-of-stock" className="text-sm text-gray-700">
                      Incluir produtos sem estoque
                    </label>
                  </div>
                </div>
                <div className="w-full md:w-48">
                  <Select value={columnsCount.toString()} onValueChange={(value) => setColumnsCount(parseInt(value))}>
                    <SelectTrigger className="bg-white/50 border-gray-200 rounded-xl h-12 focus:border-blue-500 focus:ring-blue-500/20 transition-all">
                      <SelectValue placeholder="Colunas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2">2 Colunas</SelectItem>
                      <SelectItem value="3">3 Colunas</SelectItem>
                      <SelectItem value="4">4 Colunas</SelectItem>
                      <SelectItem value="5">5 Colunas</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {/* Controles específicos para Admin/Gerente */}
              {userType === 'admin' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200/50">
                  <div className="flex items-center space-x-2 h-12 px-3 bg-blue-50/50 border border-blue-200 rounded-xl">
                    <Checkbox
                      id="show-price"
                      checked={showPrice}
                      onCheckedChange={(checked) => setShowPrice(checked as boolean)}
                    />
                    <label htmlFor="show-price" className="text-sm text-blue-700 font-medium">
                      Mostrar preços
                    </label>
                  </div>
                  
                  <div className="flex items-center space-x-2 bg-blue-50/50 border border-blue-200 rounded-xl px-3 justify-between">
                    <label className="text-sm text-blue-700 font-medium whitespace-nowrap">
                      Desconto (%):
                    </label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={discountPercentage}
                      onChange={(e) => setDiscountPercentage(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
                      className="w-20 h-8 text-center border-blue-300 focus:border-blue-500"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2 bg-blue-50/50 border border-blue-200 rounded-xl px-3 justify-between">
                    <label className="text-sm text-blue-700 font-medium whitespace-nowrap">
                      Estoque:
                    </label>
                    <div className="flex items-center space-x-1">
                      <Input
                        type="number"
                        min="0"
                        value={minStock}
                        onChange={(e) => setMinStock(Math.max(0, parseInt(e.target.value) || 0))}
                        className="w-16 h-8 text-center border-blue-300 focus:border-blue-500"
                      />
                      <span className="text-xs text-blue-600">-</span>
                      <Input
                        type="number"
                        min="1"
                        value={maxStock === 999999 ? '' : maxStock}
                        placeholder="∞"
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          setMaxStock(isNaN(value) ? 999999 : Math.max(1, value));
                        }}
                        className="w-16 h-8 text-center border-blue-300 focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-gray-600">
              <div className="flex items-center gap-4">
                {showOutOfStock && (
                  <Badge variant="outline" className="text-orange-600">
                    Incluindo produtos sem estoque
                  </Badge>
                )}
                {!showOutOfStock && (
                  <Badge variant="secondary" className="text-blue-600">
                    Apenas produtos com estoque
                  </Badge>
                )}
                {userType === 'admin' && discountPercentage > 0 && (
                  <Badge variant="outline" className="text-green-600">
                    Desconto: {discountPercentage}%
                  </Badge>
                )}
                {userType === 'admin' && !showPrice && (
                  <Badge variant="outline" className="text-red-600">
                    Preços ocultos
                  </Badge>
                )}
                {userType === 'admin' && (minStock > 0 || maxStock < 999999) && (
                  <Badge variant="outline" className="text-purple-600">
                    Estoque: {minStock} - {maxStock === 999999 ? '∞' : maxStock}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-4">
                <Button
                  onClick={generatePDF}
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 hover:bg-blue-50"
                  disabled={products.length === 0}
                >
                  <Printer className="w-4 h-4" />
                  Gerar PDF
                </Button>
                <div>
                  Mostrando {products.length} produtos
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Grid de produtos com fotos */}
        <div id="catalog-products-grid" className={getGridClasses()}>
          {products.map((product) => {
            return (
              <Card key={product.id} className="bg-white hover:shadow-lg transition-all border border-gray-200">
                <CardContent className="p-4">
                  {/* Título e Código */}
                  <div className={`mb-3 ${getTitleContainerHeight()}`}>
                    <h3 className={`catalog-title ${getTitleClasses()}`}>
                      {product.name}
                    </h3>
                    <p className="text-xs text-gray-500">
                      Código: {product.internal_code}
                    </p>
                  </div>
                  
                  {/* Foto do produto */}
                  <div className="w-full aspect-square mb-4 bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center">
                    {product.photo_url ? (
                      <img 
                        src={product.photo_url} 
                        alt={product.name}
                        className="object-contain w-full h-full p-2"
                      />
                    ) : (
                      <Package className="h-12 w-12 text-gray-300" />
                    )}
                  </div>
                  
                  {/* Preço */}
                  {showPrice && (
                    <div className="mb-2">
                      {discountPercentage > 0 ? (
                        <div className="flex flex-col">
                          <span className="text-sm text-gray-500 line-through">
                            {formatCurrency(product.price)}
                          </span>
                          <span className="text-xl font-bold text-green-600">
                            {formatCurrency(calculateDiscountedPrice(product.price))}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xl font-bold text-green-600">
                          {formatCurrency(product.price)}
                        </span>
                      )}
                    </div>
                  )}
                  
                  {/* Categoria e Badge de estoque */}
                  <div className="flex flex-col gap-1.5 mb-2">
                    {product.categories && (
                      <span className="text-xs text-gray-700">
                        {product.categories.name}
                      </span>
                    )}
                    {/* Mostrar estoque para admin, gerente e vendedor interno */}
                    {(userType === 'admin' || userType === 'seller_internal') && (
                      <Badge 
                        className={`catalog-stock-badge ${
                          getStockBadgeVariant(product.stock) === 'default' 
                            ? 'bg-blue-500 text-white hover:bg-blue-600' 
                            : getStockBadgeVariant(product.stock) === 'destructive'
                            ? 'bg-red-500 text-white hover:bg-red-600'
                            : 'bg-yellow-500 text-white hover:bg-yellow-600'
                        }`}
                      >
                        {getStockStatusText(product.stock)}
                      </Badge>
                    )}
                  </div>
                  
                  {/* Observações */}
                  {product.observation && (
                    <div className="text-xs text-gray-700 mt-2 pt-2 border-t border-gray-100">
                      <strong className="font-semibold">Observação:</strong> {product.observation}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {products.length === 0 && !loading && (
          <Card className="glass">
            <CardContent className="py-12 text-center">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhum produto encontrado
              </h3>
              <p className="text-gray-500">
                {searchTerm || selectedCategories.length > 0 ? 'Tente ajustar sua busca ou filtros' : 'Não há produtos cadastrados'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal de progresso do PDF */}
      <PDFProgressModal
        isOpen={pdfProgress.isGenerating}
        progress={pdfProgress.progress}
        currentPage={pdfProgress.currentPage}
        totalPages={pdfProgress.totalPages}
        status={pdfProgress.status}
      />
    </div>
  );
};

export default Catalog;