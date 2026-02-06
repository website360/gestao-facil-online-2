import React from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Download } from 'lucide-react';
import { generateSalePDF } from './pdf/pdfGeneratorSimple';

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
    taxes_amount?: number;
    installments?: number;
    payment_method_id?: string;
    payment_type_id?: string;
    shipping_option_id?: string;
  };
  className?: string;
}

const SalePDFGenerator = ({ sale, className }: SalePDFGeneratorProps) => {
  const handleDownloadPDF = async () => {
    try {
      console.log('=== INICIANDO GERAÇÃO PDF VENDA ===');
      console.log('Sale recebido no componente:', sale);
      console.log('Cliente na sale:', sale.clients);
      await generateSalePDF(sale);
      console.log('PDF gerado com sucesso!');
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