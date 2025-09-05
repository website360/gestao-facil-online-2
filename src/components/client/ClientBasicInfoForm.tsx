
import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import InputMask from 'react-input-mask';

interface ClientBasicInfoFormProps {
  name: string;
  email: string;
  phone: string;
  onNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
  onPhoneChange: (value: string) => void;
}

const ClientBasicInfoForm = ({
  name,
  email,
  phone,
  onNameChange,
  onEmailChange,
  onPhoneChange,
}: ClientBasicInfoFormProps) => {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="name">
          Nome *
        </Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => onNameChange(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">
          Email *
        </Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">
          Telefone *
        </Label>
        <InputMask
          mask="(99) 99999-9999"
          value={phone}
          onChange={(e) => onPhoneChange(e.target.value)}
          maskChar="_"
          id="phone"
          placeholder="(00) 00000-0000"
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
          required
        />
      </div>
    </>
  );
};

export default ClientBasicInfoForm;
