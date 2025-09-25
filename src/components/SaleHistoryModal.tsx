
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, User, CheckCircle, Package, FileText, TrendingUp, Truck } from 'lucide-react';
import { formatSaleId } from '@/lib/budgetFormatter';

interface StatusLog {
  id: string;
  previous_status: string | null;
  new_status: string;
  reason: string | null;
  created_at: string;
  user_id: string;
  user_profile: { name: string } | null;
}

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
  const [statusLogs, setStatusLogs] = useState<StatusLog[]>([]);
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

      // Buscar logs de mudança de status
      const { data: statusLogsData, error: logsError } = await supabase
        .from('sale_status_logs')
        .select('id, previous_status, new_status, reason, created_at, user_id')
        .eq('sale_id', saleId)
        .order('created_at', { ascending: true });

      if (logsError) throw logsError;

      // Buscar perfis dos usuários envolvidos (incluindo usuários dos logs)
      const saleUserIds = [
        saleData.created_by,
        saleData.separation_user_id,
        saleData.conference_user_id,
        saleData.invoice_user_id,
        saleData.delivery_user_id
      ].filter(Boolean);

      const logUserIds = statusLogsData?.map(log => log.user_id) || [];
      const allUserIds = [...new Set([...saleUserIds, ...logUserIds])];

      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name')
        .in('id', allUserIds);

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

      // Montar logs com perfis
      const enrichedLogs: StatusLog[] = statusLogsData?.map(log => ({
        ...log,
        user_profile: profilesData?.find(p => p.id === log.user_id) || null
      })) || [];

      setHistoryData(enrichedData);
      setStatusLogs(enrichedLogs);
    } catch (error) {
      console.error('Erro ao buscar histórico da venda:', error);
    } finally {
      setLoading(false);
    }
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

  const getStatusLogForStatus = (status: string) => {
    return statusLogs.find(log => log.new_status === status);
  };

  if (!historyData) return null;

  const currentStatus = historyData.status;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Histórico da Venda {formatSaleId(historyData.id, historyData.created_at)}
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
                      {(() => {
                        // Mostrar quem FINALIZOU a separação
                        if (historyData.separation_user_profile && historyData.separation_completed_at) {
                          return (
                            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                              <User className="w-4 h-4" />
                              <span>Finalizado por: {historyData.separation_user_profile.name}</span>
                              <Clock className="w-4 h-4 ml-2" />
                              <span>{new Date(historyData.separation_completed_at).toLocaleString('pt-BR')}</span>
                            </div>
                          );
                        } else if (currentStatus === 'separacao') {
                          // Se está em separação mas não foi finalizada ainda, mostrar log de mudança para separação
                          const log = getStatusLogForStatus('separacao');
                          if (log?.user_profile) {
                            return (
                              <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                                <User className="w-4 h-4" />
                                <span>Iniciado por: {log.user_profile.name}</span>
                                <Clock className="w-4 h-4 ml-2" />
                                <span>{new Date(log.created_at).toLocaleString('pt-BR')}</span>
                              </div>
                            );
                          }
                        }
                        return null;
                      })()}
                      {(() => {
                        const separationLog = getStatusLogForStatus('separacao');
                        return separationLog?.reason && currentStatus === 'separacao' && (
                          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                            <p className="text-sm text-blue-800">
                              <span className="font-semibold">Motivo:</span> {separationLog.reason}
                            </p>
                          </div>
                        );
                      })()}
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
                      {(() => {
                        // Mostrar quem FINALIZOU a conferência
                        if (historyData.conference_user_profile && historyData.conference_completed_at) {
                          return (
                            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                              <User className="w-4 h-4" />
                              <span>Finalizado por: {historyData.conference_user_profile.name}</span>
                              <Clock className="w-4 h-4 ml-2" />
                              <span>{new Date(historyData.conference_completed_at).toLocaleString('pt-BR')}</span>
                            </div>
                          );
                        } else if (currentStatus === 'conferencia') {
                          // Se está em conferência mas não foi finalizada ainda, mostrar log de mudança para conferência
                          const log = getStatusLogForStatus('conferencia');
                          if (log?.user_profile) {
                            return (
                              <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                                <User className="w-4 h-4" />
                                <span>Iniciado por: {log.user_profile.name}</span>
                                <Clock className="w-4 h-4 ml-2" />
                                <span>{new Date(log.created_at).toLocaleString('pt-BR')}</span>
                              </div>
                            );
                          }
                        }
                        return null;
                      })()}
                      {(() => {
                        const conferenceLog = getStatusLogForStatus('conferencia');
                        return conferenceLog?.reason && currentStatus === 'conferencia' && (
                          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                            <p className="text-sm text-blue-800">
                              <span className="font-semibold">Motivo:</span> {conferenceLog.reason}
                            </p>
                          </div>
                        );
                      })()}
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
                      {(() => {
                        // Mostrar quem FINALIZOU a nota fiscal
                        if (historyData.invoice_user_profile && historyData.invoice_completed_at) {
                          return (
                            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                              <User className="w-4 h-4" />
                              <span>Finalizado por: {historyData.invoice_user_profile.name}</span>
                              <Clock className="w-4 h-4 ml-2" />
                              <span>{new Date(historyData.invoice_completed_at).toLocaleString('pt-BR')}</span>
                            </div>
                          );
                        } else if (currentStatus === 'nota_fiscal') {
                          // Se está em nota fiscal mas não foi finalizada ainda, mostrar log de mudança para nota fiscal
                          const log = getStatusLogForStatus('nota_fiscal');
                          if (log?.user_profile) {
                            return (
                              <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                                <User className="w-4 h-4" />
                                <span>Iniciado por: {log.user_profile.name}</span>
                                <Clock className="w-4 h-4 ml-2" />
                                <span>{new Date(log.created_at).toLocaleString('pt-BR')}</span>
                              </div>
                            );
                          }
                        }
                        return null;
                      })()}
                      {(() => {
                        const invoiceLog = getStatusLogForStatus('nota_fiscal');
                        return invoiceLog?.reason && currentStatus === 'nota_fiscal' && (
                          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                            <p className="text-sm text-blue-800">
                              <span className="font-semibold">Motivo:</span> {invoiceLog.reason}
                            </p>
                          </div>
                        );
                      })()}
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
                      {(() => {
                        // Mostrar quem FINALIZOU a entrega
                        if (historyData.delivery_user_profile && historyData.delivery_completed_at) {
                          return (
                            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                              <User className="w-4 h-4" />
                              <span>Finalizado por: {historyData.delivery_user_profile.name}</span>
                              <Clock className="w-4 h-4 ml-2" />
                              <span>{new Date(historyData.delivery_completed_at).toLocaleString('pt-BR')}</span>
                            </div>
                          );
                        } else if (currentStatus === 'aguardando_entrega' || currentStatus === 'entrega_realizada') {
                          // Se está aguardando entrega ou entrega realizada, mostrar log relevante
                          const log = getStatusLogForStatus('aguardando_entrega') || getStatusLogForStatus('entrega_realizada');
                          if (log?.user_profile) {
                            return (
                              <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                                <User className="w-4 h-4" />
                                <span>{currentStatus === 'entrega_realizada' ? 'Finalizado por' : 'Iniciado por'}: {log.user_profile.name}</span>
                                <Clock className="w-4 h-4 ml-2" />
                                <span>{new Date(log.created_at).toLocaleString('pt-BR')}</span>
                              </div>
                            );
                          }
                        }
                        return null;
                      })()}
                      {(() => {
                        const deliveryLog = getStatusLogForStatus('entrega_realizada') || getStatusLogForStatus('aguardando_entrega');
                        return deliveryLog?.reason && (currentStatus === 'aguardando_entrega' || currentStatus === 'entrega_realizada') && (
                          <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-md">
                            <p className="text-sm text-blue-800">
                              <span className="font-semibold">Motivo:</span> {deliveryLog.reason}
                            </p>
                          </div>
                        );
                      })()}
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
