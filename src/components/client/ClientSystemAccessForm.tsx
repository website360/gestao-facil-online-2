import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Eye, EyeOff } from 'lucide-react';
import { useUserProfile } from '@/hooks/useUserProfile';

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
  // Mostrar/ocultar a senha: permite conferir a senha atual do cliente
  // (para suporte ou teste do portal) sem precisar trocá-la.
  // Restrito ao admin: gerente e vendedores continuam vendo o campo mascarado.
  const { userProfile, isSuperAdmin } = useUserProfile();
  const canRevealPassword = userProfile?.role === 'admin' || isSuperAdmin;
  const [showPassword, setShowPassword] = useState(false);

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
            Senha de Acesso
          </Label>
          <div className="relative">
            <Input
              id="system_password"
              type={showPassword && canRevealPassword ? 'text' : 'password'}
              value={systemPassword}
              onChange={(e) => onSystemPasswordChange(e.target.value)}
              placeholder="Digite uma senha para o cliente"
              className={canRevealPassword ? 'pr-10' : undefined}
            />
            {canRevealPassword && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowPassword(prev => !prev)}
                className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                title={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default ClientSystemAccessForm;
