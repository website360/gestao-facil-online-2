import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Printer, CheckCircle, Download, Loader2, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';
import { printVolumeLabelsDirect, downloadVolumeLabelsPDF } from './pdfLabelGenerator';

interface VolumeLabelPrinterProps {
  clientName: string;
  totalVolumes: number;
  invoiceNumber?: string;
  onPrint: () => void;
  onClose: () => void;
}

const VolumeLabelPrinter: React.FC<VolumeLabelPrinterProps> = ({
  clientName,
  totalVolumes,
  invoiceNumber = '',
  onPrint,
  onClose
}) => {
  const [printing, setPrinting] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  const handlePrint = async () => {
    if (printing || totalVolumes <= 0) return;

    setPrinting(true);
    try {
      const result = await printVolumeLabelsDirect({ clientName, totalVolumes, invoiceNumber });

      if (result.success) {
        toast.success(result.message || 'Etiquetas enviadas via PDF para a impressora.');
        onPrint();
      } else {
        toast.error(result.message || 'Não foi possível imprimir via PDF. Use "Baixar PDF" abaixo.');
      }
    } catch {
      toast.error('Erro ao enviar impressão para a impressora.');
    } finally {
      setPrinting(false);
    }
  };

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      await downloadVolumeLabelsPDF({ clientName, totalVolumes, invoiceNumber });
      toast.success('PDF baixado! Abra e imprima na impressora térmica.');
      onPrint();
    } catch {
      toast.error('Erro ao gerar PDF.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2 text-green-700">
          <CheckCircle className="w-5 h-5" />
          Conferência Finalizada com Sucesso!
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <p className="text-green-800 font-medium mb-1">
            Volumes registrados: {totalVolumes}
          </p>
          <p className="text-green-600 text-sm">
            A venda foi enviada para Nota Fiscal.
          </p>
        </div>

        <div className="space-y-3">
          <Button
            onClick={handlePrint}
            disabled={printing || totalVolumes <= 0}
            className="w-full bg-green-600 hover:bg-green-700"
            size="lg"
          >
            {printing ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Printer className="w-5 h-5 mr-2" />
            )}
            {printing ? 'Enviando...' : `Imprimir ${totalVolumes} Etiqueta${totalVolumes > 1 ? 's' : ''}`}
          </Button>

          <Button
            onClick={handleDownloadPDF}
            disabled={downloading}
            variant="outline"
            className="w-full"
            size="lg"
          >
            {downloading ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : (
              <Download className="w-5 h-5 mr-2" />
            )}
            {downloading ? 'Gerando...' : 'Baixar PDF (alternativa)'}
          </Button>
        </div>

        {/* Help section */}
        <div className="border-t pt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowHelp(!showHelp)}
            className="w-full text-muted-foreground text-xs"
          >
            <HelpCircle className="w-3.5 h-3.5 mr-1.5" />
            {showHelp ? 'Ocultar ajuda' : 'Ajuda: como configurar a impressora'}
          </Button>

          {showHelp && (
            <div className="mt-2 bg-muted/50 rounded-lg p-4 text-xs text-muted-foreground space-y-3">
              <p className="font-semibold text-sm text-foreground">Passo a passo para configurar a impressora térmica</p>

              <div className="space-y-2">
                <div className="flex gap-2">
                  <span className="font-bold text-foreground min-w-[20px]">1.</span>
                  <div>
                    <p className="font-semibold text-foreground">Instalar o QZ Tray</p>
                    <p>Acesse <a href="https://qz.io/download/" target="_blank" rel="noopener noreferrer" className="text-primary underline font-semibold">qz.io/download</a> e baixe o instalador. Execute e siga as instruções. O QZ Tray deve ficar ativo na bandeja do sistema (ícone ao lado do relógio).</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <span className="font-bold text-foreground min-w-[20px]">2.</span>
                  <div>
                    <p className="font-semibold text-foreground">Instalar o driver da impressora</p>
                    <p>Baixe o driver correto para o modelo da sua impressora (ex: Datamax Mark II) no site do fabricante. Instale e reinicie o computador se necessário.</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <span className="font-bold text-foreground min-w-[20px]">3.</span>
                  <div>
                    <p className="font-semibold text-foreground">Configurar tamanho da etiqueta</p>
                    <p>Vá em <span className="font-mono bg-muted px-1 rounded">Painel de Controle → Dispositivos e Impressoras</span>. Clique com o botão direito na impressora → <span className="font-mono bg-muted px-1 rounded">Preferências de Impressão</span>. Defina o tamanho do papel como <strong>100mm × 60mm</strong> (largura × altura).</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <span className="font-bold text-foreground min-w-[20px]">4.</span>
                  <div>
                    <p className="font-semibold text-foreground">Ajustar temperatura do cabeçote</p>
                    <p>Nas preferências da impressora, vá em <span className="font-mono bg-muted px-1 rounded">Opções → Temperatura do Cabeçote</span>. Ajuste entre <strong>10 a 15</strong> para impressão nítida. Valores muito altos borram; muito baixos ficam claros.</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <span className="font-bold text-foreground min-w-[20px]">5.</span>
                  <div>
                    <p className="font-semibold text-foreground">Ajustar velocidade de impressão</p>
                    <p>Na mesma tela de preferências, defina a velocidade para <strong>média</strong> (3 a 4 pol/s). Velocidade muito alta pode comprometer a qualidade.</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <span className="font-bold text-foreground min-w-[20px]">6.</span>
                  <div>
                    <p className="font-semibold text-foreground">Configurar sensor de mídia</p>
                    <p>Verifique se o sensor de mídia está configurado como <strong>"Gap"</strong> (para etiquetas com espaço entre elas) ou <strong>"Contínuo"</strong> conforme o tipo de rolo utilizado.</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <span className="font-bold text-foreground min-w-[20px]">7.</span>
                  <div>
                    <p className="font-semibold text-foreground">Teste de impressão</p>
                    <p>Clique em <strong>"Baixar PDF"</strong> acima, abra o arquivo e imprima. Verifique se a borda aparece completa em todos os lados. Se estiver cortando, ajuste as margens nas preferências da impressora.</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-2 mt-2">
                <p className="font-semibold text-foreground text-xs">Dica:</p>
                <p>Para impressão direta (botão "Imprimir Etiquetas"), o <strong>QZ Tray</strong> precisa estar rodando. Se o botão não funcionar, use sempre a opção "Baixar PDF" como alternativa.</p>
              </div>
            </div>
          )}
        </div>

        <Button
          variant="outline"
          onClick={onClose}
          className="w-full"
          size="lg"
        >
          Fechar sem Imprimir
        </Button>
      </CardContent>
    </Card>
  );
};

export default VolumeLabelPrinter;
