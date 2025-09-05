import { useState } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Product {
  id: string;
  name: string;
  internal_code: string;
  barcode?: string;
  price: number;
  stock: number;
  category_id?: string;
  supplier_id?: string;
  size?: string;
  composition?: string;
  color?: string;
  box?: string;
  stock_unit?: string;
  width?: number;
  length?: number;
  thickness?: number;
  diameter?: number;
  height?: number;
  weight?: number;
  weight_unit?: string;
  photo_url?: string;
  observation?: string;
  categories?: { name: string };
  suppliers?: { name: string };
}

interface ImportData {
  id?: string;
  name: string;
  internal_code: string;
  barcode?: string;
  price: number;
  stock: number;
  category_name?: string;
  category_id?: string;
  supplier_name?: string;
  supplier_id?: string;
  size?: string;
  composition?: string;
  color?: string;
  box?: string;
  stock_unit?: string;
  width?: number;
  length?: number;
  thickness?: number;
  diameter?: number;
  height?: number;
  weight?: number;
  weight_unit?: string;
  photo_url?: string;
  observation?: string;
}

interface ConflictProduct {
  existing: Product;
  imported: ImportData;
}

export const useProductExcel = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [conflicts, setConflicts] = useState<ConflictProduct[]>([]);
  const [pendingImport, setPendingImport] = useState<ImportData[]>([]);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importStatus, setImportStatus] = useState('');
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [totalImported, setTotalImported] = useState(0);

  // Helpers to parse Brazilian-formatted numbers and integers safely
  const parseNumberBR = (val: any): number => {
    if (val === undefined || val === null) return 0;
    if (typeof val === 'number') return isFinite(val) ? val : 0;
    let s = String(val).trim();
    if (!s) return 0;
    s = s.replace(/R\$\s*/i, '').replace(/\./g, '').replace(/,/g, '.');
    const n = parseFloat(s);
    return isNaN(n) ? 0 : n;
  };

  const parseIntSafe = (val: any): number => {
    if (val === undefined || val === null) return 0;
    if (typeof val === 'number') return Math.trunc(val) || 0;
    let s = String(val).trim();
    if (!s) return 0;
    s = s.replace(/\./g, '').replace(/,/g, '.');
    const n = parseFloat(s);
    return isNaN(n) ? 0 : Math.trunc(n);
  };

  const exportToExcel = async (products: Product[]) => {
    try {
      setIsProcessing(true);

      const exportData = products.map(product => ({
        'Nome': product.name,
        'Código Interno': product.internal_code,
        'Código de Barras': product.barcode || '',
        'Categoria': product.categories?.name || '',
        'Fornecedor': product.suppliers?.name || '',
        'Preço': product.price,
        'Estoque': product.stock,
        'Tipo': product.stock_unit || 'Peça',
        'Largura': product.width || '',
        'Comprimento': product.length || '',
        'Altura': product.height || '',
        'Peso': product.weight || '',
        'Tamanho': product.size || '',
        'Composição': product.composition || '',
        'Cor': product.color || '',
        'Caixa': product.box || '',
        'Observação': product.observation || ''
      }));

      // Criar planilha
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Produtos');

      const colWidths = [
        { wch: 30 }, // Nome
        { wch: 18 }, // Código Interno
        { wch: 18 }, // Código de Barras
        { wch: 18 }, // Categoria
        { wch: 18 }, // Fornecedor
        { wch: 12 }, // Preço
        { wch: 10 }, // Estoque
        { wch: 12 }, // Tipo
        { wch: 10 }, // Largura
        { wch: 12 }, // Comprimento
        { wch: 10 }, // Altura
        { wch: 10 }, // Peso
        { wch: 12 }, // Tamanho
        { wch: 18 }, // Composição
        { wch: 12 }, // Cor
        { wch: 12 }, // Caixa
        { wch: 30 }, // Observação
      ];
      worksheet['!cols'] = colWidths;

      // Salvar arquivo
      const fileName = `produtos-${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      
      toast({
        title: "Sucesso",
        description: "Planilha exportada com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast({
        title: "Erro",
        description: "Erro ao exportar planilha.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const processImportFile = async (file: File) => {
    try {
      setIsProcessing(true);
      setShowProgressModal(true);
      setImportProgress(0);
      setImportStatus('Lendo arquivo...');

      const data = await file.arrayBuffer();
      setImportProgress(20);
      setImportStatus('Processando dados...');
      
      const workbook = XLSX.read(data, { type: 'array' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

      if (jsonData.length < 2) {
        setShowProgressModal(false);
        toast({
          title: "Erro",
          description: "A planilha deve conter pelo menos uma linha de cabeçalho e uma linha de dados.",
          variant: "destructive",
        });
        return;
      }

      setImportProgress(40);
      setImportStatus('Validando produtos...');

      // Mapear colunas (assumindo que a primeira linha é o cabeçalho)
      const headers = jsonData[0] as string[];
      const rows = jsonData.slice(1) as any[][];

      const importData: ImportData[] = rows
        .filter(row => row.some(cell => cell !== undefined && cell !== ''))
        .map(row => {
          const rowData: any = {};
          headers.forEach((header, index) => {
            const value = row[index];
            const normalizedHeader = header?.toString().toLowerCase().trim();
            
            switch (normalizedHeader) {
              case 'nome':
                rowData.name = value?.toString() || '';
                break;
              case 'código interno':
              case 'codigo interno':
                rowData.internal_code = value?.toString() || '';
                break;
              case 'código de barras':
              case 'codigo de barras':
                rowData.barcode = value?.toString() || '';
                break;
              case 'categoria':
                rowData.category_name = value?.toString() || '';
                break;
              case 'fornecedor':
                rowData.supplier_name = value?.toString() || '';
                break;
              case 'preço':
              case 'preco':
                rowData.price = parseNumberBR(value);
                break;
              case 'estoque':
                rowData.stock = parseIntSafe(value);
                break;
              case 'tipo':
                rowData.stock_unit = value?.toString() || 'Peça';
                break;
              case 'largura':
                rowData.width = value !== undefined && value !== null && value !== '' ? parseNumberBR(value) : undefined;
                break;
              case 'comprimento':
                rowData.length = value !== undefined && value !== null && value !== '' ? parseNumberBR(value) : undefined;
                break;
              case 'altura':
                rowData.height = value !== undefined && value !== null && value !== '' ? parseNumberBR(value) : undefined;
                break;
              case 'peso':
                rowData.weight = value !== undefined && value !== null && value !== '' ? parseNumberBR(value) : undefined;
                break;
              case 'tamanho':
                rowData.size = value?.toString() || '';
                break;
              case 'composição':
              case 'composicao':
                rowData.composition = value?.toString() || '';
                break;
              case 'cor':
                rowData.color = value?.toString() || '';
                break;
              case 'caixa':
                rowData.box = value?.toString() || '';
                break;
              case 'observação':
              case 'observacao':
                rowData.observation = value?.toString() || '';
                break;
            }
          });

          return rowData as ImportData;
        });

      if (importData.length === 0) {
        setShowProgressModal(false);
        toast({
          title: "Erro",
          description: "Nenhum produto válido encontrado na planilha. Verifique se as colunas 'Nome' e 'Código Interno' estão preenchidas.",
          variant: "destructive",
        });
        return;
      }

      setImportProgress(60);
      setImportStatus('Verificando conflitos...');

      // Verificar conflitos com produtos existentes
      await checkConflicts(importData);

    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      setShowProgressModal(false);
      toast({
        title: "Erro",
        description: "Erro ao processar arquivo. Verifique se é um arquivo Excel válido.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const checkConflicts = async (importData: ImportData[]) => {
    try {
      const internalCodes = importData
        .map(item => (item.internal_code || '').trim())
        .filter(code => code);
      
      let existingProducts: Product[] = [] as any;
      if (internalCodes.length > 0) {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .in('internal_code', internalCodes);
        if (error) throw error;
        existingProducts = data as any;
      }

      const conflictItems: ConflictProduct[] = [];
      const newItems: ImportData[] = [];

      importData.forEach(importItem => {
        const existingProduct = existingProducts?.find(p => p.internal_code === importItem.internal_code);
        
        if (existingProduct) {
          conflictItems.push({
            existing: existingProduct,
            imported: importItem
          });
        } else {
          newItems.push(importItem);
        }
      });

      if (conflictItems.length > 0) {
        // Conflitos encontrados: seguir automaticamente com atualização dos conflitantes e inserção dos novos
        setImportProgress(80);
        setImportStatus(`Atualizando ${conflictItems.length} e importando ${newItems.length} produtos...`);
        await importProducts(newItems, conflictItems.map(c => c.imported));
      } else {
        // Não há conflitos, importar diretamente
        setImportProgress(80);
        setImportStatus('Importando produtos...');
        await importProducts(newItems, []);
      }

    } catch (error) {
      console.error('Erro ao verificar conflitos:', error);
      toast({
        title: "Erro",
        description: "Erro ao verificar produtos existentes.",
        variant: "destructive",
      });
    }
  };

  const importProducts = async (
    products: ImportData[], 
    replaceProducts: ImportData[]
  ) => {
    try {
      setIsProcessing(true);
      if (!showProgressModal) {
        setShowProgressModal(true);
        setImportProgress(0);
      }
      setImportStatus('Buscando categorias e fornecedores...');

      // Buscar categorias e fornecedores
      const [categoriesData, suppliersData] = await Promise.all([
        supabase.from('categories').select('id, name'),
        supabase.from('suppliers').select('id, name')
      ]);

      const categories = categoriesData.data || [];
      const suppliers = suppliersData.data || [];

      setImportProgress(40);
      setImportStatus('Preparando dados dos produtos...');

      const productsToInsert = products.map((product, idx) => {
        const category = categories.find(c => c.name.toLowerCase() === (product.category_name || '').toLowerCase());
        const supplier = suppliers.find(s => s.name.toLowerCase() === (product.supplier_name || '').toLowerCase());

        const code = (product.internal_code || '').trim() || `AUTO-${Date.now()}-${idx}`;
        const name = (product.name || '').trim() || code || `Produto ${idx + 1}`;

        return {
          name,
          internal_code: code,
          barcode: product.barcode || null,
          price: Math.max(0, product.price || 0),
          stock: Math.max(0, product.stock || 0),
          stock_unit: product.stock_unit || 'Peça',
          category_id: category?.id || null,
          supplier_id: supplier?.id || null,
          size: product.size || null,
          composition: product.composition || null,
          color: product.color || null,
          box: product.box || null,
          width: product.width || null,
          length: product.length || null,
          height: product.height || null,
          weight: product.weight || null,
          observation: product.observation || null
        };
      });

      // Inserir novos produtos
      if (productsToInsert.length > 0) {
        setImportProgress(60);
        setImportStatus(`Inserindo ${productsToInsert.length} novos produtos...`);
        
        const { error: insertError } = await supabase
          .from('products')
          .insert(productsToInsert);

        if (insertError) throw insertError;
      }

      // Atualizar produtos existentes (replace)
      if (replaceProducts.length > 0) {
        setImportProgress(80);
        setImportStatus(`Atualizando ${replaceProducts.length} produtos existentes...`);
        
        for (const product of replaceProducts) {
          const category = categories.find(c => c.name.toLowerCase() === product.category_name?.toLowerCase());
          const supplier = suppliers.find(s => s.name.toLowerCase() === product.supplier_name?.toLowerCase());

          const { error: updateError } = await supabase
            .from('products')
            .update({
              name: product.name,
              barcode: product.barcode || null,
              price: product.price,
              stock: product.stock,
              stock_unit: product.stock_unit || 'Peça',
              category_id: categories.find(c => c.name.toLowerCase() === (product.category_name || '').toLowerCase())?.id || null,
              supplier_id: suppliers.find(s => s.name.toLowerCase() === (product.supplier_name || '').toLowerCase())?.id || null,
              size: product.size || null,
              composition: product.composition || null,
              color: product.color || null,
              box: product.box || null,
              width: product.width || null,
              length: product.length || null,
              height: product.height || null,
              weight: product.weight || null,
              observation: product.observation || null
            })
            .eq('internal_code', product.internal_code);

          if (updateError) throw updateError;
        }
      }

      const totalImported = productsToInsert.length + replaceProducts.length;
      
      setImportProgress(100);
      setImportStatus('Finalizando...');
      
      // Aguardar um pouco para mostrar 100%
      setTimeout(() => {
        setShowProgressModal(false);
        setTotalImported(totalImported);
        setShowSuccessModal(true);
      }, 500);

      // Reset state
      setConflicts([]);
      setPendingImport([]);
      setShowConflictDialog(false);

      return true;
    } catch (error) {
      console.error('Erro ao importar produtos:', error);
      setShowProgressModal(false);
      toast({
        title: "Erro",
        description: "Erro ao importar produtos.",
        variant: "destructive",
      });
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadTemplate = () => {
    const templateData = [{
      'Nome': 'Exemplo Produto',
      'Código Interno': 'PROD001',
      'Código de Barras': '1234567890123',
      'Categoria': 'Tecido',
      'Fornecedor': 'Fornecedor 001',
      'Preço': 10.50,
      'Estoque': 100,
      'Tipo': 'Unidade',
      'Largura': 1.5,
      'Comprimento': 2.0,
      'Altura': 0.3,
      'Peso': 0.8,
      'Tamanho': 'M',
      'Composição': '100% Algodão',
      'Cor': 'Azul',
      'Caixa': 'CX001',
      'Observação': 'Produto de exemplo'
    }];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Modelo');

    XLSX.writeFile(workbook, 'modelo-importacao-produtos.xlsx');
    
    toast({
      title: "Sucesso",
      description: "Modelo de planilha baixado com sucesso!",
    });
  };

  const handleSuccessModalClose = () => {
    setShowSuccessModal(false);
    // Recarregar a página para mostrar os produtos importados
    window.location.reload();
  };

  return {
    isProcessing,
    conflicts,
    pendingImport,
    showConflictDialog,
    setShowConflictDialog,
    exportToExcel,
    processImportFile,
    importProducts,
    downloadTemplate,
    importProgress,
    importStatus,
    showProgressModal,
    showSuccessModal,
    totalImported,
    handleSuccessModalClose
  };
};