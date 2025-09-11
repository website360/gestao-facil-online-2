import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Package, CheckCircle, X, Scan } from 'lucide-react';
import VolumeWeightModal from './VolumeWeightModal';
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
interface ConferenceItem {
  id: string;
  sale_item_id: string;
  conferred_quantity: number;
  is_correct: boolean;
  conferred_at: string;
}
interface Sale {
  id: string;
  client_id: string;
  status: string;
  total_amount: number;
  notes: string;
  created_at: string;
  clients: {
    name: string;
  } | null;
}
interface ConferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  saleId: string | null;
  onConferenceComplete: () => void;
}
const ConferenceModal: React.FC<ConferenceModalProps> = ({
  isOpen,
  onClose,
  saleId,
  onConferenceComplete
}) => {
  const [saleItems, setSaleItems] = useState<SaleItem[]>([]);
  const [saleData, setSaleData] = useState<Sale | null>(null);
  const [conferenceItems, setConferenceItems] = useState<ConferenceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [foundItem, setFoundItem] = useState<SaleItem | null>(null);
  const [quantityInput, setQuantityInput] = useState('');
  const [codeMessage, setCodeMessage] = useState('');
  const [showVolumeModal, setShowVolumeModal] = useState(false);
  const codeInputRef = useRef<HTMLInputElement>(null);
  const quantityInputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (isOpen && saleId) {
      fetchSaleData();
      fetchSaleItems();
      fetchConferenceItems();
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
      setSaleItems(data?.map(item => ({
        ...item,
        products: item.products ? {
          name: (item.products as any).name,
          internal_code: (item.products as any).internal_code,
          barcode: (item.products as any).barcode,
          stock_unit: (item.products as any).stock_unit || 'Unidade'
        } : null
      })) || []);
    } catch (error) {
      console.error('Erro ao buscar itens da venda:', error);
      toast.error('Erro ao carregar itens da venda');
    } finally {
      setLoading(false);
    }
  };
  const fetchConferenceItems = async () => {
    if (!saleId) return;
    try {
      const {
        data,
        error
      } = await supabase.from('conference_items').select('*').eq('sale_id', saleId);
      if (error) throw error;
      setConferenceItems(data || []);
    } catch (error) {
      console.error('Erro ao buscar itens conferidos:', error);
    }
  };
  const handleCodeSearch = (code: string) => {
    if (!code.trim()) {
      setFoundItem(null);
      setCodeMessage('');
      setQuantityInput('');
      return;
    }
    const item = saleItems.find(item => 
      item.products?.internal_code === code.trim() || 
      item.products?.barcode === code.trim() || 
      item.products?.name.toLowerCase() === code.trim().toLowerCase()
    );
    if (item) {
      setFoundItem(item);
      setCodeMessage(`Produto encontrado: ${item.products?.name}`);
      setQuantityInput('');
      
      // Focus no campo de quantidade quando produto é encontrado
      setTimeout(() => {
        quantityInputRef.current?.focus();
      }, 100);
    } else {
      setFoundItem(null);
      setCodeMessage('Produto não encontrado na lista');
      setQuantityInput('');
    }
  };
  const handleQuantitySubmit = async () => {
    if (!foundItem || !quantityInput) return;
    const conferredQty = parseInt(quantityInput);
    const expectedQty = foundItem.quantity;
    const isCorrect = conferredQty === expectedQty;
    if (!isCorrect) {
      const difference = expectedQty - conferredQty;
      let actionMessage = '';
      
      if (difference > 0) {
        actionMessage = `Adicione ${difference} ${difference === 1 ? 'item' : 'itens'}`;
      } else {
        actionMessage = `Remova ${Math.abs(difference)} ${Math.abs(difference) === 1 ? 'item' : 'itens'}`;
      }
      
      toast.error(`Quantidade incorreta! ${actionMessage} e confira novamente.`);
      
      // Limpar quantidade e focar novamente no campo
      setQuantityInput('');
      setTimeout(() => {
        quantityInputRef.current?.focus();
      }, 100);
      return;
    }
    try {
      const existingConference = conferenceItems.find(ci => ci.sale_item_id === foundItem.id);
      if (existingConference) {
        const { error } = await supabase
          .from('conference_items')
          .update({
            conferred_quantity: conferredQty,
            is_correct: isCorrect,
            conferred_at: new Date().toISOString()
          })
          .eq('id', existingConference.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('conference_items')
          .insert({
            sale_id: saleId!,
            sale_item_id: foundItem.id,
            conferred_quantity: conferredQty,
            is_correct: isCorrect,
            conferred_at: new Date().toISOString()
          });
        if (error) throw error;
      }
      await fetchConferenceItems();
      toast.success('Item conferido com sucesso!');
      // Limpar formulário e focar no campo de código
      setCodeInput('');
      setFoundItem(null);
      setQuantityInput('');
      setCodeMessage('');
      
      setTimeout(() => {
        codeInputRef.current?.focus();
      }, 100);
    } catch (error) {
      console.error('Erro ao conferir item:', error);
      toast.error('Erro ao conferir item');
    }
  };
  const handleFinalizeConference = async () => {
    const allItemsConferred = saleItems.every(item => conferenceItems.some(ci => ci.sale_item_id === item.id));
    if (!allItemsConferred) {
      toast.error('Todos os itens devem ser conferidos antes de finalizar');
      return;
    }
    const allItemsCorrect = conferenceItems.every(ci => ci.is_correct);
    
    if (allItemsCorrect) {
      // Se todos os itens estão corretos, abrir modal de volumes
      setShowVolumeModal(true);
    } else {
      // Se há itens incorretos, retornar para separação
      setSaving(true);
      try {
        const {
          data: {
            user
          }
        } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não encontrado');
        
        const {
          error
        } = await supabase.from('sales').update({
          status: 'separacao',
          conference_user_id: user.id,
          conference_completed_at: new Date().toISOString()
        }).eq('id', saleId);
        
        if (error) throw error;
        toast.warning('Itens com problemas encontrados. Venda retornada para Separação.');
        onConferenceComplete();
        onClose();
      } catch (error) {
        console.error('Erro ao finalizar conferência:', error);
        toast.error('Erro ao finalizar conferência');
      } finally {
        setSaving(false);
      }
    }
  };

  const handleVolumeComplete = () => {
    onConferenceComplete();
    onClose();
    setShowVolumeModal(false);
  };
  const formatSaleId = (id: string) => {
    // Usar hash do ID da venda para gerar um número consistente
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      const char = id.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    const sequentialNumber = Math.abs(hash % 100000000).toString().padStart(8, '0');
    return `#V${sequentialNumber}`;
  };
  const getConferenceStatus = (itemId: string) => {
    return conferenceItems.find(ci => ci.sale_item_id === itemId);
  };
  const conferenceProgress = saleItems.length > 0 ? conferenceItems.length / saleItems.length * 100 : 0;
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            Conferência de Produtos
          </DialogTitle>
        </DialogHeader>

        {/* Header fixo mais compacto */}
        <div className="flex-shrink-0">
          {saleData && (
            <Card className="mb-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Informações da Conferência</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3 text-sm">
                  <div>
                    <strong>Cliente:</strong> {saleData.clients?.name || 'N/A'}
                  </div>
                  <div>
                    <strong>Venda:</strong> {formatSaleId(saleData.id)}
                  </div>
                  <div>
                    <strong>Progresso:</strong>
                    <div className="flex items-center gap-2 mt-1">
                      <Progress value={conferenceProgress} className="flex-1 h-2" />
                      <span className="text-xs text-gray-600 min-w-[50px]">
                        {Math.round(conferenceProgress)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="code-input" className="flex items-center gap-2 text-sm mx-0 my-[6px]">
                      <Scan className="w-4 h-4" />
                      Código de Barras / Código Interno / Nome do Produto
                    </Label>
                    <Input
                      id="code-input"
                      ref={codeInputRef}
                      value={codeInput}
                      onChange={(e) => {
                        setCodeInput(e.target.value);
                        handleCodeSearch(e.target.value);
                      }}
                      placeholder="Digite ou escaneie o código do produto"
                      className={`${
                        foundItem 
                          ? 'border-green-500 bg-green-50' 
                          : codeMessage && !foundItem 
                            ? 'border-red-500 bg-red-50' 
                            : ''
                      }`}
                    />
                    {codeMessage && (
                      <p className={`text-sm mt-1 ${foundItem ? 'text-green-600' : 'text-red-600'}`}>
                        {codeMessage}
                      </p>
                    )}
                  </div>

                  {foundItem && (
                    <div className="space-y-2">
                      <Label htmlFor="quantity-input" className="text-sm">
                        Quantidade Conferida
                      </Label>
                      <div className="flex gap-2">
                        <Input
                          id="quantity-input"
                          ref={quantityInputRef}
                          type="number"
                          value={quantityInput}
                          onChange={(e) => setQuantityInput(e.target.value)}
                          placeholder="Digite a quantidade conferida"
                          className="flex-1"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && quantityInput) {
                              handleQuantitySubmit();
                            }
                          }}
                        />
                        <Button
                          onClick={handleQuantitySubmit}
                          disabled={!quantityInput}
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          Conferir
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Área com scroll para a tabela */}
        <div className="flex-1 min-h-0">
          <Card className="h-full flex flex-col">
            <CardHeader className="flex-shrink-0 pb-3">
              <CardTitle className="text-lg">Lista de Produtos para Conferência</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-0 p-0">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Carregando itens...</p>
                </div>
              ) : (
                <div className="h-full border-t">
                  <ScrollArea className="h-full">
                    <Table>
                      <TableHeader className="sticky top-0 bg-white z-10">
                        <TableRow className="bg-gray-50">
                          <TableHead className="min-w-[120px]">Código</TableHead>
                          <TableHead className="min-w-[200px]">Produto</TableHead>
                          <TableHead className="w-32 text-center">Qtd Esperada</TableHead>
                          <TableHead className="w-32 text-center">Qtd Conferida</TableHead>
                          <TableHead className="w-32">Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {saleItems.map((item) => {
                          const conferenceStatus = getConferenceStatus(item.id);
                          return (
                            <TableRow
                              key={item.id}
                              className={`transition-colors ${
                                conferenceStatus?.is_correct
                                  ? 'bg-green-50'
                                  : conferenceStatus && !conferenceStatus.is_correct
                                    ? 'bg-red-50'
                                    : 'hover:bg-gray-50'
                              }`}
                            >
                              <TableCell className="font-mono text-sm font-medium">
                                {item.products?.internal_code || 'N/A'}
                              </TableCell>
                              <TableCell className="font-medium">
                                {item.products?.name || 'Produto não encontrado'}
                              </TableCell>
                              <TableCell className="text-center">
                                {conferenceStatus ? (
                                  <div className="flex items-center justify-center gap-1">
                                    <span className="font-semibold text-lg">{item.quantity}</span>
                                    <span className="text-sm text-gray-600">
                                      {item.products?.stock_unit || 'Unidade'}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-gray-400">***</span>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                {conferenceStatus ? (
                                  <div className="flex items-center justify-center gap-1">
                                    <span className="font-semibold text-lg">{conferenceStatus.conferred_quantity}</span>
                                    <span className="text-sm text-gray-600">
                                      {item.products?.stock_unit || 'Unidade'}
                                    </span>
                                  </div>
                                ) : (
                                  <span className="text-gray-400">-</span>
                                )}
                              </TableCell>
                              <TableCell>
                                {conferenceStatus ? (
                                  <Badge
                                    className={
                                      conferenceStatus.is_correct
                                        ? "bg-green-100 text-green-800 border-green-300"
                                        : "bg-red-100 text-red-800 border-red-300"
                                    }
                                  >
                                    {conferenceStatus.is_correct ? (
                                      <>
                                        <CheckCircle className="w-3 h-3 mr-1" />
                                        Correto
                                      </>
                                    ) : (
                                      <>
                                        <X className="w-3 h-3 mr-1" />
                                        Incorreto
                                      </>
                                    )}
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="border-gray-300">
                                    Pendente
                                  </Badge>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>

                    {saleItems.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <p>Nenhum item encontrado para esta venda.</p>
                      </div>
                    )}
                  </ScrollArea>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Footer fixo */}
        <div className="flex-shrink-0 flex justify-between items-center pt-4 border-t">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{conferenceItems.length}</span> de{' '}
            <span className="font-medium">{saleItems.length}</span> itens conferidos
            {conferenceProgress > 0 && (
              <span className="ml-2 text-blue-600">
                ({Math.round(conferenceProgress)}% concluído)
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              onClick={handleFinalizeConference}
              disabled={conferenceItems.length !== saleItems.length || saving}
              className="bg-green-600 hover:bg-green-700"
            >
              {saving ? 'Finalizando...' : 'Finalizar Conferência'}
            </Button>
          </div>
        </div>
      </DialogContent>

      {/* Modal de Volumes */}
      <VolumeWeightModal
        isOpen={showVolumeModal}
        onClose={() => setShowVolumeModal(false)}
        saleId={saleId}
        onComplete={handleVolumeComplete}
      />
    </Dialog>
  );
};
export default ConferenceModal;
