import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Download, Palette, FileText } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  categories?: {
    name: string;
  };
}

interface LayoutTemplate {
  id: string;
  name: string;
  description: string;
  catalogConfig: any;
  layoutConfig: any;
  createdAt: string;
}

interface CategoryTemplateSelection {
  categoryName: string;
  templateId: string | null;
}

interface TemplateSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedProducts: Product[];
  onGeneratePDF: (categoryTemplates: Record<string, string>) => void;
  loading?: boolean;
}

const TemplateSelectionModal = ({ 
  open, 
  onOpenChange, 
  selectedProducts, 
  onGeneratePDF,
  loading = false
}: TemplateSelectionModalProps) => {
  const [templates, setTemplates] = useState<LayoutTemplate[]>([]);
  const [categorySelections, setCategorySelections] = useState<CategoryTemplateSelection[]>([]);
  const [defaultTemplate, setDefaultTemplate] = useState<string>('');

  // Obter categorias únicas dos produtos selecionados
  const uniqueCategories = React.useMemo(() => {
    const categories = new Set<string>();
    selectedProducts.forEach(product => {
      if (product.categories?.name) {
        categories.add(product.categories.name);
      } else {
        categories.add('Sem categoria');
      }
    });
    return Array.from(categories).sort();
  }, [selectedProducts]);

  // Carregar templates salvos
  useEffect(() => {
    if (open) {
      loadTemplates();
      initializeCategorySelections();
    }
  }, [open, uniqueCategories]);

  const loadTemplates = () => {
    try {
      const savedTemplates = localStorage.getItem('catalog-templates');
      if (savedTemplates) {
        const parsedTemplates = JSON.parse(savedTemplates);
        console.log('Templates carregados:', parsedTemplates);
        setTemplates(parsedTemplates);
        
        // Definir primeiro template como padrão se não houver seleção
        if (parsedTemplates.length > 0 && !defaultTemplate) {
          setDefaultTemplate(parsedTemplates[0].id);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
      setTemplates([]);
    }
  };

  const initializeCategorySelections = () => {
    const initialSelections = uniqueCategories.map(categoryName => ({
      categoryName,
      templateId: null
    }));
    setCategorySelections(initialSelections);
  };

  const handleCategoryTemplateChange = (categoryName: string, templateId: string) => {
    setCategorySelections(prev => 
      prev.map(selection => 
        selection.categoryName === categoryName 
          ? { ...selection, templateId }
          : selection
      )
    );
  };

  const handleApplyDefaultToAll = () => {
    if (!defaultTemplate) return;
    
    setCategorySelections(prev => 
      prev.map(selection => ({
        ...selection,
        templateId: defaultTemplate
      }))
    );
  };

  const handleGeneratePDF = () => {
    // Verificar se todas as categorias têm templates selecionados
    const incompleteSelections = categorySelections.filter(selection => !selection.templateId);
    
    if (incompleteSelections.length > 0) {
      return;
    }

    // Converter para o formato esperado
    const categoryTemplates: Record<string, string> = {};
    categorySelections.forEach(selection => {
      if (selection.templateId) {
        categoryTemplates[selection.categoryName] = selection.templateId;
      }
    });

    onGeneratePDF(categoryTemplates);
  };

  const allCategoriesSelected = categorySelections.every(selection => selection.templateId);
  const hasProducts = selectedProducts.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-blue-600" />
            Seleção de Templates por Categoria
          </DialogTitle>
          <DialogDescription>
            Escolha um template diferente para cada categoria dos produtos selecionados.
            Isso permitirá criar um catálogo com layouts variados.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Resumo dos produtos selecionados */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Resumo da Seleção
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <Badge variant="secondary">
                  {selectedProducts.length} produtos selecionados
                </Badge>
                <Badge variant="outline">
                  {uniqueCategories.length} categorias encontradas
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Seleção de template padrão */}
          {templates.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Template Padrão</CardTitle>
                <CardDescription>
                  Escolha um template para aplicar rapidamente a todas as categorias
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <Select value={defaultTemplate} onValueChange={setDefaultTemplate}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um template padrão" />
                      </SelectTrigger>
                      <SelectContent>
                        {templates.map((template) => (
                          <SelectItem key={template.id} value={template.id}>
                            {template.name} - {template.description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={handleApplyDefaultToAll}
                    disabled={!defaultTemplate}
                  >
                    Aplicar a Todas
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <Separator />

          {/* Seleção individual por categoria */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Templates por Categoria</h3>
            
            {templates.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-gray-500">
                    <Palette className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-sm">
                      Nenhum template encontrado. 
                      <br />
                      Crie templates no Designer de Layout primeiro.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {uniqueCategories.map((categoryName) => {
                  const selection = categorySelections.find(s => s.categoryName === categoryName);
                  const productsInCategory = selectedProducts.filter(p => 
                    (p.categories?.name || 'Sem categoria') === categoryName
                  ).length;

                  return (
                    <Card key={categoryName}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{categoryName}</CardTitle>
                          <Badge variant="outline">
                            {productsInCategory} produtos
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Select 
                          value={selection?.templateId || ''} 
                          onValueChange={(value) => handleCategoryTemplateChange(categoryName, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um template" />
                          </SelectTrigger>
                          <SelectContent>
                            {templates.map((template) => (
                              <SelectItem key={template.id} value={template.id}>
                                <div className="flex flex-col">
                                  <span className="font-medium">{template.name}</span>
                                  <span className="text-xs text-gray-500">{template.description}</span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleGeneratePDF}
            disabled={!allCategoriesSelected || !hasProducts || loading || templates.length === 0}
            className="min-w-[140px]"
          >
            <Download className="w-4 h-4 mr-2" />
            {loading ? 'Gerando...' : 'Gerar PDF'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TemplateSelectionModal;