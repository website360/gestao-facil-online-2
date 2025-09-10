
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
    <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
      <h1 className="text-xl md:text-2xl font-bold text-gray-900">Gerenciamento de Produtos</h1>
      <div className="flex flex-wrap gap-2 md:items-center">
        {(userRole === 'admin' || userRole === 'gerente') && (
          <>
            <Button onClick={onExportExcel} variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Exportar Excel</span>
              <span className="sm:hidden">Exportar</span>
            </Button>
            <Button onClick={handleImportClick} variant="outline" className="flex items-center gap-2">
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
              className="flex items-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
            >
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Entrada/Saída Manual</span>
              <span className="sm:hidden">Entrada/Saída</span>
            </Button>
            <Button 
              onClick={onBulkStockImport} 
              variant="outline" 
              className="flex items-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span className="hidden sm:inline">Importar por Planilha</span>
              <span className="sm:hidden">Importar Stock</span>
            </Button>
          </>
        )}
        {userRole === 'admin' || userRole === 'gerente' ? (
          <Button onClick={onNewProduct} className="btn-gradient">
            <Plus className="h-4 w-4 mr-2" />
            Novo Produto
          </Button>
        ) : null}
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
