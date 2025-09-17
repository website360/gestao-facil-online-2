
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { formatSaleId } from '@/lib/budgetFormatter';

interface Client {
  name: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
}

interface SaleItem {
  id: string;
  sale_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  products?: Product;
}

interface Sale {
  id: string;
  client_id: string;
  total_amount: number;
  status: 'separacao' | 'conferencia' | 'nota_fiscal' | 'finalizado';
  notes: string;
  created_at: string;
  created_by: string;
  clients?: Client;
  sale_items?: SaleItem[];
  profiles?: { name: string };
  budgets?: { created_by: string };
}

interface SalePDFDownloaderProps {
  sale: Sale;
  className?: string;
}

const SalePDFDownloader = ({ sale, className }: SalePDFDownloaderProps) => {
  const downloadPDF = () => {
    const currentDate = new Date().toLocaleDateString('pt-BR');
    const saleDate = new Date(sale.created_at).toLocaleDateString('pt-BR');
    const saleId = formatSaleId(sale.id, sale.created_at);

    // Determinar nome do vendedor
    let salespersonName = 'N/A';
    if (sale.profiles?.name) {
      salespersonName = sale.profiles.name;
    } else if (sale.budgets?.created_by && sale.budgets.created_by !== sale.client_id) {
      salespersonName = 'Vendedor';
    } else {
      salespersonName = 'Cliente';
    }

    const getStatusLabel = (status: string) => {
      switch (status) {
        case 'separacao': return 'Separação';
        case 'conferencia': return 'Conferência';
        case 'nota_fiscal': return 'Nota Fiscal';
        case 'finalizado': return 'Finalizado';
        default: return status;
      }
    };

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Pedido ${saleId}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            margin: 20px;
            color: #333;
            line-height: 1.6;
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 20px;
          }
          .company-name {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 10px;
          }
          .sale-title {
            font-size: 20px;
            margin: 20px 0;
          }
          .client-info {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin-bottom: 20px;
          }
          .client-info h3 {
            margin-top: 0;
            color: #2563eb;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
          }
          th, td {
            border: 1px solid #ddd;
            padding: 12px;
            text-align: left;
          }
          th {
            background-color: #2563eb;
            color: white;
            font-weight: bold;
          }
          .text-right {
            text-align: right;
          }
          .total-row {
            background-color: #f8f9fa;
            font-weight: bold;
            font-size: 16px;
          }
          .notes {
            margin-top: 20px;
            padding: 15px;
            background-color: #f8f9fa;
            border-radius: 5px;
          }
          .footer {
            margin-top: 40px;
            text-align: center;
            font-size: 12px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 20px;
          }
          .status {
            display: inline-block;
            padding: 5px 10px;
            border-radius: 3px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
          }
          .status-separacao {
            background-color: #dbeafe;
            color: #1e40af;
          }
          .status-conferencia {
            background-color: #fef3c7;
            color: #92400e;
          }
          .status-nota_fiscal {
            background-color: #fed7aa;
            color: #c2410c;
          }
          .status-finalizado {
            background-color: #d1fae5;
            color: #065f46;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">Sistema de Gestão</div>
          <div class="sale-title">PEDIDO DE VENDA ${saleId}</div>
          <div>Data: ${saleDate}</div>
          <div>Status: <span class="status status-${sale.status}">${getStatusLabel(sale.status)}</span></div>
        </div>

        <div class="client-info">
          <h3>Dados do Cliente</h3>
          <p><strong>Nome:</strong> ${sale.clients?.name || 'N/A'}</p>
          <p><strong>Vendedor:</strong> ${salespersonName}</p>
        </div>

        <table>
          <thead>
            <tr>
              <th>Produto</th>
              <th class="text-right">Qtd</th>
              <th class="text-right">Valor Unit.</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${sale.sale_items?.map(item => `
              <tr>
                <td>${item.products?.name || 'Produto não encontrado'}</td>
                <td class="text-right">${item.quantity}</td>
                <td class="text-right">${item.unit_price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                <td class="text-right">${item.total_price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
              </tr>
            `).join('') || ''}
            <tr class="total-row">
              <td colspan="3" class="text-right">TOTAL GERAL:</td>
              <td class="text-right">${sale.total_amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
            </tr>
          </tbody>
        </table>

        ${sale.notes ? `
          <div class="notes">
            <h3>Observações</h3>
            <p>${sale.notes}</p>
          </div>
        ` : ''}

        <div class="footer">
          <p>Pedido gerado em ${currentDate}</p>
          <p>Este documento serve como comprovante do pedido de venda.</p>
        </div>
      </body>
      </html>
    `;

    // Criar blob com o conteúdo HTML
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    // Criar link de download
    const link = document.createElement('a');
    link.href = url;
    link.download = `pedido-${saleId.replace('#', '')}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Limpar URL
    URL.revokeObjectURL(url);
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          onClick={downloadPDF}
          variant="ghost"
          size="sm"
          className={className}
        >
          <Download className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Baixar PDF do Pedido</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default SalePDFDownloader;
