import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Truck, Save, TestTube } from 'lucide-react';

interface CorreiosConfig {
  enabled: boolean;
  user: string;
  access_code: string;
  cartao_postagem: string;
  cep_origem: string;
  pac_enabled: boolean;
  sedex_enabled: boolean;
  weight_unit: string; // kg ou g
  dimension_unit: string; // cm
  currency: string; // R$
  packaging_type: string; // real ou cubagem
  additional_value: number;
  additional_days: number;
}

const CorreiosConfigurationTab = () => {
  const [config, setConfig] = useState<CorreiosConfig>({
    enabled: false,
    user: '',
    access_code: '',
    cartao_postagem: '',
    cep_origem: '',
    pac_enabled: true,
    sedex_enabled: true,
    weight_unit: 'kg',
    dimension_unit: 'cm',
    currency: 'R$',
    packaging_type: 'real',
    additional_value: 0,
    additional_days: 0
  });
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    try {
      const { data, error } = await supabase
        .from('system_configurations')
        .select('value')
        .eq('key', 'correios_config')
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data?.value) {
        const loadedConfig = typeof data.value === 'string' 
          ? JSON.parse(data.value) 
          : data.value;
        setConfig(prev => ({ ...prev, ...loadedConfig }));
      }
    } catch (error: any) {
      console.error('Error loading configuration:', error);
      toast.error('Erro ao carregar configurações');
    }
  };

  const saveConfiguration = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('system_configurations')
        .upsert({
          key: 'correios_config',
          value: JSON.stringify(config),
          description: 'Configurações da API dos Correios'
        }, {
          onConflict: 'key'
        });

      if (error) throw error;

      toast.success('Configurações salvas com sucesso!');
    } catch (error: any) {
      console.error('Error saving configuration:', error);
      toast.error('Erro ao salvar configurações');
    } finally {
      setLoading(false);
    }
  };

  const testConfiguration = async () => {
    if (!config.enabled || !config.cep_origem) {
      toast.error('Configure e ative os Correios antes de testar');
      return;
    }

    setTesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('calculate-shipping', {
        body: {
          cep_destino: '01310-100', // CEP de teste (Paulista - SP)
          peso: 1,
          altura: 10,
          largura: 15,
          comprimento: 20
        }
      });

      if (error) throw error;

      if (data.success) {
        toast.success('Teste realizado com sucesso! Valores calculados.');
        console.log('Shipping options:', data.shipping_options);
      } else {
        toast.error(data.error || 'Erro no teste da configuração');
      }
    } catch (error: any) {
      console.error('Error testing configuration:', error);
      toast.error('Erro ao testar configuração dos Correios');
    } finally {
      setTesting(false);
    }
  };

  const updateConfig = (field: keyof CorreiosConfig, value: any) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Configurações dos Correios
          </CardTitle>
          <CardDescription>
            Configure a integração com a API dos Correios para cálculo automático de frete
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Status da Integração */}
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="enabled">Ativar integração com Correios</Label>
              <p className="text-sm text-muted-foreground">
                Habilita o cálculo automático de frete nos orçamentos
              </p>
            </div>
            <Switch
              id="enabled"
              checked={config.enabled}
              onCheckedChange={(checked) => updateConfig('enabled', checked)}
            />
          </div>

          <Separator />

          {/* Credenciais de Acesso */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Credenciais de Acesso</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="user">Usuário</Label>
                <Input
                  id="user"
                  type="text"
                  value={config.user}
                  onChange={(e) => updateConfig('user', e.target.value)}
                  placeholder="Usuário do contrato com os Correios"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="access_code">Código de Acesso à API</Label>
                <Input
                  id="access_code"
                  type="password"
                  value={config.access_code}
                  onChange={(e) => updateConfig('access_code', e.target.value)}
                  placeholder="Código de acesso fornecido pelos Correios"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cartao_postagem">Cartão de Postagem</Label>
                <Input
                  id="cartao_postagem"
                  type="text"
                  value={config.cartao_postagem}
                  onChange={(e) => updateConfig('cartao_postagem', e.target.value)}
                  placeholder="Número do cartão de postagem"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cep_origem">CEP de Origem</Label>
                <Input
                  id="cep_origem"
                  type="text"
                  value={config.cep_origem}
                  onChange={(e) => updateConfig('cep_origem', e.target.value)}
                  placeholder="00000-000"
                  maxLength={9}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Configurações de Unidades */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Configurações de Unidades</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight_unit">Unidade de Peso</Label>
                <Select value={config.weight_unit} onValueChange={(value) => updateConfig('weight_unit', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kg">Quilograma (kg)</SelectItem>
                    <SelectItem value="g">Grama (g)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dimension_unit">Unidade de Dimensão</Label>
                <Select value={config.dimension_unit} onValueChange={(value) => updateConfig('dimension_unit', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a unidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cm">Centímetro (cm)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Moeda</Label>
                <Select value={config.currency} onValueChange={(value) => updateConfig('currency', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a moeda" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="R$">Real (R$)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="packaging_type">Tipo de Empacotamento</Label>
                <Select value={config.packaging_type} onValueChange={(value) => updateConfig('packaging_type', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="real">Real (dimensões reais)</SelectItem>
                    <SelectItem value="cubagem">Cubagem (peso cubado)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="additional_value">Valor Adicional (R$)</Label>
                <Input
                  id="additional_value"
                  type="number"
                  step="0.01"
                  value={config.additional_value}
                  onChange={(e) => updateConfig('additional_value', parseFloat(e.target.value) || 0)}
                  placeholder="0,00"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="additional_days">Prazo Adicional (dias)</Label>
                <Input
                  id="additional_days"
                  type="number"
                  value={config.additional_days}
                  onChange={(e) => updateConfig('additional_days', parseInt(e.target.value) || 0)}
                  placeholder="0"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Serviços Disponíveis */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Serviços Disponíveis</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="pac_enabled">PAC</Label>
                  <p className="text-sm text-muted-foreground">
                    Encomenda Econômica
                  </p>
                </div>
                <Switch
                  id="pac_enabled"
                  checked={config.pac_enabled}
                  onCheckedChange={(checked) => updateConfig('pac_enabled', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="sedex_enabled">SEDEX</Label>
                  <p className="text-sm text-muted-foreground">
                    Encomenda Expressa
                  </p>
                </div>
                <Switch
                  id="sedex_enabled"
                  checked={config.sedex_enabled}
                  onCheckedChange={(checked) => updateConfig('sedex_enabled', checked)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Ações */}
          <div className="flex gap-3">
            <Button onClick={saveConfiguration} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Salvando...' : 'Salvar Configurações'}
            </Button>

            <Button 
              variant="outline" 
              onClick={testConfiguration} 
              disabled={testing || !config.enabled}
            >
              <TestTube className="h-4 w-4 mr-2" />
              {testing ? 'Testando...' : 'Testar Configuração'}
            </Button>
          </div>

          {/* Informações Adicionais */}
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Informações Importantes:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Você precisa ter um contrato ativo com os Correios</li>
              <li>• As credenciais são fornecidas pelos Correios após a contratação</li>
              <li>• O CEP de origem deve ser o local de onde os produtos serão enviados</li>
              <li>• O teste utiliza um CEP de destino padrão (Paulista - SP)</li>
            </ul>
          </div>

          {/* Manual de Configuração */}
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <h4 className="font-semibold mb-3 text-blue-900">📋 Manual de Configuração Passo a Passo</h4>
            
            <div className="space-y-4 text-sm">
              <div>
                <h5 className="font-medium text-blue-800 mb-2">1️⃣ Pré-requisitos (antes de configurar)</h5>
                <ul className="text-blue-700 space-y-1 ml-4">
                  <li>• <strong>Contrato ativo</strong> com os Correios para serviços de encomenda</li>
                  <li>• <strong>Credenciais de acesso</strong> à API (usuário e senha)</li>
                  <li>• <strong>Cartão de postagem</strong> ativo fornecido pelos Correios</li>
                  <li>• <strong>CEP de origem</strong> do local de envio dos produtos</li>
                </ul>
              </div>

                <div>
                  <h5 className="font-medium text-blue-800 mb-2">2️⃣ Como obter as credenciais</h5>
                  <ul className="text-blue-700 space-y-1 ml-4">
                    <li>• Acesse o <strong>Portal de Soluções dos Correios</strong>: <em>solucoes.correios.com.br</em></li>
                    <li>• Faça login ou crie uma conta empresarial</li>
                    <li>• Acesse <strong>"Meus Contratos"</strong> → <strong>"API de Fretes"</strong></li>
                    <li>• <strong>Contrate o serviço</strong> de API para cálculo de fretes</li>
                    <li>• Aguarde aprovação e receba as <strong>credenciais por email</strong>:</li>
                    <li className="ml-4">- Usuário (login empresarial)</li>
                    <li className="ml-4">- Código de acesso à API</li>
                    <li className="ml-4">- Cartão de postagem</li>
                  </ul>
                </div>

                <div>
                  <h5 className="font-medium text-blue-800 mb-2">3️⃣ Configuração no sistema</h5>
                  <ol className="text-blue-700 space-y-1 ml-4">
                    <li>1. Ative a integração usando o switch acima</li>
                    <li>2. Preencha as credenciais recebidas dos Correios</li>
                    <li>3. Informe o CEP de origem (local de envio)</li>
                    <li>4. Configure as unidades (peso: kg/g, dimensão: cm)</li>
                    <li>5. Defina tipo de empacotamento (real ou cubagem)</li>
                    <li>6. Configure valores e prazos adicionais se necessário</li>
                    <li>7. Escolha os serviços (PAC e/ou SEDEX)</li>
                    <li>8. Clique em "Testar Configuração"</li>
                    <li>9. Se o teste passou, clique em "Salvar Configurações"</li>
                  </ol>
                </div>

                <div>
                  <h5 className="font-medium text-blue-800 mb-2">4️⃣ Preparação dos produtos</h5>
                  <ul className="text-blue-700 space-y-1 ml-4">
                    <li>• Acesse <strong>Produtos → Editar Produto</strong></li>
                    <li>• Na seção <strong>"Medidas"</strong>, preencha:</li>
                    <li className="ml-4">- <strong>Peso</strong> (kg ou g) - <strong>obrigatório</strong></li>
                    <li className="ml-4">- Largura (cm) - <strong>obrigatório</strong></li>
                    <li className="ml-4">- Comprimento (cm) - <strong>obrigatório</strong></li>
                    <li className="ml-4">- Espessura (cm) - <strong>obrigatório</strong></li>
                    <li>• Produtos sem peso e dimensões <strong>não calcularão frete</strong></li>
                  </ul>
                </div>

                <div>
                  <h5 className="font-medium text-blue-800 mb-2">5️⃣ Usando nos orçamentos</h5>
                  <ul className="text-blue-700 space-y-1 ml-4">
                    <li>• Crie um orçamento e adicione produtos</li>
                    <li>• Selecione primeiro a forma de envio:</li>
                    <li className="ml-4">- <strong>PAC:</strong> Aparecerá campo para CEP</li>
                    <li className="ml-4">- <strong>SEDEX:</strong> Aparecerá campo para CEP</li>
                    <li className="ml-4">- <strong>Outras opções:</strong> Mantém como antes</li>
                    <li>• Para PAC/SEDEX, digite CEP ou use "CEP do Cliente"</li>
                    <li>• Clique <strong>"Calcular Frete"</strong></li>
                    <li>• O valor será calculado automaticamente</li>
                  </ul>
                </div>
            </div>
          </div>

          {/* Resolução de Problemas */}
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <h4 className="font-semibold mb-3 text-yellow-900">🔧 Resolução de Problemas Comuns</h4>
            
            <div className="space-y-3 text-sm">
              <div>
                <strong className="text-yellow-800">❌ "Configuração não encontrada"</strong>
                <ul className="text-yellow-700 ml-4 mt-1">
                  <li>• Verifique se salvou as configurações</li>
                  <li>• Confirme se ativou a integração</li>
                </ul>
              </div>

              <div>
                <strong className="text-yellow-800">❌ "Configuração incompleta"</strong>
                <ul className="text-yellow-700 ml-4 mt-1">
                  <li>• Preencha todos os campos obrigatórios</li>
                  <li>• Verifique usuário, senha, cartão e CEP origem</li>
                </ul>
              </div>

              <div>
                <strong className="text-yellow-800">❌ "CEP inválido"</strong>
                <ul className="text-yellow-700 ml-4 mt-1">
                  <li>• CEP deve ter 8 dígitos (formato: 00000-000)</li>
                  <li>• Verifique se o CEP existe</li>
                </ul>
              </div>

              <div>
                <strong className="text-yellow-800">❌ "Frete não aparece no orçamento"</strong>
                <ul className="text-yellow-700 ml-4 mt-1">
                  <li>• Verifique se os produtos têm dimensões cadastradas</li>
                  <li>• Adicione pelo menos 1 produto no orçamento</li>
                  <li>• Teste a configuração dos Correios</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Links Úteis */}
          <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
            <h4 className="font-semibold mb-3 text-green-900">🔗 Links Úteis</h4>
            <div className="space-y-2 text-sm">
              <div>
                <strong className="text-green-800">Portal de Soluções:</strong>
                <span className="text-green-700 ml-2">solucoes.correios.com.br</span>
              </div>
              <div>
                <strong className="text-green-800">Site dos Correios:</strong>
                <span className="text-green-700 ml-2">www.correios.com.br</span>
              </div>
              <div>
                <strong className="text-green-800">Para Empresas:</strong>
                <span className="text-green-700 ml-2">www.correios.com.br/para-sua-empresa</span>
              </div>
              <div>
                <strong className="text-green-800">API de Fretes:</strong>
                <span className="text-green-700 ml-2">solucoes.correios.com.br → Meus Contratos → API de Fretes</span>
              </div>
              <div>
                <strong className="text-green-800">Central de Atendimento:</strong>
                <span className="text-green-700 ml-2">3003-0100 (capitais) ou 0800-725-7282</span>
              </div>
              <div>
                <strong className="text-green-800">Suporte Técnico:</strong>
                <span className="text-green-700 ml-2">0800-725-0100 ou api@correios.com.br</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CorreiosConfigurationTab;