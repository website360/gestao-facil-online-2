import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Package, Scale, CheckCircle } from 'lucide-react';

interface VolumeWeightModalProps {
  isOpen: boolean;
  onClose: () => void;
  saleId: string | null;
  onComplete: () => void;
}

interface VolumeWeight {
  volume_number: number;
  weight_kg: number;
}

const VolumeWeightModal: React.FC<VolumeWeightModalProps> = ({
  isOpen,
  onClose,
  saleId,
  onComplete
}) => {
  const [totalVolumes, setTotalVolumes] = useState<number>(1);
  const [volumes, setVolumes] = useState<VolumeWeight[]>([]);
  const [step, setStep] = useState<'volumes' | 'weights'>('volumes');
  const [saving, setSaving] = useState(false);

  const handleVolumeCountSubmit = () => {
    if (totalVolumes < 1 || totalVolumes > 50) {
      toast.error('O número de volumes deve estar entre 1 e 50');
      return;
    }

    const initialVolumes: VolumeWeight[] = [];
    for (let i = 1; i <= totalVolumes; i++) {
      initialVolumes.push({
        volume_number: i,
        weight_kg: 0
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

  const handleSaveVolumes = async () => {
    // Validar se todos os volumes têm peso maior que 0
    const hasInvalidWeights = volumes.some(vol => vol.weight_kg <= 0);
    if (hasInvalidWeights) {
      toast.error('Todos os volumes devem ter peso maior que 0 kg');
      return;
    }

    setSaving(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não encontrado');

      // Salvar cada volume na tabela
      const volumePromises = volumes.map(volume => 
        supabase.from('sale_volumes').insert({
          sale_id: saleId!,
          volume_number: volume.volume_number,
          weight_kg: volume.weight_kg,
          created_by: user.id
        })
      );

      await Promise.all(volumePromises);

      // Calcular peso total
      const totalWeight = volumes.reduce((sum, vol) => sum + vol.weight_kg, 0);

      // Atualizar a venda com informações dos volumes e finalizar conferência
      const { error } = await supabase
        .from('sales')
        .update({
          status: 'nota_fiscal',
          conference_user_id: user.id,
          conference_completed_at: new Date().toISOString(),
          total_volumes: totalVolumes,
          total_weight_kg: totalWeight
        })
        .eq('id', saleId);

      if (error) throw error;

      toast.success('Volumes registrados com sucesso! Venda enviada para Nota Fiscal.');
      onComplete();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar volumes:', error);
      toast.error('Erro ao registrar volumes');
    } finally {
      setSaving(false);
    }
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
  };

  const handleClose = () => {
    resetModal();
    onClose();
  };

  const formatSaleId = (id: string) => {
    const timestamp = new Date().getTime();
    const sequentialNumber = (timestamp % 100000000).toString().padStart(8, '0');
    return `#V${sequentialNumber}`;
  };

  const totalWeight = volumes.reduce((sum, vol) => sum + vol.weight_kg, 0);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Registro de Volumes e Pesos
            {saleId && (
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
                  max="50"
                  value={totalVolumes}
                  onChange={(e) => setTotalVolumes(parseInt(e.target.value) || 1)}
                  placeholder="Digite o número de volumes"
                  className="text-lg text-center"
                />
                <p className="text-sm text-gray-600 mt-1">
                  Informe quantas caixas/volumes serão enviados (máximo 50)
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
                Peso de cada volume ({totalVolumes} {totalVolumes === 1 ? 'volume' : 'volumes'})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-80 overflow-y-auto">
                {volumes.map((volume) => (
                  <div key={volume.volume_number} className="space-y-2">
                    <Label htmlFor={`weight-${volume.volume_number}`}>
                      Volume {volume.volume_number}
                    </Label>
                    <div className="flex items-center gap-2">
                      <Input
                        id={`weight-${volume.volume_number}`}
                        type="number"
                        step="0.001"
                        min="0.001"
                        value={volume.weight_kg || ''}
                        onChange={(e) => handleWeightChange(volume.volume_number, e.target.value)}
                        placeholder="0.000"
                        className="text-center"
                      />
                      <span className="text-sm text-gray-600 min-w-[20px]">kg</span>
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
                    disabled={saving || volumes.some(vol => vol.weight_kg <= 0)}
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
      </DialogContent>
    </Dialog>
  );
};

export default VolumeWeightModal;