
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Download, BarChart3, History, Truck, User } from 'lucide-react';
import SalesByDateClientReport from '@/components/reports/SalesByDateClientReport';
import SalesBySalespersonReport from '@/components/reports/SalesBySalespersonReport';
import ProductStockHistoryReport from '@/components/reports/ProductStockHistoryReport';
import ShippingReport from '@/components/reports/ShippingReport';

const Reports = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 mr-4">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Relatórios</h1>
              <p className="text-gray-600">Gere e exporte relatórios do sistema</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="sales-by-date-client" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-6 h-auto">
            <TabsTrigger value="sales-by-date-client" className="flex flex-col md:flex-row items-center gap-1 md:gap-2 py-3 px-2 text-xs md:text-sm">
              <FileText className="w-4 h-4" />
              <span className="text-center">Vendas por Data</span>
            </TabsTrigger>
            <TabsTrigger value="sales-by-salesperson" className="flex flex-col md:flex-row items-center gap-1 md:gap-2 py-3 px-2 text-xs md:text-sm">
              <User className="w-4 h-4" />
              <span className="text-center">Vendas por Vendedor</span>
            </TabsTrigger>
            <TabsTrigger value="stock-history" className="flex flex-col md:flex-row items-center gap-1 md:gap-2 py-3 px-2 text-xs md:text-sm">
              <History className="w-4 h-4" />
              <span className="text-center">Histórico de Estoque</span>
            </TabsTrigger>
            <TabsTrigger value="shipping" className="flex flex-col md:flex-row items-center gap-1 md:gap-2 py-3 px-2 text-xs md:text-sm">
              <Truck className="w-4 h-4" />
              <span className="text-center">Relatório de Frete</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sales-by-date-client">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Relatório de Vendas por Data e Cliente
                </CardTitle>
                <CardDescription>
                  Visualize todas as vendas em um período específico agrupadas por cliente
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SalesByDateClientReport />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sales-by-salesperson">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Relatório de Vendas por Vendedor
                </CardTitle>
                <CardDescription>
                  Visualize as vendas agrupadas por vendedor com cálculo de comissões
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SalesBySalespersonReport />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stock-history">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Histórico de Movimentações de Estoque
                </CardTitle>
                <CardDescription>
                  Visualize todo o histórico de entradas, saídas e ajustes de estoque por produto
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ProductStockHistoryReport />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shipping">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Relatório de Frete
                </CardTitle>
                <CardDescription>
                  Visualize todos os fretes cobrados em orçamentos e vendas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ShippingReport />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Reports;
