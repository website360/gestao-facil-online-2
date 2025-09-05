import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ConflictProduct {
  existing: any;
  imported: any;
}

interface ProductImportConflictDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conflicts: ConflictProduct[];
  onResolve: (replaceProducts: any[], ignoreProducts: any[]) => void;
  isProcessing: boolean;
}

const ProductImportConflictDialog = ({
  open,
  onOpenChange,
  conflicts,
  onResolve,
  isProcessing
}: ProductImportConflictDialogProps) => {
  const [selections, setSelections] = useState<Record<string, 'replace' | 'ignore'>>({});

  const handleSelectionChange = (productCode: string, action: 'replace' | 'ignore') => {
    setSelections(prev => ({
      ...prev,
      [productCode]: action
    }));
  };

  const handleSelectAll = (action: 'replace' | 'ignore') => {
    const newSelections: Record<string, 'replace' | 'ignore'> = {};
    conflicts.forEach(conflict => {
      newSelections[conflict.imported.internal_code] = action;
    });
    setSelections(newSelections);
  };

  const handleResolve = () => {
    const replaceProducts: any[] = [];
    const ignoreProducts: any[] = [];

    conflicts.forEach(conflict => {
      const selection = selections[conflict.imported.internal_code];
      if (selection === 'replace') {
        replaceProducts.push(conflict.imported);
      } else if (selection === 'ignore') {
        ignoreProducts.push(conflict.imported);
      }
    });

    onResolve(replaceProducts, ignoreProducts);
  };

  const selectedCount = Object.keys(selections).length;
  const replaceCount = Object.values(selections).filter(s => s === 'replace').length;
  const ignoreCount = Object.values(selections).filter(s => s === 'ignore').length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Conflitos de Importação</DialogTitle>
          <DialogDescription>
            Foram encontrados {conflicts.length} produto(s) com códigos internos que já existem no sistema.
            Escolha o que fazer com cada produto:
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSelectAll('replace')}
            >
              Substituir Todos
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSelectAll('ignore')}
            >
              Ignorar Todos
            </Button>
          </div>

          <ScrollArea className="h-[400px] w-full border rounded-md p-4">
            <div className="space-y-4">
              {conflicts.map((conflict, index) => (
                <div key={conflict.imported.internal_code} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium">
                        {conflict.imported.name}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Código: {conflict.imported.internal_code}
                      </p>
                    </div>
                    <Badge variant="destructive">Conflito</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium text-muted-foreground">Produto Existente:</h5>
                      <div className="text-sm space-y-1">
                        <p><strong>Nome:</strong> {conflict.existing.name}</p>
                        <p><strong>Preço:</strong> R$ {conflict.existing.price}</p>
                        <p><strong>Estoque:</strong> {conflict.existing.stock}</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h5 className="text-sm font-medium text-muted-foreground">Produto a Importar:</h5>
                      <div className="text-sm space-y-1">
                        <p><strong>Nome:</strong> {conflict.imported.name}</p>
                        <p><strong>Preço:</strong> R$ {conflict.imported.price}</p>
                        <p><strong>Estoque:</strong> {conflict.imported.stock}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`replace-${index}`}
                        checked={selections[conflict.imported.internal_code] === 'replace'}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            handleSelectionChange(conflict.imported.internal_code, 'replace');
                          }
                        }}
                      />
                      <label htmlFor={`replace-${index}`} className="text-sm font-medium">
                        Substituir produto existente
                      </label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id={`ignore-${index}`}
                        checked={selections[conflict.imported.internal_code] === 'ignore'}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            handleSelectionChange(conflict.imported.internal_code, 'ignore');
                          }
                        }}
                      />
                      <label htmlFor={`ignore-${index}`} className="text-sm font-medium">
                        Ignorar produto
                      </label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Selecionados: {selectedCount} / {conflicts.length} | 
              Substituir: {replaceCount} | 
              Ignorar: {ignoreCount}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isProcessing}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleResolve}
                disabled={selectedCount !== conflicts.length || isProcessing}
              >
                {isProcessing ? 'Processando...' : 'Confirmar Importação'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProductImportConflictDialog;