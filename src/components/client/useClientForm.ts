
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Client } from './types';
import { useUserProfile } from '@/hooks/useUserProfile';
import { isVendorOrOldVendasRole } from '@/utils/roleMapper';

interface UseClientFormProps {
  editingClient: Client | null;
  onSuccess: () => void;
}

export const useClientForm = ({ editingClient, onSuccess }: UseClientFormProps) => {
  const { userProfile } = useUserProfile();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [clientType, setClientType] = useState('');
  const [cpf, setCpf] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [razaoSocial, setRazaoSocial] = useState('');
  const [inscricaoEstadual, setInscricaoEstadual] = useState('');
  const [cep, setCep] = useState('');
  const [street, setStreet] = useState('');
  const [number, setNumber] = useState('');
  const [complement, setComplement] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [allowSystemAccess, setAllowSystemAccess] = useState(false);
  const [systemPassword, setSystemPassword] = useState('');
  const [assignedUserId, setAssignedUserId] = useState('all');
  const [loading, setLoading] = useState(false);

  // Verificar se o usuário é vendedor
  const isVendor = userProfile && isVendorOrOldVendasRole(userProfile.role as any);

  useEffect(() => {
    if (editingClient) {
      setName(editingClient.name);
      setEmail(editingClient.email);
      setPhone(editingClient.phone);
      setClientType(editingClient.client_type);
      setCpf(editingClient.cpf || '');
      setCnpj(editingClient.cnpj || '');
      setBirthDate(editingClient.birth_date || '');
      setRazaoSocial(editingClient.razao_social || '');
      setInscricaoEstadual(editingClient.inscricao_estadual || '');
      setCep(editingClient.cep || '');
      setStreet(editingClient.street || '');
      setNumber(editingClient.number || '');
      setComplement(editingClient.complement || '');
      setNeighborhood(editingClient.neighborhood || '');
      setCity(editingClient.city || '');
      setState(editingClient.state || '');
      setAllowSystemAccess(editingClient.allow_system_access || false);
      setSystemPassword(editingClient.system_password || '');
      setAssignedUserId(editingClient.assigned_user_id || 'all');
    } else {
      setName('');
      setEmail('');
      setPhone('');
      setClientType('');
      setCpf('');
      setCnpj('');
      setBirthDate('');
      setRazaoSocial('');
      setInscricaoEstadual('');
      setCep('');
      setStreet('');
      setNumber('');
      setComplement('');
      setNeighborhood('');
      setCity('');
      setState('');
      setAllowSystemAccess(false);
      setSystemPassword('');
      // Se é vendedor, definir automaticamente como responsável
      setAssignedUserId(isVendor && userProfile ? userProfile.id : 'all');
    }
  }, [editingClient, isVendor, userProfile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setLoading(true);

    try {
      // Verificar duplicação de documento
      const documentToCheck = clientType === 'fisica' ? cpf : cnpj;
      const documentField = clientType === 'fisica' ? 'cpf' : 'cnpj';
      
      if (documentToCheck) {
        let query = supabase
          .from('clients')
          .select('id')
          .eq(documentField, documentToCheck);

        // Excluir o próprio cliente na edição (evitar passar UUID vazio)
        if (editingClient?.id) {
          query = query.neq('id', editingClient.id);
        }

        const { data: existingClients, error: checkError } = await query;

        if (checkError) {
          console.error('Erro ao verificar documento:', checkError);
          throw checkError;
        }

        if (existingClients && existingClients.length > 0) {
          toast.error(`Já existe um cliente cadastrado com este ${clientType === 'fisica' ? 'CPF' : 'CNPJ'}.`);
          setLoading(false);
          return;
        }
      }

      const clientData = {
        name,
        email,
        phone,
        client_type: clientType,
        cpf: clientType === 'fisica' ? cpf || null : null,
        cnpj: clientType === 'juridica' ? cnpj || null : null,
        birth_date: clientType === 'fisica' ? birthDate || null : null,
        razao_social: clientType === 'juridica' ? razaoSocial || null : null,
        inscricao_estadual: clientType === 'juridica' ? inscricaoEstadual || null : null,
        cep: cep || null,
        street: street || null,
        number: number || null,
        complement: complement || null,
        neighborhood: neighborhood || null,
        city: city || null,
        state: state || null,
        allow_system_access: allowSystemAccess,
        system_password: allowSystemAccess ? systemPassword : null,
        assigned_user_id: (() => {
          // Se é vendedor, sempre usar o ID do vendedor logado
          if (isVendor && userProfile) {
            return userProfile.id;
          }
          // Se não é vendedor, usar o valor selecionado
          return !assignedUserId || assignedUserId === 'all' ? null : assignedUserId;
        })(),
      };

      console.log('Salvando cliente:', clientData);

      if (editingClient) {
        const { error } = await supabase
          .from('clients')
          .update(clientData)
          .eq('id', editingClient.id);

        if (error) {
          console.error('Erro ao atualizar cliente:', error);
          throw error;
        }
        
        if (allowSystemAccess && systemPassword) {
          toast.success('Cliente atualizado com sucesso! O cliente agora pode acessar o sistema para criar orçamentos.');
        } else {
          toast.success('Cliente atualizado com sucesso!');
        }
      } else {
        const { error } = await supabase
          .from('clients')
          .insert(clientData);

        if (error) {
          console.error('Erro ao criar cliente:', error);
          throw error;
        }
        
        if (allowSystemAccess && systemPassword) {
          toast.success('Cliente criado com sucesso! O cliente pode acessar o sistema com as credenciais fornecidas.');
        } else {
          toast.success('Cliente criado com sucesso!');
        }
      }

      onSuccess();
      
      // Limpar formulário após sucesso
      if (!editingClient) {
        setName('');
        setEmail('');
        setPhone('');
        setClientType('');
        setCpf('');
        setCnpj('');
        setBirthDate('');
        setRazaoSocial('');
        setInscricaoEstadual('');
        setCep('');
        setStreet('');
        setNumber('');
        setComplement('');
        setNeighborhood('');
        setCity('');
        setState('');
        setAllowSystemAccess(false);
        setSystemPassword('');
        setAssignedUserId(isVendor && userProfile ? userProfile.id : 'all');
      }
    } catch (error: any) {
      console.error('Error saving client:', error);
      toast.error(`Erro ao salvar cliente: ${error.message || 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  return {
    name,
    email,
    phone,
    clientType,
    cpf,
    cnpj,
    birthDate,
    razaoSocial,
    inscricaoEstadual,
    cep,
    street,
    number,
    complement,
    neighborhood,
    city,
    state,
    allowSystemAccess,
    systemPassword,
    assignedUserId,
    loading,
    setName,
    setEmail,
    setPhone,
    setClientType,
    setCpf,
    setCnpj,
    setBirthDate,
    setRazaoSocial,
    setInscricaoEstadual,
    setCep,
    setStreet,
    setNumber,
    setComplement,
    setNeighborhood,
    setCity,
    setState,
    setAllowSystemAccess,
    setSystemPassword,
    setAssignedUserId,
    handleSubmit,
  };
};
