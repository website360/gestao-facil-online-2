import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Search, ShoppingBag, Package, Filter } from 'lucide-react';

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
  const [products, setProducts] = useState<Product[]>([]);
  
  // Verificar se é a versão pública do catálogo
  const isPublicCatalog = location.pathname === '/catalog-public';
  const [categories, setCategories] = useState<Category[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showOutOfStock, setShowOutOfStock] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [columnsCount, setColumnsCount] = useState<number>(4);

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [searchTerm, selectedCategory, showOutOfStock]);

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
        // Por padrão, mostrar apenas produtos com estoque (>= 1)
        query = query.gte('stock', 1);
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
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              <ShoppingBag className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Catálogo de Produtos</h1>
          <p className="text-gray-600 mb-4">Visualize nossos produtos disponíveis</p>
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
              </div>
              <div>
                Mostrando {products.length} produtos
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Grid de produtos com fotos */}
        <div className={getGridClasses()}>
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
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="text-2xl font-bold text-green-600">
                          R$ {product.price.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    {product.categories && (
                      <Badge variant="outline">
                        {product.categories.name}
                      </Badge>
                    )}
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