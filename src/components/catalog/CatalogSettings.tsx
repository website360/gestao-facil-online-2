import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, FileText, Grid, Palette, Type, Settings2, Upload, Image } from 'lucide-react';
import { toast } from 'sonner';

interface PageSettings {
  paperSize: 'A4' | 'A5' | 'Letter' | 'Custom';
  orientation: 'portrait' | 'landscape';
  customWidth: number;
  customHeight: number;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
}

interface LayoutSettings {
  cardsPerPage: number;
  rows: number;
  columns: number;
  cardSpacing: number;
  rowSpacing: number;
  automaticLayout: boolean;
}

interface FontSettings {
  primaryFont: string;
  secondaryFont: string;
  titleSize: number;
  subtitleSize: number;
  bodySize: number;
  globalFontMargin: number;
  elementMargin: number;
}

interface StyleSettings {
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
  cardBackgroundColor: string;
  cardBorderColor: string;
  cardBorderWidth: number;
  cardBorderRadius: number;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

interface CoverSettings {
  backgroundImage: string | null;
  title: string;
  subtitle: string;
  titlePosition: 'top' | 'center' | 'bottom';
  titleFont: string;
  titleSize: number;
  titleColor: string;
  subtitleFont: string;
  subtitleSize: number;
  subtitleColor: string;
  dateFont: string;
  dateSize: number;
  dateColor: string;
}

interface CatalogConfiguration {
  page: PageSettings;
  layout: LayoutSettings;
  fonts: FontSettings;
  styles: StyleSettings;
  cover: CoverSettings;
}

interface CatalogSettingsProps {
  onConfigurationSave: (config: CatalogConfiguration) => void;
}

const PAPER_SIZES = {
  A4: { width: 210, height: 297 },
  A5: { width: 148, height: 210 },
  Letter: { width: 216, height: 279 },
  Custom: { width: 210, height: 297 }
};

const FONT_OPTIONS = [
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Georgia',
  'Verdana',
  'Tahoma',
  'Comic Sans MS',
  'Impact',
  'Trebuchet MS',
  'Courier New'
];

export const CatalogSettings: React.FC<CatalogSettingsProps> = ({ onConfigurationSave }) => {
  const [config, setConfig] = useState<CatalogConfiguration>({
    page: {
      paperSize: 'A4',
      orientation: 'portrait',
      customWidth: 210,
      customHeight: 297,
      marginTop: 20,
      marginBottom: 20,
      marginLeft: 15,
      marginRight: 15
    },
    layout: {
      cardsPerPage: 8,
      rows: 4,
      columns: 2,
      cardSpacing: 5,
      rowSpacing: 10,
      automaticLayout: true
    },
    fonts: {
      primaryFont: 'Helvetica',
      secondaryFont: 'Arial',
      titleSize: 14,
      subtitleSize: 10,
      bodySize: 8,
      globalFontMargin: 2,
      elementMargin: 4
    },
    styles: {
      showGrid: true,
      snapToGrid: false,
      gridSize: 5,
      cardBackgroundColor: '#ffffff',
      cardBorderColor: '#e5e7eb',
      cardBorderWidth: 1,
      cardBorderRadius: 4,
      primaryColor: '#3b82f6',
      secondaryColor: '#64748b',
      accentColor: '#16a34a'
    },
    cover: {
      backgroundImage: null,
      title: 'CATÁLOGO DE PRODUTOS',
      subtitle: 'Sistema de Gestão',
      titlePosition: 'center',
      titleFont: 'Helvetica',
      titleSize: 32,
      titleColor: '#1e3a8a',
      subtitleFont: 'Helvetica',
      subtitleSize: 16,
      subtitleColor: '#475569',
      dateFont: 'Helvetica',
      dateSize: 12,
      dateColor: '#64748b'
    }
  });

  // Carregar configurações salvas
  useEffect(() => {
    const savedConfig = localStorage.getItem('catalog-configuration');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        setConfig(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
      }
    }
  }, []);

  const updatePageConfig = (updates: Partial<PageSettings>) => {
    setConfig(prev => ({
      ...prev,
      page: { ...prev.page, ...updates }
    }));
  };

  const updateLayoutConfig = (updates: Partial<LayoutSettings>) => {
    setConfig(prev => ({
      ...prev,
      layout: { ...prev.layout, ...updates }
    }));
  };

  const updateFontConfig = (updates: Partial<FontSettings>) => {
    setConfig(prev => ({
      ...prev,
      fonts: { ...prev.fonts, ...updates }
    }));
  };

  const updateStyleConfig = (updates: Partial<StyleSettings>) => {
    setConfig(prev => ({
      ...prev,
      styles: { ...prev.styles, ...updates }
    }));
  };

  const updateCoverConfig = (updates: Partial<CoverSettings>) => {
    setConfig(prev => ({
      ...prev,
      cover: { ...prev.cover, ...updates }
    }));
  };

  const handlePaperSizeChange = (paperSize: PageSettings['paperSize']) => {
    const size = PAPER_SIZES[paperSize];
    updatePageConfig({
      paperSize,
      customWidth: size.width,
      customHeight: size.height
    });
  };

  const handleOrientationChange = (orientation: PageSettings['orientation']) => {
    updatePageConfig({
      orientation,
      // Trocar largura e altura quando mudar orientação
      customWidth: config.page.customHeight,
      customHeight: config.page.customWidth
    });
  };

  const calculateCardsPerPage = () => {
    return config.layout.rows * config.layout.columns;
  };

  const handleSaveConfiguration = () => {
    // Salvar no localStorage
    localStorage.setItem('catalog-configuration', JSON.stringify(config));
    
    // Callback para o componente pai
    onConfigurationSave(config);
    
    toast.success('Configurações salvas com sucesso!');
  };

  const handleCoverImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        updateCoverConfig({ backgroundImage: e.target?.result as string });
        toast.success('Imagem da capa carregada com sucesso!');
      };
      reader.readAsDataURL(file);
    }
  };

  const resetToDefaults = () => {
    localStorage.removeItem('catalog-configuration');
    setConfig({
      page: {
        paperSize: 'A4',
        orientation: 'portrait',
        customWidth: 210,
        customHeight: 297,
        marginTop: 20,
        marginBottom: 20,
        marginLeft: 15,
        marginRight: 15
      },
      layout: {
        cardsPerPage: 8,
        rows: 4,
        columns: 2,
        cardSpacing: 5,
        rowSpacing: 10,
        automaticLayout: true
      },
      fonts: {
        primaryFont: 'Helvetica',
        secondaryFont: 'Arial',
        titleSize: 14,
        subtitleSize: 10,
        bodySize: 8,
        globalFontMargin: 2,
        elementMargin: 4
      },
      styles: {
        showGrid: true,
        snapToGrid: false,
        gridSize: 5,
        cardBackgroundColor: '#ffffff',
        cardBorderColor: '#e5e7eb',
        cardBorderWidth: 1,
        cardBorderRadius: 4,
        primaryColor: '#3b82f6',
        secondaryColor: '#64748b',
        accentColor: '#16a34a'
      },
      cover: {
        backgroundImage: null,
        title: 'CATÁLOGO DE PRODUTOS',
        subtitle: 'Sistema de Gestão',
        titlePosition: 'center',
        titleFont: 'Helvetica',
        titleSize: 32,
        titleColor: '#1e3a8a',
        subtitleFont: 'Helvetica',
        subtitleSize: 16,
        subtitleColor: '#475569',
        dateFont: 'Helvetica',
        dateSize: 12,
        dateColor: '#64748b'
      }
    });
    toast.info('Configurações resetadas para padrão');
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings2 className="w-5 h-5" />
          Configurações do Catálogo
        </CardTitle>
        <CardDescription>
          Configure todos os aspectos do seu catálogo de produtos em PDF
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="page" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="page" className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Página
            </TabsTrigger>
            <TabsTrigger value="layout" className="flex items-center gap-2">
              <Grid className="w-4 h-4" />
              Layout
            </TabsTrigger>
            <TabsTrigger value="fonts" className="flex items-center gap-2">
              <Type className="w-4 h-4" />
              Fontes
            </TabsTrigger>
            <TabsTrigger value="styles" className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Estilos
            </TabsTrigger>
            <TabsTrigger value="cover" className="flex items-center gap-2">
              <Image className="w-4 h-4" />
              Capa
            </TabsTrigger>
          </TabsList>

          <TabsContent value="page" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Tamanho do Papel</h3>
                
                <div className="space-y-2">
                  <Label htmlFor="paperSize">Tamanho Predefinido</Label>
                  <Select value={config.page.paperSize} onValueChange={handlePaperSizeChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tamanho" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="A4">A4 (210 × 297 mm)</SelectItem>
                      <SelectItem value="A5">A5 (148 × 210 mm)</SelectItem>
                      <SelectItem value="Letter">Carta (216 × 279 mm)</SelectItem>
                      <SelectItem value="Custom">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="orientation">Orientação</Label>
                  <Select value={config.page.orientation} onValueChange={handleOrientationChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a orientação" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="portrait">Retrato</SelectItem>
                      <SelectItem value="landscape">Paisagem</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {config.page.paperSize === 'Custom' && (
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="customWidth">Largura (mm)</Label>
                      <Input
                        id="customWidth"
                        type="number"
                        value={config.page.customWidth}
                        onChange={(e) => updatePageConfig({ customWidth: Number(e.target.value) })}
                        min={50}
                        max={500}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="customHeight">Altura (mm)</Label>
                      <Input
                        id="customHeight"
                        type="number"
                        value={config.page.customHeight}
                        onChange={(e) => updatePageConfig({ customHeight: Number(e.target.value) })}
                        min={50}
                        max={500}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Margens</h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="marginTop">Superior (mm)</Label>
                    <Input
                      id="marginTop"
                      type="number"
                      value={config.page.marginTop}
                      onChange={(e) => updatePageConfig({ marginTop: Number(e.target.value) })}
                      min={0}
                      max={50}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="marginBottom">Inferior (mm)</Label>
                    <Input
                      id="marginBottom"
                      type="number"
                      value={config.page.marginBottom}
                      onChange={(e) => updatePageConfig({ marginBottom: Number(e.target.value) })}
                      min={0}
                      max={50}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="marginLeft">Esquerda (mm)</Label>
                    <Input
                      id="marginLeft"
                      type="number"
                      value={config.page.marginLeft}
                      onChange={(e) => updatePageConfig({ marginLeft: Number(e.target.value) })}
                      min={0}
                      max={50}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="marginRight">Direita (mm)</Label>
                    <Input
                      id="marginRight"
                      type="number"
                      value={config.page.marginRight}
                      onChange={(e) => updatePageConfig({ marginRight: Number(e.target.value) })}
                      min={0}
                      max={50}
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="layout" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Disposição dos Cards</h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="rows">Linhas por Página</Label>
                    <Input
                      id="rows"
                      type="number"
                      value={config.layout.rows}
                      onChange={(e) => updateLayoutConfig({ rows: Number(e.target.value) })}
                      min={1}
                      max={10}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="columns">Colunas por Página</Label>
                    <Input
                      id="columns"
                      type="number"
                      value={config.layout.columns}
                      onChange={(e) => updateLayoutConfig({ columns: Number(e.target.value) })}
                      min={1}
                      max={6}
                    />
                  </div>
                </div>

                <div className="p-3 bg-muted rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Cards por página:</span>
                    <Badge variant="secondary">{calculateCardsPerPage()}</Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="automaticLayout"
                      checked={config.layout.automaticLayout}
                      onCheckedChange={(checked) => updateLayoutConfig({ automaticLayout: checked })}
                    />
                    <Label htmlFor="automaticLayout">Layout Automático</Label>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Calcula automaticamente o tamanho dos cards baseado no espaço disponível
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Espaçamento</h3>
                
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="cardSpacing">Espaçamento entre Cards (mm)</Label>
                    <Input
                      id="cardSpacing"
                      type="number"
                      value={config.layout.cardSpacing}
                      onChange={(e) => updateLayoutConfig({ cardSpacing: Number(e.target.value) })}
                      min={0}
                      max={20}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="rowSpacing">Espaçamento entre Linhas (mm)</Label>
                    <Input
                      id="rowSpacing"
                      type="number"
                      value={config.layout.rowSpacing}
                      onChange={(e) => updateLayoutConfig({ rowSpacing: Number(e.target.value) })}
                      min={0}
                      max={30}
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="fonts" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Seleção de Fontes</h3>
                
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="primaryFont">Fonte Principal</Label>
                    <Select value={config.fonts.primaryFont} onValueChange={(value) => updateFontConfig({ primaryFont: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a fonte principal" />
                      </SelectTrigger>
                      <SelectContent>
                        {FONT_OPTIONS.map(font => (
                          <SelectItem key={font} value={font}>{font}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="secondaryFont">Fonte Secundária</Label>
                    <Select value={config.fonts.secondaryFont} onValueChange={(value) => updateFontConfig({ secondaryFont: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a fonte secundária" />
                      </SelectTrigger>
                      <SelectContent>
                        {FONT_OPTIONS.map(font => (
                          <SelectItem key={font} value={font}>{font}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Tamanhos de Fonte</h3>
                
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="titleSize">Título (pt)</Label>
                    <Input
                      id="titleSize"
                      type="number"
                      value={config.fonts.titleSize}
                      onChange={(e) => updateFontConfig({ titleSize: Number(e.target.value) })}
                      min={8}
                      max={36}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="subtitleSize">Subtítulo (pt)</Label>
                    <Input
                      id="subtitleSize"
                      type="number"
                      value={config.fonts.subtitleSize}
                      onChange={(e) => updateFontConfig({ subtitleSize: Number(e.target.value) })}
                      min={6}
                      max={24}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bodySize">Corpo do Texto (pt)</Label>
                    <Input
                      id="bodySize"
                      type="number"
                      value={config.fonts.bodySize}
                      onChange={(e) => updateFontConfig({ bodySize: Number(e.target.value) })}
                      min={6}
                      max={18}
                    />
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 space-y-4">
                <h3 className="text-lg font-semibold">Margens de Fonte e Elementos</h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="globalFontMargin">Margem Global de Fontes (mm)</Label>
                    <Input
                      id="globalFontMargin"
                      type="number"
                      value={config.fonts.globalFontMargin}
                      onChange={(e) => updateFontConfig({ globalFontMargin: Number(e.target.value) })}
                      min={0}
                      max={10}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="elementMargin">Margem entre Elementos (mm)</Label>
                    <Input
                      id="elementMargin"
                      type="number"
                      value={config.fonts.elementMargin}
                      onChange={(e) => updateFontConfig({ elementMargin: Number(e.target.value) })}
                      min={0}
                      max={15}
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="styles" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Grid e Alinhamento</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="showGrid"
                      checked={config.styles.showGrid}
                      onCheckedChange={(checked) => updateStyleConfig({ showGrid: checked })}
                    />
                    <Label htmlFor="showGrid">Mostrar Grid no Designer</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="snapToGrid"
                      checked={config.styles.snapToGrid}
                      onCheckedChange={(checked) => updateStyleConfig({ snapToGrid: checked })}
                    />
                    <Label htmlFor="snapToGrid">Snap to Grid</Label>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="gridSize">Tamanho do Grid (px)</Label>
                    <Input
                      id="gridSize"
                      type="number"
                      value={config.styles.gridSize}
                      onChange={(e) => updateStyleConfig({ gridSize: Number(e.target.value) })}
                      min={1}
                      max={20}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Aparência dos Cards</h3>
                
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="cardBackgroundColor">Cor de Fundo dos Cards</Label>
                    <div className="flex gap-2">
                      <Input
                        id="cardBackgroundColor"
                        type="color"
                        value={config.styles.cardBackgroundColor}
                        onChange={(e) => updateStyleConfig({ cardBackgroundColor: e.target.value })}
                        className="w-20"
                      />
                      <Input
                        type="text"
                        value={config.styles.cardBackgroundColor}
                        onChange={(e) => updateStyleConfig({ cardBackgroundColor: e.target.value })}
                        placeholder="#ffffff"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="cardBorderColor">Cor da Borda dos Cards</Label>
                    <div className="flex gap-2">
                      <Input
                        id="cardBorderColor"
                        type="color"
                        value={config.styles.cardBorderColor}
                        onChange={(e) => updateStyleConfig({ cardBorderColor: e.target.value })}
                        className="w-20"
                      />
                      <Input
                        type="text"
                        value={config.styles.cardBorderColor}
                        onChange={(e) => updateStyleConfig({ cardBorderColor: e.target.value })}
                        placeholder="#e5e7eb"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="cardBorderWidth">Largura da Borda (px)</Label>
                      <Input
                        id="cardBorderWidth"
                        type="number"
                        value={config.styles.cardBorderWidth}
                        onChange={(e) => updateStyleConfig({ cardBorderWidth: Number(e.target.value) })}
                        min={0}
                        max={5}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cardBorderRadius">Radius da Borda (px)</Label>
                      <Input
                        id="cardBorderRadius"
                        type="number"
                        value={config.styles.cardBorderRadius}
                        onChange={(e) => updateStyleConfig({ cardBorderRadius: Number(e.target.value) })}
                        min={0}
                        max={20}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="md:col-span-2 space-y-4">
                <h3 className="text-lg font-semibold">Cores do Tema</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="primaryColor">Cor Primária</Label>
                    <div className="flex gap-2">
                      <Input
                        id="primaryColor"
                        type="color"
                        value={config.styles.primaryColor}
                        onChange={(e) => updateStyleConfig({ primaryColor: e.target.value })}
                        className="w-20"
                      />
                      <Input
                        type="text"
                        value={config.styles.primaryColor}
                        onChange={(e) => updateStyleConfig({ primaryColor: e.target.value })}
                        placeholder="#3b82f6"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="secondaryColor">Cor Secundária</Label>
                    <div className="flex gap-2">
                      <Input
                        id="secondaryColor"
                        type="color"
                        value={config.styles.secondaryColor}
                        onChange={(e) => updateStyleConfig({ secondaryColor: e.target.value })}
                        className="w-20"
                      />
                      <Input
                        type="text"
                        value={config.styles.secondaryColor}
                        onChange={(e) => updateStyleConfig({ secondaryColor: e.target.value })}
                        placeholder="#64748b"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="accentColor">Cor de Destaque</Label>
                    <div className="flex gap-2">
                      <Input
                        id="accentColor"
                        type="color"
                        value={config.styles.accentColor}
                        onChange={(e) => updateStyleConfig({ accentColor: e.target.value })}
                        className="w-20"
                      />
                      <Input
                        type="text"
                        value={config.styles.accentColor}
                        onChange={(e) => updateStyleConfig({ accentColor: e.target.value })}
                        placeholder="#16a34a"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="cover" className="space-y-6">
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Imagem de Fundo da Capa</h3>
                
                <div className="space-y-4">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    {config.cover.backgroundImage ? (
                      <div className="space-y-4">
                        <div className="w-full max-w-sm mx-auto">
                          <img
                            src={config.cover.backgroundImage}
                            alt="Preview da capa"
                            className="w-full h-40 object-cover rounded-lg border"
                          />
                        </div>
                        <div className="flex gap-2 justify-center">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => updateCoverConfig({ backgroundImage: null })}
                          >
                            Remover Imagem
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById('cover-upload')?.click()}
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            Alterar Imagem
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <Upload className="w-12 h-12 mx-auto text-gray-400" />
                        <div>
                          <h4 className="text-lg font-medium">Adicionar Imagem de Fundo</h4>
                          <p className="text-sm text-gray-500 mt-1">
                            A imagem será aplicada como fundo 100% da capa do catálogo
                          </p>
                        </div>
                        <Button
                          variant="outline"
                          onClick={() => document.getElementById('cover-upload')?.click()}
                        >
                          <Upload className="w-4 h-4 mr-2" />
                          Escolher Imagem
                        </Button>
                      </div>
                    )}
                    
                    <input
                      id="cover-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleCoverImageUpload}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Textos da Capa</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="coverTitle">Título Principal</Label>
                    <Input
                      id="coverTitle"
                      value={config.cover.title}
                      onChange={(e) => updateCoverConfig({ title: e.target.value })}
                      placeholder="CATÁLOGO DE PRODUTOS"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="coverSubtitle">Subtítulo</Label>
                    <Input
                      id="coverSubtitle"
                      value={config.cover.subtitle}
                      onChange={(e) => updateCoverConfig({ subtitle: e.target.value })}
                      placeholder="Sistema de Gestão"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="titlePosition">Posição dos Textos</Label>
                    <Select value={config.cover.titlePosition} onValueChange={(value: any) => updateCoverConfig({ titlePosition: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a posição" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="top">Topo</SelectItem>
                        <SelectItem value="center">Centro</SelectItem>
                        <SelectItem value="bottom">Rodapé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Configurações do Título</h3>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="titleFont">Fonte</Label>
                      <Select value={config.cover.titleFont} onValueChange={(value) => updateCoverConfig({ titleFont: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Fonte do título" />
                        </SelectTrigger>
                        <SelectContent>
                          {FONT_OPTIONS.map(font => (
                            <SelectItem key={font} value={font}>{font}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="titleSize">Tamanho</Label>
                      <Input
                        id="titleSize"
                        type="number"
                        value={config.cover.titleSize}
                        onChange={(e) => updateCoverConfig({ titleSize: Number(e.target.value) })}
                        min={10}
                        max={60}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="titleColor">Cor do Título</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={config.cover.titleColor}
                        onChange={(e) => updateCoverConfig({ titleColor: e.target.value })}
                        className="w-20"
                      />
                      <Input
                        type="text"
                        value={config.cover.titleColor}
                        onChange={(e) => updateCoverConfig({ titleColor: e.target.value })}
                        placeholder="#1e3a8a"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Configurações do Subtítulo</h3>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="subtitleFont">Fonte</Label>
                      <Select value={config.cover.subtitleFont} onValueChange={(value) => updateCoverConfig({ subtitleFont: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Fonte do subtítulo" />
                        </SelectTrigger>
                        <SelectContent>
                          {FONT_OPTIONS.map(font => (
                            <SelectItem key={font} value={font}>{font}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="subtitleSize">Tamanho</Label>
                      <Input
                        id="subtitleSize"
                        type="number"
                        value={config.cover.subtitleSize}
                        onChange={(e) => updateCoverConfig({ subtitleSize: Number(e.target.value) })}
                        min={8}
                        max={40}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subtitleColor">Cor do Subtítulo</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={config.cover.subtitleColor}
                        onChange={(e) => updateCoverConfig({ subtitleColor: e.target.value })}
                        className="w-20"
                      />
                      <Input
                        type="text"
                        value={config.cover.subtitleColor}
                        onChange={(e) => updateCoverConfig({ subtitleColor: e.target.value })}
                        placeholder="#475569"
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Configurações da Data</h3>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="dateFont">Fonte</Label>
                      <Select value={config.cover.dateFont} onValueChange={(value) => updateCoverConfig({ dateFont: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Fonte da data" />
                        </SelectTrigger>
                        <SelectContent>
                          {FONT_OPTIONS.map(font => (
                            <SelectItem key={font} value={font}>{font}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dateSize">Tamanho</Label>
                      <Input
                        id="dateSize"
                        type="number"
                        value={config.cover.dateSize}
                        onChange={(e) => updateCoverConfig({ dateSize: Number(e.target.value) })}
                        min={6}
                        max={20}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dateColor">Cor da Data</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={config.cover.dateColor}
                        onChange={(e) => updateCoverConfig({ dateColor: e.target.value })}
                        className="w-20"
                      />
                      <Input
                        type="text"
                        value={config.cover.dateColor}
                        onChange={(e) => updateCoverConfig({ dateColor: e.target.value })}
                        placeholder="#64748b"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <Separator className="my-6" />

        <div className="flex justify-between items-center">
          <Button variant="outline" onClick={resetToDefaults}>
            Resetar Padrões
          </Button>
          
          <Button onClick={handleSaveConfiguration} className="flex items-center gap-2">
            <Save className="w-4 h-4" />
            Salvar Configurações
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};