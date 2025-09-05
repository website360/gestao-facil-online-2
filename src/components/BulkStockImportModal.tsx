import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { Upload, FileSpreadsheet, TrendingUp, Download, AlertCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

interface StockMovement {
  product: {
    id: string;
    name: string;
    internal_code: string;
    stock: number;
    stock_unit: string;
  };
  quantity: number;
  newStock: number;
}

interface BulkStockImportModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const BulkStockImportModal = ({ open, onClose, onSuccess }: BulkStockImportModalProps) => {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const downloadTemplate = () => {
    const template = [
      ['codigo_produto', 'quantidade'],
      ['001', '600'],
      ['002', '-13'],
      ['003', '100']
    ];

    const ws = XLSX.utils.aoa_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Modelo');
    
    // Definir larguras das colunas
    ws['!cols'] = [
      { width: 15 },
      { width: 12 }
    ];

    XLSX.writeFile(wb, 'modelo_movimentacao_estoque.xlsx');
    toast.success('Modelo baixado com sucesso!');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setMovements([]);
      setErrors([]);
      setShowConfirmation(false);
    }
  };

  const processFile = async () => {
    if (!file) {
      toast.error('Selecione um arquivo');
      return;
    }

    setLoading(true);
    setErrors([]);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      // Remove header row
      const rows = jsonData.slice(1) as any[];
      
      if (rows.length === 0) {
        throw new Error('Planilha vazia ou sem dados');
      }

      // Buscar todos os produtos
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, internal_code, stock, stock_unit');

      if (productsError) throw productsError;

      const processedMovements: StockMovement[] = [];
      const processErrors: string[] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const rowNum = i + 2; // +2 porque começamos do índice 0 e pulamos o header

        if (!row || row.length < 2) {
          processErrors.push(`Linha ${rowNum}: Dados insuficientes`);
          continue;
        }

        const codigo = row[0]?.toString().trim();
        const quantidadeStr = row[1]?.toString().trim();

        if (!codigo) {
          processErrors.push(`Linha ${rowNum}: Código do produto não informado`);
          continue;
        }

        if (!quantidadeStr) {
          processErrors.push(`Linha ${rowNum}: Quantidade não informada`);
          continue;
        }

        const quantidade = parseInt(quantidadeStr);
        if (isNaN(quantidade) || quantidade === 0) {
          processErrors.push(`Linha ${rowNum}: Quantidade inválida (${quantidadeStr})`);
          continue;
        }

        const product = products?.find(p => 
          p.internal_code.toLowerCase() === codigo.toLowerCase()
        );

        if (!product) {
          processErrors.push(`Linha ${rowNum}: Produto não encontrado (${codigo})`);
          continue;
        }

        const newStock = product.stock + quantidade;
        if (newStock < 0) {
          processErrors.push(`Linha ${rowNum}: Estoque ficaria negativo (${product.stock} + ${quantidade} = ${newStock})`);
          continue;
        }

        processedMovements.push({
          product,
          quantity: quantidade,
          newStock
        });
      }

      setMovements(processedMovements);
      setErrors(processErrors);

      if (processedMovements.length === 0) {
        toast.error('Nenhuma movimentação válida encontrada');
      } else {
        setShowConfirmation(true);
        if (processErrors.length > 0) {
          toast.warning(`${processedMovements.length} movimentações processadas, ${processErrors.length} com erro`);
        } else {
          toast.success(`${processedMovements.length} movimentações processadas com sucesso`);
        }
      }
    } catch (error: any) {
      console.error('Error processing file:', error);
      toast.error('Erro ao processar arquivo: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  const confirmMovements = async () => {
    if (movements.length === 0) return;

    setLoading(true);

    try {
      // Processar todas as movimentações
      const updates = movements.map(async (movement) => {
        // Atualizar estoque
        const { error: updateError } = await supabase
          .from('products')
          .update({ stock: movement.newStock })
          .eq('id', movement.product.id);

        if (updateError) throw updateError;

        // Registrar movimentação
        const movementType = movement.quantity > 0 ? 'entrada' : 'saida';
        const reason = movement.quantity > 0 ? 'entrada_massa' : 'ajuste_manual';
        const notes = movement.quantity > 0 ? 
          `Entrada via importação de planilha` : 
          `Saída via importação de planilha`;

        const { error: movementError } = await supabase.rpc('register_stock_movement', {
          p_product_id: movement.product.id,
          p_user_id: user?.id,
          p_movement_type: movementType,
          p_quantity: Math.abs(movement.quantity),
          p_previous_stock: movement.product.stock,
          p_new_stock: movement.newStock,
          p_reason: reason,
          p_notes: notes
        });

        if (movementError) throw movementError;
      });

      await Promise.all(updates);

      toast.success(`Estoque atualizado com sucesso para ${movements.length} produto(s)!`);
      
      // Resetar formulário
      setFile(null);
      setMovements([]);
      setErrors([]);
      setShowConfirmation(false);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error confirming movements:', error);
      toast.error('Erro ao processar movimentações: ' + (error.message || 'Erro desconhecido'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFile(null);
      setMovements([]);
      setErrors([]);
      setShowConfirmation(false);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" />
            Importar Movimentação de Estoque via Planilha
          </DialogTitle>
          <DialogDescription>
            Faça upload de uma planilha Excel com duas colunas: código do produto e quantidade. 
            Use números positivos para entrada e negativos para saída.
          </DialogDescription>
        </DialogHeader>

        {!showConfirmation ? (
          <div className="flex flex-col space-y-4">
            {/* Download do modelo */}
            <Card className="p-4 bg-blue-50 border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-blue-900">Modelo da Planilha</h3>
                  <p className="text-sm text-blue-700">
                    Baixe o modelo com o formato correto: código_produto | quantidade
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={downloadTemplate}
                  className="border-blue-300 text-blue-700 hover:bg-blue-100"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Baixar Modelo
                </Button>
              </div>
            </Card>

            {/* Upload do arquivo */}
            <div className="space-y-2">
              <Label htmlFor="file-upload">Arquivo Excel (.xlsx, .xls)</Label>
              <Input
                id="file-upload"
                type="file"
                accept=".xlsx,.xls"
                onChange={handleFileChange}
                className="cursor-pointer"
              />
              {file && (
                <p className="text-sm text-muted-foreground">
                  Arquivo selecionado: {file.name}
                </p>
              )}
            </div>

            {/* Botão para processar */}
            <div className="flex justify-end">
              <Button
                onClick={processFile}
                disabled={!file || loading}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                    Processando...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <Upload className="mr-2 h-4 w-4" />
                    Processar Arquivo
                  </div>
                )}
              </Button>
            </div>

            {/* Erros */}
            {errors.length > 0 && (
              <Card className="p-4 bg-red-50 border-red-200">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-red-600" />
                  <h3 className="font-medium text-red-900">Erros Encontrados</h3>
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {errors.map((error, index) => (
                    <p key={index} className="text-sm text-red-700">
                      {error}
                    </p>
                  ))}
                </div>
              </Card>
            )}
          </div>
        ) : (
          /* Modal de confirmação */
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-3">Confirmar Movimentações ({movements.length} produtos)</h3>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {movements.map((movement, index) => (
                  <div key={index} className="flex justify-between items-center text-sm p-2 bg-background rounded">
                    <div className="flex-1">
                      <p className="font-medium">{movement.product.name}</p>
                      <p className="text-muted-foreground text-xs">{movement.product.internal_code}</p>
                    </div>
                    <div className="text-right">
                      <p>
                        {movement.product.stock} {movement.quantity >= 0 ? '+' : ''} {movement.quantity} = 
                        <span className={`font-medium ml-1 ${movement.quantity >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {movement.newStock} {movement.product.stock_unit}
                        </span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {errors.length > 0 && (
                <div className="mt-4 p-3 bg-yellow-50 rounded border-yellow-200 border">
                  <p className="text-sm text-yellow-800">
                    <AlertCircle className="inline h-4 w-4 mr-1" />
                    {errors.length} linha(s) com erro foram ignoradas
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                onClick={() => setShowConfirmation(false)}
                disabled={loading}
              >
                Voltar
              </Button>
              <Button 
                onClick={confirmMovements}
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? (
                  <div className="flex items-center">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                    Processando...
                  </div>
                ) : (
                  <div className="flex items-center">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Confirmar {movements.length} Movimentações
                  </div>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BulkStockImportModal;