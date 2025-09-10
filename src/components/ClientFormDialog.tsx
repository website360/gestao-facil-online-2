
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Client } from '@/components/client/types';
import ClientBasicInfoForm from '@/components/client/ClientBasicInfoForm';
import { ClientTypeSelector } from '@/components/client/ClientTypeSelector';
import ClientDocumentFields from '@/components/client/ClientDocumentFields';
import ClientAddressForm from '@/components/client/ClientAddressForm';
import ClientSystemAccessForm from '@/components/client/ClientSystemAccessForm';
import { ClientUserSelector } from '@/components/client/ClientUserSelector';
import { useClientForm } from '@/components/client/useClientForm';

interface ClientFormDialogProps {
  showForm: boolean;
  editingClient: Client | null;
  onClose: () => void;
  onSuccess: () => void;
}

const ClientFormDialog = ({ showForm, editingClient, onClose, onSuccess }: ClientFormDialogProps) => {
  const {
    name,
    email,
    phone,
    clientType,
    cpf,
    cnpj,
    birthDate,
    razaoSocial,
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
  } = useClientForm({ editingClient, onSuccess });

  return (
    <Dialog open={showForm} onOpenChange={onClose}>
      <DialogContent className="max-w-[95vw] md:max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg md:text-xl">
            {editingClient ? 'Editar Cliente' : 'Novo Cliente'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <ClientBasicInfoForm
            name={name}
            email={email}
            phone={phone}
            onNameChange={setName}
            onEmailChange={setEmail}
            onPhoneChange={setPhone}
          />
          
          <ClientTypeSelector
            clientType={clientType}
            onClientTypeChange={setClientType}
          />
          
          {clientType && (
            <>
              <ClientDocumentFields
                clientType={clientType === 'fisica' ? 'individual' : 'business'}
                cpf={cpf}
                cnpj={cnpj}
                birthDate={birthDate}
                razaoSocial={razaoSocial}
                onCpfChange={setCpf}
                onCnpjChange={setCnpj}
                onBirthDateChange={setBirthDate}
                onRazaoSocialChange={setRazaoSocial}
              />
              
              <ClientAddressForm
                cep={cep}
                street={street}
                number={number}
                complement={complement}
                neighborhood={neighborhood}
                city={city}
                state={state}
                onCepChange={setCep}
                onStreetChange={setStreet}
                onNumberChange={setNumber}
                onComplementChange={setComplement}
                onNeighborhoodChange={setNeighborhood}
                onCityChange={setCity}
                onStateChange={setState}
              />
              
              <ClientSystemAccessForm
                allowSystemAccess={allowSystemAccess}
                systemPassword={systemPassword}
                onAllowSystemAccessChange={setAllowSystemAccess}
                onSystemPasswordChange={setSystemPassword}
              />
              
              <ClientUserSelector
                value={assignedUserId}
                onChange={setAssignedUserId}
              />
            </>
          )}
          
          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ClientFormDialog;
