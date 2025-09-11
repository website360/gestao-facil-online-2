
import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Plus, Download, Upload, TrendingUp, FileSpreadsheet } from 'lucide-react';

interface ProductManagementHeaderProps {
  onNewProduct: () => void;
  onExportExcel: () => void;
  onImportExcel: (file: File) => void;
  onBulkStockEntry: () => void;
  onBulkStockImport: () => void;
  userRole?: string;
}

const ProductManagementHeader = ({ onNewProduct, onExportExcel, onImportExcel, onBulkStockEntry, onBulkStockImport, userRole }: ProductManagementHeaderProps) => {
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

  // Verificar se usuário pode fazer entrada de estoque (admin ou gerente)
  const canManageStock = userRole === 'admin' || userRole === 'gerente';

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl md:text-2xl font-bold text-gray-900">Gerenciamento de Produtos</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:justify-end gap-2 overflow-hidden">
        {(userRole === 'admin' || userRole === 'gerente') && (
          <>
            <Button onClick={onExportExcel} variant="outline" className="flex items-center gap-2 flex-shrink-0">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Exportar Excel</span>
              <span className="sm:hidden">Exportar</span>
            </Button>
            <Button onClick={handleImportClick} variant="outline" className="flex items-center gap-2 flex-shrink-0">
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Importar Excel</span>
              <span className="sm:hidden">Importar</span>
            </Button>
          </>
        )}
        {canManageStock && (
          <>
            <Button 
              onClick={onBulkStockEntry} 
              variant="outline" 
              className="flex items-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 border-green-200 flex-shrink-0"
            >
              <TrendingUp className="h-4 w-4" />
              <span className="hidden lg:inline">Entrada/Saída Manual</span>
              <span className="lg:hidden">Entrada/Saída</span>
            </Button>
            <Button 
              onClick={onBulkStockImport} 
              variant="outline" 
              className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 flex-shrink-0"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span className="hidden lg:inline">Importar por Planilha</span>
              <span className="lg:hidden">Importar Stock</span>
            </Button>
          </>
        )}
        {(userRole === 'admin' || userRole === 'gerente') && (
          <Button onClick={onNewProduct} className="btn-gradient flex-shrink-0 col-span-2 sm:col-span-1">
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Novo Produto</span>
            <span className="sm:hidden">Novo</span>
          </Button>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};

export default ProductManagementHeader;
