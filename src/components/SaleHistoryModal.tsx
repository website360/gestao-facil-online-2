
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, User, CheckCircle, Package, FileText, TrendingUp, Truck } from 'lucide-react';

interface SaleHistoryData {
  id: string;
  status: string;
  created_at: string;
  created_by: string;
  separation_user_id: string | null;
  separation_completed_at: string | null;
  conference_user_id: string | null;
  conference_completed_at: string | null;
  invoice_user_id: string | null;
  invoice_completed_at: string | null;
  delivery_user_id: string | null;
  delivery_completed_at: string | null;
  created_by_profile: { name: string } | null;
  separation_user_profile: { name: string } | null;
  conference_user_profile: { name: string } | null;
  invoice_user_profile: { name: string } | null;
  delivery_user_profile: { name: string } | null;
}

interface SaleHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  saleId: string | null;
}

const SaleHistoryModal: React.FC<SaleHistoryModalProps> = ({
  isOpen,
  onClose,
  saleId
}) => {
  const [historyData, setHistoryData] = useState<SaleHistoryData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && saleId) {
      fetchSaleHistory();
    }
  }, [isOpen, saleId]);

  const fetchSaleHistory = async () => {
    if (!saleId) return;
    
    setLoading(true);
    try {
      // Buscar dados da venda
      const { data: saleData, error: saleError } = await supabase
        .from('sales')
        .select('*')
        .eq('id', saleId)
        .single();

      if (saleError) throw saleError;

      // Buscar perfis dos usuários envolvidos
      const userIds = [
        saleData.created_by,
        saleData.separation_user_id,
        saleData.conference_user_id,
        saleData.invoice_user_id,
        saleData.delivery_user_id
      ].filter(Boolean);

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Montar dados com perfis
      const enrichedData: SaleHistoryData = {
        ...saleData,
        created_by_profile: profilesData?.find(p => p.id === saleData.created_by) || null,
        separation_user_profile: profilesData?.find(p => p.id === saleData.separation_user_id) || null,
        conference_user_profile: profilesData?.find(p => p.id === saleData.conference_user_id) || null,
        invoice_user_profile: profilesData?.find(p => p.id === saleData.invoice_user_id) || null,
        delivery_user_profile: profilesData?.find(p => p.id === saleData.delivery_user_id) || null,
      };

      setHistoryData(enrichedData);
    } catch (error) {
      console.error('Erro ao buscar histórico da venda:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatSaleId = (id: string) => {
    const timestamp = new Date().getTime();
    const sequentialNumber = (timestamp % 100000000).toString().padStart(8, '0');
    return `#V${sequentialNumber}`;
  };

  const getStepStatus = (stepCompleted: boolean, currentStep: boolean) => {
    if (stepCompleted) return 'completed';
    if (currentStep) return 'current';
    return 'pending';
  };

  const getStepIcon = (step: string, status: string) => {
    const iconClass = status === 'completed' ? 'text-green-600' : 
                     status === 'current' ? 'text-blue-600' : 'text-gray-400';
    
    switch (step) {
      case 'created':
        return <TrendingUp className={`w-5 h-5 ${iconClass}`} />;
      case 'separation':
        return <Package className={`w-5 h-5 ${iconClass}`} />;
      case 'conference':
        return <CheckCircle className={`w-5 h-5 ${iconClass}`} />;
      case 'invoice':
        return <FileText className={`w-5 h-5 ${iconClass}`} />;
      case 'delivery':
        return <Truck className={`w-5 h-5 ${iconClass}`} />;
      default:
        return <Clock className={`w-5 h-5 ${iconClass}`} />;
    }
  };

  if (!historyData) return null;

  const currentStatus = historyData.status;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Histórico da Venda {formatSaleId(historyData.id)}
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>Linha do Tempo</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Criação da Venda */}
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {getStepIcon('created', 'completed')}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">Venda Criada</h3>
                        <Badge className="bg-green-100 text-green-800">
                          Concluído
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                        <User className="w-4 h-4" />
                        <span>Por: {historyData.created_by_profile?.name}</span>
                        <Clock className="w-4 h-4 ml-2" />
                        <span>{new Date(historyData.created_at).toLocaleString('pt-BR')}</span>
                      </div>
                    </div>
                  </div>

                  {/* Separação */}
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {getStepIcon('separation', getStepStatus(
                        !!historyData.separation_completed_at,
                        currentStatus === 'separacao'
                      ))}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">Separação</h3>
                        <Badge className={
                          historyData.separation_completed_at 
                            ? "bg-green-100 text-green-800"
                            : currentStatus === 'separacao'
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-600"
                        }>
                          {historyData.separation_completed_at 
                            ? "Concluído" 
                            : currentStatus === 'separacao' 
                            ? "Em Andamento" 
                            : "Pendente"}
                        </Badge>
                      </div>
                      {historyData.separation_user_profile && historyData.separation_completed_at && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                          <User className="w-4 h-4" />
                          <span>Por: {historyData.separation_user_profile.name}</span>
                          <Clock className="w-4 h-4 ml-2" />
                          <span>{new Date(historyData.separation_completed_at).toLocaleString('pt-BR')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Conferência */}
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {getStepIcon('conference', getStepStatus(
                        !!historyData.conference_completed_at,
                        currentStatus === 'conferencia'
                      ))}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">Conferência</h3>
                        <Badge className={
                          historyData.conference_completed_at 
                            ? "bg-green-100 text-green-800"
                            : currentStatus === 'conferencia'
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-600"
                        }>
                          {historyData.conference_completed_at 
                            ? "Concluído" 
                            : currentStatus === 'conferencia' 
                            ? "Em Andamento" 
                            : "Pendente"}
                        </Badge>
                      </div>
                      {historyData.conference_user_profile && historyData.conference_completed_at && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                          <User className="w-4 h-4" />
                          <span>Por: {historyData.conference_user_profile.name}</span>
                          <Clock className="w-4 h-4 ml-2" />
                          <span>{new Date(historyData.conference_completed_at).toLocaleString('pt-BR')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Nota Fiscal */}
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {getStepIcon('invoice', getStepStatus(
                        !!historyData.invoice_completed_at,
                        currentStatus === 'nota_fiscal'
                      ))}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">Nota Fiscal</h3>
                        <Badge className={
                          historyData.invoice_completed_at 
                            ? "bg-green-100 text-green-800"
                            : currentStatus === 'nota_fiscal'
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-600"
                        }>
                          {historyData.invoice_completed_at 
                            ? "Concluído" 
                            : currentStatus === 'nota_fiscal' 
                            ? "Em Andamento" 
                            : "Pendente"}
                        </Badge>
                      </div>
                      {historyData.invoice_user_profile && historyData.invoice_completed_at && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                          <User className="w-4 h-4" />
                          <span>Por: {historyData.invoice_user_profile.name}</span>
                          <Clock className="w-4 h-4 ml-2" />
                          <span>{new Date(historyData.invoice_completed_at).toLocaleString('pt-BR')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Entrega Realizada */}
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {getStepIcon('delivery', getStepStatus(
                        currentStatus === 'entrega_realizada',
                        currentStatus === 'aguardando_entrega' || currentStatus === 'entrega_realizada'
                      ))}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold">Entrega Realizada</h3>
                        <Badge className={
                          currentStatus === 'entrega_realizada'
                            ? "bg-green-100 text-green-800"
                            : currentStatus === 'aguardando_entrega'
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-600"
                        }>
                          {currentStatus === 'entrega_realizada' 
                            ? "Concluído" 
                            : currentStatus === 'aguardando_entrega'
                            ? "Em Andamento"
                            : "Pendente"}
                        </Badge>
                      </div>
                      {historyData.delivery_user_profile && historyData.delivery_completed_at && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                          <User className="w-4 h-4" />
                          <span>Por: {historyData.delivery_user_profile.name}</span>
                          <Clock className="w-4 h-4 ml-2" />
                          <span>{new Date(historyData.delivery_completed_at).toLocaleString('pt-BR')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SaleHistoryModal;
