
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface Category {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

interface CategoryDeleteDialogProps {
  categoryToDelete: Category | null;
  onClose: () => void;
  onConfirm: () => void;
}

const CategoryDeleteDialog = ({ categoryToDelete, onClose, onConfirm }: CategoryDeleteDialogProps) => {
  if (!categoryToDelete) return null;

  return (
    <Dialog open={!!categoryToDelete} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar Exclusão</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir a categoria "{categoryToDelete.name}"?
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

export default CategoryDeleteDialog;
