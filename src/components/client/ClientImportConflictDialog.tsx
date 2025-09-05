import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle } from 'lucide-react';

interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  client_type: string;
  cpf?: string;
  cnpj?: string;
}

interface ImportData {
  name: string;
  email: string;
  phone: string;
  client_type: string;
  cpf?: string;
  cnpj?: string;
  razao_social?: string;
  birth_date?: string;
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  allow_system_access?: boolean;
}

interface ConflictClient {
  existing: Client;
  imported: ImportData;
}

interface ClientImportConflictDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conflicts: ConflictClient[];
  onResolve: (resolutions: { [key: string]: 'skip' | 'update' }) => void;
  isProcessing: boolean;
}

const ClientImportConflictDialog: React.FC<ClientImportConflictDialogProps> = ({
  open,
  onOpenChange,
  conflicts,
  onResolve,
  isProcessing
}) => {
  const [selections, setSelections] = useState<{ [key: string]: 'skip' | 'update' }>({});

  const handleSelectionChange = (index: number, value: 'skip' | 'update') => {
    setSelections(prev => ({
      ...prev,
      [index]: value
    }));
  };

  const handleResolve = () => {
    onResolve(selections);
  };

  const handleSelectAll = (action: 'skip' | 'update') => {
    const newSelections: { [key: string]: 'skip' | 'update' } = {};
    conflicts.forEach((_, index) => {
      newSelections[index] = action;
    });
    setSelections(newSelections);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            <DialogTitle>Conflitos de Importação Detectados</DialogTitle>
          </div>
          <DialogDescription>
            Foram encontrados {conflicts.length} clientes com emails que já existem no sistema.
            Escolha como deseja proceder com cada conflito.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSelectAll('skip')}
            >
              Pular Todos
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSelectAll('update')}
            >
              Atualizar Todos
            </Button>
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {conflicts.map((conflict, index) => (
              <div key={index} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-medium text-lg">
                    Conflito #{index + 1}: {conflict.imported.email}
                  </h4>
                  <div className="flex gap-2">
                    <label className="flex items-center gap-2">
                      <Checkbox
                        checked={selections[index] === 'skip'}
                        onCheckedChange={() => handleSelectionChange(index, 'skip')}
                      />
                      Pular
                    </label>
                    <label className="flex items-center gap-2">
                      <Checkbox
                        checked={selections[index] === 'update'}
                        onCheckedChange={() => handleSelectionChange(index, 'update')}
                      />
                      Atualizar
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h5 className="font-medium text-sm text-gray-600">Cliente Existente</h5>
                    <div className="bg-red-50 p-3 rounded border">
                      <div className="space-y-1 text-sm">
                        <div><strong>Nome:</strong> {conflict.existing.name}</div>
                        <div><strong>Email:</strong> {conflict.existing.email}</div>
                        <div><strong>Telefone:</strong> {conflict.existing.phone}</div>
                        <div>
                          <strong>Tipo:</strong>{' '}
                          <Badge variant={conflict.existing.client_type === 'juridica' ? 'default' : 'secondary'}>
                            {conflict.existing.client_type === 'juridica' ? 'Jurídica' : 'Física'}
                          </Badge>
                        </div>
                        <div>
                          <strong>Documento:</strong> {conflict.existing.client_type === 'juridica' ? conflict.existing.cnpj : conflict.existing.cpf}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h5 className="font-medium text-sm text-gray-600">Cliente do Arquivo</h5>
                    <div className="bg-green-50 p-3 rounded border">
                      <div className="space-y-1 text-sm">
                        <div><strong>Nome:</strong> {conflict.imported.name}</div>
                        <div><strong>Email:</strong> {conflict.imported.email}</div>
                        <div><strong>Telefone:</strong> {conflict.imported.phone}</div>
                        <div>
                          <strong>Tipo:</strong>{' '}
                          <Badge variant={conflict.imported.client_type === 'juridica' ? 'default' : 'secondary'}>
                            {conflict.imported.client_type === 'juridica' ? 'Jurídica' : 'Física'}
                          </Badge>
                        </div>
                        <div>
                          <strong>Documento:</strong> {conflict.imported.client_type === 'juridica' ? conflict.imported.cnpj : conflict.imported.cpf}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleResolve} disabled={isProcessing}>
            {isProcessing ? 'Processando...' : 'Resolver Conflitos'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ClientImportConflictDialog;