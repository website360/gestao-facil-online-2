
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, Package, ArrowRight, Sparkles } from 'lucide-react';

interface SeparationSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientName: string;
  saleId: string;
}

const SeparationSuccessModal = ({ isOpen, onClose, clientName, saleId }: SeparationSuccessModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 border-green-200 shadow-2xl">
        <DialogHeader className="text-center pb-6">
          <div className="mx-auto mb-4 relative">
            <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
              <Package className="h-10 w-10 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
              <CheckCircle className="h-4 w-4 text-white" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-green-700 to-emerald-700 bg-clip-text text-transparent flex items-center justify-center gap-2">
            <Sparkles className="h-6 w-6 text-green-600" />
            Parabéns!
            <Sparkles className="h-6 w-6 text-green-600" />
          </DialogTitle>
        </DialogHeader>

        <div className="text-center space-y-4 pb-6">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-green-200/50">
            <h3 className="text-xl font-semibold text-gray-800 mb-3">
              Separação Concluída com Sucesso! 🎉
            </h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              A separação dos produtos para o cliente <span className="font-bold text-green-600">{clientName}</span> foi finalizada.
            </p>
            <div className="flex items-center justify-center gap-2 text-sm text-gray-600 bg-blue-50 rounded-lg p-3 border border-blue-200">
              <Package className="h-4 w-4 text-blue-600" />
              <span>Venda {saleId}</span>
              <ArrowRight className="h-4 w-4 text-gray-400" />
              <span className="font-semibold text-orange-600">Enviada para Conferência</span>
            </div>
          </div>
        </div>

        <div className="flex justify-center">
          <Button
            onClick={onClose}
            className="h-12 px-8 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl shadow-lg transition-all transform hover:scale-105"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Continuar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SeparationSuccessModal;
