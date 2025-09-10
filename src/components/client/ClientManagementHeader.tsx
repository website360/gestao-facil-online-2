
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Download, Upload } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ClientManagementHeaderProps {
  onNewClient: () => void;
  onExportExcel: () => void;
  onImportExcel: (file: File) => void;
}

export const ClientManagementHeader = ({ onNewClient, onExportExcel, onImportExcel }: ClientManagementHeaderProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImportExcel(file);
      // Reset input para permitir selecionar o mesmo arquivo novamente
      event.target.value = '';
    }
  };

  return (
    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
      <h1 className="text-xl md:text-2xl font-bold text-gray-900">Gerenciamento de Clientes</h1>
      <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={onExportExcel} variant="outline" className="flex items-center gap-2 w-full sm:w-auto">
            <Download className="h-4 w-4" />
            Exportar Excel
          </Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={handleImportClick} variant="outline" className="flex items-center gap-2 w-full sm:w-auto">
                  <Upload className="h-4 w-4" />
                  Importar Excel
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-sm">
                <p className="text-sm">
                  <strong>Novo:</strong> A planilha agora inclui a coluna "Vendedor Responsável".<br />
                  Você pode informar o nome ou email do vendedor para atribuir clientes automaticamente.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Button onClick={onNewClient} className="btn-gradient w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Novo Cliente
        </Button>
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />
    </div>
  );
};
