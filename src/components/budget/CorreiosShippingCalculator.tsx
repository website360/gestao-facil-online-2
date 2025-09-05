import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calculator, Truck, Clock } from 'lucide-react';
import { useCorreiosShipping } from '@/hooks/useCorreiosShipping';
import { formatCurrency } from '@/lib/formatters';

interface ShippingOption {
  service_name: string;
  service_code: string;
  price: number;
  delivery_time: number;
  error?: string;
}

interface CorreiosShippingCalculatorProps {
  onShippingSelected: (option: ShippingOption) => void;
  selectedOption?: ShippingOption | null;
  cepDestino?: string;
  peso?: number;
  altura?: number;
  largura?: number;
  comprimento?: number;
}

const CorreiosShippingCalculator = ({
  onShippingSelected,
  selectedOption,
  cepDestino = '',
  peso = 1,
  altura = 10,
  largura = 15,
  comprimento = 20
}: CorreiosShippingCalculatorProps) => {
  const [cep, setCep] = useState(cepDestino);
  const [dimensions, setDimensions] = useState({
    peso,
    altura,
    largura,
    comprimento
  });
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [isEnabled, setIsEnabled] = useState(false);

  const { calculateShipping, isCorreiosEnabled, loading } = useCorreiosShipping();

  useEffect(() => {
    checkIfEnabled();
  }, []);

  const checkIfEnabled = async () => {
    const enabled = await isCorreiosEnabled();
    setIsEnabled(enabled);
  };

  const handleCalculate = async () => {
    if (!cep || cep.length < 8) {
      return;
    }

    const options = await calculateShipping({
      cep_destino: cep,
      peso: dimensions.peso,
      altura: dimensions.altura,
      largura: dimensions.largura,
      comprimento: dimensions.comprimento
    });

    setShippingOptions(options);
  };

  const formatCep = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 5) {
      return cleaned;
    }
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5, 8)}`;
  };

  const handleCepChange = (value: string) => {
    const formatted = formatCep(value);
    setCep(formatted);
  };

  if (!isEnabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Cálculo de Frete - Correios
          </CardTitle>
          <CardDescription>
            Configure os Correios nas configurações do sistema para habilitar o cálculo automático
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Truck className="h-5 w-5" />
          Cálculo de Frete - Correios
        </CardTitle>
        <CardDescription>
          Calcule automaticamente os valores de PAC e SEDEX
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* CEP de Destino */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="cep">CEP de Destino</Label>
            <Input
              id="cep"
              value={cep}
              onChange={(e) => handleCepChange(e.target.value)}
              placeholder="00000-000"
              maxLength={9}
            />
          </div>
          <div className="flex items-end">
            <Button 
              onClick={handleCalculate} 
              disabled={loading || !cep || cep.length < 8}
              className="w-full"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Calculator className="h-4 w-4 mr-2" />
              )}
              Calcular Frete
            </Button>
          </div>
        </div>

        {/* Dimensões da Encomenda */}
        <div className="space-y-2">
          <Label>Dimensões da Encomenda (opcional)</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div>
              <Label htmlFor="peso" className="text-xs">Peso (kg)</Label>
              <Input
                id="peso"
                type="number"
                value={dimensions.peso}
                onChange={(e) => setDimensions(prev => ({
                  ...prev,
                  peso: Number(e.target.value) || 1
                }))}
                min="0.1"
                step="0.1"
              />
            </div>
            <div>
              <Label htmlFor="altura" className="text-xs">Altura (cm)</Label>
              <Input
                id="altura"
                type="number"
                value={dimensions.altura}
                onChange={(e) => setDimensions(prev => ({
                  ...prev,
                  altura: Number(e.target.value) || 10
                }))}
                min="1"
              />
            </div>
            <div>
              <Label htmlFor="largura" className="text-xs">Largura (cm)</Label>
              <Input
                id="largura"
                type="number"
                value={dimensions.largura}
                onChange={(e) => setDimensions(prev => ({
                  ...prev,
                  largura: Number(e.target.value) || 15
                }))}
                min="1"
              />
            </div>
            <div>
              <Label htmlFor="comprimento" className="text-xs">Comprimento (cm)</Label>
              <Input
                id="comprimento"
                type="number"
                value={dimensions.comprimento}
                onChange={(e) => setDimensions(prev => ({
                  ...prev,
                  comprimento: Number(e.target.value) || 20
                }))}
                min="1"
              />
            </div>
          </div>
        </div>

        {/* Opções de Frete */}
        {shippingOptions.length > 0 && (
          <div className="space-y-3">
            <Label>Opções de Frete Disponíveis</Label>
            <div className="grid gap-3">
              {shippingOptions.map((option) => (
                <div
                  key={option.service_code}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedOption?.service_code === option.service_code
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => !option.error && onShippingSelected(option)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{option.service_name}</span>
                          {option.error ? (
                            <Badge variant="destructive">Erro</Badge>
                          ) : (
                            <Badge variant="secondary">Disponível</Badge>
                          )}
                        </div>
                        {option.error ? (
                          <p className="text-sm text-destructive">{option.error}</p>
                        ) : (
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {option.delivery_time} dias úteis
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    {!option.error && (
                      <div className="text-right">
                        <div className="text-lg font-bold">
                          {formatCurrency(option.price)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Opção Selecionada */}
        {selectedOption && !selectedOption.error && (
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold">Frete Selecionado: {selectedOption.service_name}</span>
                <p className="text-sm text-muted-foreground">
                  Entrega em {selectedOption.delivery_time} dias úteis
                </p>
              </div>
              <div className="text-lg font-bold text-primary">
                {formatCurrency(selectedOption.price)}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CorreiosShippingCalculator;