
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputMask from 'react-input-mask';

interface ClientDocumentFieldsProps {
  clientType: 'individual' | 'business';
  cpf: string;
  cnpj: string;
  birthDate: string;
  razaoSocial: string;
  inscricaoEstadual: string;
  onCpfChange: (value: string) => void;
  onCnpjChange: (value: string) => void;
  onBirthDateChange: (value: string) => void;
  onRazaoSocialChange: (value: string) => void;
  onInscricaoEstadualChange: (value: string) => void;
}

const ClientDocumentFields = ({
  clientType,
  cpf,
  cnpj,
  birthDate,
  razaoSocial,
  inscricaoEstadual,
  onCpfChange,
  onCnpjChange,
  onBirthDateChange,
  onRazaoSocialChange,
  onInscricaoEstadualChange,
}: ClientDocumentFieldsProps) => {
  const [loadingCnpj, setLoadingCnpj] = useState(false);

  // Não mostrar campos até que o tipo seja selecionado
  if (!clientType) {
    return null;
  }

  const handleCnpjChange = async (newCnpj: string) => {
    onCnpjChange(newCnpj);
    
    // Remove caracteres não numéricos
    const cleanCnpj = newCnpj.replace(/\D/g, '');
    
    if (cleanCnpj.length === 14) {
      setLoadingCnpj(true);
      try {
        const response = await fetch(`https://www.receitaws.com.br/v1/cnpj/${cleanCnpj}`);
        const data = await response.json();
        
        if (data.status === 'OK' && data.nome) {
          onRazaoSocialChange(data.nome);
        }
      } catch (error) {
        console.error('Erro ao buscar CNPJ:', error);
      } finally {
        setLoadingCnpj(false);
      }
    }
  };

  if (clientType === 'individual') {
    return (
      <>
        <div className="space-y-2">
          <Label htmlFor="cpf">
            CPF
          </Label>
          <InputMask
            mask="999.999.999-99"
            value={cpf}
            onChange={(e) => onCpfChange(e.target.value)}
            maskChar="_"
            id="cpf"
            placeholder="000.000.000-00"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="birth_date">
            Data de Nascimento
          </Label>
          <Input
            id="birth_date"
            type="date"
            value={birthDate}
            onChange={(e) => onBirthDateChange(e.target.value)}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="cnpj">
          CNPJ
        </Label>
        <div className="relative">
          <InputMask
            mask="99.999.999/9999-99"
            value={cnpj}
            onChange={(e) => handleCnpjChange(e.target.value)}
            maskChar="_"
            id="cnpj"
            placeholder="00.000.000/0000-00"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
          />
          {loadingCnpj && (
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            </div>
          )}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="razao_social">
          Razão Social
        </Label>
        <Input
          id="razao_social"
          value={razaoSocial}
          onChange={(e) => onRazaoSocialChange(e.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="inscricao_estadual">
          Inscrição Estadual <span className="text-muted-foreground">(opcional)</span>
        </Label>
        <Input
          id="inscricao_estadual"
          value={inscricaoEstadual}
          onChange={(e) => onInscricaoEstadualChange(e.target.value)}
          placeholder="Digite a inscrição estadual"
        />
      </div>
    </>
  );
};

export default ClientDocumentFields;
