
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
}

interface BudgetItem {
  id: string;
  budget_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  products?: Product;
}

interface Budget {
  id: string;
  client_id: string;
  total_amount: number;
  status: 'aguardando_aprovacao' | 'aprovado' | 'rejeitado' | 'convertido';
  notes: string;
  created_at: string;
  clients?: Client;
  budget_items?: BudgetItem[];
}

import { formatBudgetId } from '@/lib/budgetFormatter';

interface BudgetPDFDownloaderProps {
  budget: Budget;
  className?: string;
}

const BudgetPDFDownloader = ({ budget, className }: BudgetPDFDownloaderProps) => {
  const downloadPDF = () => {
    const currentDate = new Date().toLocaleDateString('pt-BR');
    const budgetDate = new Date(budget.created_at).toLocaleDateString('pt-BR');
    const formattedBudgetId = formatBudgetId(budget.id, budget.created_at);

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Orçamento ${formattedBudgetId}</title>
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
          .budget-title {
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
          .status-aguardando {
            background-color: #fef3c7;
            color: #92400e;
          }
          .status-enviado {
            background-color: #d1fae5;
            color: #065f46;
          }
          .status-convertido {
            background-color: #dbeafe;
            color: #1e40af;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">Sistema de Gestão</div>
          <div class="budget-title">ORÇAMENTO Nº ${formattedBudgetId}</div>
          <div>Data: ${budgetDate}</div>
          <div>Status: <span class="status status-${budget.status}">${budget.status}</span></div>
        </div>

        <div class="client-info">
          <h3>Dados do Cliente</h3>
          <p><strong>Nome:</strong> ${budget.clients?.name || 'N/A'}</p>
          <p><strong>Email:</strong> ${budget.clients?.email || 'N/A'}</p>
          <p><strong>Telefone:</strong> ${budget.clients?.phone || 'N/A'}</p>
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
            ${budget.budget_items?.map(item => `
              <tr>
                <td>${item.products?.name || 'Produto não encontrado'}</td>
                <td class="text-right">${item.quantity}</td>
                <td class="text-right">${item.unit_price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
                <td class="text-right">${item.total_price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
              </tr>
            `).join('') || ''}
            <tr class="total-row">
              <td colspan="3" class="text-right">TOTAL GERAL:</td>
              <td class="text-right">${budget.total_amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td>
            </tr>
          </tbody>
        </table>

        ${budget.notes ? `
          <div class="notes">
            <h3>Observações</h3>
            <p>${budget.notes}</p>
          </div>
        ` : ''}

        <div class="footer">
          <p>Orçamento gerado em ${currentDate}</p>
          <p>Este orçamento tem validade de 30 dias a partir da data de emissão.</p>
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
    link.download = `orcamento-${formattedBudgetId.replace('#', '')}.html`;
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
          variant="outline"
          size="icon"
          className={className}
        >
          <Download className="h-4 w-4 text-black" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Baixar PDF</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default BudgetPDFDownloader;
