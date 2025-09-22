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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/utils';
import { Search, ShoppingBag, Package, Filter, AlertCircle, Link, Printer } from 'lucide-react';
import html2canvas from 'html2canvas';
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
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showOutOfStock, setShowOutOfStock] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [columnsCount, setColumnsCount] = useState<number>(4);
  
  // Estados específicos para Admin/Gerente
  const [showPrice, setShowPrice] = useState<boolean>(true);
  const [discountPercentage, setDiscountPercentage] = useState<number>(0);
  const [minStock, setMinStock] = useState<number>(0);
  const [maxStock, setMaxStock] = useState<number>(999999);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [searchTerm, selectedCategory, showOutOfStock, minStock, maxStock]);

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
      if (selectedCategory && selectedCategory !== 'all') {
        query = query.eq('category_id', selectedCategory);
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

  const generatePDF = async () => {
    try {
      toast.loading('Gerando PDF do catálogo...');
      
      // Buscar o elemento que contém os produtos
      const catalogContainer = document.getElementById('catalog-products-grid');
      if (!catalogContainer) {
        toast.error('Erro ao localizar o conteúdo para impressão');
        return;
      }

      // Obter todos os cards de produtos
      const productCards = catalogContainer.querySelectorAll('> div');
      if (productCards.length === 0) {
        toast.error('Nenhum produto encontrado para impressão');
        return;
      }

      // Calcular quantas colunas temos baseado no grid
      const containerStyles = window.getComputedStyle(catalogContainer);
      const gridTemplateColumns = containerStyles.gridTemplateColumns;
      const columnCount = gridTemplateColumns.split(' ').length;

      // Capturar a imagem do container
      const canvas = await html2canvas(catalogContainer, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#F2F8FF'
      });

      // Criar PDF
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      
      // Calcular dimensões mantendo a proporção
      const imgWidth = pageWidth - (margin * 2);
      const scale = imgWidth / canvas.width;
      const imgHeight = canvas.height * scale;
      
      // Se a imagem couber em uma página
      if (imgHeight <= pageHeight - (margin * 2)) {
        const imgData = canvas.toDataURL('image/png');
        pdf.addImage(imgData, 'PNG', margin, margin, imgWidth, imgHeight);
      } else {
        // Calcular alturas das linhas de produtos
        const productRows: Array<{elements: Element[], top: number, bottom: number}> = [];
        let currentRow: Element[] = [];
        let currentRowTop = -1;
        let currentRowBottom = -1;

        // Agrupar produtos por linha
        Array.from(productCards).forEach((card, index) => {
          const rect = card.getBoundingClientRect();
          const containerRect = catalogContainer.getBoundingClientRect();
          const relativeTop = rect.top - containerRect.top;
          const relativeBottom = rect.bottom - containerRect.top;

          // Se é o primeiro produto ou está na mesma linha
          if (currentRowTop === -1 || Math.abs(relativeTop - currentRowTop) < 50) {
            if (currentRowTop === -1) {
              currentRowTop = relativeTop;
              currentRowBottom = relativeBottom;
            } else {
              currentRowBottom = Math.max(currentRowBottom, relativeBottom);
            }
            currentRow.push(card);
          } else {
            // Nova linha
            if (currentRow.length > 0) {
              productRows.push({
                elements: [...currentRow],
                top: currentRowTop,
                bottom: currentRowBottom
              });
            }
            currentRow = [card];
            currentRowTop = relativeTop;
            currentRowBottom = relativeBottom;
          }
        });

        // Adicionar a última linha
        if (currentRow.length > 0) {
          productRows.push({
            elements: [...currentRow],
            top: currentRowTop,
            bottom: currentRowBottom
          });
        }

        // Gerar PDF página por página, respeitando as linhas
        const maxPageHeight = (pageHeight - (margin * 2)) / scale;
        let currentPageHeight = 0;
        let currentSourceY = 0;
        let isFirstPage = true;

        for (let i = 0; i < productRows.length; i++) {
          const row = productRows[i];
          const rowHeight = row.bottom - row.top;
          
          // Se a linha não cabe na página atual, criar nova página
          if (!isFirstPage && currentPageHeight + rowHeight > maxPageHeight) {
            // Finalizar página atual
            const pageCanvas = document.createElement('canvas');
            pageCanvas.width = canvas.width;
            pageCanvas.height = currentPageHeight;
            const pageCtx = pageCanvas.getContext('2d');
            
            if (pageCtx) {
              pageCtx.drawImage(
                canvas,
                0, currentSourceY, canvas.width, currentPageHeight,
                0, 0, canvas.width, currentPageHeight
              );
              
              const pageImgData = pageCanvas.toDataURL('image/png');
              const pageImgHeight = currentPageHeight * scale;
              
              pdf.addImage(pageImgData, 'PNG', margin, margin, imgWidth, pageImgHeight);
            }
            
            // Preparar nova página
            pdf.addPage();
            currentSourceY = row.top;
            currentPageHeight = rowHeight;
          } else {
            // Adicionar linha à página atual
            if (isFirstPage) {
              currentSourceY = row.top;
              currentPageHeight = rowHeight;
              isFirstPage = false;
            } else {
              currentPageHeight = row.bottom - currentSourceY;
            }
          }
        }

        // Finalizar última página
        if (currentPageHeight > 0) {
          const pageCanvas = document.createElement('canvas');
          pageCanvas.width = canvas.width;
          pageCanvas.height = currentPageHeight;
          const pageCtx = pageCanvas.getContext('2d');
          
          if (pageCtx) {
            pageCtx.drawImage(
              canvas,
              0, currentSourceY, canvas.width, currentPageHeight,
              0, 0, canvas.width, currentPageHeight
            );
            
            const pageImgData = pageCanvas.toDataURL('image/png');
            const pageImgHeight = currentPageHeight * scale;
            
            pdf.addImage(pageImgData, 'PNG', margin, margin, imgWidth, pageImgHeight);
          }
        }
      }
      
      // Gerar nome do arquivo com data atual
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];
      const fileName = `catalogo-produtos-${dateStr}.pdf`;
      
      // Fazer download
      pdf.save(fileName);
      
      toast.dismiss();
      toast.success('PDF do catálogo gerado com sucesso!');
      
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.dismiss();
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
          
          {/* Link para cadastro se for público */}
          {userType === 'public' && (
            <div className="flex justify-center mb-4">
              <Button 
                variant="outline" 
                onClick={() => navigate('/cadastro')}
                className="flex items-center gap-2"
              >
                <Link className="w-4 h-4" />
                Solicitar Cadastro
              </Button>
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
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="bg-white/50 border-gray-200 rounded-xl h-12 focus:border-blue-500 focus:ring-blue-500/20 transition-all">
                      <Filter className="w-4 h-4 mr-2 text-gray-500" />
                      <SelectValue placeholder="Filtrar por categoria" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as categorias</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
              <Card key={product.id} className="glass hover:shadow-lg transition-all">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2">{product.name}</CardTitle>
                      <CardDescription className="mt-1">
                        Código: {product.internal_code}
                      </CardDescription>
                    </div>
                  </div>
                  
                  {/* Foto do produto */}
                  <div className="w-full aspect-square mb-3 bg-gray-100 rounded-lg overflow-hidden">
                    <Avatar className="w-full h-full rounded-lg">
                      <AvatarImage 
                        src={product.photo_url || ''} 
                        alt={product.name}
                        className="object-cover w-full h-full"
                      />
                      <AvatarFallback className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                        <Package className="h-8 w-8 text-gray-400" />
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3">
                    {/* Preço */}
                    {showPrice && (
                      <div className="flex justify-between items-center">
                        <div className="flex flex-col">
                          {discountPercentage > 0 ? (
                            <div className="flex flex-col">
                              <span className="text-lg text-gray-500 line-through">
                                {formatCurrency(product.price)}
                              </span>
                              <span className="text-2xl font-bold text-green-600">
                                {formatCurrency(calculateDiscountedPrice(product.price))}
                              </span>
                            </div>
                          ) : (
                            <span className="text-2xl font-bold text-green-600">
                              {formatCurrency(product.price)}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    {/* Badge de estoque */}
                    <div className="flex flex-wrap gap-2">
                      {product.categories && (
                        <Badge variant="outline">
                          {product.categories.name}
                        </Badge>
                      )}
                      {/* Mostrar estoque para admin, gerente e vendedor interno */}
                      {(userType === 'admin' || userType === 'seller_internal') && (
                        <Badge variant={getStockBadgeVariant(product.stock)}>
                          {getStockStatusText(product.stock)}
                        </Badge>
                      )}
                    </div>
                    
                    {product.observation && (
                       <div className="text-sm text-gray-600 mt-2 p-2 bg-gray-50 rounded-md">
                         <strong>Observação:</strong> {product.observation}
                       </div>
                     )}
                  </div>
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
                {searchTerm || selectedCategory !== 'all' ? 'Tente ajustar sua busca ou filtros' : 'Não há produtos cadastrados'}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Catalog;