import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  FileText, 
  Palette,
  Grid3X3,
  Type,
  Settings,
  Save,
  Download,
  Eye,
  Trash2,
  Plus,
  Upload,
  Image
} from 'lucide-react';

interface PageSettings {
  paperSize: 'A4' | 'A3' | 'Letter' | 'Custom';
  orientation: 'portrait' | 'landscape';
  customWidth: number;
  customHeight: number;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
}

interface LayoutSettings {
  rows: number;
  columns: number;
  cardSpacing: number;
  rowSpacing: number;
  cardBorderWidth: number;
  cardBorderColor: string;
  cardBorderRadius: number;
  cardBackgroundColor: string;
}

interface CategoryTitleSettings {
  fontSize: number;
  fontColor: string;
  fontWeight: 'normal' | 'bold';
  alignment: 'left' | 'center' | 'right';
  marginBottom: number;
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
  categoryTitle: CategoryTitleSettings;
  cover: CoverSettings;
}


export const CatalogAdvancedSettings = () => {
  const [activeTab, setActiveTab] = useState('page');
  const [config, setConfig] = useState<CatalogConfiguration>({
    page: {
      paperSize: 'A4',
      orientation: 'portrait',
      customWidth: 210,
      customHeight: 297,
      marginTop: 20,
      marginBottom: 20,
      marginLeft: 15,
      marginRight: 15,
    },
    layout: {
      rows: 4,
      columns: 2,
      cardSpacing: 10,
      rowSpacing: 15,
      cardBorderWidth: 1,
      cardBorderColor: '#e5e7eb',
      cardBorderRadius: 8,
      cardBackgroundColor: '#ffffff',
    },
    categoryTitle: {
      fontSize: 22,
      fontColor: '#1e3a8a',
      fontWeight: 'bold',
      alignment: 'center',
      marginBottom: 25,
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


  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = () => {
    const saved = localStorage.getItem('catalog-configuration');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setConfig(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Erro ao carregar configuração:', error);
      }
    }
  };


  const saveConfiguration = () => {
    localStorage.setItem('catalog-configuration', JSON.stringify(config));
    toast.success('Configurações salvas com sucesso!');
  };

  const updatePageConfig = (field: keyof PageSettings, value: any) => {
    setConfig(prev => ({
      ...prev,
      page: { ...prev.page, [field]: value }
    }));
  };

  const updateLayoutConfig = (field: keyof LayoutSettings, value: any) => {
    setConfig(prev => ({
      ...prev,
      layout: { ...prev.layout, [field]: value }
    }));
  };

  const updateCategoryTitleConfig = (field: keyof CategoryTitleSettings, value: any) => {
    setConfig(prev => ({
      ...prev,
      categoryTitle: { ...prev.categoryTitle, [field]: value }
    }));
  };

  const calculateCardDimensions = () => {
    const { page, layout } = config;
    let pageWidth = page.paperSize === 'A4' ? 210 : page.paperSize === 'A3' ? 297 : page.paperSize === 'Letter' ? 216 : page.customWidth;
    let pageHeight = page.paperSize === 'A4' ? 297 : page.paperSize === 'A3' ? 420 : page.paperSize === 'Letter' ? 279 : page.customHeight;
    
    if (page.orientation === 'landscape') {
      [pageWidth, pageHeight] = [pageHeight, pageWidth];
    }

    const availableWidth = pageWidth - (page.marginLeft + page.marginRight);
    const availableHeight = pageHeight - (page.marginTop + page.marginBottom + config.categoryTitle.marginBottom + config.categoryTitle.fontSize);
    
    const cardWidth = (availableWidth - (layout.cardSpacing * (layout.columns - 1))) / layout.columns;
    const cardHeight = (availableHeight - (layout.rowSpacing * (layout.rows - 1))) / layout.rows;

    return {
      pageWidth: pageWidth.toFixed(1),
      pageHeight: pageHeight.toFixed(1),
      cardWidth: cardWidth.toFixed(1),
      cardHeight: cardHeight.toFixed(1),
      availableWidth: availableWidth.toFixed(1),
      availableHeight: availableHeight.toFixed(1),
      maxCardsPerPage: layout.rows * layout.columns
    };
  };

  const updateCoverConfig = (field: keyof CoverSettings, value: any) => {
    setConfig(prev => ({
      ...prev,
      cover: { ...prev.cover, [field]: value }
    }));
  };

  const handleCoverImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        updateCoverConfig('backgroundImage', e.target?.result as string);
        toast.success('Imagem da capa carregada com sucesso!');
      };
      reader.readAsDataURL(file);
    }
  };


  const dimensions = calculateCardDimensions();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Configurações Avançadas do Catálogo
          </CardTitle>
          <CardDescription>
            Configure todos os aspectos do layout e geração do PDF
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configurações */}
        <div className="space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="page" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Página
              </TabsTrigger>
              <TabsTrigger value="layout" className="flex items-center gap-2">
                <Grid3X3 className="w-4 h-4" />
                Layout
              </TabsTrigger>
              <TabsTrigger value="title" className="flex items-center gap-2">
                <Type className="w-4 h-4" />
                Títulos
              </TabsTrigger>
              <TabsTrigger value="cover" className="flex items-center gap-2">
                <Image className="w-4 h-4" />
                Capa
              </TabsTrigger>
            </TabsList>

            <TabsContent value="page" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Configurações da Página</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Tamanho do Papel</Label>
                      <Select value={config.page.paperSize} onValueChange={(value) => updatePageConfig('paperSize', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A4">A4 (210x297mm)</SelectItem>
                          <SelectItem value="A3">A3 (297x420mm)</SelectItem>
                          <SelectItem value="Letter">Letter (216x279mm)</SelectItem>
                          <SelectItem value="Custom">Personalizado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Orientação</Label>
                      <Select value={config.page.orientation} onValueChange={(value) => updatePageConfig('orientation', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="portrait">Retrato</SelectItem>
                          <SelectItem value="landscape">Paisagem</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {config.page.paperSize === 'Custom' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Largura (mm)</Label>
                        <Input
                          type="number"
                          value={config.page.customWidth}
                          onChange={(e) => updatePageConfig('customWidth', Number(e.target.value))}
                          min="50"
                          max="2000"
                        />
                      </div>
                      <div>
                        <Label>Altura (mm)</Label>
                        <Input
                          type="number"
                          value={config.page.customHeight}
                          onChange={(e) => updatePageConfig('customHeight', Number(e.target.value))}
                          min="50"
                          max="2000"
                        />
                      </div>
                    </div>
                  )}

                  <Separator />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Margem Superior (mm)</Label>
                      <Input
                        type="number"
                        value={config.page.marginTop}
                        onChange={(e) => updatePageConfig('marginTop', Number(e.target.value))}
                        min="0"
                        max="100"
                      />
                    </div>
                    <div>
                      <Label>Margem Inferior (mm)</Label>
                      <Input
                        type="number"
                        value={config.page.marginBottom}
                        onChange={(e) => updatePageConfig('marginBottom', Number(e.target.value))}
                        min="0"
                        max="100"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Margem Esquerda (mm)</Label>
                      <Input
                        type="number"
                        value={config.page.marginLeft}
                        onChange={(e) => updatePageConfig('marginLeft', Number(e.target.value))}
                        min="0"
                        max="100"
                      />
                    </div>
                    <div>
                      <Label>Margem Direita (mm)</Label>
                      <Input
                        type="number"
                        value={config.page.marginRight}
                        onChange={(e) => updatePageConfig('marginRight', Number(e.target.value))}
                        min="0"
                        max="100"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="layout" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Layout dos Cards</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Linhas por Página</Label>
                      <Input
                        type="number"
                        value={config.layout.rows}
                        onChange={(e) => updateLayoutConfig('rows', Number(e.target.value))}
                        min="1"
                        max="10"
                      />
                    </div>
                    <div>
                      <Label>Colunas por Página</Label>
                      <Input
                        type="number"
                        value={config.layout.columns}
                        onChange={(e) => updateLayoutConfig('columns', Number(e.target.value))}
                        min="1"
                        max="6"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Espaçamento entre Cards (mm)</Label>
                      <Input
                        type="number"
                        value={config.layout.cardSpacing}
                        onChange={(e) => updateLayoutConfig('cardSpacing', Number(e.target.value))}
                        min="0"
                        max="50"
                      />
                    </div>
                    <div>
                      <Label>Espaçamento entre Linhas (mm)</Label>
                      <Input
                        type="number"
                        value={config.layout.rowSpacing}
                        onChange={(e) => updateLayoutConfig('rowSpacing', Number(e.target.value))}
                        min="0"
                        max="50"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Espessura da Borda (px)</Label>
                      <Input
                        type="number"
                        value={config.layout.cardBorderWidth}
                        onChange={(e) => updateLayoutConfig('cardBorderWidth', Number(e.target.value))}
                        min="0"
                        max="10"
                      />
                    </div>
                    <div>
                      <Label>Arredondamento da Borda (px)</Label>
                      <Input
                        type="number"
                        value={config.layout.cardBorderRadius}
                        onChange={(e) => updateLayoutConfig('cardBorderRadius', Number(e.target.value))}
                        min="0"
                        max="50"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Cor da Borda</Label>
                      <Input
                        type="color"
                        value={config.layout.cardBorderColor}
                        onChange={(e) => updateLayoutConfig('cardBorderColor', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Cor de Fundo do Card</Label>
                      <Input
                        type="color"
                        value={config.layout.cardBackgroundColor}
                        onChange={(e) => updateLayoutConfig('cardBackgroundColor', e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="title" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Títulos das Categorias</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Tamanho da Fonte (px)</Label>
                      <Input
                        type="number"
                        value={config.categoryTitle.fontSize}
                        onChange={(e) => updateCategoryTitleConfig('fontSize', Number(e.target.value))}
                        min="8"
                        max="72"
                      />
                    </div>
                    <div>
                      <Label>Peso da Fonte</Label>
                      <Select value={config.categoryTitle.fontWeight} onValueChange={(value) => updateCategoryTitleConfig('fontWeight', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="bold">Negrito</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Cor da Fonte</Label>
                      <Input
                        type="color"
                        value={config.categoryTitle.fontColor}
                        onChange={(e) => updateCategoryTitleConfig('fontColor', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Alinhamento</Label>
                      <Select value={config.categoryTitle.alignment} onValueChange={(value) => updateCategoryTitleConfig('alignment', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="left">Esquerda</SelectItem>
                          <SelectItem value="center">Centro</SelectItem>
                          <SelectItem value="right">Direita</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Margem Inferior do Título (mm)</Label>
                    <Input
                      type="number"
                      value={config.categoryTitle.marginBottom}
                      onChange={(e) => updateCategoryTitleConfig('marginBottom', Number(e.target.value))}
                      min="0"
                      max="100"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="cover" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Configurações da Capa</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Imagem de Fundo */}
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Imagem de Fundo da Capa</Label>
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
                              onClick={() => updateCoverConfig('backgroundImage', null)}
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

                  <Separator />

                  {/* Textos da Capa */}
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Textos da Capa</Label>
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <Label>Título Principal</Label>
                        <Input
                          value={config.cover.title}
                          onChange={(e) => updateCoverConfig('title', e.target.value)}
                          placeholder="CATÁLOGO DE PRODUTOS"
                        />
                      </div>
                      <div>
                        <Label>Subtítulo</Label>
                        <Input
                          value={config.cover.subtitle}
                          onChange={(e) => updateCoverConfig('subtitle', e.target.value)}
                          placeholder="Sistema de Gestão"
                        />
                      </div>
                      <div>
                        <Label>Posição dos Textos</Label>
                        <Select value={config.cover.titlePosition} onValueChange={(value: any) => updateCoverConfig('titlePosition', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="top">Topo</SelectItem>
                            <SelectItem value="center">Centro</SelectItem>
                            <SelectItem value="bottom">Rodapé</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Configurações do Título */}
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Configurações do Título</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Fonte do Título</Label>
                        <Select value={config.cover.titleFont} onValueChange={(value) => updateCoverConfig('titleFont', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Helvetica">Helvetica</SelectItem>
                            <SelectItem value="Arial">Arial</SelectItem>
                            <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                            <SelectItem value="Georgia">Georgia</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Tamanho do Título</Label>
                        <Input
                          type="number"
                          value={config.cover.titleSize}
                          onChange={(e) => updateCoverConfig('titleSize', Number(e.target.value))}
                          min="10"
                          max="60"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Cor do Título</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={config.cover.titleColor}
                          onChange={(e) => updateCoverConfig('titleColor', e.target.value)}
                          className="w-20"
                        />
                        <Input
                          type="text"
                          value={config.cover.titleColor}
                          onChange={(e) => updateCoverConfig('titleColor', e.target.value)}
                          placeholder="#1e3a8a"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Configurações do Subtítulo */}
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Configurações do Subtítulo</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Fonte do Subtítulo</Label>
                        <Select value={config.cover.subtitleFont} onValueChange={(value) => updateCoverConfig('subtitleFont', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Helvetica">Helvetica</SelectItem>
                            <SelectItem value="Arial">Arial</SelectItem>
                            <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                            <SelectItem value="Georgia">Georgia</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Tamanho do Subtítulo</Label>
                        <Input
                          type="number"
                          value={config.cover.subtitleSize}
                          onChange={(e) => updateCoverConfig('subtitleSize', Number(e.target.value))}
                          min="8"
                          max="40"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Cor do Subtítulo</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={config.cover.subtitleColor}
                          onChange={(e) => updateCoverConfig('subtitleColor', e.target.value)}
                          className="w-20"
                        />
                        <Input
                          type="text"
                          value={config.cover.subtitleColor}
                          onChange={(e) => updateCoverConfig('subtitleColor', e.target.value)}
                          placeholder="#475569"
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Configurações da Data */}
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Configurações da Data</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Fonte da Data</Label>
                        <Select value={config.cover.dateFont} onValueChange={(value) => updateCoverConfig('dateFont', value)}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Helvetica">Helvetica</SelectItem>
                            <SelectItem value="Arial">Arial</SelectItem>
                            <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                            <SelectItem value="Georgia">Georgia</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Tamanho da Data</Label>
                        <Input
                          type="number"
                          value={config.cover.dateSize}
                          onChange={(e) => updateCoverConfig('dateSize', Number(e.target.value))}
                          min="6"
                          max="20"
                        />
                      </div>
                    </div>
                    <div>
                      <Label>Cor da Data</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={config.cover.dateColor}
                          onChange={(e) => updateCoverConfig('dateColor', e.target.value)}
                          className="w-20"
                        />
                        <Input
                          type="text"
                          value={config.cover.dateColor}
                          onChange={(e) => updateCoverConfig('dateColor', e.target.value)}
                          placeholder="#64748b"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>


          <div className="flex gap-2">
            <Button onClick={saveConfiguration} className="flex-1">
              <Save className="w-4 h-4 mr-2" />
              Salvar Configurações
            </Button>
          </div>
        </div>

        {/* Preview e Templates */}
        <div className="space-y-6">
          {/* Informações Calculadas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Dimensões Calculadas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <strong>Página:</strong> {dimensions.pageWidth} x {dimensions.pageHeight} mm
                </div>
                <div>
                  <strong>Área Útil:</strong> {dimensions.availableWidth} x {dimensions.availableHeight} mm
                </div>
                <div>
                  <strong>Card:</strong> {dimensions.cardWidth} x {dimensions.cardHeight} mm
                </div>
                <div>
                  <strong>Cards por Página:</strong> {dimensions.maxCardsPerPage}
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  );
};