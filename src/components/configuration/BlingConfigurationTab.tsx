import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Save, Eye, EyeOff, ExternalLink, CheckCircle2, XCircle, Link2, RefreshCw, FlaskConical, BookOpen, ChevronDown } from 'lucide-react';
import BlingSyncLogs from './BlingSyncLogs';

interface BlingConfig {
  enabled: boolean;
  client_id: string;
  client_secret: string;
  refresh_token: string;
  access_token?: string;
  access_token_expires_at?: number;
  authorized?: boolean;
  authorized_at?: string;
  dry_run?: boolean;
  payment_method_map?: Record<string, number>;
  default_forma_pagamento_id?: number | string;
  bling_formas?: BlingForma[];
}

interface LocalPaymentMethod {
  id: string;
  name: string;
}

interface BlingForma {
  id: number;
  descricao: string;
}

const defaultConfig: BlingConfig = {
  enabled: false,
  client_id: '',
  client_secret: '',
  refresh_token: '',
  dry_run: false,
  payment_method_map: {},
  default_forma_pagamento_id: '',
};

const NONE = '__none__';

const BlingConfigurationTab = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<BlingConfig>(defaultConfig);
  const [showSecret, setShowSecret] = useState(false);

  const [paymentMethods, setPaymentMethods] = useState<LocalPaymentMethod[]>([]);
  const [blingFormas, setBlingFormas] = useState<BlingForma[]>([]);
  const [loadingFormas, setLoadingFormas] = useState(false);
  const [guideOpen, setGuideOpen] = useState(true);

  useEffect(() => {
    fetchConfiguration();
    fetchPaymentMethods();
  }, []);

  // Listen for OAuth success message from popup
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'bling-oauth-success') {
        toast.success('Bling autorizado com sucesso!');
        fetchConfiguration();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
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
          // Recarrega as formas do Bling em cache para o mapeamento ficar visível
          if (Array.isArray(parsed.bling_formas) && parsed.bling_formas.length > 0) {
            setBlingFormas(parsed.bling_formas);
          }
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

  const fetchPaymentMethods = async () => {
    const { data } = await supabase
      .from('payment_methods')
      .select('id, name')
      .eq('active', true)
      .order('name');
    if (data) setPaymentMethods(data as LocalPaymentMethod[]);
  };

  const fetchBlingFormas = async () => {
    setLoadingFormas(true);
    try {
      const { data, error } = await supabase.functions.invoke('bling-formas-pagamento');
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }
      setBlingFormas(data?.formas ?? []);
      toast.success(`${data?.formas?.length ?? 0} formas de pagamento carregadas do Bling`);
    } catch (error) {
      console.error('Erro ao buscar formas do Bling:', error);
      toast.error('Erro ao buscar formas de pagamento do Bling');
    } finally {
      setLoadingFormas(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Fetch latest config to preserve OAuth tokens
      const { data: latestData } = await supabase
        .from('system_configurations')
        .select('value')
        .eq('key', 'bling_config')
        .maybeSingle();

      let mergedConfig: BlingConfig = { ...config };
      if (latestData?.value) {
        try {
          const existing = JSON.parse(latestData.value);
          // Preserve token fields from DB, update user-editable fields
          mergedConfig = {
            ...existing,
            enabled: config.enabled,
            client_id: config.client_id,
            client_secret: config.client_secret,
            dry_run: config.dry_run,
            payment_method_map: config.payment_method_map ?? {},
            default_forma_pagamento_id: config.default_forma_pagamento_id ?? '',
          };
        } catch { /* ignore parse errors */ }
      }

      // Cacheia as formas do Bling para reexibir o mapeamento ao reabrir a tela
      if (blingFormas.length > 0) {
        mergedConfig.bling_formas = blingFormas;
      }

      const { error } = await supabase
        .from('system_configurations')
        .upsert({
          key: 'bling_config',
          value: JSON.stringify(mergedConfig),
          description: 'Configurações de integração com o Bling ERP (OAuth 2.0)',
        }, { onConflict: 'key' });

      if (error) throw error;
      setConfig(mergedConfig);
      toast.success('Configurações do Bling salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  const getCallbackUrl = () => {
    const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID || 'hsugdbkauxbjuogzmukp';
    return `https://${projectId}.supabase.co/functions/v1/bling-oauth-callback`;
  };

  const updateConfig = (field: keyof BlingConfig, value: string | boolean) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  const setMethodMapping = (methodId: string, blingFormaId: string) => {
    setConfig(prev => {
      const map = { ...(prev.payment_method_map ?? {}) };
      if (blingFormaId === NONE) {
        delete map[methodId];
      } else {
        map[methodId] = Number(blingFormaId);
      }
      return { ...prev, payment_method_map: map };
    });
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
          {/* Passo a passo completo */}
          <Collapsible open={guideOpen} onOpenChange={setGuideOpen}>
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
              <CollapsibleTrigger className="flex w-full items-center justify-between p-4 text-left">
                <span className="flex items-center gap-2 font-semibold text-blue-800 dark:text-blue-300">
                  <BookOpen className="h-4 w-4" />
                  Passo a passo da integração com o Bling
                </span>
                <ChevronDown className={`h-4 w-4 text-blue-700 transition-transform ${guideOpen ? 'rotate-180' : ''}`} />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="px-4 pb-4 space-y-4 text-sm text-blue-800 dark:text-blue-300">

                  <div>
                    <p className="font-semibold mb-1">Parte 1 — Criar o aplicativo no Bling</p>
                    <ol className="space-y-1 list-decimal list-inside text-blue-700 dark:text-blue-400">
                      <li>Acesse o <a href="https://developer.bling.com.br" target="_blank" rel="noopener noreferrer" className="underline font-medium inline-flex items-center gap-1">Painel de Desenvolvedores do Bling <ExternalLink className="h-3 w-3" /></a> e faça login.</li>
                      <li>Clique em <strong>Criar aplicativo</strong> e escolha o tipo <strong>“Aplicativo privado”</strong> (uso da própria empresa).</li>
                      <li>No campo <strong>URL de redirecionamento (callback)</strong>, cole a URL exibida na seção “URL de Callback” logo abaixo desta tela.</li>
                      <li>Em <strong>Escopos / Permissões</strong>, marque pelo menos: <strong>Pedidos de Venda</strong>, <strong>Contatos</strong> e <strong>Formas de Pagamento</strong> (leitura e escrita).</li>
                      <li>Salve o aplicativo e copie o <strong>Client ID</strong> e o <strong>Client Secret</strong>.</li>
                    </ol>
                  </div>

                  <div>
                    <p className="font-semibold mb-1">Parte 2 — Conectar o sistema ao Bling</p>
                    <ol className="space-y-1 list-decimal list-inside text-blue-700 dark:text-blue-400">
                      <li>Ative a integração no botão <strong>Ativado/Desativado</strong> no topo desta tela.</li>
                      <li>Cole o <strong>Client ID</strong> e o <strong>Client Secret</strong> nos campos abaixo e clique em <strong>Salvar Configurações</strong>.</li>
                      <li>No painel do Bling, copie o <strong>Link de Convite</strong> do seu aplicativo e abra-o em uma nova aba.</li>
                      <li>Autorize o aplicativo no Bling — você será redirecionado de volta e o <strong>Status da Autorização</strong> mudará para “Autorizado”.</li>
                    </ol>
                  </div>

                  <div>
                    <p className="font-semibold mb-1">Parte 3 — Mapear as formas de pagamento</p>
                    <ol className="space-y-1 list-decimal list-inside text-blue-700 dark:text-blue-400">
                      <li>Na seção <strong>Formas de pagamento</strong>, clique em <strong>Buscar do Bling</strong>.</li>
                      <li>Para cada forma de pagamento do sistema, selecione a forma equivalente no Bling.</li>
                      <li>Defina uma <strong>Forma padrão (fallback)</strong> para usar quando não houver mapeamento específico.</li>
                      <li>Clique em <strong>Salvar Configurações</strong>. <span className="opacity-80">(Sem mapeamento, o pedido é enviado sem as parcelas.)</span></li>
                    </ol>
                  </div>

                  <div>
                    <p className="font-semibold mb-1">Parte 4 — Testar e enviar</p>
                    <ol className="space-y-1 list-decimal list-inside text-blue-700 dark:text-blue-400">
                      <li><strong>Ative o Modo de teste (dry-run)</strong> e salve. Assim você valida o envio sem criar pedidos no Bling.</li>
                      <li>Na tela de <strong>Vendas</strong>, em uma venda já faturada, clique no ícone do Bling para enviar.</li>
                      <li>Confira o resultado na seção <strong>Log de envios ao Bling</strong> (abaixo). Em dry-run, nada é enviado de verdade.</li>
                      <li>Quando estiver tudo certo, <strong>desligue o dry-run</strong> e salve — os próximos envios criam o pedido de venda real no Bling.</li>
                      <li>Se um envio falhar, use o botão <strong>Reenviar</strong> na tela de log.</li>
                    </ol>
                  </div>

                  <div className="bg-blue-100/60 dark:bg-blue-900/30 rounded-md p-3 text-xs text-blue-700 dark:text-blue-400">
                    <strong>Observações:</strong> o ícone de envio na tela de Vendas aparece para os papéis <strong>Nota Fiscal</strong> e <strong>Admin</strong>.
                    O pedido de venda <strong>não emite a NF-e automaticamente</strong> — a emissão continua sendo feita no Bling. O sistema evita envios duplicados (uma venda já enviada não é reenviada).
                  </div>

                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>

          <Separator />

          {/* Callback URL */}
          <div className="bg-muted/50 p-4 rounded-lg border">
            <Label className="text-sm font-semibold">URL de Callback (cole no aplicativo do Bling)</Label>
            <div className="flex gap-2 mt-2">
              <Input
                readOnly
                value={getCallbackUrl()}
                className="font-mono text-xs bg-background"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(getCallbackUrl());
                  toast.success('URL copiada!');
                }}
              >
                Copiar
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Configure esta URL como "URL de redirecionamento" no aplicativo do Bling
            </p>
          </div>

          <Separator />

          {/* Credentials */}
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
          </div>

          <Separator />

          {/* Dry-run (modo teste) */}
          <div className="flex items-start justify-between bg-amber-50 dark:bg-amber-950/30 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
            <div className="flex gap-3">
              <FlaskConical className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <Label htmlFor="bling-dryrun" className="font-semibold text-amber-800 dark:text-amber-300">
                  Modo de teste (dry-run)
                </Label>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-1 max-w-xl">
                  Quando ativado, ao "Enviar para Bling" o sistema monta e valida o pedido (contato, itens, parcelas)
                  mas <strong>NÃO envia</strong> de fato ao Bling — apenas registra no log. Use para testar com segurança.
                </p>
              </div>
            </div>
            <Switch
              id="bling-dryrun"
              checked={!!config.dry_run}
              onCheckedChange={(checked) => updateConfig('dry_run', checked)}
            />
          </div>

          <Separator />

          {/* Mapeamento de formas de pagamento */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold">Formas de pagamento</h4>
                <p className="text-xs text-muted-foreground">
                  Relacione cada forma de pagamento do sistema com a forma correspondente no Bling (necessário para enviar as parcelas).
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={fetchBlingFormas}
                disabled={loadingFormas || !config.authorized}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loadingFormas ? 'animate-spin' : ''}`} />
                Buscar do Bling
              </Button>
            </div>

            {!config.authorized && (
              <p className="text-xs text-yellow-700 dark:text-yellow-400">
                Autorize o Bling primeiro para poder buscar as formas de pagamento.
              </p>
            )}

            {blingFormas.length > 0 && (
              <div className="space-y-3 max-w-2xl">
                {paymentMethods.map((pm) => (
                  <div key={pm.id} className="grid grid-cols-2 gap-3 items-center">
                    <Label className="text-sm">{pm.name}</Label>
                    <Select
                      value={config.payment_method_map?.[pm.id]?.toString() ?? NONE}
                      onValueChange={(v) => setMethodMapping(pm.id, v)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a forma no Bling" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={NONE}>— Não mapear —</SelectItem>
                        {blingFormas.map((f) => (
                          <SelectItem key={f.id} value={f.id.toString()}>
                            {f.descricao}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}

                <div className="grid grid-cols-2 gap-3 items-center pt-2 border-t">
                  <Label className="text-sm font-medium">Forma padrão (fallback)</Label>
                  <Select
                    value={config.default_forma_pagamento_id?.toString() || NONE}
                    onValueChange={(v) =>
                      setConfig(prev => ({ ...prev, default_forma_pagamento_id: v === NONE ? '' : Number(v) }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Forma padrão" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NONE}>— Nenhuma —</SelectItem>
                      {blingFormas.map((f) => (
                        <SelectItem key={f.id} value={f.id.toString()}>
                          {f.descricao}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Save button */}
          <div className="flex items-center gap-3">
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar Configurações'}
            </Button>
          </div>

          <Separator />

          {/* Authorization status */}
          <div className="space-y-3">
            <h4 className="font-semibold">Status da Autorização</h4>
            {config.authorized ? (
              <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950/30 p-3 rounded-lg border border-green-200 dark:border-green-800">
                <CheckCircle2 className="h-5 w-5" />
                <div>
                  <p className="font-medium">Bling autorizado com sucesso!</p>
                  {config.authorized_at && (
                    <p className="text-xs opacity-75">
                      Autorizado em: {new Date(config.authorized_at).toLocaleString('pt-BR')}
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950/30 p-3 rounded-lg border border-yellow-200 dark:border-yellow-800">
                <XCircle className="h-5 w-5" />
                <div>
                  <p className="font-medium">Bling não autorizado</p>
                  <p className="text-xs opacity-75">
                    Salve as credenciais acima e depois use o Link de Convite do Bling para autorizar
                  </p>
                </div>
              </div>
            )}

            <div className="bg-muted/50 p-4 rounded-lg border">
              <h5 className="font-medium text-sm mb-2 flex items-center gap-2">
                <Link2 className="h-4 w-4" />
                Como autorizar usando o Link de Convite
              </h5>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li><strong>Salve</strong> o Client ID e Client Secret acima primeiro</li>
                <li>No painel do Bling, copie o <strong>Link de Convite</strong> do seu aplicativo</li>
                <li>Abra o link em uma nova aba (você será redirecionado para o Bling)</li>
                <li>Autorize o aplicativo — o Bling redirecionará automaticamente para cá</li>
                <li>O status acima mudará para <strong>"Autorizado"</strong></li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Log de envios */}
      <BlingSyncLogs />
    </div>
  );
};

export default BlingConfigurationTab;
