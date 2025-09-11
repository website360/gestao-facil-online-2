
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-2 md:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-3 md:mb-6 lg:mb-8">
          <div className="flex items-center mb-2 md:mb-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 mr-3 md:mr-4">
              <BarChart3 className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Relatórios</h1>
              <p className="text-sm md:text-base text-gray-600">Gere e exporte relatórios do sistema</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="sales-by-date-client" className="w-full">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 mb-3 md:mb-6 h-auto p-1">
            <TabsTrigger value="sales-by-date-client" className="flex flex-col md:flex-row items-center gap-1 md:gap-2 py-2 md:py-3 px-1 md:px-2 text-xs md:text-sm min-h-[3rem] md:min-h-[auto]">
              <FileText className="w-3 h-3 md:w-4 md:h-4" />
              <span className="text-center leading-tight">Vendas por Data</span>
            </TabsTrigger>
            <TabsTrigger value="sales-by-salesperson" className="flex flex-col md:flex-row items-center gap-1 md:gap-2 py-2 md:py-3 px-1 md:px-2 text-xs md:text-sm min-h-[3rem] md:min-h-[auto]">
              <User className="w-3 h-3 md:w-4 md:h-4" />
              <span className="text-center leading-tight">Vendas por Vendedor</span>
            </TabsTrigger>
            <TabsTrigger value="stock-history" className="flex flex-col md:flex-row items-center gap-1 md:gap-2 py-2 md:py-3 px-1 md:px-2 text-xs md:text-sm min-h-[3rem] md:min-h-[auto]">
              <History className="w-3 h-3 md:w-4 md:h-4" />
              <span className="text-center leading-tight">Histórico de Estoque</span>
            </TabsTrigger>
            <TabsTrigger value="shipping" className="flex flex-col md:flex-row items-center gap-1 md:gap-2 py-2 md:py-3 px-1 md:px-2 text-xs md:text-sm min-h-[3rem] md:min-h-[auto]">
              <Truck className="w-3 h-3 md:w-4 md:h-4" />
              <span className="text-center leading-tight">Relatório de Frete</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sales-by-date-client">
            <Card className="glass">
              <CardHeader className="p-3 md:p-6">
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                  <FileText className="w-4 h-4 md:w-5 md:h-5" />
                  Relatório de Vendas por Data e Cliente
                </CardTitle>
                <CardDescription className="text-sm md:text-base">
                  Visualize todas as vendas em um período específico agrupadas por cliente
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 md:p-6">
                <SalesByDateClientReport />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sales-by-salesperson">
            <Card className="glass">
              <CardHeader className="p-3 md:p-6">
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                  <User className="w-4 h-4 md:w-5 md:h-5" />
                  Relatório de Vendas por Vendedor
                </CardTitle>
                <CardDescription className="text-sm md:text-base">
                  Visualize as vendas agrupadas por vendedor com cálculo de comissões
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 md:p-6">
                <SalesBySalespersonReport />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stock-history">
            <Card className="glass">
              <CardHeader className="p-3 md:p-6">
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                  <History className="w-4 h-4 md:w-5 md:h-5" />
                  Histórico de Movimentações de Estoque
                </CardTitle>
                <CardDescription className="text-sm md:text-base">
                  Visualize todo o histórico de entradas, saídas e ajustes de estoque por produto
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 md:p-6">
                <ProductStockHistoryReport />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shipping">
            <Card className="glass">
              <CardHeader className="p-3 md:p-6">
                <CardTitle className="flex items-center gap-2 text-lg md:text-xl">
                  <Truck className="w-4 h-4 md:w-5 md:h-5" />
                  Relatório de Frete
                </CardTitle>
                <CardDescription className="text-sm md:text-base">
                  Visualize todos os fretes cobrados em orçamentos e vendas
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 md:p-6">
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
