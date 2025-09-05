import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Percent, Save } from 'lucide-react';

const DiscountConfigurationTab = () => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [maxDiscount, setMaxDiscount] = useState(10); // Valor único para ambos os tipos

  useEffect(() => {
    fetchConfigurations();
  }, []);

  const fetchConfigurations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('system_configurations')
        .select('key, value')
        .eq('key', 'max_discount_sales');

      if (error) throw error;

      if (data && data.length > 0) {
        setMaxDiscount(Number(data[0].value));
      }
    } catch (error) {
      console.error('Error fetching configurations:', error);
      toast.error('Erro ao carregar configurações');
    } finally {
      setLoading(false);
    }
  };

  const saveConfiguration = async (value: number) => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('system_configurations')
        .upsert({
          key: 'max_discount_sales',
          value: String(value),
          description: 'Limite máximo de desconto (geral e individual) que vendedores podem aplicar (%)'
        }, { onConflict: 'key' });

      if (error) throw error;

      toast.success('Configuração salva com sucesso!');
    } catch (error) {
      console.error('Error saving configuration:', error);
      toast.error('Erro ao salvar configuração');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    if (maxDiscount < 0 || maxDiscount > 100) {
      toast.error('O valor deve estar entre 0 e 100%');
      return;
    }
    await saveConfiguration(maxDiscount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
        <span className="ml-3 text-gray-600">Carregando configurações...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Percent className="h-5 w-5" />
            Configurações de Desconto
          </CardTitle>
          <CardDescription>
            Configure os limites de desconto para vendedores nos orçamentos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-800 mb-2">Informação Importante</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <strong>Admin e Gerente:</strong> Podem aplicar qualquer valor de desconto</li>
              <li>• <strong>Vendedor:</strong> Limitado pelo valor configurado abaixo (geral e individual)</li>
              <li>• <strong>Cliente:</strong> Não tem acesso aos campos de desconto</li>
            </ul>
          </div>

          <Separator />

          <div className="max-w-md">
            <div className="space-y-4">
              <div>
                <Label htmlFor="max_discount">
                  Limite de Desconto para Vendedores (%)
                </Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    id="max_discount"
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={maxDiscount}
                    onChange={(e) => setMaxDiscount(Number(e.target.value))}
                    placeholder="Ex: 10"
                  />
                  <Button
                    onClick={handleSave}
                    disabled={saving}
                    size="sm"
                  >
                    <Save className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Este limite se aplica tanto ao desconto geral quanto ao desconto individual por item
                </p>
              </div>
            </div>
          </div>

          <Separator />

          <div className="bg-yellow-50 p-4 rounded-lg">
            <h4 className="font-semibold text-yellow-800 mb-2">Como Funciona</h4>
            <div className="text-sm text-yellow-700 space-y-2">
              <p><strong>Desconto Geral:</strong> Aplicado a todo o orçamento, reduzindo o valor total proporcionalmente.</p>
              <p><strong>Desconto Individual:</strong> Aplicado item por item, permitindo descontos específicos para produtos diferentes.</p>
              <p><strong>Limite Único:</strong> O mesmo valor configurado se aplica tanto ao desconto geral quanto ao individual.</p>
              <p><strong>Validação:</strong> O sistema impedirá que vendedores ultrapassem o limite configurado.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DiscountConfigurationTab;