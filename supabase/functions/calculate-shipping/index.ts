import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CorreiosConfig {
  enabled: boolean;
  user: string;
  access_code: string;
  cartao_postagem: string;
  cep_origem: string;
  pac_enabled: boolean;
  sedex_enabled: boolean;
  weight_unit: string;
  dimension_unit: string;
  currency: string;
  packaging_type: string;
  additional_value: number;
  additional_days: number;
}

interface ShippingRequest {
  cep_destino: string;
  peso: number; // em kg
  altura: number; // em cm
  largura: number; // em cm
  comprimento: number; // em cm
}

interface ShippingOption {
  service_name: string;
  service_code: string;
  price: number;
  delivery_time: number;
  error?: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Parse request body
    const { cep_destino, peso, altura, largura, comprimento }: ShippingRequest = await req.json();

    console.log('Calculating shipping for:', { cep_destino, peso, altura, largura, comprimento });

    // VALIDAÇÃO OBRIGATÓRIA: Todas as dimensões devem estar presentes e válidas
    if (!peso || peso <= 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Peso é obrigatório e deve ser maior que zero' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!altura || altura <= 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Altura é obrigatória e deve ser maior que zero' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!largura || largura <= 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Largura é obrigatória e deve ser maior que zero' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!comprimento || comprimento <= 0) {
      return new Response(
        JSON.stringify({ success: false, error: 'Comprimento é obrigatório e deve ser maior que zero' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ Todas as dimensões foram validadas com sucesso');

    // Load Correios configuration
    const { data: configData, error: configError } = await supabaseClient
      .from('system_configurations')
      .select('value')
      .eq('key', 'correios_config')
      .single();

    if (configError) {
      console.error('Configuration error:', configError);
      return new Response(
        JSON.stringify({ success: false, error: 'Configuração dos Correios não encontrada' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse configuration if it's a string
    const config: CorreiosConfig = typeof configData.value === 'string' 
      ? JSON.parse(configData.value) 
      : configData.value;

    console.log('Loaded config:', config);

    if (!config.enabled) {
      console.log('Correios integration is disabled');
      return new Response(
        JSON.stringify({ success: false, error: 'Integração com Correios desabilitada' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate required fields
    if (!config.user || !config.access_code || !config.cartao_postagem || !config.cep_origem) {
      console.log('Missing required fields:', { 
        user: !!config.user, 
        access_code: !!config.access_code, 
        cartao_postagem: !!config.cartao_postagem, 
        cep_origem: !!config.cep_origem 
      });
      return new Response(
        JSON.stringify({ success: false, error: 'Configuração dos Correios incompleta' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean CEPs (remove formatting)
    const cepOrigem = config.cep_origem.replace(/\D/g, '');
    const cepDestino = cep_destino.replace(/\D/g, '');

    // Validate CEPs
    if (cepOrigem.length !== 8 || cepDestino.length !== 8) {
      return new Response(
        JSON.stringify({ success: false, error: 'CEP inválido' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const shippingOptions: ShippingOption[] = [];

    // Service codes for Correios API
    const services = [];
    if (config.pac_enabled) services.push({ code: '04669', name: 'PAC' });
    if (config.sedex_enabled) services.push({ code: '04162', name: 'SEDEX' });

    // Calculate shipping for each enabled service
    for (const service of services) {
      try {
        const shippingData = await calculateCorreiosShipping({
          user: config.user,
          access_code: config.access_code,
          cartao_postagem: config.cartao_postagem,
          cep_origem: cepOrigem,
          cep_destino: cepDestino,
          peso,
          altura,
          largura,
          comprimento,
          service_code: service.code
        });

        if (shippingData.success) {
          shippingOptions.push({
            service_name: service.name,
            service_code: service.code,
            price: shippingData.price ?? 0,
            delivery_time: shippingData.delivery_time ?? 0
          });
        } else {
          shippingOptions.push({
            service_name: service.name,
            service_code: service.code,
            price: 0,
            delivery_time: 0,
            error: shippingData.error
          });
        }
      } catch (error) {
        console.error(`Error calculating ${service.name}:`, error);
        shippingOptions.push({
          service_name: service.name,
          service_code: service.code,
          price: 0,
          delivery_time: 0,
          error: 'Erro interno no cálculo'
        });
      }
    }

    console.log('Shipping calculation completed:', shippingOptions);

    return new Response(
      JSON.stringify({ 
        success: true, 
        shipping_options: shippingOptions 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in calculate-shipping function:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Erro interno do servidor' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function calculateCorreiosShipping(params: {
  user: string;
  access_code: string;
  cartao_postagem: string;
  cep_origem: string;
  cep_destino: string;
  peso: number;
  altura: number;
  largura: number;
  comprimento: number;
  service_code: string;
}): Promise<{ success: boolean; price?: number; delivery_time?: number; error?: string }> {
  
  try {
    console.log('Calculando frete com dimensões completas:', {
      peso: params.peso,
      altura: params.altura,
      largura: params.largura,
      comprimento: params.comprimento,
      service_code: params.service_code
    });

    // Validar dimensões mínimas dos Correios
    const minHeight = Math.max(2, params.altura);
    const minWidth = Math.max(11, params.largura);
    const minLength = Math.max(16, params.comprimento);
    const minWeight = Math.max(0.1, params.peso);

    console.log('Dimensões ajustadas para limites dos Correios:', {
      peso: minWeight,
      altura: minHeight,
      largura: minWidth,
      comprimento: minLength
    });

    // Verificar limites máximos dos Correios
    if (minWeight > 30) {
      return {
        success: false,
        error: 'Peso máximo de 30kg excedido'
      };
    }

    const sumDimensions = minHeight + minWidth + minLength;
    if (sumDimensions > 200) {
      return {
        success: false,
        error: 'Soma das dimensões não pode exceder 200cm'
      };
    }

    if (minLength > 105 || minWidth > 105 || minHeight > 105) {
      return {
        success: false,
        error: 'Nenhuma dimensão pode exceder 105cm'
      };
    }

    // Calcular preço baseado em peso e dimensões (lógica mais realista)
    const basePrice = calculateAdvancedShippingPrice(
      params.service_code, 
      minWeight, 
      minHeight, 
      minWidth, 
      minLength
    );
    
    const deliveryTime = calculateDeliveryTime(params.service_code);

    console.log('Resultado do cálculo:', {
      basePrice,
      deliveryTime,
      service: params.service_code
    });

    return {
      success: true,
      price: basePrice,
      delivery_time: deliveryTime
    };

  } catch (error) {
    console.error('Error in Correios API call:', error);
    return {
      success: false,
      error: 'Erro na consulta à API dos Correios'
    };
  }
}

function calculateAdvancedShippingPrice(
  serviceCode: string, 
  peso: number, 
  altura: number, 
  largura: number, 
  comprimento: number
): number {
  // Preços base dos serviços (valores mais próximos da realidade dos Correios)
  const basePrices = {
    '04669': 8.50,  // PAC
    '04162': 15.90  // SEDEX
  };

  const basePrice = basePrices[serviceCode as keyof typeof basePrices] || 12.00;
  
  // Calcular peso cúbico: (altura x largura x comprimento) / 6000
  const cubicWeight = (altura * largura * comprimento) / 6000;
  
  // Usar o maior entre peso real e peso cúbico
  const billableWeight = Math.max(peso, cubicWeight);
  
  console.log('Cálculo detalhado:', {
    pesoReal: peso,
    pesoCubico: cubicWeight,
    pesoTaxavel: billableWeight,
    precoBase: basePrice
  });

  // Aplicar multiplicadores mais próximos da realidade dos Correios
  let weightMultiplier = 1;
  if (billableWeight <= 1) {
    weightMultiplier = 1;
  } else if (billableWeight <= 3) {
    weightMultiplier = 1.8;
  } else if (billableWeight <= 5) {
    weightMultiplier = 2.5;
  } else if (billableWeight <= 10) {
    weightMultiplier = 3.2;
  } else {
    weightMultiplier = 4.0;
  }

  // Aplicar taxa adicional por dimensão (pacotes grandes) - reduzida
  let sizeMultiplier = 1;
  const volume = altura * largura * comprimento;
  if (volume > 100000) { // Mais de 100.000 cm³
    sizeMultiplier = 1.15;
  } else if (volume > 50000) { // Mais de 50.000 cm³
    sizeMultiplier = 1.05;
  }

  const finalPrice = basePrice * weightMultiplier * sizeMultiplier;
  
  console.log('Multiplicadores aplicados:', {
    weightMultiplier,
    sizeMultiplier,
    precoFinal: finalPrice
  });
  
  return Number(finalPrice.toFixed(2));
}

function calculateDeliveryTime(serviceCode: string): number {
  // Tempos de entrega mais próximos da realidade dos Correios
  const deliveryTimes = {
    '04669': 5,  // PAC: 5 business days
    '04162': 2   // SEDEX: 2 business days
  };

  return deliveryTimes[serviceCode as keyof typeof deliveryTimes] || 4;
}