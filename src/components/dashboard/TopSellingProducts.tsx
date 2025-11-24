import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import EmptyState from '@/components/ui/empty-state';
import { TrendingUp, Package } from 'lucide-react';

interface TopProduct {
  product_id: string;
  product_name: string;
  internal_code: string;
  photo_url: string | null;
  current_stock: number;
  quantity_sold: number;
}

interface TopSellingProductsProps {
  products: TopProduct[];
  loading: boolean;
}

const TopSellingProducts = ({ products, loading }: TopSellingProductsProps) => {
  if (loading) {
    return (
      <Card className="bg-white border border-gray-200 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-gray-600" />
            Top 10 Produtos Mais Vendidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-32 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-lg font-semibold text-gray-900 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2 text-gray-600" />
          Top 10 Produtos Mais Vendidos
          {products.length > 0 && (
            <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
              {products.length}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {products.length === 0 ? (
          <EmptyState
            title="Nenhuma venda no período"
            description="Os produtos mais vendidos aparecerão aqui quando houver vendas registradas."
            icon={Package}
          />
        ) : (
          <ScrollArea className="h-[600px]">
            <div className="p-6">
              <div className="space-y-4">
                {products.map((product, index) => (
                  <div
                    key={product.product_id}
                    className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    {/* Ranking Badge */}
                    <div className="flex-shrink-0">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                          index === 0
                            ? 'bg-yellow-500 text-white'
                            : index === 1
                            ? 'bg-gray-300 text-gray-700'
                            : index === 2
                            ? 'bg-orange-400 text-white'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {index + 1}
                      </div>
                    </div>

                    {/* Product Image */}
                    <div className="flex-shrink-0 w-16 h-16 bg-white rounded-lg border border-gray-200 flex items-center justify-center overflow-hidden">
                      {product.photo_url ? (
                        <img
                          src={product.photo_url}
                          alt={product.product_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Package className="w-8 h-8 text-gray-300" />
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-gray-900 truncate">
                        {product.product_name}
                      </h4>
                      <p className="text-xs text-gray-500">
                        Código: {product.internal_code}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge
                          variant={product.current_stock > 10 ? 'default' : product.current_stock > 0 ? 'secondary' : 'destructive'}
                          className="text-xs"
                        >
                          Estoque: {product.current_stock}
                        </Badge>
                      </div>
                    </div>

                    {/* Quantity Sold */}
                    <div className="flex-shrink-0 text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        {product.quantity_sold}
                      </div>
                      <div className="text-xs text-gray-500">vendidos</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
};

export default TopSellingProducts;
