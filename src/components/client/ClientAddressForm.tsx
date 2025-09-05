import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputMask from 'react-input-mask';

interface ClientAddressFormProps {
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  onCepChange: (value: string) => void;
  onStreetChange: (value: string) => void;
  onNumberChange: (value: string) => void;
  onComplementChange: (value: string) => void;
  onNeighborhoodChange: (value: string) => void;
  onCityChange: (value: string) => void;
  onStateChange: (value: string) => void;
}

const ClientAddressForm = ({
  cep,
  street,
  number,
  complement,
  neighborhood,
  city,
  state,
  onCepChange,
  onStreetChange,
  onNumberChange,
  onComplementChange,
  onNeighborhoodChange,
  onCityChange,
  onStateChange,
}: ClientAddressFormProps) => {
  const [loadingCep, setLoadingCep] = useState(false);

  const handleCepChange = async (newCep: string) => {
    onCepChange(newCep);
    
    // Remove caracteres não numéricos
    const cleanCep = newCep.replace(/\D/g, '');
    
    if (cleanCep.length === 8) {
      setLoadingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
        const data = await response.json();
        
        if (!data.erro) {
          onStreetChange(data.logradouro || '');
          onNeighborhoodChange(data.bairro || '');
          onCityChange(data.localidade || '');
          onStateChange(data.uf || '');
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
      } finally {
        setLoadingCep(false);
      }
    }
  };

  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="cep">
          CEP
        </Label>
        <div className="relative">
          <InputMask
            mask="99999-999"
            value={cep}
            onChange={(e) => handleCepChange(e.target.value)}
            maskChar="_"
            id="cep"
            placeholder="00000-000"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
          />
          {loadingCep && (
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="street">
          Endereço
        </Label>
        <Input
          id="street"
          value={street}
          onChange={(e) => onStreetChange(e.target.value)}
          placeholder="Rua, Avenida, etc."
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="number">
            Número
          </Label>
          <Input
            id="number"
            value={number}
            onChange={(e) => onNumberChange(e.target.value)}
            placeholder="123"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="complement">
            Complemento
          </Label>
          <Input
            id="complement"
            value={complement}
            onChange={(e) => onComplementChange(e.target.value)}
            placeholder="Apto, Bloco, etc."
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="neighborhood">
          Bairro
        </Label>
        <Input
          id="neighborhood"
          value={neighborhood}
          onChange={(e) => onNeighborhoodChange(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="city">
            Cidade
          </Label>
          <Input
            id="city"
            value={city}
            onChange={(e) => onCityChange(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="state">
            Estado
          </Label>
          <Input
            id="state"
            value={state}
            onChange={(e) => onStateChange(e.target.value)}
            maxLength={2}
            placeholder="SP"
          />
        </div>
      </div>
    </>
  );
};

export default ClientAddressForm;