import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { Package, CheckCircle, Scan } from 'lucide-react';
import { formatSaleId } from '@/lib/budgetFormatter';
import SeparationConfirmModal from './SeparationConfirmModal';
interface SaleItem {
  id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  products: {
    name: string;
    internal_code: string;
    barcode: string | null;
    stock_unit: string;
  } | null;
}
interface Sale {
  id: string;
  client_id: string;
  status: string;
  total_amount: number;
  notes: string;
  created_at: string;
  budget_id: string | null;
  clients: {
    name: string;
  } | null;
}
interface SeparationModalProps {
  isOpen: boolean;
  onClose: () => void;
  saleId: string | null;
  onSeparationComplete: () => void;
}
const SeparationModal: React.FC<SeparationModalProps> = ({
  isOpen,
  onClose,
  saleId,
  onSeparationComplete
}) => {
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [saleData, setSaleData] = useState<Sale | null>(null);
  const [separatedItems, setSeparatedItems] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [codeVerification, setCodeVerification] = useState<{
    status: 'idle' | 'found' | 'not-found';
    message: string;
  }>({
    status: 'idle',
    message: ''
  });
  
  // Estado para confirmação de item individual
  const [itemToConfirm, setItemToConfirm] = useState<SaleItem | null>(null);
  const [showItemConfirmModal, setShowItemConfirmModal] = useState(false);

  useEffect(() => {
    if (isOpen && saleId) {
      fetchSaleData();
      fetchSaleItems();
    }
  }, [isOpen, saleId]);

  const fetchSaleData = async () => {
    if (!saleId) return;
    try {
      const {
        data: salesData,
        error: salesError
      } = await supabase.from('sales').select(`
          *,
          clients(name)
        `).eq('id', saleId).single();
      if (salesError) throw salesError;
      setSaleData({
        ...salesData,
        clients: salesData.clients ? {
          name: (salesData.clients as any).name
        } : null
      });
    } catch (error) {
      console.error('Erro ao buscar dados da venda:', error);
      toast.error('Erro ao carregar dados da venda');
    }
  };
  const fetchSaleItems = async () => {
    if (!saleId) return;
    setLoading(true);
    try {
      const {
        data,
        error
      } = await supabase.from('sale_items').select(`
          *,
          products(name, internal_code, barcode, stock_unit)
        `).eq('sale_id', saleId);
      if (error) throw error;
      
      const items = data?.map(item => ({
        ...item,
        products: item.products ? {
          name: (item.products as any).name,
          internal_code: (item.products as any).internal_code,
          barcode: (item.products as any).barcode,
          stock_unit: (item.products as any).stock_unit || 'Unidade'
        } : null
      })) || [];
      
      setSaleItems(items);

      // Carregar progresso existente da separação
      const { data: separationData, error: separationError } = await supabase
        .from('separation_items')
        .select('sale_item_id, separated_quantity, total_quantity')
        .eq('sale_id', saleId);

      if (separationError) {
        console.error('Erro ao carregar progresso da separação:', separationError);
      } else {
        // Marcar itens que foram completamente separados
        const separatedItemIds = new Set<string>();
        separationData?.forEach(sep => {
          if (sep.separated_quantity === sep.total_quantity) {
            separatedItemIds.add(sep.sale_item_id);
          }
        });
        setSeparatedItems(separatedItemIds);
      }
      
    } catch (error) {
      console.error('Erro ao buscar itens da venda:', error);
      toast.error('Erro ao carregar itens da venda');
    } finally {
      setLoading(false);
    }
  };
  const handleCodeVerification = async (code: string) => {
    if (!code.trim()) {
      setCodeVerification({
        status: 'idle',
        message: ''
      });
      return;
    }
    const foundItem = saleItems.find(item => 
      item.products?.internal_code === code.trim() || 
      item.products?.barcode === code.trim() ||
      item.products?.name.toLowerCase() === code.trim().toLowerCase()
    );
    if (foundItem) {
      setCodeVerification({
        status: 'found',
        message: `Produto encontrado: ${foundItem.products?.name}`
      });

      // Verificar se o item já está separado
      if (separatedItems.has(foundItem.id)) {
        toast.info('Este item já foi separado');
        setTimeout(() => {
          setCodeInput('');
          setCodeVerification({
            status: 'idle',
            message: ''
          });
        }, 1500);
        return;
      }

      // Abrir modal de confirmação para o item encontrado
      setItemToConfirm(foundItem);
      setShowItemConfirmModal(true);

      // Limpar o campo após a validação
      setTimeout(() => {
        setCodeInput('');
        setCodeVerification({
          status: 'idle',
          message: ''
        });
      }, 1500);
    } else {
      setCodeVerification({
        status: 'not-found',
        message: 'Produto informado não faz parte do pedido'
      });

      // Limpar o campo após mostrar o erro
      setTimeout(() => {
        setCodeInput('');
        setCodeVerification({
          status: 'idle',
          message: ''
        });
      }, 2000);
    }
  };
  const handleCodeInputChange = (value: string) => {
    setCodeInput(value);
    handleCodeVerification(value);
  };
  const handleItemToggle = (itemId: string) => {
    const item = saleItems.find(i => i.id === itemId);
    if (!item || !saleId) return;

    // Se o item já está separado, desmarcar diretamente (sem confirmação)
    if (separatedItems.has(itemId)) {
      handleUnseparateItem(itemId);
    } else {
      // Se não está separado, abrir modal de confirmação
      setItemToConfirm(item);
      setShowItemConfirmModal(true);
    }
  };

  const handleUnseparateItem = async (itemId: string) => {
    const item = saleItems.find(i => i.id === itemId);
    if (!item || !saleId) return;

    const newSeparatedItems = new Set(separatedItems);
    newSeparatedItems.delete(itemId);
    setSeparatedItems(newSeparatedItems);

    // Salvar progresso na base de dados
    try {
      const { error } = await supabase
        .from('separation_items')
        .upsert({
          sale_id: saleId,
          sale_item_id: itemId,
          separated_quantity: 0,
          total_quantity: item.quantity
        }, {
          onConflict: 'sale_id,sale_item_id'
        });

      if (error) throw error;

      // Atualizar percentagem na tabela sales
      const totalItems = saleItems.length;
      const separatedCount = newSeparatedItems.size;
      const percentage = Math.round((separatedCount / totalItems) * 100);
      
      await supabase
        .from('sales')
        .update({
          separation_percentage: percentage,
          separation_complete: separatedCount === totalItems
        })
        .eq('id', saleId);

    } catch (error) {
      console.error('Erro ao salvar progresso da separação:', error);
      toast.error('Erro ao salvar progresso');
    }
  };

  const handleConfirmItemSeparation = async () => {
    if (!itemToConfirm || !saleId) return;

    const newSeparatedItems = new Set([...separatedItems, itemToConfirm.id]);
    setSeparatedItems(newSeparatedItems);

    // Salvar progresso na base de dados
    try {
      const { error } = await supabase
        .from('separation_items')
        .upsert({
          sale_id: saleId,
          sale_item_id: itemToConfirm.id,
          separated_quantity: itemToConfirm.quantity,
          total_quantity: itemToConfirm.quantity
        }, {
          onConflict: 'sale_id,sale_item_id'
        });

      if (error) throw error;

      // Atualizar percentagem na tabela sales
      const totalItems = saleItems.length;
      const separatedCount = newSeparatedItems.size;
      const percentage = Math.round((separatedCount / totalItems) * 100);
      
      await supabase
        .from('sales')
        .update({
          separation_percentage: percentage,
          separation_complete: separatedCount === totalItems
        })
        .eq('id', saleId);

      toast.success(`${itemToConfirm.quantity} ${itemToConfirm.products?.stock_unit || 'unidade(s)'} de ${itemToConfirm.products?.name} separado(s)`);

    } catch (error) {
      console.error('Erro ao salvar progresso da separação:', error);
      toast.error('Erro ao salvar progresso');
    }

    // Fechar modal e limpar estado
    setShowItemConfirmModal(false);
    setItemToConfirm(null);
  };

  const handleCancelItemConfirmation = () => {
    setShowItemConfirmModal(false);
    setItemToConfirm(null);
  };
  const handleFinalizeSeparation = () => {
    if (separatedItems.size === 0) {
      toast.error('Selecione pelo menos um item para separar');
      return;
    }
    if (separatedItems.size !== saleItems.length) {
      toast.error('Todos os itens devem ser separados para finalizar');
      return;
    }
    setShowConfirmModal(true);
  };

  const handleConfirmSeparation = async () => {
    setSaving(true);
    setShowConfirmModal(false);
    try {
      // Obter o usuário atual
      const {
        data: {
          user
        }
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não encontrado');

      // Atualizar status da venda para 'conferencia' e salvar responsável pela separação
      const {
        error
      } = await supabase.from('sales').update({
        status: 'conferencia',
        separation_user_id: user.id,
        separation_completed_at: new Date().toISOString()
      }).eq('id', saleId);
      if (error) throw error;
      toast.success('Separação finalizada com sucesso!');
      onSeparationComplete();
      onClose();
    } catch (error) {
      console.error('Erro ao finalizar separação:', error);
      toast.error('Erro ao finalizar separação');
    } finally {
      setSaving(false);
    }
  };
  const allItemsSeparated = saleItems.length > 0 && separatedItems.size === saleItems.length;
  const separationProgress = saleItems.length > 0 ? separatedItems.size / saleItems.length * 100 : 0;
  return <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Separação de Produtos
          </DialogTitle>
        </DialogHeader>

        {/* Header fixo mais compacto */}
        <div className="flex-shrink-0">
          {saleData && <Card className="mb-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Informações da Separação</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3 text-sm">
                  <div>
                    <strong>Cliente:</strong> {saleData.clients?.name || 'N/A'}
                  </div>
                  <div>
                    <strong>Venda:</strong> {formatSaleId(saleData.id, saleData.created_at)}
                  </div>
                  <div>
                    <strong>Progresso:</strong>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress value={separationProgress} className="flex-1 h-2" />
                      <span className="text-xs text-gray-600 min-w-[50px]">
                        {Math.round(separationProgress)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="code-input" className="flex items-center gap-2 text-sm my-[6px]">
                      <Scan className="w-4 h-4" />
                      Código de Barras / Código Interno
                    </Label>
                    <Input id="code-input" value={codeInput} onChange={e => handleCodeInputChange(e.target.value)} placeholder="Digite ou escaneie o código do produto" className={`${codeVerification.status === 'found' ? 'border-green-500 bg-green-50' : codeVerification.status === 'not-found' ? 'border-red-500 bg-red-50' : ''}`} />
                    {codeVerification.message && <p className={`text-sm mt-1 ${codeVerification.status === 'found' ? 'text-green-600' : 'text-red-600'}`}>
                        {codeVerification.message}
                      </p>}
                  </div>
                </div>
              </CardContent>
            </Card>}
        </div>

        {/* Área com scroll para a tabela */}
        <div className="flex-1 min-h-0">
          <Card className="h-full flex flex-col">
            <CardHeader className="flex-shrink-0 pb-3">
              <CardTitle className="text-lg">Lista de Produtos para Separação</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 p-0">
              {loading ? <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Carregando itens...</p>
                </div> : <div className="h-full border-t">
                  <ScrollArea className="h-full">
                    <Table>
                      <TableHeader className="sticky top-0 bg-white z-10">
                        <TableRow className="bg-gray-50">
                          <TableHead className="w-16 text-center">Separado</TableHead>
                          <TableHead className="min-w-[120px]">Código</TableHead>
                          <TableHead className="min-w-[200px]">Produto</TableHead>
                          <TableHead className="w-32 text-center">Qtd / Unidade</TableHead>
                          <TableHead className="w-32">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {saleItems.map(item => {
                      const isSeparated = separatedItems.has(item.id);
                      return <TableRow key={item.id} className={`transition-colors ${isSeparated ? 'bg-green-50 border-green-200' : 'hover:bg-gray-50'}`}>
                              <TableCell className="text-center">
                                <Checkbox checked={isSeparated} onCheckedChange={() => handleItemToggle(item.id)} className="mx-auto" />
                              </TableCell>
                              <TableCell className="font-mono text-sm font-medium">
                                {item.products?.internal_code || 'N/A'}
                              </TableCell>
                              <TableCell className="font-medium">
                                {item.products?.name || 'Produto não encontrado'}
                              </TableCell>
                              <TableCell className="text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <span className="font-semibold text-lg">{item.quantity}</span>
                                  <span className="text-sm text-gray-600">
                                    {item.products?.stock_unit || 'Unidade'}
                                  </span>
                                </div>
                              </TableCell>
                              <TableCell>
                                {isSeparated ? <Badge className="bg-green-100 text-green-800 border-green-300">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    Separado
                                  </Badge> : <Badge variant="outline" className="border-gray-300">
                                    Pendente
                                  </Badge>}
                              </TableCell>
                            </TableRow>;
                    })}
                      </TableBody>
                    </Table>

                    {saleItems.length === 0 && <div className="text-center py-8 text-gray-500">
                        <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p>Nenhum item encontrado para esta venda.</p>
                      </div>}
                  </ScrollArea>
                </div>}
            </CardContent>
          </Card>
        </div>

        {/* Footer fixo */}
        <div className="flex-shrink-0 flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{separatedItems.size}</span> de <span className="font-medium">{saleItems.length}</span> itens separados
            {separationProgress > 0 && <span className="ml-2 text-blue-600">
                ({Math.round(separationProgress)}% concluído)
              </span>}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleFinalizeSeparation} disabled={!allItemsSeparated || saving} className="bg-green-600 hover:bg-green-700">
              {saving ? 'Finalizando...' : 'Finalizar Separação'}
            </Button>
          </div>
        </div>

        {/* Modal de Confirmação de Finalização */}
        <SeparationConfirmModal
          open={showConfirmModal}
          onOpenChange={setShowConfirmModal}
          onConfirm={handleConfirmSeparation}
          itemCount={saleItems.length}
          loading={saving}
        />

        {/* Modal de Confirmação de Item Individual */}
        <AlertDialog open={showItemConfirmModal} onOpenChange={setShowItemConfirmModal}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Separação</AlertDialogTitle>
              <AlertDialogDescription className="text-base">
                Confirma que separou <strong className="text-foreground">{itemToConfirm?.quantity} {itemToConfirm?.products?.stock_unit || 'unidade(s)'}</strong> do produto <strong className="text-foreground">{itemToConfirm?.products?.name}</strong>?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={handleCancelItemConfirmation}>
                Cancelar
              </AlertDialogCancel>
              <AlertDialogAction 
                onClick={handleConfirmItemSeparation}
                className="bg-green-600 hover:bg-green-700"
              >
                Sim, Confirmo
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DialogContent>
    </Dialog>;
};
export default SeparationModal;