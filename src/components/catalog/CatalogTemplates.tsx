import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  Save,
  Download,
  Eye,
  Trash2,
  Plus,
  Layout,
  FileText
} from 'lucide-react';

interface ElementConfig {
  id: string;
  type: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontWeight: string;
  color: string;
  visible: boolean;
  padding: number;
  borderWidth: number;
  margin: number;
  zIndex: number;
  rotation: number;
  borderRadius: number;
  backgroundColor: string;
  textAlign: 'left' | 'center' | 'right';
  opacity: number;
  borderColor: string;
}

interface LayoutConfig {
  elements: ElementConfig[];
  cardWidth: number;
  cardHeight: number;
  backgroundColor: string;
  borderColor: string;
  borderWidth: number;
  rows: number;
  columns: number;
  gridSize: number;
  showGrid: boolean;
  snapToGrid: boolean;
  scale: number;
}

interface CatalogConfiguration {
  page?: any;
  layout?: any;
  categoryTitle?: any;
  cover?: any;
}

interface LayoutTemplate {
  id: string;
  name: string;
  description?: string;
  elements: ElementConfig[];
  layoutConfig: LayoutConfig;
  catalogConfig: CatalogConfiguration;
  createdAt: string;
}

interface CatalogTemplatesProps {
  onLoadTemplate?: (template: LayoutTemplate) => void;
}

export const CatalogTemplates = ({ onLoadTemplate }: CatalogTemplatesProps) => {
  const [templates, setTemplates] = useState<LayoutTemplate[]>([]);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');

  useEffect(() => {
    console.log('CatalogTemplates component mounted, loading templates...');
    loadTemplates();
  }, []);

  const loadTemplates = () => {
    try {
      const saved = localStorage.getItem('catalog-templates');
      console.log('Loading templates from localStorage:', saved);
      if (saved) {
        const parsed = JSON.parse(saved);
        console.log('Parsed templates:', parsed);
        setTemplates(parsed);
      } else {
        console.log('No templates found in localStorage');
        setTemplates([]);
      }
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
      // Se houver erro de parsing, limpar os templates corrompidos
      localStorage.removeItem('catalog-templates');
      setTemplates([]);
      toast.error('Templates corrompidos foram removidos');
    }
  };

  const cleanupOldTemplates = (templates: LayoutTemplate[]) => {
    // Manter apenas os 10 templates mais recentes para evitar exceder quota
    const sortedTemplates = templates.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return sortedTemplates.slice(0, 10);
  };

  const compressTemplateData = (template: LayoutTemplate): LayoutTemplate => {
    // Remove dados desnecessários para reduzir tamanho
    const cleanElements = template.elements.map(element => ({
      ...element,
      // Remove propriedades que podem ser recriadas
      id: element.id,
      type: element.type,
      x: element.x,
      y: element.y,
      width: element.width,
      height: element.height,
      fontSize: element.fontSize,
      color: element.color,
      textAlign: element.textAlign,
      visible: element.visible
    }));

    return {
      ...template,
      elements: cleanElements,
      // Salvar todas as configurações avançadas exceto a capa (universal)
      catalogConfig: template.catalogConfig ? {
        page: template.catalogConfig.page || {},
        layout: template.catalogConfig.layout || {},
        categoryTitle: template.catalogConfig.categoryTitle || {},
        // Não incluir cover - será universal
      } : {
        page: {},
        layout: {},
        categoryTitle: {},
      }
    };
  };

  const saveAsTemplate = () => {
    if (!newTemplateName.trim()) {
      toast.error('Digite um nome para o template');
      return;
    }

    try {
      // Carrega configuração do layout atual (elementos do canvas)
      const currentLayout = localStorage.getItem('catalog-layout');
      const layoutData = currentLayout ? JSON.parse(currentLayout) : null;

      // Carrega configurações avançadas
      const catalogConfig = localStorage.getItem('catalog-configuration');
      const catalogData = catalogConfig ? JSON.parse(catalogConfig) : null;

      if (!layoutData) {
        toast.error('Nenhum layout encontrado para salvar');
        return;
      }

      const newTemplate: LayoutTemplate = {
        id: `template-${Date.now()}`,
        name: newTemplateName,
        description: templateDescription,
        elements: layoutData.elements || [],
        layoutConfig: {
          cardWidth: layoutData.cardWidth || 300,
          cardHeight: layoutData.cardHeight || 200,
          backgroundColor: layoutData.backgroundColor || '#ffffff',
          borderColor: layoutData.borderColor || '#e5e7eb',
          borderWidth: layoutData.borderWidth || 1,
          rows: layoutData.rows || 4,
          columns: layoutData.columns || 2,
          gridSize: layoutData.gridSize || 10,
          showGrid: layoutData.showGrid !== undefined ? layoutData.showGrid : true,
          snapToGrid: layoutData.snapToGrid !== undefined ? layoutData.snapToGrid : true,
          scale: layoutData.scale || 1,
          elements: layoutData.elements || []
        },
        catalogConfig: catalogData ? {
          page: catalogData.page || {},
          layout: catalogData.layout || {},
          categoryTitle: catalogData.categoryTitle || {},
          // Não incluir cover - será universal
        } : {
          page: {},
          layout: {},
          categoryTitle: {},
        },
        createdAt: new Date().toISOString()
      };

      // Comprimir dados do template
      const compressedTemplate = compressTemplateData(newTemplate);
      
      // Limpar templates antigos e adicionar o novo
      const cleanedTemplates = cleanupOldTemplates([...templates, compressedTemplate]);
      
      // Tentar salvar com tratamento de quota
      try {
        const templatesJson = JSON.stringify(cleanedTemplates);
        console.log('Salvando templates:', templatesJson);
        localStorage.setItem('catalog-templates', templatesJson);
        setTemplates(cleanedTemplates);
        
        // Verificar se foi salvo corretamente
        const savedCheck = localStorage.getItem('catalog-templates');
        if (savedCheck) {
          console.log('Templates salvos com sucesso. Verificação:', JSON.parse(savedCheck));
          setNewTemplateName('');
          setTemplateDescription('');
          toast.success('Template salvo com sucesso!');
        } else {
          throw new Error('Falha na verificação de salvamento');
        }
      } catch (quotaError) {
        console.error('Erro de quota:', quotaError);
        if (quotaError instanceof Error && quotaError.name === 'QuotaExceededError') {
          // Se ainda assim exceder, remover mais templates antigos
          const minimalTemplates = cleanedTemplates.slice(0, 5);
          try {
            localStorage.setItem('catalog-templates', JSON.stringify(minimalTemplates));
            setTemplates(minimalTemplates);
            setNewTemplateName('');
            setTemplateDescription('');
            toast.success('Template salvo! Templates antigos foram removidos para liberar espaço.');
          } catch (secondError) {
            // Se ainda falhar, limpar tudo e salvar apenas o novo
            localStorage.removeItem('catalog-templates');
            const onlyNew = [compressedTemplate];
            localStorage.setItem('catalog-templates', JSON.stringify(onlyNew));
            setTemplates(onlyNew);
            setNewTemplateName('');
            setTemplateDescription('');
            toast.success('Template salvo! Cache de templates foi limpo.');
          }
        } else {
          throw quotaError;
        }
      }
    } catch (error) {
      console.error('Erro ao salvar template:', error);
      toast.error('Erro ao salvar template');
    }
  };

  const loadTemplate = (template: LayoutTemplate) => {
    try {
      console.log('Carregando template:', template);
      
      // Salvar configurações da capa atuais antes de carregar o template
      const currentCatalogConfig = localStorage.getItem('catalog-configuration');
      let currentCoverConfig = null;
      if (currentCatalogConfig) {
        const parsed = JSON.parse(currentCatalogConfig);
        currentCoverConfig = parsed.cover;
      }
      
      // Restaura configurações do layout
      localStorage.setItem('catalog-layout', JSON.stringify(template.layoutConfig));
      console.log('Layout config restaurado:', template.layoutConfig);
      
      // Restaura configurações avançadas, mas mantém as configurações da capa
      if (template.catalogConfig) {
        const configToSave = {
          ...template.catalogConfig,
          // Manter as configurações da capa universais
          cover: currentCoverConfig || {
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
        };
        
        localStorage.setItem('catalog-configuration', JSON.stringify(configToSave));
        console.log('Catalog config restaurado (com capa preservada):', configToSave);
      }

      toast.success(`Template "${template.name}" carregado! Configurações da capa preservadas.`);
      
      // Notifica o componente pai para recarregar os dados
      if (onLoadTemplate) {
        onLoadTemplate(template);
      }

      // Força refresh da página para aplicar todas as mudanças
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      console.error('Erro ao carregar template:', error);
      toast.error('Erro ao carregar template');
    }
  };

  const deleteTemplate = (templateId: string) => {
    try {
      console.log('Excluindo template:', templateId);
      const updatedTemplates = templates.filter(t => t.id !== templateId);
      setTemplates(updatedTemplates);
      localStorage.setItem('catalog-templates', JSON.stringify(updatedTemplates));
      
      // Verificar se foi removido corretamente
      const savedCheck = localStorage.getItem('catalog-templates');
      console.log('Templates após exclusão:', savedCheck);
      
      toast.success('Template excluído com sucesso!');
    } catch (error) {
      console.error('Erro ao excluir template:', error);
      // Se falhar, recarregar templates do localStorage
      loadTemplates();
      toast.error('Erro ao excluir template');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layout className="w-5 h-5" />
            Gerenciar Templates
          </CardTitle>
        <CardDescription>
          Salve e carregue configurações completas do designer e configurações avançadas. 
          <br />
          <span className="text-xs text-muted-foreground">
            Máximo de 10 templates salvos. As configurações da capa são universais e preservadas entre templates.
          </span>
        </CardDescription>
        </CardHeader>
      </Card>

      {/* Salvar Novo Template */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Salvar como Template</CardTitle>
          <CardDescription>
            Salva todo o layout do canvas e configurações avançadas
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="template-name">Nome do Template</Label>
            <Input
              id="template-name"
              placeholder="Ex: Layout Padrão"
              value={newTemplateName}
              onChange={(e) => setNewTemplateName(e.target.value)}
            />
          </div>
          
          <div>
            <Label htmlFor="template-description">Descrição (opcional)</Label>
            <Input
              id="template-description"
              placeholder="Ex: Layout com 2 colunas e bordas azuis"
              value={templateDescription}
              onChange={(e) => setTemplateDescription(e.target.value)}
            />
          </div>

          <Button onClick={saveAsTemplate} className="w-full">
            <Save className="w-4 h-4 mr-2" />
            Salvar Template
          </Button>
        </CardContent>
      </Card>

      {/* Templates Salvos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Templates Salvos</CardTitle>
          <CardDescription>
            {templates.length === 0 ? 'Nenhum template salvo' : `${templates.length} template(s) disponível(s)`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {templates.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum template salvo ainda.</p>
              <p className="text-sm">Configure o designer e salve seu primeiro template acima.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {templates.map((template) => (
                <div key={template.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium">{template.name}</h4>
                    {template.description && (
                      <p className="text-sm text-muted-foreground">{template.description}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Criado em {new Date(template.createdAt).toLocaleDateString('pt-BR')}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {template.elements?.length || 0} elemento(s) salvos
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => loadTemplate(template)}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Carregar
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteTemplate(template.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};