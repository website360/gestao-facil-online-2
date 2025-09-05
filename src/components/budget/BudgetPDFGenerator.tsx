
import React from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { useBudgetCalculations } from '@/hooks/useBudgetCalculations';
import { generateSimpleBudgetPDF } from './pdf/pdfGeneratorSimple';
import type { LocalBudget } from '@/hooks/useBudgetManagement';

interface BudgetPDFGeneratorProps {
  budget: LocalBudget;
  className?: string;
}

const BudgetPDFGenerator = ({ budget, className }: BudgetPDFGeneratorProps) => {
  const { calculateBudgetTotal } = useBudgetCalculations();

  const handleGeneratePDF = async () => {
    try {
      console.log('=== INICIANDO GERAÇÃO PDF ===');
      console.log('Budget recebido no componente:', budget);
      console.log('Cliente no budget:', budget.clients);
      await generateSimpleBudgetPDF(budget, calculateBudgetTotal);
      console.log('PDF gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
    }
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleGeneratePDF}
      className={className}
      title="Baixar PDF do orçamento"
    >
      <Download className="h-4 w-4" />
    </Button>
  );
};

export default BudgetPDFGenerator;
