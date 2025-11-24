
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Download, BarChart3, History, Truck, User, Package, Shield } from 'lucide-react';
import SalesByDateClientReport from '@/components/reports/SalesByDateClientReport';
import SalesBySalespersonReport from '@/components/reports/SalesBySalespersonReport';
import ProductStockHistoryReport from '@/components/reports/ProductStockHistoryReport';
import ShippingReport from '@/components/reports/ShippingReport';
import { SalesByProductReport } from '@/components/reports/SalesByProductReport';
import { StockAuditReport } from '@/components/reports/StockAuditReport';

const Reports = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-2 md:p-4 lg:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-3 md:mb-4 lg:mb-8">
          <div className="flex items-center mb-2 md:mb-3 lg:mb-4">
            <div className="w-8 h-8 md:w-10 md:h-10 lg:w-12 lg:h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl lg:rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 mr-2 md:mr-3 lg:mr-4">
              <BarChart3 className="w-4 h-4 md:w-5 md:h-5 lg:w-6 lg:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 break-words">Relatórios</h1>
              <p className="text-xs md:text-sm lg:text-base text-gray-600 break-words">Gere e exporte relatórios do sistema</p>
            </div>
          </div>
        </div>

        <Tabs defaultValue="sales-by-date-client" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6 mb-3 md:mb-6 h-auto p-1 gap-1">
            <TabsTrigger value="sales-by-date-client" className="flex flex-col items-center gap-1 py-2 px-1 text-xs lg:text-sm min-h-[3.5rem] lg:min-h-[auto] lg:flex-row lg:gap-2">
              <FileText className="w-3 h-3 lg:w-4 lg:h-4 flex-shrink-0" />
              <span className="text-center leading-tight break-words">Vendas por Data</span>
            </TabsTrigger>
            <TabsTrigger value="sales-by-salesperson" className="flex flex-col items-center gap-1 py-2 px-1 text-xs lg:text-sm min-h-[3.5rem] lg:min-h-[auto] lg:flex-row lg:gap-2">
              <User className="w-3 h-3 lg:w-4 lg:h-4 flex-shrink-0" />
              <span className="text-center leading-tight break-words">Vendas por Vendedor</span>
            </TabsTrigger>
            <TabsTrigger value="sales-by-product" className="flex flex-col items-center gap-1 py-2 px-1 text-xs lg:text-sm min-h-[3.5rem] lg:min-h-[auto] lg:flex-row lg:gap-2">
              <Package className="w-3 h-3 lg:w-4 lg:h-4 flex-shrink-0" />
              <span className="text-center leading-tight break-words">Vendas por Produto</span>
            </TabsTrigger>
            <TabsTrigger value="stock-history" className="flex flex-col items-center gap-1 py-2 px-1 text-xs lg:text-sm min-h-[3.5rem] lg:min-h-[auto] lg:flex-row lg:gap-2">
              <History className="w-3 h-3 lg:w-4 lg:h-4 flex-shrink-0" />
              <span className="text-center leading-tight break-words">Histórico de Estoque</span>
            </TabsTrigger>
            <TabsTrigger value="stock-audit" className="flex flex-col items-center gap-1 py-2 px-1 text-xs lg:text-sm min-h-[3.5rem] lg:min-h-[auto] lg:flex-row lg:gap-2">
              <Shield className="w-3 h-3 lg:w-4 lg:h-4 flex-shrink-0" />
              <span className="text-center leading-tight break-words">Auditoria</span>
            </TabsTrigger>
            <TabsTrigger value="shipping" className="flex flex-col items-center gap-1 py-2 px-1 text-xs lg:text-sm min-h-[3.5rem] lg:min-h-[auto] lg:flex-row lg:gap-2">
              <Truck className="w-3 h-3 lg:w-4 lg:h-4 flex-shrink-0" />
              <span className="text-center leading-tight break-words">Relatório de Frete</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sales-by-date-client">
            <Card className="glass overflow-hidden">
              <CardHeader className="p-3 md:p-4 lg:p-6">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg lg:text-xl break-words">
                  <FileText className="w-4 h-4 lg:w-5 lg:h-5 flex-shrink-0" />
                  <span>Relatório de Vendas por Data e Cliente</span>
                </CardTitle>
                <CardDescription className="text-xs md:text-sm lg:text-base break-words">
                  Visualize todas as vendas em um período específico agrupadas por cliente
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 md:p-4 lg:p-6 overflow-x-auto">
                <SalesByDateClientReport />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sales-by-salesperson">
            <Card className="glass overflow-hidden">
              <CardHeader className="p-3 md:p-4 lg:p-6">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg lg:text-xl break-words">
                  <User className="w-4 h-4 lg:w-5 lg:h-5 flex-shrink-0" />
                  <span>Relatório de Vendas por Vendedor</span>
                </CardTitle>
                <CardDescription className="text-xs md:text-sm lg:text-base break-words">
                  Visualize as vendas agrupadas por vendedor com cálculo de comissões
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 md:p-4 lg:p-6 overflow-x-auto">
                <SalesBySalespersonReport />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sales-by-product">
            <Card className="glass overflow-hidden">
              <CardHeader className="p-3 md:p-4 lg:p-6">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg lg:text-xl break-words">
                  <Package className="w-4 h-4 lg:w-5 lg:h-5 flex-shrink-0" />
                  <span>Relatório de Vendas por Produto</span>
                </CardTitle>
                <CardDescription className="text-xs md:text-sm lg:text-base break-words">
                  Análise detalhada de vendas por produto com ticket médio
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 md:p-4 lg:p-6 overflow-x-auto">
                <SalesByProductReport />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stock-history">
            <Card className="glass overflow-hidden">
              <CardHeader className="p-3 md:p-4 lg:p-6">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg lg:text-xl break-words">
                  <History className="w-4 h-4 lg:w-5 lg:h-5 flex-shrink-0" />
                  <span>Histórico de Movimentações de Estoque</span>
                </CardTitle>
                <CardDescription className="text-xs md:text-sm lg:text-base break-words">
                  Visualize todo o histórico de entradas, saídas e ajustes de estoque por produto
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 md:p-4 lg:p-6 overflow-x-auto">
                <ProductStockHistoryReport />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="stock-audit">
            <Card className="glass overflow-hidden">
              <CardHeader className="p-3 md:p-4 lg:p-6">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg lg:text-xl break-words">
                  <Shield className="w-4 h-4 lg:w-5 lg:h-5 flex-shrink-0" />
                  <span>Auditoria de Estoque</span>
                </CardTitle>
                <CardDescription className="text-xs md:text-sm lg:text-base break-words">
                  Identifique e corrija inconsistências entre o estoque do sistema e as movimentações
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 md:p-4 lg:p-6 overflow-x-auto">
                <StockAuditReport />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shipping">
            <Card className="glass overflow-hidden">
              <CardHeader className="p-3 md:p-4 lg:p-6">
                <CardTitle className="flex items-center gap-2 text-base md:text-lg lg:text-xl break-words">
                  <Truck className="w-4 h-4 lg:w-5 lg:h-5 flex-shrink-0" />
                  <span>Relatório de Frete</span>
                </CardTitle>
                <CardDescription className="text-xs md:text-sm lg:text-base break-words">
                  Visualize todos os fretes cobrados em orçamentos e vendas
                </CardDescription>
              </CardHeader>
              <CardContent className="p-3 md:p-4 lg:p-6 overflow-x-auto">
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
