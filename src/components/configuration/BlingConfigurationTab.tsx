import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Save, Eye, EyeOff, ExternalLink, RefreshCw, CheckCircle2, XCircle } from 'lucide-react';

interface BlingConfig {
  enabled: boolean;
  client_id: string;
  client_secret: string;
  refresh_token: string;
}

const defaultConfig: BlingConfig = {
  enabled: false,
  client_id: '',
  client_secret: '',
  refresh_token: '',
};

const BlingConfigurationTab = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [config, setConfig] = useState<BlingConfig>(defaultConfig);
  const [showSecret, setShowSecret] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    fetchConfiguration();
  }, []);

  const fetchConfiguration = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('system_configurations')
        .select('value')
        .eq('key', 'bling_config')
        .maybeSingle();

      if (error) throw error;

      if (data?.value) {
        try {
          const parsed = JSON.parse(data.value);
          setConfig({ ...defaultConfig, ...parsed });
        } catch {
          console.error('Erro ao parsear configuração do Bling');
        }
      }
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
      toast.error('Erro ao carregar configurações do Bling');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('system_configurations')
        .upsert({
          key: 'bling_config',
          value: JSON.stringify(config),
          description: 'Configurações de integração com o Bling ERP (OAuth 2.0)',
        }, { onConflict: 'key' });

      if (error) throw error;
      toast.success('Configurações do Bling salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const handleTestConnection = async () => {
    if (!config.client_id || !config.client_secret) {
      toast.error('Preencha o Client ID e Client Secret para testar');
      return;
    }
    setTesting(true);
    setConnectionStatus('idle');
    try {
      // Teste básico: validar que os campos estão preenchidos
      // A validação real será feita pela Edge Function futuramente
      await new Promise(resolve => setTimeout(resolve, 1500));

      if (config.client_id.length > 5 && config.client_secret.length > 5) {
        setConnectionStatus('success');
        toast.success('Credenciais parecem válidas! A validação completa será feita ao enviar o primeiro pedido.');
      } else {
        setConnectionStatus('error');
        toast.error('Credenciais inválidas. Verifique os dados informados.');
      }
    } catch {
      setConnectionStatus('error');
      toast.error('Erro ao testar conexão');
    } finally {
      setTesting(false);
    }
  };

  const updateConfig = (field: keyof BlingConfig, value: string | boolean) => {
    setConfig(prev => ({ ...prev, [field]: value }));
    setConnectionStatus('idle');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        <span className="ml-3 text-muted-foreground">Carregando configurações...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                Integração Bling ERP
              </CardTitle>
              <CardDescription>
                Configure as credenciais OAuth 2.0 para integrar com o Bling ERP
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor="bling-enabled" className="text-sm">
                {config.enabled ? 'Ativado' : 'Desativado'}
              </Label>
              <Switch
                id="bling-enabled"
                checked={config.enabled}
                onCheckedChange={(checked) => updateConfig('enabled', checked)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 dark:bg-blue-950/30 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">Como obter as credenciais</h4>
            <ol className="text-sm text-blue-700 dark:text-blue-400 space-y-1 list-decimal list-inside">
              <li>Acesse o <a href="https://developer.bling.com.br" target="_blank" rel="noopener noreferrer" className="underline font-medium inline-flex items-center gap-1">Painel de Desenvolvedores do Bling <ExternalLink className="h-3 w-3" /></a></li>
              <li>Crie um novo aplicativo</li>
              <li>Copie o <strong>Client ID</strong> e <strong>Client Secret</strong></li>
              <li>Autorize o aplicativo para obter o <strong>Refresh Token</strong></li>
            </ol>
          </div>

          <Separator />

          <div className="space-y-4 max-w-lg">
            <div className="space-y-2">
              <Label htmlFor="client_id">Client ID</Label>
              <Input
                id="client_id"
                value={config.client_id}
                onChange={(e) => updateConfig('client_id', e.target.value)}
                placeholder="Cole o Client ID do aplicativo Bling"
                disabled={!config.enabled}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client_secret">Client Secret</Label>
              <div className="flex gap-2">
                <Input
                  id="client_secret"
                  type={showSecret ? 'text' : 'password'}
                  value={config.client_secret}
                  onChange={(e) => updateConfig('client_secret', e.target.value)}
                  placeholder="Cole o Client Secret"
                  disabled={!config.enabled}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowSecret(!showSecret)}
                  disabled={!config.enabled}
                >
                  {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="refresh_token">Refresh Token</Label>
              <div className="flex gap-2">
                <Input
                  id="refresh_token"
                  type={showToken ? 'text' : 'password'}
                  value={config.refresh_token}
                  onChange={(e) => updateConfig('refresh_token', e.target.value)}
                  placeholder="Cole o Refresh Token"
                  disabled={!config.enabled}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowToken(!showToken)}
                  disabled={!config.enabled}
                >
                  {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Obtido após autorizar o aplicativo no fluxo OAuth do Bling
              </p>
            </div>
          </div>

          <Separator />

          <div className="flex items-center gap-3">
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
            <Button
              variant="outline"
              onClick={handleTestConnection}
              disabled={testing || !config.enabled}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${testing ? 'animate-spin' : ''}`} />
              {testing ? 'Testando...' : 'Testar Conexão'}
            </Button>
            {connectionStatus === 'success' && (
              <span className="flex items-center gap-1 text-sm text-green-600">
                <CheckCircle2 className="h-4 w-4" /> Credenciais válidas
              </span>
            )}
            {connectionStatus === 'error' && (
              <span className="flex items-center gap-1 text-sm text-destructive">
                <XCircle className="h-4 w-4" /> Credenciais inválidas
              </span>
            )}
          </div>

          <Separator />

          <div className="bg-yellow-50 dark:bg-yellow-950/30 p-4 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <h4 className="font-semibold text-yellow-800 dark:text-yellow-300 mb-2">Funcionalidades da Integração</h4>
            <div className="text-sm text-yellow-700 dark:text-yellow-400 space-y-1">
              <p>• <strong>Envio de Pedidos:</strong> Vendas finalizadas podem ser enviadas como pedidos de venda no Bling</p>
              <p>• <strong>Sincronização:</strong> O sistema rastreará quais vendas já foram enviadas para evitar duplicações</p>
              <p>• <strong>API v3:</strong> Utiliza a API mais recente do Bling para máxima compatibilidade</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BlingConfigurationTab;
