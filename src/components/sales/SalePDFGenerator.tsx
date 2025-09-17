import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Download } from 'lucide-react';

interface SalePDFGeneratorProps {
  sale: {
    id: string;
    client_id: string;
    status: string;
    total_amount: number;
    notes?: string;
    created_at: string;
    created_by: string;
    clients: { name: string } | null;
    sale_items?: any[];
    created_by_profile?: { name: string } | null;
    invoice_number?: string;
    tracking_code?: string;
    shipping_cost?: number;
    discount_percentage?: number;
    installments?: number;
  };
  className?: string;
}

const SalePDFGenerator = ({ sale, className }: SalePDFGeneratorProps) => {
  const handleDownloadPDF = async () => {
    try {
      // Formatação dos dados para gerar o PDF
      const saleData = {
        id: sale.id,
        date: new Date(sale.created_at).toLocaleDateString('pt-BR'),
        salesperson: sale.created_by_profile?.name || 'N/A',
        client: sale.clients?.name || 'Cliente não informado',
        items: sale.sale_items || [],
        total: sale.total_amount,
        notes: sale.notes || '',
        invoice_number: sale.invoice_number || '',
        tracking_code: sale.tracking_code || ''
      };

      // Gerar HTML string
      const htmlContent = `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Venda ${saleData.id}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .info-section { margin-bottom: 20px; }
            .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            .items-table th { background-color: #f2f2f2; }
            .total { font-weight: bold; font-size: 1.2em; text-align: right; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>VENDA</h1>
            <p>Número: ${saleData.id}</p>
            <p>Data: ${saleData.date}</p>
          </div>
          
          <div class="info-section">
            <h3>Informações da Venda</h3>
            <p><strong>Cliente:</strong> ${saleData.client}</p>
            <p><strong>Vendedor:</strong> ${saleData.salesperson}</p>
            ${saleData.invoice_number ? `<p><strong>Nota Fiscal:</strong> ${saleData.invoice_number}</p>` : ''}
            ${saleData.tracking_code ? `<p><strong>Código de Rastreio:</strong> ${saleData.tracking_code}</p>` : ''}
          </div>
          
          <table class="items-table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Quantidade</th>
                <th>Valor Unitário</th>
                <th>Total</th>
              </tr>
            </thead>
            <tbody>
              ${saleData.items.map((item: any) => `
                <tr>
                  <td>${item.products?.name || 'Item'}</td>
                  <td>${item.quantity}</td>
                  <td>R$ ${item.unit_price?.toFixed(2).replace('.', ',') || '0,00'}</td>
                  <td>R$ ${item.total_price?.toFixed(2).replace('.', ',') || '0,00'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="total">
            <p>Total da Venda: R$ ${saleData.total.toFixed(2).replace('.', ',')}</p>
          </div>
          
          ${saleData.notes ? `
            <div class="info-section">
              <h3>Observações</h3>
              <p>${saleData.notes}</p>
            </div>
          ` : ''}
        </body>
        </html>
      `;

      // Criar e baixar o arquivo
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `venda-${saleData.id}-${saleData.date.replace(/\//g, '-')}.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao gerar PDF da venda:', error);
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleDownloadPDF}
          className={`h-8 w-8 p-0 text-blue-600 hover:text-blue-700 ${className}`}
        >
          <Download className="h-4 w-4" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>Baixar PDF da Venda</p>
      </TooltipContent>
    </Tooltip>
  );
};

export default SalePDFGenerator;