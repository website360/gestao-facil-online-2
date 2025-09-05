import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Upload, Save, Loader2, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface PDFConfig {
  page?: {
    margins: { top: number; right: number; bottom: number; left: number };
  };
  header: {
    logoUrl?: string;
    height: number;
    backgroundColor: string;
    companyName: string;
    showLogo: boolean;
    variant?: 'bar' | 'banner' | 'none';
    logoPosition?: 'left' | 'center' | 'right';
    showCompanyName?: boolean;
    titleText?: string;
  };
  footer: {
    height: number;
    validityText: string;
    copyrightText: string;
  };
  fonts: {
    title: number;
    subtitle: number;
    normal: number;
    small: number;
    family?: 'helvetica' | 'times' | 'courier';
  };
  colors: {
    primary: string;
    dark: string;
    gray: string;
    secondary?: string;
  };
  sections: {
    clientInfo: {
      fontSize: number;
      backgroundColor: string;
      borderColor: string;
      borderWidth: number;
      lineSpacing: number;
      showBorder: boolean;
      padding: {
        top: number;
        right: number;
        bottom: number;
        left: number;
      };
      titleMargin: {
        top: number;
        right: number;
        bottom: number;
        left: number;
      };
    };
    paymentInfo: {
      fontSize: number;
      backgroundColor: string;
      borderColor: string;
      borderWidth: number;
      lineSpacing: number;
      showBorder: boolean;
      padding: {
        top: number;
        right: number;
        bottom: number;
        left: number;
      };
      titleMargin: {
        top: number;
        right: number;
        bottom: number;
        left: number;
      };
    };
    financialSummary: {
      fontSize: number;
      lineSpacing: number;
      labelFontSize: number;
      totalFontSize: number;
      totalColor: string;
    };
    tableHeaders: {
      fontSize: number;
      color: string;
    };
  };
  layout?: {
    sectionOrder: Array<'clientInfo' | 'itemsTable' | 'financialSummary' | 'paymentInfo' | 'notes'>;
    show: {
      clientInfo: boolean;
      itemsTable: boolean;
      financialSummary: boolean;
      paymentInfo: boolean;
      notes: boolean;
    };
    sectionSpacing: number;
  };
  table?: {
    showColumns: {
      quantity: boolean;
      unitPrice: boolean;
      discount: boolean;
      total: boolean;
    };
    columnWidths: {
      item: number;
      quantity: number;
      unitPrice: number;
      discount: number;
      total: number;
    };
    headerBackgroundColor?: string;
    zebraColor?: string;
    rowHeight?: number;
  };
}

const DEFAULT_CONFIG: PDFConfig = {
  page: {
    margins: { top: 15, right: 15, bottom: 20, left: 15 },
  },
  header: {
    height: 25,
    backgroundColor: '#0EA5E9',
    companyName: 'Sistema de Gestão',
    showLogo: true,
    variant: 'bar',
    logoPosition: 'left',
    showCompanyName: true,
    titleText: 'Proposta Comercial',
  },
  footer: {
    height: 20,
    validityText: 'Este orçamento tem validade de 30 dias a partir da data de emissão.',
    copyrightText: `Sistema de Gestão - ${new Date().getFullYear()}`,
  },
  fonts: {
    title: 17,
    subtitle: 13,
    normal: 10,
    small: 9,
    family: 'helvetica',
  },
  colors: {
    primary: '#0EA5E9',
    dark: '#1F2937',
    gray: '#6B7280',
    secondary: '#0EA5E9',
  },
  sections: {
    clientInfo: {
      fontSize: 10,
      backgroundColor: '#F7FAFC',
      borderColor: '#E2E8F0',
      borderWidth: 1,
      lineSpacing: 4,
      showBorder: true,
      padding: { top: 5, right: 5, bottom: 5, left: 5 },
      titleMargin: { top: 8, right: 0, bottom: 8, left: 0 },
    },
    paymentInfo: {
      fontSize: 9,
      backgroundColor: '#F7FAFC',
      borderColor: '#E2E8F0',
      borderWidth: 1,
      lineSpacing: 4,
      showBorder: true,
      padding: { top: 5, right: 5, bottom: 5, left: 5 },
      titleMargin: { top: 8, right: 0, bottom: 8, left: 0 },
    },
    financialSummary: {
      fontSize: 10,
      lineSpacing: 5,
      labelFontSize: 10,
      totalFontSize: 11,
      totalColor: '#FFFFFF',
    },
    tableHeaders: {
      fontSize: 10,
      color: '#1F2937',
    },
  },
  layout: {
    sectionOrder: ['clientInfo', 'itemsTable', 'financialSummary', 'paymentInfo', 'notes'],
    show: { clientInfo: true, itemsTable: true, financialSummary: true, paymentInfo: true, notes: true },
    sectionSpacing: 8,
  },
  table: {
    showColumns: { quantity: true, unitPrice: true, discount: true, total: true },
    columnWidths: { item: 50, quantity: 10, unitPrice: 15, discount: 10, total: 15 },
    headerBackgroundColor: '#0EA5E9',
    zebraColor: '#F8F8F8',
    rowHeight: 8,
  },
};

const PDFConfigurationTab = () => {
  const [config, setConfig] = useState<PDFConfig>(DEFAULT_CONFIG);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [removingLogo, setRemovingLogo] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      console.log('Carregando configurações PDF...');
      
      const { data, error } = await supabase
        .from('system_configurations')
        .select('value')
        .eq('key', 'pdf_budget_config')
        .maybeSingle();

      if (error) {
        console.error('Erro ao carregar configurações do PDF:', error);
        toast.error('Erro ao carregar configurações do PDF');
        return;
      }

      if (data?.value) {
        console.log('Dados carregados do banco:', data.value);
        
        let savedConfig: Partial<PDFConfig>;
        
        // Parse JSON se for string, ou use direto se já for objeto
        if (typeof data.value === 'string') {
          savedConfig = JSON.parse(data.value);
        } else {
          savedConfig = data.value as Partial<PDFConfig>;
        }
        
        console.log('Configuração parseada:', savedConfig);
        
        setConfig({
          page: {
            margins: { ...DEFAULT_CONFIG.page!.margins, ...(savedConfig.page?.margins || {}) },
          },
          header: { ...DEFAULT_CONFIG.header, ...(savedConfig.header || {}) },
          footer: { ...DEFAULT_CONFIG.footer, ...(savedConfig.footer || {}) },
          fonts: { ...DEFAULT_CONFIG.fonts, ...(savedConfig.fonts || {}) },
          colors: { ...DEFAULT_CONFIG.colors, ...(savedConfig.colors || {}) },
          sections: {
            clientInfo: { 
              ...DEFAULT_CONFIG.sections.clientInfo, 
              ...(savedConfig.sections?.clientInfo || {}),
              padding: { 
                ...DEFAULT_CONFIG.sections.clientInfo.padding, 
                ...(savedConfig.sections?.clientInfo?.padding || {}) 
              },
              titleMargin: { 
                ...DEFAULT_CONFIG.sections.clientInfo.titleMargin, 
                ...(savedConfig.sections?.clientInfo?.titleMargin || {}) 
              },
            },
            paymentInfo: { 
              ...DEFAULT_CONFIG.sections.paymentInfo, 
              ...(savedConfig.sections?.paymentInfo || {}),
              padding: { 
                ...DEFAULT_CONFIG.sections.paymentInfo.padding, 
                ...(savedConfig.sections?.paymentInfo?.padding || {}) 
              },
              titleMargin: { 
                ...DEFAULT_CONFIG.sections.paymentInfo.titleMargin, 
                ...(savedConfig.sections?.paymentInfo?.titleMargin || {}) 
              },
            },
            financialSummary: {
              ...DEFAULT_CONFIG.sections.financialSummary,
              ...(savedConfig.sections?.financialSummary || {}),
            },
            tableHeaders: {
              ...DEFAULT_CONFIG.sections.tableHeaders,
              ...(savedConfig.sections?.tableHeaders || {}),
            },
          },
          layout: {
            sectionOrder: savedConfig.layout?.sectionOrder || DEFAULT_CONFIG.layout!.sectionOrder,
            show: { ...DEFAULT_CONFIG.layout!.show, ...(savedConfig.layout?.show || {}) },
            sectionSpacing: savedConfig.layout?.sectionSpacing ?? DEFAULT_CONFIG.layout!.sectionSpacing,
          },
          table: {
            showColumns: { ...DEFAULT_CONFIG.table!.showColumns, ...(savedConfig.table?.showColumns || {}) },
            columnWidths: { ...DEFAULT_CONFIG.table!.columnWidths, ...(savedConfig.table?.columnWidths || {}) },
            headerBackgroundColor: savedConfig.table?.headerBackgroundColor || DEFAULT_CONFIG.table!.headerBackgroundColor,
            zebraColor: savedConfig.table?.zebraColor || DEFAULT_CONFIG.table!.zebraColor,
            rowHeight: savedConfig.table?.rowHeight ?? DEFAULT_CONFIG.table!.rowHeight,
          },
        });
        
        console.log('Configuração final carregada');
      } else {
        console.log('Nenhuma configuração salva encontrada, usando padrão');
        setConfig(DEFAULT_CONFIG);
      }
    } catch (error) {
      console.error('Erro ao carregar configurações do PDF:', error);
      toast.error('Erro ao carregar configurações do PDF');
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      console.log('Iniciando salvamento das configurações PDF...');
      
      const { data, error } = await supabase
        .from('system_configurations')
        .upsert({
          key: 'pdf_budget_config',
          value: JSON.stringify(config),
          description: 'Configurações do PDF de orçamento'
        }, {
          onConflict: 'key'
        })
        .select();

      if (error) {
        console.error('Erro SQL ao salvar configurações:', error);
        toast.error(`Erro ao salvar: ${error.message}`);
        return;
      }

      console.log('Configurações salvas com sucesso:', data);
      toast.success('Configurações do PDF salvas com sucesso!');
      
      // Recarregar as configurações para confirmar que foram salvas
      await loadConfig();
    } catch (error) {
      console.error('Erro geral ao salvar configurações:', error);
      toast.error('Erro ao salvar configurações do PDF');
    } finally {
      setSaving(false);
    }
  };

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) { // 2MB limit
      toast.error('O arquivo deve ter no máximo 2MB');
      return;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione apenas arquivos de imagem');
      return;
    }

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `pdf-logo-${Date.now()}.${fileExt}`;
      
      const { data, error } = await supabase.storage
        .from('logos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Erro no upload:', error);
        toast.error(`Erro ao fazer upload do logo: ${error.message}`);
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(fileName);

      setConfig(prev => ({
        ...prev,
        header: { ...prev.header, logoUrl: publicUrl }
      }));

      toast.success('Logo carregado com sucesso!');
    } catch (error) {
      console.error('Erro ao fazer upload do logo:', error);
      toast.error('Erro ao fazer upload do logo');
    }
  };

  const handleRemoveLogo = async () => {
    if (!config.header.logoUrl) return;

    setRemovingLogo(true);
    try {
      // Extract file name from URL to delete from storage
      const urlParts = config.header.logoUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];

      // Remove from Supabase storage
      const { error } = await supabase.storage
        .from('logos')
        .remove([fileName]);

      if (error) {
        console.error('Erro ao remover logo do storage:', error);
        // Continue anyway to remove from config
      }

      // Remove from config
      setConfig(prev => ({
        ...prev,
        header: { ...prev.header, logoUrl: undefined }
      }));

      toast.success('Logo removido com sucesso!');
    } catch (error) {
      console.error('Erro ao remover logo:', error);
      toast.error('Erro ao remover logo');
    } finally {
      setRemovingLogo(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Configurações do PDF - Orçamento</CardTitle>
          <CardDescription>
            Configure a aparência e conteúdo dos PDFs de orçamento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Header Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Cabeçalho</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyName">Nome da Empresa</Label>
                <Input
                  id="companyName"
                  value={config.header.companyName}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    header: { ...prev.header, companyName: e.target.value }
                  }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="headerHeight">Altura (px)</Label>
                <Input
                  id="headerHeight"
                  type="number"
                  min="15"
                  max="50"
                  value={config.header.height}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    header: { ...prev.header, height: parseInt(e.target.value) || 25 }
                  }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="headerColor">Cor de Fundo</Label>
              <Input
                id="headerColor"
                type="color"
                value={config.header.backgroundColor}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  header: { ...prev.header, backgroundColor: e.target.value }
                }))}
              />
            </div>

            {/* Logo upload section */}
            <div className="space-y-2">
              <Label htmlFor="logoUpload">Logo da Empresa</Label>
              
              {/* Logo Preview */}
              {config.header.logoUrl && (
                <div className="flex items-center gap-4 p-4 border rounded-lg bg-gray-50">
                  <img 
                    src={config.header.logoUrl} 
                    alt="Logo preview" 
                    className="h-12 w-auto object-contain"
                  />
                  <div className="flex-1">
                    <p className="text-sm text-green-600 font-medium">Logo carregado</p>
                    <p className="text-xs text-gray-500">Este logo será exibido no cabeçalho do PDF</p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleRemoveLogo}
                    disabled={removingLogo}
                  >
                    {removingLogo ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              )}
              
              {/* Upload Button */}
              <div className="flex items-center gap-2">
                <Input
                  id="logoUpload"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('logoUpload')?.click()}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  {config.header.logoUrl ? 'Alterar Logo' : 'Carregar Logo'}
                </Button>
                {!config.header.logoUrl && (
                  <span className="text-sm text-gray-500">Formato: JPG, PNG (máx. 2MB)</span>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Footer Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Rodapé</h3>
            
            <div className="space-y-2">
              <Label htmlFor="footerHeight">Altura (px)</Label>
              <Input
                id="footerHeight"
                type="number"
                min="15"
                max="40"
                value={config.footer.height}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  footer: { ...prev.footer, height: parseInt(e.target.value) || 20 }
                }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="validityText">Texto de Validade</Label>
              <Textarea
                id="validityText"
                value={config.footer.validityText}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  footer: { ...prev.footer, validityText: e.target.value }
                }))}
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="copyrightText">Texto de Copyright</Label>
              <Input
                id="copyrightText"
                value={config.footer.copyrightText}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  footer: { ...prev.footer, copyrightText: e.target.value }
                }))}
              />
            </div>
          </div>

          <Separator />

          {/* Font Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Fontes</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="titleFont">Título</Label>
                <Input
                  id="titleFont"
                  type="number"
                  min="12"
                  max="24"
                  value={config.fonts.title}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    fonts: { ...prev.fonts, title: parseInt(e.target.value) || 17 }
                  }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subtitleFont">Subtítulo</Label>
                <Input
                  id="subtitleFont"
                  type="number"
                  min="10"
                  max="18"
                  value={config.fonts.subtitle}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    fonts: { ...prev.fonts, subtitle: parseInt(e.target.value) || 13 }
                  }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="normalFont">Normal</Label>
                <Input
                  id="normalFont"
                  type="number"
                  min="8"
                  max="14"
                  value={config.fonts.normal}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    fonts: { ...prev.fonts, normal: parseInt(e.target.value) || 10 }
                  }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="smallFont">Pequeno</Label>
                <Input
                  id="smallFont"
                  type="number"
                  min="7"
                  max="12"
                  value={config.fonts.small}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    fonts: { ...prev.fonts, small: parseInt(e.target.value) || 9 }
                  }))}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Color Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Cores</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primaryColor">Cor Primária</Label>
                <Input
                  id="primaryColor"
                  type="color"
                  value={config.colors.primary}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    colors: { ...prev.colors, primary: e.target.value }
                  }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="darkColor">Cor Escura</Label>
                <Input
                  id="darkColor"
                  type="color"
                  value={config.colors.dark}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    colors: { ...prev.colors, dark: e.target.value }
                  }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="grayColor">Cor Cinza</Label>
                <Input
                  id="grayColor"
                  type="color"
                  value={config.colors.gray}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    colors: { ...prev.colors, gray: e.target.value }
                  }))}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Financial Summary Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Resumo Financeiro</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="financialFontSize">Tamanho da Fonte</Label>
                <Input
                  id="financialFontSize"
                  type="number"
                  min="8"
                  max="16"
                  value={config.sections.financialSummary.fontSize}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    sections: {
                      ...prev.sections,
                      financialSummary: { ...prev.sections.financialSummary, fontSize: parseInt(e.target.value) || 10 }
                    }
                  }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="financialLineSpacing">Espaçamento entre Linhas</Label>
                <Input
                  id="financialLineSpacing"
                  type="number"
                  min="2"
                  max="10"
                  value={config.sections.financialSummary.lineSpacing}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    sections: {
                      ...prev.sections,
                      financialSummary: { ...prev.sections.financialSummary, lineSpacing: parseInt(e.target.value) || 5 }
                    }
                  }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="financialLabelFontSize">Tamanho Fonte Valores</Label>
                <Input
                  id="financialLabelFontSize"
                  type="number"
                  min="8"
                  max="16"
                  value={config.sections.financialSummary.labelFontSize}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    sections: {
                      ...prev.sections,
                      financialSummary: { ...prev.sections.financialSummary, labelFontSize: parseInt(e.target.value) || 10 }
                    }
                  }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="totalFontSize">Tamanho Fonte Total Geral</Label>
                <Input
                  id="totalFontSize"
                  type="number"
                  min="8"
                  max="20"
                  value={config.sections.financialSummary.totalFontSize}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    sections: {
                      ...prev.sections,
                      financialSummary: { ...prev.sections.financialSummary, totalFontSize: parseInt(e.target.value) || 11 }
                    }
                  }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="totalColor">Cor Texto Total Geral</Label>
                <Input
                  id="totalColor"
                  type="color"
                  value={config.sections.financialSummary.totalColor}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    sections: {
                      ...prev.sections,
                      financialSummary: { ...prev.sections.financialSummary, totalColor: e.target.value }
                    }
                  }))}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Table Headers Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Cabeçalhos da Tabela</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tableHeaderFontSize">Tamanho da Fonte</Label>
                <Input
                  id="tableHeaderFontSize"
                  type="number"
                  min="8"
                  max="16"
                  value={config.sections.tableHeaders.fontSize}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    sections: {
                      ...prev.sections,
                      tableHeaders: { ...prev.sections.tableHeaders, fontSize: parseInt(e.target.value) || 10 }
                    }
                  }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tableHeaderColor">Cor do Texto</Label>
                <Input
                  id="tableHeaderColor"
                  type="color"
                  value={config.sections.tableHeaders.color}
                  onChange={(e) => setConfig(prev => ({
                    ...prev,
                    sections: {
                      ...prev.sections,
                      tableHeaders: { ...prev.sections.tableHeaders, color: e.target.value }
                    }
                  }))}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Section Styling Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Estilo das Seções</h3>
            
            {/* Client Info Section */}
            <div className="space-y-4 p-4 border rounded-lg">
              <h4 className="text-md font-medium">Dados do Cliente</h4>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientFontSize">Tamanho da Fonte</Label>
                  <Input
                    id="clientFontSize"
                    type="number"
                    min="8"
                    max="16"
                    value={config.sections.clientInfo.fontSize}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      sections: {
                        ...prev.sections,
                        clientInfo: { ...prev.sections.clientInfo, fontSize: parseInt(e.target.value) || 10 }
                      }
                    }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="clientLineSpacing">Espaçamento entre Linhas</Label>
                  <Input
                    id="clientLineSpacing"
                    type="number"
                    min="2"
                    max="8"
                    value={config.sections.clientInfo.lineSpacing}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      sections: {
                        ...prev.sections,
                        clientInfo: { ...prev.sections.clientInfo, lineSpacing: parseInt(e.target.value) || 4 }
                      }
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clientBgColor">Cor de Fundo</Label>
                  <Input
                    id="clientBgColor"
                    type="color"
                    value={config.sections.clientInfo.backgroundColor}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      sections: {
                        ...prev.sections,
                        clientInfo: { ...prev.sections.clientInfo, backgroundColor: e.target.value }
                      }
                    }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="clientBorderColor">Cor da Borda</Label>
                  <Input
                    id="clientBorderColor"
                    type="color"
                    value={config.sections.clientInfo.borderColor}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      sections: {
                        ...prev.sections,
                        clientInfo: { ...prev.sections.clientInfo, borderColor: e.target.value }
                      }
                    }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="clientBorderWidth">Espessura da Borda</Label>
                  <Input
                    id="clientBorderWidth"
                    type="number"
                    min="0"
                    max="5"
                    value={config.sections.clientInfo.borderWidth}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      sections: {
                        ...prev.sections,
                        clientInfo: { ...prev.sections.clientInfo, borderWidth: parseInt(e.target.value) || 1 }
                      }
                    }))}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="clientShowBorder"
                    checked={config.sections.clientInfo.showBorder}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      sections: {
                        ...prev.sections,
                        clientInfo: { ...prev.sections.clientInfo, showBorder: e.target.checked }
                      }
                    }))}
                  />
                  <Label htmlFor="clientShowBorder">Mostrar Borda</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Padding (px)</Label>
                <div className="grid grid-cols-4 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="clientPaddingTop" className="text-xs">Topo</Label>
                    <Input
                      id="clientPaddingTop"
                      type="number"
                      min="0"
                      max="20"
                      value={config.sections.clientInfo.padding.top}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        sections: {
                          ...prev.sections,
                          clientInfo: { 
                            ...prev.sections.clientInfo, 
                            padding: { ...prev.sections.clientInfo.padding, top: parseInt(e.target.value) || 0 }
                          }
                        }
                      }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="clientPaddingRight" className="text-xs">Direita</Label>
                    <Input
                      id="clientPaddingRight"
                      type="number"
                      min="0"
                      max="20"
                      value={config.sections.clientInfo.padding.right}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        sections: {
                          ...prev.sections,
                          clientInfo: { 
                            ...prev.sections.clientInfo, 
                            padding: { ...prev.sections.clientInfo.padding, right: parseInt(e.target.value) || 0 }
                          }
                        }
                      }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="clientPaddingBottom" className="text-xs">Baixo</Label>
                    <Input
                      id="clientPaddingBottom"
                      type="number"
                      min="0"
                      max="20"
                      value={config.sections.clientInfo.padding.bottom}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        sections: {
                          ...prev.sections,
                          clientInfo: { 
                            ...prev.sections.clientInfo, 
                            padding: { ...prev.sections.clientInfo.padding, bottom: parseInt(e.target.value) || 0 }
                          }
                        }
                      }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="clientPaddingLeft" className="text-xs">Esquerda</Label>
                    <Input
                      id="clientPaddingLeft"
                      type="number"
                      min="0"
                      max="20"
                      value={config.sections.clientInfo.padding.left}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        sections: {
                          ...prev.sections,
                          clientInfo: { 
                            ...prev.sections.clientInfo, 
                            padding: { ...prev.sections.clientInfo.padding, left: parseInt(e.target.value) || 0 }
                          }
                        }
                      }))}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Margem do Título (px)</Label>
                <div className="grid grid-cols-4 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="clientTitleMarginTop" className="text-xs">Topo</Label>
                    <Input
                      id="clientTitleMarginTop"
                      type="number"
                      min="0"
                      max="20"
                      value={config.sections.clientInfo.titleMargin.top}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        sections: {
                          ...prev.sections,
                          clientInfo: { 
                            ...prev.sections.clientInfo, 
                            titleMargin: { ...prev.sections.clientInfo.titleMargin, top: parseInt(e.target.value) || 0 }
                          }
                        }
                      }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="clientTitleMarginRight" className="text-xs">Direita</Label>
                    <Input
                      id="clientTitleMarginRight"
                      type="number"
                      min="0"
                      max="20"
                      value={config.sections.clientInfo.titleMargin.right}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        sections: {
                          ...prev.sections,
                          clientInfo: { 
                            ...prev.sections.clientInfo, 
                            titleMargin: { ...prev.sections.clientInfo.titleMargin, right: parseInt(e.target.value) || 0 }
                          }
                        }
                      }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="clientTitleMarginBottom" className="text-xs">Baixo</Label>
                    <Input
                      id="clientTitleMarginBottom"
                      type="number"
                      min="0"
                      max="20"
                      value={config.sections.clientInfo.titleMargin.bottom}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        sections: {
                          ...prev.sections,
                          clientInfo: { 
                            ...prev.sections.clientInfo, 
                            titleMargin: { ...prev.sections.clientInfo.titleMargin, bottom: parseInt(e.target.value) || 0 }
                          }
                        }
                      }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="clientTitleMarginLeft" className="text-xs">Esquerda</Label>
                    <Input
                      id="clientTitleMarginLeft"
                      type="number"
                      min="0"
                      max="20"
                      value={config.sections.clientInfo.titleMargin.left}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        sections: {
                          ...prev.sections,
                          clientInfo: { 
                            ...prev.sections.clientInfo, 
                            titleMargin: { ...prev.sections.clientInfo.titleMargin, left: parseInt(e.target.value) || 0 }
                          }
                        }
                      }))}
                    />
                  </div>
                </div>
              </div>
            </div>
            
            {/* Payment Info Section */}
            <div className="space-y-4 p-4 border rounded-lg">
              <h4 className="text-md font-medium">Informações de Pagamento e Frete</h4>
              
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="paymentFontSize">Tamanho da Fonte</Label>
                  <Input
                    id="paymentFontSize"
                    type="number"
                    min="8"
                    max="16"
                    value={config.sections.paymentInfo.fontSize}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      sections: {
                        ...prev.sections,
                        paymentInfo: { ...prev.sections.paymentInfo, fontSize: parseInt(e.target.value) || 9 }
                      }
                    }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="paymentLineSpacing">Espaçamento entre Linhas</Label>
                  <Input
                    id="paymentLineSpacing"
                    type="number"
                    min="2"
                    max="8"
                    value={config.sections.paymentInfo.lineSpacing}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      sections: {
                        ...prev.sections,
                        paymentInfo: { ...prev.sections.paymentInfo, lineSpacing: parseInt(e.target.value) || 4 }
                      }
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="paymentBgColor">Cor de Fundo</Label>
                  <Input
                    id="paymentBgColor"
                    type="color"
                    value={config.sections.paymentInfo.backgroundColor}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      sections: {
                        ...prev.sections,
                        paymentInfo: { ...prev.sections.paymentInfo, backgroundColor: e.target.value }
                      }
                    }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="paymentBorderColor">Cor da Borda</Label>
                  <Input
                    id="paymentBorderColor"
                    type="color"
                    value={config.sections.paymentInfo.borderColor}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      sections: {
                        ...prev.sections,
                        paymentInfo: { ...prev.sections.paymentInfo, borderColor: e.target.value }
                      }
                    }))}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="paymentBorderWidth">Espessura da Borda</Label>
                  <Input
                    id="paymentBorderWidth"
                    type="number"
                    min="0"
                    max="5"
                    value={config.sections.paymentInfo.borderWidth}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      sections: {
                        ...prev.sections,
                        paymentInfo: { ...prev.sections.paymentInfo, borderWidth: parseInt(e.target.value) || 1 }
                      }
                    }))}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="paymentShowBorder"
                    checked={config.sections.paymentInfo.showBorder}
                    onChange={(e) => setConfig(prev => ({
                      ...prev,
                      sections: {
                        ...prev.sections,
                        paymentInfo: { ...prev.sections.paymentInfo, showBorder: e.target.checked }
                      }
                    }))}
                  />
                  <Label htmlFor="paymentShowBorder">Mostrar Borda</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Padding (px)</Label>
                <div className="grid grid-cols-4 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="paymentPaddingTop" className="text-xs">Topo</Label>
                    <Input
                      id="paymentPaddingTop"
                      type="number"
                      min="0"
                      max="20"
                      value={config.sections.paymentInfo.padding.top}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        sections: {
                          ...prev.sections,
                          paymentInfo: { 
                            ...prev.sections.paymentInfo, 
                            padding: { ...prev.sections.paymentInfo.padding, top: parseInt(e.target.value) || 0 }
                          }
                        }
                      }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="paymentPaddingRight" className="text-xs">Direita</Label>
                    <Input
                      id="paymentPaddingRight"
                      type="number"
                      min="0"
                      max="20"
                      value={config.sections.paymentInfo.padding.right}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        sections: {
                          ...prev.sections,
                          paymentInfo: { 
                            ...prev.sections.paymentInfo, 
                            padding: { ...prev.sections.paymentInfo.padding, right: parseInt(e.target.value) || 0 }
                          }
                        }
                      }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="paymentPaddingBottom" className="text-xs">Baixo</Label>
                    <Input
                      id="paymentPaddingBottom"
                      type="number"
                      min="0"
                      max="20"
                      value={config.sections.paymentInfo.padding.bottom}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        sections: {
                          ...prev.sections,
                          paymentInfo: { 
                            ...prev.sections.paymentInfo, 
                            padding: { ...prev.sections.paymentInfo.padding, bottom: parseInt(e.target.value) || 0 }
                          }
                        }
                      }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="paymentPaddingLeft" className="text-xs">Esquerda</Label>
                    <Input
                      id="paymentPaddingLeft"
                      type="number"
                      min="0"
                      max="20"
                      value={config.sections.paymentInfo.padding.left}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        sections: {
                          ...prev.sections,
                          paymentInfo: { 
                            ...prev.sections.paymentInfo, 
                            padding: { ...prev.sections.paymentInfo.padding, left: parseInt(e.target.value) || 0 }
                          }
                        }
                      }))}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Margem do Título (px)</Label>
                <div className="grid grid-cols-4 gap-2">
                  <div className="space-y-1">
                    <Label htmlFor="paymentTitleMarginTop" className="text-xs">Topo</Label>
                    <Input
                      id="paymentTitleMarginTop"
                      type="number"
                      min="0"
                      max="20"
                      value={config.sections.paymentInfo.titleMargin.top}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        sections: {
                          ...prev.sections,
                          paymentInfo: { 
                            ...prev.sections.paymentInfo, 
                            titleMargin: { ...prev.sections.paymentInfo.titleMargin, top: parseInt(e.target.value) || 0 }
                          }
                        }
                      }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="paymentTitleMarginRight" className="text-xs">Direita</Label>
                    <Input
                      id="paymentTitleMarginRight"
                      type="number"
                      min="0"
                      max="20"
                      value={config.sections.paymentInfo.titleMargin.right}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        sections: {
                          ...prev.sections,
                          paymentInfo: { 
                            ...prev.sections.paymentInfo, 
                            titleMargin: { ...prev.sections.paymentInfo.titleMargin, right: parseInt(e.target.value) || 0 }
                          }
                        }
                      }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="paymentTitleMarginBottom" className="text-xs">Baixo</Label>
                    <Input
                      id="paymentTitleMarginBottom"
                      type="number"
                      min="0"
                      max="20"
                      value={config.sections.paymentInfo.titleMargin.bottom}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        sections: {
                          ...prev.sections,
                          paymentInfo: { 
                            ...prev.sections.paymentInfo, 
                            titleMargin: { ...prev.sections.paymentInfo.titleMargin, bottom: parseInt(e.target.value) || 0 }
                          }
                        }
                      }))}
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="paymentTitleMarginLeft" className="text-xs">Esquerda</Label>
                    <Input
                      id="paymentTitleMarginLeft"
                      type="number"
                      min="0"
                      max="20"
                      value={config.sections.paymentInfo.titleMargin.left}
                      onChange={(e) => setConfig(prev => ({
                        ...prev,
                        sections: {
                          ...prev.sections,
                          paymentInfo: { 
                            ...prev.sections.paymentInfo, 
                            titleMargin: { ...prev.sections.paymentInfo.titleMargin, left: parseInt(e.target.value) || 0 }
                          }
                        }
                      }))}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button onClick={saveConfig} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Configurações
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PDFConfigurationTab;
