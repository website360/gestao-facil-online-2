import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Weight } from 'lucide-react';
import { formatNumber } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VolumeViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  saleId: string;
}

interface VolumeWeight {
  id: string;
  volume_number: number;
  weight_kg: number;
}

const VolumeViewModal = ({ isOpen, onClose, saleId }: VolumeViewModalProps) => {
  const [volumes, setVolumes] = useState<VolumeWeight[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchVolumes = async () => {
    if (!saleId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('sale_volumes')
        .select('id, volume_number, weight_kg')
        .eq('sale_id', saleId)
        .order('volume_number');

      if (error) throw error;
      setVolumes(data || []);
    } catch (error) {
      console.error('Erro ao buscar volumes:', error);
      toast.error('Erro ao carregar os volumes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && saleId) {
      fetchVolumes();
    }
  }, [isOpen, saleId]);

  const totalWeight = volumes.reduce((sum, volume) => sum + Number(volume.weight_kg), 0);

  const handleClose = () => {
    setVolumes([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md mx-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            Volumes e Pesos da Venda
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Carregando volumes...</p>
            </div>
          ) : volumes.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Nenhum volume encontrado</p>
            </div>
          ) : (
            <>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-900">Total de Volumes:</span>
                  </div>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {volumes.length}
                  </Badge>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2">
                    <Weight className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-900">Peso Total:</span>
                  </div>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                    {formatNumber(totalWeight, 2)} kg
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium text-gray-900">Detalhamento por Volume:</h4>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {volumes.map((volume) => (
                    <div key={volume.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium text-blue-600">
                            {volume.volume_number}
                          </span>
                        </div>
                        <span className="text-sm text-gray-600">Volume {volume.volume_number}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Weight className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-900">
                          {formatNumber(Number(volume.weight_kg), 2)} kg
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={handleClose}>
              Fechar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VolumeViewModal;