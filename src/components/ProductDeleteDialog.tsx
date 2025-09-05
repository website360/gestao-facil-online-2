
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface Product {
  id: string;
  name: string;
  internal_code: string;
  price: number;
  stock: number;
  stock_unit?: string;
  category_id?: string;
  categories?: { name: string };
  created_at: string;
}

interface ProductDeleteDialogProps {
  productToDelete: Product | null;
  onClose: () => void;
  onConfirm: () => void;
}

const ProductDeleteDialog = ({ productToDelete, onClose, onConfirm }: ProductDeleteDialogProps) => {
  if (!productToDelete) return null;

  return (
    <Dialog open={!!productToDelete} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar Exclusão</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir o produto "{productToDelete.name}"?
            Esta ação não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm}>
            Excluir
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDeleteDialog;
