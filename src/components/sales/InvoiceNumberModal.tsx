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
import { FileText } from 'lucide-react';

interface InvoiceNumberModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (invoiceNumber: string) => void;
  loading?: boolean;
}

const InvoiceNumberModal = ({ open, onClose, onConfirm, loading = false }: InvoiceNumberModalProps) => {
  const [invoiceNumber, setInvoiceNumber] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (invoiceNumber.trim()) {
      onConfirm(invoiceNumber.trim());
      setInvoiceNumber('');
    }
  };

  const handleClose = () => {
    if (!loading) {
      setInvoiceNumber('');
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Gerar Nota Fiscal
          </DialogTitle>
          <DialogDescription>
            Informe o número da nota fiscal para finalizar a venda.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invoice-number">Número da Nota Fiscal *</Label>
            <Input
              id="invoice-number"
              placeholder="Ex: 123456"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              disabled={loading}
              required
              autoFocus
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !invoiceNumber.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  Processando...
                </div>
              ) : (
                <div className="flex items-center">
                  <FileText className="mr-2 h-4 w-4" />
                  Confirmar Nota Fiscal
                </div>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default InvoiceNumberModal;