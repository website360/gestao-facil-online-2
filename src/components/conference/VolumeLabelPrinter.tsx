import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Printer, CheckCircle, Download, AlertTriangle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { downloadVolumeLabelsPDF } from './pdfLabelGenerator';

// Lazy import QZ Tray to avoid errors if not available
let qzModule: any = null;
async function getQZ() {
  if (!qzModule) {
    try {
      qzModule = await import('./qzTrayPrinter');
    } catch {
      return null;
    }
  }
  return qzModule;
}

interface VolumeLabelPrinterProps {
  clientName: string;
  totalVolumes: number;
  invoiceNumber?: string;
  onPrint: () => void;
  onClose: () => void;
}

type PrintMode = 'loading' | 'qz' | 'fallback';

const VolumeLabelPrinter: React.FC<VolumeLabelPrinterProps> = ({
  clientName,
  totalVolumes,
  invoiceNumber = '',
  onPrint,
  onClose
}) => {
  const [mode, setMode] = useState<PrintMode>('loading');
  const [printers, setPrinters] = useState<string[]>([]);
  const [selectedPrinter, setSelectedPrinter] = useState('');
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      try {
        const qz = await getQZ();
        if (!qz || cancelled) {
          if (!cancelled) setMode('fallback');
          return;
        }

        const connected = await qz.connectQZTray();
        if (!connected || cancelled) {
          if (!cancelled) setMode('fallback');
          return;
        }

        const found = await qz.findPrinters();
        if (cancelled) return;

        if (found.length === 0) {
          setMode('fallback');
          return;
        }

        setPrinters(found);
        // Auto-select Datamax
        const datamax = found.find((p: string) =>
          p.toLowerCase().includes('datamax') ||
          p.toLowerCase().includes('e-4204') ||
          p.toLowerCase().includes('honeywell')
        );
        setSelectedPrinter(datamax || found[0]);
        setMode('qz');
      } catch {
        if (!cancelled) setMode('fallback');
      }
    };

    // Timeout after 8 seconds if QZ Tray doesn't respond
    const timeout = setTimeout(() => {
      if (!cancelled) setMode('fallback');
    }, 8000);

    init().finally(() => clearTimeout(timeout));

    return () => { cancelled = true; };
  }, []);

  const handleDirectPrint = async () => {
    if (!selectedPrinter) return;
    setPrinting(true);
    try {
      const qz = await getQZ();
      if (!qz) throw new Error('QZ not available');
      await qz.printRawDPL(selectedPrinter, clientName, totalVolumes, invoiceNumber);
      toast.success(`${totalVolumes} etiqueta${totalVolumes > 1 ? 's' : ''} enviada${totalVolumes > 1 ? 's' : ''}!`);
      onPrint();
    } catch (error) {
      console.error('Erro na impressão:', error);
      toast.error('Erro ao imprimir. Verifique se a impressora está ligada.');
    } finally {
      setPrinting(false);
    }
  };

  const handleDownloadPDF = () => {
    try {
      downloadVolumeLabelsPDF({ clientName, totalVolumes, invoiceNumber });
      toast.success('PDF baixado! Abra e imprima pelo Adobe Reader.');
      onPrint();
    } catch {
      toast.error('Erro ao gerar PDF.');
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

        {mode === 'loading' && (
          <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            Verificando impressora...
          </div>
        )}

        {mode === 'qz' && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium whitespace-nowrap">Impressora:</label>
              <select
                value={selectedPrinter}
                onChange={(e) => setSelectedPrinter(e.target.value)}
                className="flex-1 border rounded px-2 py-1.5 text-sm bg-background"
              >
                {printers.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <Button
              onClick={handleDirectPrint}
              disabled={printing || !selectedPrinter}
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              {printing ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Printer className="w-5 h-5 mr-2" />
              )}
              {printing ? 'Imprimindo...' : `Imprimir ${totalVolumes} Etiqueta${totalVolumes > 1 ? 's' : ''}`}
            </Button>
          </div>
        )}

        {mode === 'fallback' && (
          <div className="space-y-3">
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
              <p className="font-bold flex items-center gap-1 mb-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Impressão direta não disponível
              </p>
              <p className="mb-2">
                Para impressão direta na Datamax (igual ao BarTender), instale o <strong>QZ Tray</strong> (gratuito):
              </p>
              <ol className="list-decimal list-inside space-y-0.5 ml-1">
                <li>Acesse <a href="https://qz.io/download" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-bold">qz.io/download</a></li>
                <li>Baixe e instale</li>
                <li>Deixe rodando e recarregue a página</li>
              </ol>
            </div>

            <Button
              onClick={handleDownloadPDF}
              className="w-full bg-blue-600 hover:bg-blue-700"
              size="lg"
            >
              <Download className="w-5 h-5 mr-2" />
              Baixar Etiquetas PDF ({totalVolumes})
            </Button>
          </div>
        )}

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
