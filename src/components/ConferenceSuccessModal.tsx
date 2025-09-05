
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CheckCircle, Trophy, Star, Sparkles } from 'lucide-react';

interface ConferenceSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemsCount: number;
}

const ConferenceSuccessModal = ({ isOpen, onClose, itemsCount }: ConferenceSuccessModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md bg-gradient-to-br from-green-50 via-emerald-50 to-green-100 border-green-200 shadow-2xl">
        <DialogHeader className="text-center pb-6">
          <div className="mx-auto mb-4 relative">
            <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center shadow-lg">
              <CheckCircle className="h-10 w-10 text-white" />
            </div>
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center shadow-lg">
              <Trophy className="h-4 w-4 text-white" />
            </div>
            <div className="absolute -bottom-1 -left-1 w-6 h-6 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full flex items-center justify-center shadow-lg">
              <Star className="h-3 w-3 text-white" />
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
              Conferência Realizada com Sucesso! 🎉
            </h3>
            <p className="text-gray-600 leading-relaxed">
              Todos os <span className="font-bold text-green-600">{itemsCount} itens</span> foram conferidos corretamente.
              A venda foi automaticamente movida para o status <span className="font-semibold text-orange-600">"Nota Fiscal"</span>.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-green-200/50">
              <div className="text-2xl font-bold text-green-600">{itemsCount}</div>
              <div className="text-xs text-gray-600 font-medium">Itens</div>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-green-200/50">
              <div className="text-2xl font-bold text-green-600">100%</div>
              <div className="text-xs text-gray-600 font-medium">Precisão</div>
            </div>
            <div className="bg-white/60 backdrop-blur-sm rounded-xl p-3 border border-green-200/50">
              <div className="text-2xl font-bold text-green-600">✓</div>
              <div className="text-xs text-gray-600 font-medium">Completo</div>
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

export default ConferenceSuccessModal;
