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

interface BudgetShippingSectionProps {
  clientId: string;
  cepDestino: string;
  onCepChange: (cep: string) => void;
  onShippingSelected: (option: ShippingOption | null) => void;
  selectedShipping: ShippingOption | null;
  products: Array<{
    id: string;
    name?: string;
    weight?: number;
    width?: number;
    length?: number;
    height?: number;
  }>;
  items: Array<{
    product_id: string;
    quantity: number;
  }>;
}

const BudgetShippingSection = ({
  clientId,
  cepDestino,
  onCepChange,
  onShippingSelected,
  selectedShipping,
  products,
  items
}: BudgetShippingSectionProps) => {
  const [cep, setCep] = useState(cepDestino);
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([]);
  const [clientCeps, setClientCeps] = useState<Array<{ cep: string; isMain: boolean }>>([]);
  const [isEnabled, setIsEnabled] = useState(false);
  
  const { calculateShipping, isCorreiosEnabled, loading } = useCorreiosShipping();

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

  const checkIfEnabled = async () => {
    const enabled = await isCorreiosEnabled();
    setIsEnabled(enabled);
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
    // Calcular dimensões baseado nos produtos do orçamento
    let totalWeight = 0;
    let maxWidth = 0;
    let maxLength = 0;
    let totalHeight = 0;
    let missingDimensions: string[] = [];

    console.log('=== CÁLCULO DE DIMENSÕES DEBUG ===');
    console.log('Produtos disponíveis:', products);
    console.log('Itens do orçamento:', items);

    items.forEach(item => {
      const product = products.find(p => p.id === item.product_id);
      if (product) {
        console.log(`DEBUG Produto ${product.name || product.id}:`, {
          weight: product.weight,
          width: product.width,
          length: product.length,
          height: product.height,
          quantity: item.quantity
        });

        // Peso - obrigatório
        const productWeight = product.weight;
        console.log('DEBUG - Peso:', productWeight, 'Válido:', !(!productWeight || productWeight <= 0));
        if (!productWeight || productWeight <= 0) {
          missingDimensions.push(`${product.name || product.id}: peso`);
          console.log('DEBUG - Peso FALTANDO para:', product.name || product.id);
        } else {
          totalWeight += item.quantity * productWeight;
        }

        // Largura - obrigatória
        const productWidth = product.width;
        console.log('DEBUG - Largura:', productWidth, 'Válida:', !(!productWidth || productWidth <= 0));
        if (!productWidth || productWidth <= 0) {
          missingDimensions.push(`${product.name || product.id}: largura`);
          console.log('DEBUG - Largura FALTANDO para:', product.name || product.id);
        } else {
          maxWidth = Math.max(maxWidth, productWidth);
        }

        // Comprimento - obrigatório
        const productLength = product.length;
        console.log('DEBUG - Comprimento:', productLength, 'Válido:', !(!productLength || productLength <= 0));
        if (!productLength || productLength <= 0) {
          missingDimensions.push(`${product.name || product.id}: comprimento`);
          console.log('DEBUG - Comprimento FALTANDO para:', product.name || product.id);
        } else {
          maxLength = Math.max(maxLength, productLength);
        }

        // Altura - obrigatória
        const productHeight = product.height;
        console.log('DEBUG - Altura:', productHeight, 'Válida:', !(!productHeight || productHeight <= 0));
        if (!productHeight || productHeight <= 0) {
          missingDimensions.push(`${product.name || product.id}: altura`);
          console.log('DEBUG - Altura FALTANDO para:', product.name || product.id);
        } else {
          totalHeight += item.quantity * productHeight;
        }
      } else {
        missingDimensions.push(`Produto não encontrado: ${item.product_id}`);
      }
    });

    // SÓ CRIAR DIMENSÕES SE TODAS ESTIVEREM PREENCHIDAS
    console.log('DEBUG - Dimensões faltando:', missingDimensions);
    console.log('DEBUG - Quantidade de dimensões faltando:', missingDimensions.length);
    
    if (missingDimensions.length > 0) {
      console.log('DEBUG - RETORNANDO hasAllDimensions = false');
      return {
        dimensions: null,
        missingDimensions,
        hasAllDimensions: false
      };
    }

    // NUNCA aplicar valores padrão - só usar as dimensões REAIS dos produtos
    const dimensions = {
      peso: totalWeight,
      altura: totalHeight,
      largura: maxWidth,
      comprimento: maxLength
    };

    console.log('DEBUG - Dimensões calculadas:', dimensions);
    console.log('DEBUG - RETORNANDO hasAllDimensions = true');
    
    return {
      dimensions,
      missingDimensions,
      hasAllDimensions: missingDimensions.length === 0
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

    setShippingOptions(options);
  };

  const selectShippingOption = (option: ShippingOption) => {
    if (!option.error) {
      onShippingSelected(option);
      toast.success(`${option.service_name} selecionado`);
    }
  };

  if (!isEnabled) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Cálculo de Frete
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
          <MapPin className="h-5 w-5" />
          Cálculo de Frete - Correios
        </CardTitle>
        <CardDescription>
          Informe o CEP de destino para calcular automaticamente os valores de PAC e SEDEX
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
                {calculateDimensions().hasAllDimensions && (
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

        {/* Opções de Frete */}
        {shippingOptions.length > 0 && (
          <div className="space-y-3">
            <Label>Opções de Frete Disponíveis</Label>
            <div className="grid gap-3">
              {shippingOptions.map((option) => (
                <div
                  key={option.service_code}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedShipping?.service_code === option.service_code
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => selectShippingOption(option)}
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
                          <p className="text-sm text-muted-foreground">
                            Entrega em {option.delivery_time} dias úteis
                          </p>
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

        {/* Frete Selecionado */}
        {selectedShipping && !selectedShipping.error && (
          <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-semibold">
                  Frete Selecionado: {selectedShipping.service_name}
                </span>
                <p className="text-sm text-muted-foreground">
                  Entrega em {selectedShipping.delivery_time} dias úteis
                </p>
              </div>
              <div className="text-lg font-bold text-primary">
                {formatCurrency(selectedShipping.price)}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BudgetShippingSection;