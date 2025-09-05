import React from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

interface ClientSystemAccessFormProps {
  allowSystemAccess: boolean;
  systemPassword: string;
  onAllowSystemAccessChange: (value: boolean) => void;
  onSystemPasswordChange: (value: string) => void;
}

const ClientSystemAccessForm = ({
  allowSystemAccess,
  systemPassword,
  onAllowSystemAccessChange,
  onSystemPasswordChange,
}: ClientSystemAccessFormProps) => {
  return (
    <>
      <div className="space-y-2">
        <Label htmlFor="allow_system_access">
          Acesso ao Sistema
        </Label>
        <div className="flex items-center space-x-2">
          <Switch
            id="allow_system_access"
            checked={allowSystemAccess}
            onCheckedChange={onAllowSystemAccessChange}
          />
          <Label htmlFor="allow_system_access" className="text-sm text-muted-foreground">
            Permitir que o cliente acesse o sistema para gerar orçamentos
          </Label>
        </div>
      </div>

      {allowSystemAccess && (
        <div className="space-y-2">
          <Label htmlFor="system_password">
            Senha de Acesso *
          </Label>
          <Input
            id="system_password"
            type="password"
            value={systemPassword}
            onChange={(e) => onSystemPasswordChange(e.target.value)}
            placeholder="Digite uma senha para o cliente"
            required={allowSystemAccess}
          />
        </div>
      )}
    </>
  );
};

export default ClientSystemAccessForm;