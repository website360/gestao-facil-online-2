import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, Calculator, Users } from 'lucide-react';
import { useCorreiosShipping } from '@/hooks/useCorreiosShipping';
import { formatCurrency } from '@/lib/formatters';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ProductDimensionsValidator from './ProductDimensionsValidator';
import CorreiosIntegrationInfo from './CorreiosIntegrationInfo';

interface ShippingOption {
  service_name: string;
  service_code: string;
  price: number;
  delivery_time: number;
  error?: string;
}

interface ConditionalShippingSectionProps {
  clientId: string;
  shippingOptionId: string;
  onShippingChange: (optionId: string) => void;
  onShippingCostChange: (cost: number) => void;
  cepDestino: string;
  onCepChange: (cep: string) => void;
  shippingOptions: Array<{ id: string; name: string; price: number }>;
  products: Array<{
    id: string;
    name?: string;
    weight?: number;
    width?: number;
    length?: number;
    height?: number;
    diameter?: number;
  }>;
  items: Array<{
    product_id: string;
    quantity: number;
  }>;
  readonly?: boolean;
}

const ConditionalShippingSection = ({
  clientId,
  shippingOptionId,
  onShippingChange,
  onShippingCostChange,
  cepDestino,
  onCepChange,
  shippingOptions,
  products,
  items
}: ConditionalShippingSectionProps) => {
  const [cep, setCep] = useState(cepDestino);
  const [correiosOptions, setCorreiosOptions] = useState<ShippingOption[]>([]);
  const [clientCeps, setClientCeps] = useState<Array<{ cep: string; isMain: boolean }>>([]);
  const [isCorreiosEnabled, setIsCorreiosEnabled] = useState(false);
  const [showCepField, setShowCepField] = useState(false);
  
  const { calculateShipping, isCorreiosEnabled: checkCorreiosEnabled, loading } = useCorreiosShipping();

  // Verificar se a opção selecionada é PAC ou SEDEX
  const selectedOption = shippingOptions.find(opt => opt.id === shippingOptionId);
  const isCorreiosOption = selectedOption && (
    selectedOption.name.toLowerCase().includes('pac') || 
    selectedOption.name.toLowerCase().includes('sedex')
  );

  useEffect(() => {
    checkIfEnabled();
  }, []);

  useEffect(() => {
    if (clientId) {
      loadClientCeps();
    }
  }, [clientId]);

  useEffect(() => {
    setCep(cepDestino);
  }, [cepDestino]);

  useEffect(() => {
    // Mostrar campo CEP apenas se for PAC ou SEDEX
    setShowCepField(isCorreiosOption && isCorreiosEnabled);
    
    // Limpar opções dos Correios se não for opção de Correios
    if (!isCorreiosOption) {
      setCorreiosOptions([]);
    }
  }, [isCorreiosOption, isCorreiosEnabled]);

  const checkIfEnabled = async () => {
    const enabled = await checkCorreiosEnabled();
    setIsCorreiosEnabled(enabled);
  };

  const loadClientCeps = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('cep')
        .eq('id', clientId)
        .single();

      if (error) throw error;

      if (data?.cep) {
        setClientCeps([{ cep: data.cep, isMain: true }]);
      }
    } catch (error) {
      console.error('Error loading client CEPs:', error);
    }
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
    onCepChange(formatted);
  };

  const useClientCep = (clientCep: string) => {
    const formatted = formatCep(clientCep);
    setCep(formatted);
    onCepChange(formatted);
    toast.success('CEP do cliente selecionado');
  };

  const calculateDimensions = () => {
    let totalWeight = 0;
    let maxWidth = 0;
    let maxLength = 0;
    let maxHeight = 0;
    let missingDimensions: string[] = [];

    console.log('=== CONDITIONAL SHIPPING - CÁLCULO DE DIMENSÕES DEBUG ===');
    console.log('Produtos disponíveis:', products);
    console.log('Itens do orçamento:', items);

    items.forEach(item => {
      const product = products.find(p => p.id === item.product_id);
      if (product) {
        console.log(`DEBUG CONDITIONAL - Produto ${product.name || product.id}:`, {
          weight: product.weight,
          width: product.width,
          length: product.length,
          height: product.height,
          quantity: item.quantity
        });

        // Peso - obrigatório
        const productWeight = product.weight;
        console.log('DEBUG CONDITIONAL - Peso:', productWeight, 'Válido:', !(!productWeight || productWeight <= 0));
        if (!productWeight || productWeight <= 0) {
          missingDimensions.push(`${product.name || product.id}: peso`);
          console.log('DEBUG CONDITIONAL - Peso FALTANDO para:', product.name || product.id);
        } else {
          totalWeight += item.quantity * productWeight;
        }

        // Largura - obrigatória
        const productWidth = product.width;
        console.log('DEBUG CONDITIONAL - Largura:', productWidth, 'Válida:', !(!productWidth || productWidth <= 0));
        if (!productWidth || productWidth <= 0) {
          missingDimensions.push(`${product.name || product.id}: largura`);
          console.log('DEBUG CONDITIONAL - Largura FALTANDO para:', product.name || product.id);
        } else {
          maxWidth = Math.max(maxWidth, productWidth);
        }

        // Comprimento - obrigatório
        const productLength = product.length;
        console.log('DEBUG CONDITIONAL - Comprimento:', productLength, 'Válido:', !(!productLength || productLength <= 0));
        if (!productLength || productLength <= 0) {
          missingDimensions.push(`${product.name || product.id}: comprimento`);
          console.log('DEBUG CONDITIONAL - Comprimento FALTANDO para:', product.name || product.id);
        } else {
          maxLength = Math.max(maxLength, productLength);
        }

        // Altura - obrigatória (usar a maior altura, não somar)
        const productHeight = product.height;
        console.log('DEBUG CONDITIONAL - Altura:', productHeight, 'Válida:', !(!productHeight || productHeight <= 0));
        if (!productHeight || productHeight <= 0) {
          missingDimensions.push(`${product.name || product.id}: altura`);
          console.log('DEBUG CONDITIONAL - Altura FALTANDO para:', product.name || product.id);
        } else {
          maxHeight = Math.max(maxHeight, productHeight);
        }
      } else {
        missingDimensions.push(`Produto não encontrado: ${item.product_id}`);
        console.log('DEBUG CONDITIONAL - Produto não encontrado:', item.product_id);
      }
    });

    // SÓ RETORNAR DIMENSÕES SE TODAS ESTIVEREM PREENCHIDAS
    console.log('DEBUG CONDITIONAL - Dimensões faltando:', missingDimensions);
    console.log('DEBUG CONDITIONAL - Quantidade de dimensões faltando:', missingDimensions.length);
    
    if (missingDimensions.length > 0) {
      console.log('DEBUG CONDITIONAL - RETORNANDO hasAllDimensions = false');
      return {
        dimensions: null,
        missingDimensions,
        hasAllDimensions: false
      };
    }

    // NUNCA aplicar valores padrão - só usar as dimensões REAIS dos produtos
    const dimensions = {
      peso: totalWeight,
      altura: maxHeight,
      largura: maxWidth,
      comprimento: maxLength
    };

    console.log('DEBUG CONDITIONAL - Dimensões calculadas:', dimensions);
    console.log('DEBUG CONDITIONAL - RETORNANDO hasAllDimensions = true');

    return {
      dimensions,
      missingDimensions,
      hasAllDimensions: true
    };
  };

  const handleCalculate = async () => {
    if (!cep || cep.length < 8) {
      toast.error('Informe um CEP válido');
      return;
    }

    const { dimensions, missingDimensions, hasAllDimensions } = calculateDimensions();
    
    if (!hasAllDimensions) {
      toast.error(`Não é possível calcular o frete. Dimensões faltando: ${missingDimensions.join(', ')}`);
      return;
    }

    if (!dimensions) {
      toast.error('Erro ao calcular dimensões dos produtos');
      return;
    }
    
    const options = await calculateShipping({
      cep_destino: cep,
      ...dimensions
    });

    setCorreiosOptions(options);
  };

  const selectCorreiosOption = (option: ShippingOption) => {
    if (!option.error) {
      onShippingCostChange(option.price);
      toast.success(`${option.service_name} selecionado - ${formatCurrency(option.price)}`);
    }
  };

  // Renderizar apenas se for PAC/SEDEX e Correios estiver habilitado
  if (!showCepField) {
    return null;
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5" />
          Cálculo de Frete - {selectedOption?.name}
        </CardTitle>
        <CardDescription>
          Informe o CEP de destino para calcular automaticamente o valor do frete
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Informações sobre integração dos Correios */}
        <CorreiosIntegrationInfo />
        
        {/* Validador de Dimensões */}
        <ProductDimensionsValidator products={products} items={items} />
        {/* CEP de Destino */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          
          {/* Botão usar CEP cadastrado */}
          {clientCeps.length > 0 && (
            <div className="space-y-2">
              <Label>CEPs Cadastrados</Label>
              <Button 
                type="button"
                variant="outline" 
                onClick={() => useClientCep(clientCeps[0].cep)}
                className="w-full"
              >
                <Users className="h-4 w-4 mr-2" />
                Usar CEP do Cliente
              </Button>
            </div>
          )}
          
          <div className="flex items-end">
            <Button 
              type="button"
              onClick={handleCalculate} 
              disabled={loading || !cep || cep.length < 8 || items.length === 0 || !calculateDimensions().hasAllDimensions}
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

        {/* Informações do Cálculo */}
        {items.length > 0 && (
          <div className="p-3 bg-muted/50 rounded-lg">
            <div className="text-sm text-muted-foreground space-y-1">
              <p>
                <strong>Itens:</strong> {items.length} produto(s)
                {calculateDimensions().hasAllDimensions && calculateDimensions().dimensions && (
                  <span> • <strong> Peso total:</strong> {calculateDimensions().dimensions.peso}kg</span>
                )}
              </p>
              {calculateDimensions().hasAllDimensions && calculateDimensions().dimensions && (
                <p>
                  <strong>Dimensões:</strong> {calculateDimensions().dimensions.largura}cm (L) × 
                  {calculateDimensions().dimensions.comprimento}cm (C) × {calculateDimensions().dimensions.altura}cm (A)
                </p>
              )}
              {calculateDimensions().hasAllDimensions ? (
                <p className="text-xs text-green-600">
                  ✅ Todos os produtos têm dimensões completas para cálculo preciso
                </p>
              ) : (
                <p className="text-xs text-red-600">
                  ❌ Alguns produtos não têm todas as dimensões. Cadastre peso, largura, comprimento e altura para calcular o frete.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Valor Calculado */}
        {correiosOptions.length > 0 && (
          <div className="space-y-3">
            <Label>Valor Calculado</Label>
            <div className="grid gap-3">
              {correiosOptions
                .filter(option => 
                  (selectedOption?.name.toLowerCase().includes('pac') && option.service_name.toLowerCase().includes('pac')) ||
                  (selectedOption?.name.toLowerCase().includes('sedex') && option.service_name.toLowerCase().includes('sedex'))
                )
                .map((option) => (
                <div
                  key={option.service_code}
                  className="p-4 border rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{option.service_name}</span>
                          {option.error ? (
                            <Badge variant="destructive">Erro</Badge>
                          ) : (
                            <Badge variant="secondary">Calculado</Badge>
                          )}
                        </div>
                        {option.error ? (
                          <p className="text-sm text-destructive">{option.error}</p>
                        ) : (
                          <p className="text-sm text-muted-foreground">
                            Entrega em {option.delivery_time} dias úteis
                          </p>
                        )}
                      </div>
                    </div>
                    {!option.error && (
                      <div className="flex items-center gap-3">
                        <div className="text-lg font-bold">
                          {formatCurrency(option.price)}
                        </div>
                        <Button 
                          type="button"
                          onClick={() => selectCorreiosOption(option)}
                          size="sm"
                        >
                          Aplicar Valor
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ConditionalShippingSection;