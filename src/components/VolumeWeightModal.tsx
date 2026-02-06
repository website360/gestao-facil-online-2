import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Package, Scale, CheckCircle } from 'lucide-react';
import { formatSaleId } from '@/lib/budgetFormatter';
import VolumeLabelPrinter from './conference/VolumeLabelPrinter';

interface VolumeWeightModalProps {
  isOpen: boolean;
  onClose: () => void;
  saleId: string | null;
  onComplete: () => void;
  needsDimensions?: boolean;
}

interface VolumeWeight {
  volume_number: number;
  weight_kg: number;
  width_cm: number;
  height_cm: number;
  length_cm: number;
}

const VolumeWeightModal: React.FC<VolumeWeightModalProps> = ({
  isOpen,
  onClose,
  saleId,
  onComplete,
  needsDimensions = false
}) => {
  const [totalVolumes, setTotalVolumes] = useState<number>(1);
  const [volumes, setVolumes] = useState<VolumeWeight[]>([]);
  const [step, setStep] = useState<'volumes' | 'weights' | 'labels'>('volumes');
  const [saving, setSaving] = useState(false);
  const [clientName, setClientName] = useState<string>('');

  // Buscar nome do cliente quando o modal abrir
  useEffect(() => {
    const fetchClientName = async () => {
      if (!saleId || !isOpen) return;
      
      try {
        const { data, error } = await supabase
          .from('sales')
          .select(`
            clients(name)
          `)
          .eq('id', saleId)
          .single();

        if (error) throw error;
        
        if (data?.clients) {
          setClientName((data.clients as any).name || 'Cliente');
        }
      } catch (error) {
        console.error('Erro ao buscar nome do cliente:', error);
        setClientName('Cliente');
      }
    };

    fetchClientName();
  }, [saleId, isOpen]);

  const handleVolumeCountSubmit = () => {
    if (totalVolumes < 1) {
      toast.error('O número de volumes deve ser pelo menos 1');
      return;
    }

    const initialVolumes: VolumeWeight[] = [];
    for (let i = 1; i <= totalVolumes; i++) {
      initialVolumes.push({
        volume_number: i,
        weight_kg: 0,
        width_cm: 0,
        height_cm: 0,
        length_cm: 0
      });
    }
    setVolumes(initialVolumes);
    setStep('weights');
  };

  const handleWeightChange = (volumeNumber: number, weight: string) => {
    const weightValue = parseFloat(weight) || 0;
    setVolumes(prev => 
      prev.map(vol => 
        vol.volume_number === volumeNumber 
          ? { ...vol, weight_kg: weightValue }
          : vol
      )
    );
  };

  const handleDimensionChange = (volumeNumber: number, field: 'width_cm' | 'height_cm' | 'length_cm', value: string) => {
    const dimensionValue = parseFloat(value) || 0;
    setVolumes(prev => 
      prev.map(vol => 
        vol.volume_number === volumeNumber 
          ? { ...vol, [field]: dimensionValue }
          : vol
      )
    );
  };

  const handleSaveVolumes = async () => {
    // Validar se todos os volumes têm peso válido
    const hasInvalidWeight = volumes.some(vol => vol.weight_kg <= 0);
    if (hasInvalidWeight) {
      toast.error('Todos os volumes devem ter peso maior que 0');
      return;
    }

    // Se precisar de dimensões (frete Correios), validar dimensões também
    if (needsDimensions) {
      const hasInvalidDimensions = volumes.some(vol => 
        vol.width_cm <= 0 || vol.height_cm <= 0 || vol.length_cm <= 0
      );
      if (hasInvalidDimensions) {
        toast.error('Para frete Correios, todos os volumes devem ter dimensões (largura, altura, comprimento) maiores que 0');
        return;
      }
    }

    setSaving(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não encontrado');

      // Salvar cada volume na tabela
      const volumePromises = volumes.map(volume => {
        const volumeData: any = {
          sale_id: saleId!,
          volume_number: volume.volume_number,
          weight_kg: volume.weight_kg,
          created_by: user.id
        };

        // Só incluir dimensões se necessário (frete Correios)
        if (needsDimensions) {
          volumeData.width_cm = volume.width_cm;
          volumeData.height_cm = volume.height_cm;
          volumeData.length_cm = volume.length_cm;
        }

        return supabase.from('sale_volumes').insert(volumeData);
      });

      await Promise.all(volumePromises);

      // Calcular peso total
      const totalWeight = volumes.reduce((sum, vol) => sum + vol.weight_kg, 0);

      // Preparar dados para atualizar a venda
      const updateData: any = {
        status: 'nota_fiscal',
        conference_user_id: user.id,
        conference_completed_at: new Date().toISOString(),
        total_volumes: totalVolumes,
        total_weight_kg: totalWeight
      };

      // Se precisou de dimensões (frete Correios), marcar como pronta para gerar etiqueta
      if (needsDimensions) {
        updateData.ready_for_shipping_label = true;
      }

      // Atualizar a venda com informações dos volumes e finalizar conferência
      const { error } = await supabase
        .from('sales')
        .update(updateData)
        .eq('id', saleId);

      if (error) throw error;

      // Avançar para step de etiquetas
      setStep('labels');
      
    } catch (error) {
      console.error('Erro ao salvar volumes:', error);
      toast.error('Erro ao registrar volumes');
    } finally {
      setSaving(false);
    }
  };

  const handlePrintComplete = () => {
    toast.success('Etiquetas enviadas para impressão!');
  };

  const handleFinalClose = () => {
    onComplete();
    resetModal();
    onClose();
  };

  const handleBack = () => {
    setStep('volumes');
    setVolumes([]);
  };

  const resetModal = () => {
    setTotalVolumes(1);
    setVolumes([]);
    setStep('volumes');
    setSaving(false);
    setClientName('');
  };

  const handleClose = () => {
    // Se estiver no step de etiquetas, permite fechar normalmente
    if (step === 'labels') {
      handleFinalClose();
      return;
    }
    resetModal();
    onClose();
  };

  const totalWeight = volumes.reduce((sum, vol) => sum + vol.weight_kg, 0);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            {step === 'labels' 
              ? 'Impressão de Etiquetas' 
              : needsDimensions 
                ? 'Registro de Volumes, Pesos e Dimensões' 
                : 'Registro de Volumes e Pesos'
            }
            {saleId && step !== 'labels' && (
              <Badge variant="outline" className="ml-2">
                {formatSaleId(saleId)}
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {step === 'volumes' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="w-5 h-5" />
                Quantos volumes tem esta venda?
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="volume-count">Número de Volumes</Label>
                <Input
                  id="volume-count"
                  type="number"
                  min="1"
                  value={totalVolumes}
                  onChange={(e) => setTotalVolumes(parseInt(e.target.value) || 1)}
                  placeholder="Digite o número de volumes"
                  className="text-lg text-center"
                />
                <p className="text-sm text-gray-600 mt-1">
                  Informe quantas caixas/volumes serão enviados
                </p>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={handleClose}>
                  Cancelar
                </Button>
                <Button onClick={handleVolumeCountSubmit}>
                  Avançar
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 'weights' && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Scale className="w-5 h-5" />
                {needsDimensions 
                  ? `Peso e Dimensões de cada volume (${totalVolumes} ${totalVolumes === 1 ? 'volume' : 'volumes'})`
                  : `Peso de cada volume (${totalVolumes} ${totalVolumes === 1 ? 'volume' : 'volumes'})`
                }
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-6 max-h-96 overflow-y-auto">
                {volumes.map((volume) => (
                  <div key={volume.volume_number} className="p-4 border rounded-lg space-y-3">
                    <Label className="text-base font-semibold">
                      Volume {volume.volume_number}
                    </Label>
                    
                    <div className={`grid gap-3 ${needsDimensions ? 'grid-cols-2 md:grid-cols-4' : 'grid-cols-1 md:grid-cols-1'}`}>
                      {/* Peso */}
                      <div className="space-y-1">
                        <Label htmlFor={`weight-${volume.volume_number}`} className="text-sm">
                          Peso
                        </Label>
                        <div className="flex items-center gap-1">
                          <Input
                            id={`weight-${volume.volume_number}`}
                            type="number"
                            step="0.001"
                            min="0.001"
                            value={volume.weight_kg || ''}
                            onChange={(e) => handleWeightChange(volume.volume_number, e.target.value)}
                            placeholder="0.000"
                            className="text-center text-sm"
                          />
                          <span className="text-xs text-muted-foreground min-w-[20px]">kg</span>
                        </div>
                      </div>

                      {/* Dimensões - só aparecem se needsDimensions for true */}
                      {needsDimensions && (
                        <>
                          {/* Largura */}
                          <div className="space-y-1">
                            <Label htmlFor={`width-${volume.volume_number}`} className="text-sm">
                              Largura
                            </Label>
                            <div className="flex items-center gap-1">
                              <Input
                                id={`width-${volume.volume_number}`}
                                type="number"
                                step="0.1"
                                min="0.1"
                                value={volume.width_cm || ''}
                                onChange={(e) => handleDimensionChange(volume.volume_number, 'width_cm', e.target.value)}
                                placeholder="0.0"
                                className="text-center text-sm"
                              />
                              <span className="text-xs text-muted-foreground min-w-[20px]">cm</span>
                            </div>
                          </div>

                          {/* Altura */}
                          <div className="space-y-1">
                            <Label htmlFor={`height-${volume.volume_number}`} className="text-sm">
                              Altura
                            </Label>
                            <div className="flex items-center gap-1">
                              <Input
                                id={`height-${volume.volume_number}`}
                                type="number"
                                step="0.1"
                                min="0.1"
                                value={volume.height_cm || ''}
                                onChange={(e) => handleDimensionChange(volume.volume_number, 'height_cm', e.target.value)}
                                placeholder="0.0"
                                className="text-center text-sm"
                              />
                              <span className="text-xs text-muted-foreground min-w-[20px]">cm</span>
                            </div>
                          </div>

                          {/* Comprimento */}
                          <div className="space-y-1">
                            <Label htmlFor={`length-${volume.volume_number}`} className="text-sm">
                              Comprimento
                            </Label>
                            <div className="flex items-center gap-1">
                              <Input
                                id={`length-${volume.volume_number}`}
                                type="number"
                                step="0.1"
                                min="0.1"
                                value={volume.length_cm || ''}
                                onChange={(e) => handleDimensionChange(volume.volume_number, 'length_cm', e.target.value)}
                                placeholder="0.0"
                                className="text-center text-sm"
                              />
                              <span className="text-xs text-muted-foreground min-w-[20px]">cm</span>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {totalWeight > 0 && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-blue-900">
                      Peso Total:
                    </span>
                    <span className="text-lg font-bold text-blue-900">
                      {totalWeight.toFixed(3)} kg
                    </span>
                  </div>
                </div>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={handleBack}>
                  Voltar
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleClose}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleSaveVolumes}
                    disabled={saving || volumes.some(vol => 
                      vol.weight_kg <= 0 || 
                      (needsDimensions && (vol.width_cm <= 0 || vol.height_cm <= 0 || vol.length_cm <= 0))
                    )}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {saving ? (
                      'Salvando...'
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Finalizar Conferência
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 'labels' && (
          <VolumeLabelPrinter
            clientName={clientName}
            totalVolumes={totalVolumes}
            onPrint={handlePrintComplete}
            onClose={handleFinalClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default VolumeWeightModal;