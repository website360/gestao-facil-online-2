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
      setShowProgressModal(true);
      setImportStatus('Lendo arquivo...');
      setImportProgress(10);

      console.log('Iniciando processamento do arquivo:', file.name, 'Tamanho:', file.size);

      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      console.log('Arquivo lido. Total de linhas encontradas:', jsonData.length);
      
      setImportStatus(`Processando ${jsonData.length} linhas...`);
      setImportProgress(30);

      // Mapear dados do Excel para estrutura do banco
      const importData: ImportData[] = jsonData.map((row: any, index: number) => {
        const name = row['Nome'] || row['nome'] || '';
        let email = row['Email'] || row['email'] || '';
        
        // Se não tem email, gerar um email temporário baseado no nome ou índice
        if (!email || email.trim() === '') {
          const sanitizedName = name ? name.toLowerCase().replace(/[^a-z0-9]/g, '') : '';
          email = sanitizedName ? `${sanitizedName}@temp.local` : `cliente${index + 1}@temp.local`;
        }
        
        // Se não tem telefone, gerar um temporário
        let phone = row['Telefone'] || row['telefone'] || '';
        if (!phone || phone.trim() === '') {
          phone = `(00) 0000-0000`;
        }
        
        return {
          name: name,
          email: email,
          phone: phone,
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
        };
      });

      // Validar dados obrigatórios - apenas nome é obrigatório (email já foi gerado)
      const validData = importData.filter(item => item.name && item.name.trim());
      
      if (validData.length === 0) {
        throw new Error('Nenhum dado válido encontrado no arquivo. O campo Nome deve estar preenchido.');
      }

      console.log(`Total de linhas processadas: ${importData.length}`);
      console.log(`Linhas válidas: ${validData.length}`);

      setImportStatus('Verificando conflitos...');
      setImportProgress(50);

      // Verificar conflitos em lotes menores para melhor performance
      const emailsToCheck = validData.filter(item => item.email && item.email.trim()).map(item => item.email);
      let existingClients: any[] = [];
      
      // Processar verificação de conflitos em lotes de 500 emails
      const emailBatchSize = 500;
      for (let i = 0; i < emailsToCheck.length; i += emailBatchSize) {
        const emailBatch = emailsToCheck.slice(i, i + emailBatchSize);
        console.log(`Verificando conflitos - lote ${Math.floor(i/emailBatchSize) + 1}/${Math.ceil(emailsToCheck.length/emailBatchSize)}`);
        
        const { data: batchClients, error } = await supabase
          .from('clients')
          .select('*')
          .in('email', emailBatch);
          
        if (error) {
          console.error('Erro ao verificar conflitos:', error);
          throw error;
        }
        
        if (batchClients) {
          existingClients = [...existingClients, ...batchClients];
        }
      }

      const conflicts: ConflictClient[] = [];
      const nonConflictData: ImportData[] = [];

      validData.forEach(item => {
        // Só verifica conflito se o item tem email
        if (item.email && item.email.trim()) {
          const existing = existingClients?.find(client => client.email === item.email);
          if (existing) {
            conflicts.push({ existing, imported: item });
          } else {
            nonConflictData.push(item);
          }
        } else {
          // Se não tem email, adiciona diretamente aos não conflitantes
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
      setShowProgressModal(false);
      toast({
        title: "Erro no processamento",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao processar o arquivo.",
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
      const batchSize = 50; // Reduzir para lotes de 50 para melhor performance com grandes volumes
      
      console.log(`Iniciando importação de ${total} clientes em lotes de ${batchSize}`);

      // Processar em lotes para melhor performance
      for (let i = 0; i < clientsData.length; i += batchSize) {
        const batch = clientsData.slice(i, i + batchSize);
        const batchNumber = Math.floor(i / batchSize) + 1;
        const totalBatches = Math.ceil(clientsData.length / batchSize);
        
        setImportStatus(`Processando lote ${batchNumber} de ${totalBatches} (${batch.length} clientes)`);
        
        // Preparar dados do lote, tratando campos vazios e convertendo para string
        const batchData = batch.map(client => ({
          name: client.name ? String(client.name).trim() : null,
          email: client.email ? String(client.email).trim() : `temp${Date.now()}@temp.local`,
          phone: client.phone ? String(client.phone).trim() : '(00) 0000-0000',
          client_type: client.client_type || 'fisica',
          cpf: client.cpf ? String(client.cpf).trim() : null,
          cnpj: client.cnpj ? String(client.cnpj).trim() : null,
          razao_social: client.razao_social ? String(client.razao_social).trim() : null,
          birth_date: client.birth_date ? String(client.birth_date).trim() : null,
          cep: client.cep ? String(client.cep).trim() : null,
          street: client.street ? String(client.street).trim() : null,
          number: client.number ? String(client.number).trim() : null,
          complement: client.complement ? String(client.complement).trim() : null,
          neighborhood: client.neighborhood ? String(client.neighborhood).trim() : null,
          city: client.city ? String(client.city).trim() : null,
          state: client.state ? String(client.state).trim() : null,
          allow_system_access: client.allow_system_access || false,
          system_password: client.system_password ? String(client.system_password).trim() : null,
          assigned_user_id: client.assigned_user_id ? String(client.assigned_user_id).trim() : null
        }));

        try {
          // Adicionar timeout para evitar travamentos
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Timeout na inserção do lote')), 30000)
          );
          
          const insertPromise = supabase
            .from('clients')
            .insert(batchData)
            .select();
            
          const { data, error } = await Promise.race([insertPromise, timeoutPromise]) as any;

          if (error) {
            console.error(`Erro no lote ${batchNumber}:`, error);
            // Se der erro no lote, tenta inserir um por vez para identificar problemas específicos
            for (const clientData of batchData) {
              try {
                const { error: individualError } = await supabase
                  .from('clients')
                  .insert([clientData]);
                  
                if (!individualError) {
                  imported++;
                } else {
                  console.error('Erro ao inserir cliente:', clientData.name || clientData.email, individualError);
                }
              } catch (indError) {
                console.error('Erro individual:', indError);
              }
            }
          } else {
            imported += data?.length || batch.length;
            console.log(`Lote ${batchNumber} importado com sucesso: ${data?.length || batch.length} clientes`);
          }
        } catch (batchError) {
          console.error(`Erro crítico no lote ${batchNumber}:`, batchError);
          // Tentar inserção individual como fallback
          for (const clientData of batchData) {
            try {
              const { error: individualError } = await supabase
                .from('clients')
                .insert([clientData]);
                
              if (!individualError) {
                imported++;
              }
            } catch (indError) {
              console.error('Erro individual no fallback:', indError);
            }
          }
        }

        const progressPercent = Math.round(((i + batch.length) / total) * 100);
        setImportProgress(progressPercent);
        
        // Pequena pausa entre lotes para não sobrecarregar o banco
        if (i + batchSize < clientsData.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      console.log(`Importação finalizada: ${imported} de ${total} clientes importados`);
      
      setTotalImported(imported);
      setShowProgressModal(false);
      setShowSuccessModal(true);

      toast({
        title: "Importação concluída",
        description: `${imported} de ${total} clientes importados com sucesso.`,
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
              name: client.name ? String(client.name).trim() : null,
              phone: client.phone ? String(client.phone).trim() : null,
              client_type: client.client_type,
              cpf: client.cpf ? String(client.cpf).trim() : null,
              cnpj: client.cnpj ? String(client.cnpj).trim() : null,
              razao_social: client.razao_social ? String(client.razao_social).trim() : null,
              birth_date: client.birth_date ? String(client.birth_date).trim() : null,
              cep: client.cep ? String(client.cep).trim() : null,
              street: client.street ? String(client.street).trim() : null,
              number: client.number ? String(client.number).trim() : null,
              complement: client.complement ? String(client.complement).trim() : null,
              neighborhood: client.neighborhood ? String(client.neighborhood).trim() : null,
              city: client.city ? String(client.city).trim() : null,
              state: client.state ? String(client.state).trim() : null,
              allow_system_access: client.allow_system_access || false,
              system_password: client.system_password ? String(client.system_password).trim() : null,
              assigned_user_id: client.assigned_user_id ? String(client.assigned_user_id).trim() : null
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