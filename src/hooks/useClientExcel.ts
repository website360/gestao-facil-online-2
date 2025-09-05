import { useState } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Client {
  id: string;
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
  system_password?: string;
  assigned_user_id?: string;
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
  system_password?: string;
  assigned_user_id?: string;
}

interface ConflictClient {
  existing: Client;
  imported: ImportData;
}

export const useClientExcel = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [conflicts, setConflicts] = useState<ConflictClient[]>([]);
  const [pendingImport, setPendingImport] = useState<ImportData[]>([]);
  const [showConflictDialog, setShowConflictDialog] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importStatus, setImportStatus] = useState('');
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [totalImported, setTotalImported] = useState(0);

  const exportToExcel = async (clients: Client[]) => {
    try {
      setIsProcessing(true);

      // Preparar dados para exportação
      const exportData = clients.map(client => ({
        'Nome': client.name,
        'Email': client.email,
        'Telefone': client.phone,
        'Tipo': client.client_type === 'juridica' ? 'Jurídica' : 'Física',
        'CPF': client.cpf || '',
        'CNPJ': client.cnpj || '',
        'Razão Social': client.razao_social || '',
        'Data de Nascimento': client.birth_date || '',
        'CEP': client.cep || '',
        'Rua': client.street || '',
        'Número': client.number || '',
        'Complemento': client.complement || '',
        'Bairro': client.neighborhood || '',
        'Cidade': client.city || '',
        'Estado': client.state || '',
        'Acesso Sistema': client.allow_system_access ? 'Sim' : 'Não'
      }));

      // Criar planilha
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Clientes');

      // Ajustar largura das colunas
      const colWidths = [
        { wch: 30 }, // Nome
        { wch: 30 }, // Email
        { wch: 15 }, // Telefone
        { wch: 10 }, // Tipo
        { wch: 15 }, // CPF
        { wch: 18 }, // CNPJ
        { wch: 30 }, // Razão Social
        { wch: 12 }, // Data de Nascimento
        { wch: 10 }, // CEP
        { wch: 25 }, // Rua
        { wch: 8 },  // Número
        { wch: 20 }, // Complemento
        { wch: 20 }, // Bairro
        { wch: 20 }, // Cidade
        { wch: 5 },  // Estado
        { wch: 15 }  // Acesso Sistema
      ];
      worksheet['!cols'] = colWidths;

      // Gerar arquivo
      const fileName = `clientes_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      toast({
        title: "Exportação concluída",
        description: `${clients.length} clientes exportados com sucesso.`,
      });

    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast({
        title: "Erro na exportação",
        description: "Ocorreu um erro ao exportar os clientes.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const processImportFile = async (file: File) => {
    try {
      setIsProcessing(true);
      setImportStatus('Lendo arquivo...');
      setImportProgress(10);

      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      setImportStatus('Processando dados...');
      setImportProgress(30);

      // Mapear dados do Excel para estrutura do banco
      const importData: ImportData[] = jsonData.map((row: any) => ({
        name: row['Nome'] || row['nome'] || '',
        email: row['Email'] || row['email'] || '',
        phone: row['Telefone'] || row['telefone'] || '',
        client_type: (row['Tipo'] || row['tipo'] || '').toLowerCase() === 'jurídica' ? 'juridica' : 'fisica',
        cpf: row['CPF'] || row['cpf'] || '',
        cnpj: row['CNPJ'] || row['cnpj'] || '',
        razao_social: row['Razão Social'] || row['razao_social'] || '',
        birth_date: row['Data de Nascimento'] || row['data_nascimento'] || '',
        cep: row['CEP'] || row['cep'] || '',
        street: row['Rua'] || row['endereco'] || row['rua'] || '',
        number: row['Número'] || row['numero'] || '',
        complement: row['Complemento'] || row['complemento'] || '',
        neighborhood: row['Bairro'] || row['bairro'] || '',
        city: row['Cidade'] || row['cidade'] || '',
        state: row['Estado'] || row['estado'] || row['uf'] || '',
        allow_system_access: (row['Acesso Sistema'] || row['acesso_sistema'] || '').toLowerCase() === 'sim'
      }));

      // Validar dados obrigatórios
      const validData = importData.filter(item => item.name && item.email && item.phone);
      
      if (validData.length === 0) {
        throw new Error('Nenhum dado válido encontrado no arquivo');
      }

      setImportStatus('Verificando conflitos...');
      setImportProgress(50);

      // Verificar conflitos (email duplicado)
      const { data: existingClients } = await supabase
        .from('clients')
        .select('*')
        .in('email', validData.map(item => item.email));

      const conflicts: ConflictClient[] = [];
      const nonConflictData: ImportData[] = [];

      validData.forEach(item => {
        const existing = existingClients?.find(client => client.email === item.email);
        if (existing) {
          conflicts.push({ existing, imported: item });
        } else {
          nonConflictData.push(item);
        }
      });

      if (conflicts.length > 0) {
        setConflicts(conflicts);
        setPendingImport(nonConflictData);
        setShowConflictDialog(true);
        setImportProgress(100);
      } else {
        await importClients(validData);
      }

    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      toast({
        title: "Erro no processamento",
        description: "Ocorreu um erro ao processar o arquivo.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const importClients = async (clientsData: ImportData[]) => {
    try {
      setIsProcessing(true);
      setShowProgressModal(true);
      setImportProgress(0);
      
      const total = clientsData.length;
      let imported = 0;

      for (let i = 0; i < clientsData.length; i++) {
        const client = clientsData[i];
        setImportStatus(`Importando cliente ${i + 1} de ${total}: ${client.name}`);
        
        const { error } = await supabase
          .from('clients')
          .insert([{
            name: client.name,
            email: client.email,
            phone: client.phone,
            client_type: client.client_type,
            cpf: client.cpf || null,
            cnpj: client.cnpj || null,
            razao_social: client.razao_social || null,
            birth_date: client.birth_date || null,
            cep: client.cep || null,
            street: client.street || null,
            number: client.number || null,
            complement: client.complement || null,
            neighborhood: client.neighborhood || null,
            city: client.city || null,
            state: client.state || null,
            allow_system_access: client.allow_system_access || false,
            system_password: client.system_password || null,
            assigned_user_id: client.assigned_user_id || null
          }]);

        if (!error) {
          imported++;
        }

        setImportProgress(Math.round(((i + 1) / total) * 100));
      }

      setTotalImported(imported);
      setShowProgressModal(false);
      setShowSuccessModal(true);

      toast({
        title: "Importação concluída",
        description: `${imported} clientes importados com sucesso.`,
      });

    } catch (error) {
      console.error('Erro na importação:', error);
      toast({
        title: "Erro na importação",
        description: "Ocorreu um erro durante a importação.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const resolveConflicts = async (resolutions: { [key: string]: 'skip' | 'update' }) => {
    try {
      const toUpdate: ImportData[] = [];
      
      conflicts.forEach((conflict, index) => {
        if (resolutions[index] === 'update') {
          toUpdate.push(conflict.imported);
        }
      });

      // Atualizar clientes com conflito
      for (const client of toUpdate) {
        const existing = conflicts.find(c => c.imported.email === client.email)?.existing;
        if (existing) {
          await supabase
            .from('clients')
            .update({
              name: client.name,
              phone: client.phone,
              client_type: client.client_type,
              cpf: client.cpf || null,
              cnpj: client.cnpj || null,
              razao_social: client.razao_social || null,
              birth_date: client.birth_date || null,
              cep: client.cep || null,
              street: client.street || null,
              number: client.number || null,
              complement: client.complement || null,
              neighborhood: client.neighborhood || null,
              city: client.city || null,
              state: client.state || null,
              allow_system_access: client.allow_system_access || false,
              system_password: client.system_password || null,
              assigned_user_id: client.assigned_user_id || null
            })
            .eq('id', existing.id);
        }
      }

      // Importar clientes sem conflito
      if (pendingImport.length > 0) {
        await importClients(pendingImport);
      }

      setShowConflictDialog(false);
      setConflicts([]);
      setPendingImport([]);

    } catch (error) {
      console.error('Erro ao resolver conflitos:', error);
      toast({
        title: "Erro",
        description: "Erro ao resolver conflitos.",
        variant: "destructive",
      });
    }
  };

  return {
    isProcessing,
    conflicts,
    pendingImport,
    showConflictDialog,
    setShowConflictDialog,
    importProgress,
    importStatus,
    showProgressModal,
    setShowProgressModal,
    showSuccessModal,
    setShowSuccessModal,
    totalImported,
    exportToExcel,
    processImportFile,
    importClients,
    resolveConflicts,
  };
};