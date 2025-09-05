import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { CatalogPDFGenerator } from '@/components/catalog/CatalogPDFGenerator';
import { CatalogAdvancedSettings } from '@/components/catalog/CatalogAdvancedSettings';
import { CatalogTemplates } from '@/components/catalog/CatalogTemplates';


import { 
  Palette, 
  Move, 
  Download, 
  RotateCcw, 
  Eye, 
  Settings,
  Package,
  DollarSign,
  Hash,
  Tag,
  Ruler,
  Image,
  FileText,
  Layers,
  Save,
  ShoppingBag,
  Grid,
  Trash2,
  Plus,
  Copy,
  ZoomIn,
  ZoomOut,
  ArrowLeft,
  Layout,
  MousePointer2
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

const CatalogDesigner = () => {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLDivElement>(null);
  const [activeTab, setActiveTab] = useState('designer');
  const [draggedElement, setDraggedElement] = useState<ElementConfig | null>(null);
  const [selectedElement, setSelectedElement] = useState<ElementConfig | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState('');
  

  const [layoutConfig, setLayoutConfig] = useState<LayoutConfig>({
    elements: [],
    cardWidth: 300,
    cardHeight: 200,
    backgroundColor: '#ffffff',
    borderColor: '#e5e7eb',
    borderWidth: 1,
    rows: 4,
    columns: 2,
    gridSize: 5,
    showGrid: true,
    snapToGrid: false,
    scale: 1.0, // Tamanho real
  });
  
  const [catalogConfig, setCatalogConfig] = useState<any>(null);

  // Carregar configurações salvas ao inicializar
  useEffect(() => {
    // Carregar configurações do catálogo
    const loadCatalogConfig = () => {
      const catalogConfigSaved = localStorage.getItem('catalog-configuration');
      let calculatedCardWidth = 300;
      let calculatedCardHeight = 200;
      let loadedCatalogConfig = null;
      
      if (catalogConfigSaved) {
        try {
          loadedCatalogConfig = JSON.parse(catalogConfigSaved);
          setCatalogConfig(loadedCatalogConfig);
          console.log('Configuração do catálogo carregada:', loadedCatalogConfig);
          
          // Calcular dimensões EXATAS do card baseado na configuração
          const { page, layout } = loadedCatalogConfig;
          
          // Converter dimensões para pixels (usando fator de conversão preciso)
          // A4: 210x297mm -> 595x842 pontos PDF (2.83 pontos por mm)
          const pageWidthMm = page.paperSize === 'A4' ? 210 : 216;
          const pageHeightMm = page.paperSize === 'A4' ? 297 : 279;
          
          // Margens em mm convertidas diretamente
          const marginLeft = page.marginLeft || 10;
          const marginRight = page.marginRight || 10;
          const marginTop = page.marginTop || 10;
          const marginBottom = page.marginBottom || 10;
          
          // Área útil da página em mm
          const usableWidth = pageWidthMm - marginLeft - marginRight;
          const usableHeight = pageHeightMm - marginTop - marginBottom;
          
          // Espaçamentos em mm
          const cardSpacing = layout.cardSpacing || 10;
          const rowSpacing = layout.rowSpacing || 10;
          
          // Cálculo exato das dimensões do card em mm
          const cardWidthMm = (usableWidth - (cardSpacing * (layout.columns - 1))) / layout.columns;
          const cardHeightMm = (usableHeight - (rowSpacing * (layout.rows - 1))) / layout.rows;
          
          // Converter para pixels usando escala 1:1 mm para visualização real
          // 1mm = 3.78 pixels aproximadamente (96dpi)
          const mmToPixel = 3.78;
          calculatedCardWidth = cardWidthMm * mmToPixel;
          calculatedCardHeight = cardHeightMm * mmToPixel;
          
          console.log(`Dimensões da página: ${pageWidthMm}x${pageHeightMm}mm`);
          console.log(`Margens: T:${marginTop} R:${marginRight} B:${marginBottom} L:${marginLeft}mm`);
          console.log(`Área útil: ${usableWidth.toFixed(1)}x${usableHeight.toFixed(1)}mm`);
          console.log(`Layout: ${layout.rows}x${layout.columns} (${cardSpacing}mm entre cards, ${rowSpacing}mm entre linhas)`);
          console.log(`Card: ${cardWidthMm.toFixed(1)}x${cardHeightMm.toFixed(1)}mm = ${calculatedCardWidth.toFixed(0)}x${calculatedCardHeight.toFixed(0)}px`);
        } catch (error) {
          console.error('Erro ao carregar configuração do catálogo:', error);
        }
      }
      
      return { calculatedCardWidth, calculatedCardHeight, loadedCatalogConfig };
    };
    
    const { calculatedCardWidth, calculatedCardHeight } = loadCatalogConfig();
    
    // Carregar layout salvo ou usar configurações calculadas
    const savedConfig = localStorage.getItem('catalog-layout');
    if (savedConfig) {
      try {
        const parsed = JSON.parse(savedConfig);
        // Atualizar com dimensões calculadas das configurações do catálogo
        parsed.cardWidth = calculatedCardWidth;
        parsed.cardHeight = calculatedCardHeight;
        // Usar escala real para mostrar tamanho exato
        parsed.scale = 1.0;
        setLayoutConfig(parsed);
        console.log('Layout carregado com dimensões exatas:', parsed);
      } catch (error) {
        console.error('Erro ao carregar layout:', error);
      }
    } else {
      // Usar configurações calculadas como padrão
      setLayoutConfig(prev => ({
        ...prev,
        cardWidth: calculatedCardWidth,
        cardHeight: calculatedCardHeight
      }));
    }
  }, []);

  const availableElements = [
    {
      id: 'product-name',
      type: 'text',
      label: 'Nome do Produto',
      width: 120,
      height: 20,
      fontSize: 14,
      fontWeight: 'bold',
      color: '#000000',
      padding: 2,
      borderWidth: 0,
      margin: 0,
      zIndex: 1,
      rotation: 0,
      borderRadius: 0,
      backgroundColor: 'transparent',
      textAlign: 'left' as const,
      opacity: 1,
      borderColor: '#000000'
    },
    {
      id: 'internal-code',
      type: 'text',
      label: 'Código Interno',
      width: 80,
      height: 16,
      fontSize: 10,
      fontWeight: 'normal',
      color: '#666666',
      padding: 2,
      borderWidth: 0,
      margin: 0,
      zIndex: 1,
      rotation: 0,
      borderRadius: 0,
      backgroundColor: 'transparent',
      textAlign: 'left' as const,
      opacity: 1,
      borderColor: '#666666'
    },
    {
      id: 'price',
      type: 'text',
      label: 'Preço',
      width: 80,
      height: 20,
      fontSize: 16,
      fontWeight: 'bold',
      color: '#16a34a',
      padding: 2,
      borderWidth: 0,
      margin: 0,
      zIndex: 1,
      rotation: 0,
      borderRadius: 0,
      backgroundColor: 'transparent',
      textAlign: 'left' as const,
      opacity: 1,
      borderColor: '#16a34a'
    },
    {
      id: 'photo',
      type: 'image',
      label: 'Foto',
      width: 60,
      height: 60,
      fontSize: 10,
      fontWeight: 'normal',
      color: '#666666',
      padding: 0,
      borderWidth: 1,
      margin: 0,
      zIndex: 1,
      rotation: 0,
      borderRadius: 4,
      backgroundColor: '#f3f4f6',
      textAlign: 'center' as const,
      opacity: 1,
      borderColor: '#d1d5db'
    },
    {
      id: 'stock',
      type: 'text',
      label: 'Estoque',
      width: 60,
      height: 16,
      fontSize: 10,
      fontWeight: 'normal',
      color: '#666666',
      padding: 2,
      borderWidth: 0,
      margin: 0,
      zIndex: 1,
      rotation: 0,
      borderRadius: 0,
      backgroundColor: 'transparent',
      textAlign: 'left' as const,
      opacity: 1,
      borderColor: '#666666'
    },
    {
      id: 'unit',
      type: 'text',
      label: 'Unidade',
      width: 40,
      height: 16,
      fontSize: 10,
      fontWeight: 'normal',
      color: '#666666',
      padding: 2,
      borderWidth: 0,
      margin: 0,
      zIndex: 1,
      rotation: 0,
      borderRadius: 0,
      backgroundColor: 'transparent',
      textAlign: 'left' as const,
      opacity: 1,
      borderColor: '#666666'
    },
    {
      id: 'size',
      type: 'text',
      label: 'Tamanho',
      width: 60,
      height: 16,
      fontSize: 10,
      fontWeight: 'normal',
      color: '#666666',
      padding: 2,
      borderWidth: 0,
      margin: 0,
      zIndex: 1,
      rotation: 0,
      borderRadius: 0,
      backgroundColor: 'transparent',
      textAlign: 'left' as const,
      opacity: 1,
      borderColor: '#666666'
    },
    {
      id: 'color',
      type: 'text',
      label: 'Cor',
      width: 50,
      height: 16,
      fontSize: 10,
      fontWeight: 'normal',
      color: '#666666',
      padding: 2,
      borderWidth: 0,
      margin: 0,
      zIndex: 1,
      rotation: 0,
      borderRadius: 0,
      backgroundColor: 'transparent',
      textAlign: 'left' as const,
      opacity: 1,
      borderColor: '#666666'
    },
    {
      id: 'composition',
      type: 'text',
      label: 'Composição',
      width: 100,
      height: 16,
      fontSize: 10,
      fontWeight: 'normal',
      color: '#666666',
      padding: 2,
      borderWidth: 0,
      margin: 0,
      zIndex: 1,
      rotation: 0,
      borderRadius: 0,
      backgroundColor: 'transparent',
      textAlign: 'left' as const,
      opacity: 1,
      borderColor: '#666666'
    },
    {
      id: 'width',
      type: 'text',
      label: 'Largura',
      width: 50,
      height: 16,
      fontSize: 10,
      fontWeight: 'normal',
      color: '#666666',
      padding: 2,
      borderWidth: 0,
      margin: 0,
      zIndex: 1,
      rotation: 0,
      borderRadius: 0,
      backgroundColor: 'transparent',
      textAlign: 'left' as const,
      opacity: 1,
      borderColor: '#666666'
    },
    {
      id: 'length',
      type: 'text',
      label: 'Comprimento',
      width: 70,
      height: 16,
      fontSize: 10,
      fontWeight: 'normal',
      color: '#666666',
      padding: 2,
      borderWidth: 0,
      margin: 0,
      zIndex: 1,
      rotation: 0,
      borderRadius: 0,
      backgroundColor: 'transparent',
      textAlign: 'left' as const,
      opacity: 1,
      borderColor: '#666666'
    },
    {
      id: 'thickness',
      type: 'text',
      label: 'Espessura',
      width: 60,
      height: 16,
      fontSize: 10,
      fontWeight: 'normal',
      color: '#666666',
      padding: 2,
      borderWidth: 0,
      margin: 0,
      zIndex: 1,
      rotation: 0,
      borderRadius: 0,
      backgroundColor: 'transparent',
      textAlign: 'left' as const,
      opacity: 1,
      borderColor: '#666666'
    },
    {
      id: 'diameter',
      type: 'text',
      label: 'Diâmetro',
      width: 60,
      height: 16,
      fontSize: 10,
      fontWeight: 'normal',
      color: '#666666',
      padding: 2,
      borderWidth: 0,
      margin: 0,
      zIndex: 1,
      rotation: 0,
      borderRadius: 0,
      backgroundColor: 'transparent',
      textAlign: 'left' as const,
      opacity: 1,
      borderColor: '#666666'
    },
    {
      id: 'observations',
      type: 'text',
      label: 'Observações',
      width: 120,
      height: 32,
      fontSize: 8,
      fontWeight: 'normal',
      color: '#666666',
      padding: 2,
      borderWidth: 0,
      margin: 0,
      zIndex: 1,
      rotation: 0,
      borderRadius: 0,
      backgroundColor: 'transparent',
      textAlign: 'left' as const,
      opacity: 1,
      borderColor: '#666666'
    }
  ];

  const snapToGrid = (value: number) => {
    if (!layoutConfig.snapToGrid) return value;
    return Math.round(value / layoutConfig.gridSize) * layoutConfig.gridSize;
  };

  const handleDragStart = (element: any) => {
    const newElement: ElementConfig = {
      ...element,
      id: `${element.id}-${Date.now()}`,
      x: 0,
      y: 0,
      visible: true,
    };
    setDraggedElement(newElement);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!draggedElement || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = snapToGrid((e.clientX - rect.left) / layoutConfig.scale);
    const y = snapToGrid((e.clientY - rect.top) / layoutConfig.scale);

    const existingElement = layoutConfig.elements.find(el => el.id === draggedElement.id);
    
    if (existingElement) {
      setLayoutConfig(prev => ({
        ...prev,
        elements: prev.elements.map(el => 
          el.id === draggedElement.id 
            ? { ...el, x, y }
            : el
        )
      }));
    } else {
      const newElement: ElementConfig = {
        ...draggedElement,
        x,
        y,
      };

      setLayoutConfig(prev => ({
        ...prev,
        elements: [...prev.elements, newElement]
      }));
    }

    setDraggedElement(null);
  };

  const handleElementClick = (e: React.MouseEvent, element: ElementConfig) => {
    e.preventDefault();
    e.stopPropagation();
    setSelectedElement(element);
  };

  const handleElementMouseDown = (e: React.MouseEvent, element: ElementConfig) => {
    e.preventDefault();
    
    if (selectedElement?.id !== element.id) {
      setSelectedElement(element);
    }
    
    const target = e.target as HTMLElement;
    if (target.classList.contains('resize-handle')) {
      setIsResizing(true);
      setResizeHandle(target.dataset.handle || '');
      return;
    }
    
    setIsDragging(true);
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: (e.clientX - rect.left) / layoutConfig.scale - element.x,
        y: (e.clientY - rect.top) / layoutConfig.scale - element.y
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!selectedElement || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / layoutConfig.scale;
    const mouseY = (e.clientY - rect.top) / layoutConfig.scale;

    if (isDragging) {
      const x = snapToGrid(mouseX - dragOffset.x);
      const y = snapToGrid(mouseY - dragOffset.y);

      const updatedConfig = {
        ...layoutConfig,
        elements: layoutConfig.elements.map(el => 
          el.id === selectedElement.id 
            ? { ...el, x, y }
            : el
        )
      };

      setLayoutConfig(updatedConfig);
      setSelectedElement(prev => prev ? { ...prev, x, y } : null);
    } else if (isResizing) {
      const deltaX = mouseX - selectedElement.x;
      const deltaY = mouseY - selectedElement.y;

      let newWidth = selectedElement.width;
      let newHeight = selectedElement.height;

      switch (resizeHandle) {
        case 'se':
          newWidth = Math.max(10, deltaX);
          newHeight = Math.max(10, deltaY);
          break;
        case 'sw':
          newWidth = Math.max(10, selectedElement.width - (mouseX - selectedElement.x));
          newHeight = Math.max(10, deltaY);
          break;
        case 'ne':
          newWidth = Math.max(10, deltaX);
          newHeight = Math.max(10, selectedElement.height - (mouseY - selectedElement.y));
          break;
        case 'nw':
          newWidth = Math.max(10, selectedElement.width - (mouseX - selectedElement.x));
          newHeight = Math.max(10, selectedElement.height - (mouseY - selectedElement.y));
          break;
      }

      const updatedConfig = {
        ...layoutConfig,
        elements: layoutConfig.elements.map(el => 
          el.id === selectedElement.id 
            ? { ...el, width: newWidth, height: newHeight }
            : el
        )
      };

      setLayoutConfig(updatedConfig);
      setSelectedElement(prev => prev ? { ...prev, width: newWidth, height: newHeight } : null);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle('');
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setSelectedElement(null);
    }
  };

  const updateElementProperty = (elementId: string, property: string, value: any) => {
    const updatedConfig = {
      ...layoutConfig,
      elements: layoutConfig.elements.map(el => 
        el.id === elementId 
          ? { ...el, [property]: value }
          : el
      )
    };

    setLayoutConfig(updatedConfig);

    if (selectedElement?.id === elementId) {
      setSelectedElement(prev => prev ? { ...prev, [property]: value } : null);
    }
  };

  const deleteElement = (elementId: string) => {
    setLayoutConfig(prev => ({
      ...prev,
      elements: prev.elements.filter(el => el.id !== elementId)
    }));
    
    if (selectedElement?.id === elementId) {
      setSelectedElement(null);
    }
  };

  const duplicateElement = (element: ElementConfig) => {
    const newElement: ElementConfig = {
      ...element,
      id: `${element.type}-${Date.now()}`,
      x: element.x + 10,
      y: element.y + 10,
    };

    setLayoutConfig(prev => ({
      ...prev,
      elements: [...prev.elements, newElement]
    }));
  };

  const saveLayout = () => {
    localStorage.setItem('catalog-layout', JSON.stringify(layoutConfig));
    toast.success('Layout salvo com sucesso!');
  };

  const resetLayout = () => {
    setLayoutConfig(prev => ({
      ...prev,
      elements: []
    }));
    setSelectedElement(null);
    toast.success('Layout resetado!');
  };

  const generatePreviewPDF = async () => {
    const sampleProduct = {
      id: '1',
      name: 'Produto de Exemplo',
      internal_code: 'EX001',
      price: 99.99,
      stock: 50,
      photo_url: null,
      categories: { name: 'Categoria' }
    };

    const generator = new CatalogPDFGenerator();
    await generator.generatePreview([sampleProduct as any]);
  };

  const renderElement = (element: ElementConfig) => {
    const scale = layoutConfig.scale || 1;
    const style = {
      position: 'absolute' as const,
      left: element.x * scale,
      top: element.y * scale,
      width: element.width * scale,
      height: element.height * scale,
      fontSize: element.fontSize * scale,
      fontWeight: element.fontWeight,
      color: element.color,
      padding: element.padding * layoutConfig.scale,
      border: element.borderWidth > 0 ? `${element.borderWidth}px solid ${element.borderColor}` : 'none',
      borderRadius: element.borderRadius * layoutConfig.scale,
      backgroundColor: element.backgroundColor,
      textAlign: element.textAlign,
      opacity: element.opacity,
      zIndex: element.zIndex,
      transform: `rotate(${element.rotation}deg)`,
      cursor: 'move',
      userSelect: 'none' as const,
      display: 'flex',
      alignItems: 'center',
      justifyContent: element.textAlign === 'center' ? 'center' : element.textAlign === 'right' ? 'flex-end' : 'flex-start',
      outline: selectedElement?.id === element.id ? '2px solid #3b82f6' : 'none',
      outlineOffset: '2px'
    };

    let content = '';
    const product = {
      id: '1',
      name: 'Produto de Exemplo',
      internal_code: 'EX001',
      price: 99.99,
      stock: 50,
      photo_url: null,
      categories: { name: 'Categoria' },
      size: 'P',
      color: 'Azul',
      composition: '100% Algodão',
      width: 10,
      length: 20,
      thickness: 2,
      diameter: 5,
      observation: 'Observação de exemplo',
      stock_unit: 'Un'
    };
    
    switch (element.type) {
      case 'text':
        if (element.id.includes('product-name')) content = product?.name || 'Nome do Produto';
        else if (element.id.includes('internal-code')) content = `**Cód.:** ${product?.internal_code || 'EX001'}`;
        else if (element.id.includes('price')) content = `R$ ${product?.price?.toFixed(2) || '99,99'}`;
        else if (element.id.includes('stock')) content = `**Estoque:** ${product?.stock || '50'}`;
        else if (element.id.includes('unit')) content = `**Unidade:** ${product?.stock_unit || 'Un'}`;
        else if (element.id.includes('size')) content = `**Tamanho:** ${product?.size || 'P'}`;
        else if (element.id.includes('color')) content = `**Cor:** ${product?.color || 'Preto'}`;
        else if (element.id.includes('composition')) content = `**Composição:** ${product?.composition || 'Algodão'}`;
        else if (element.id.includes('width')) content = `**Largura:** ${product?.width || '20'}cm`;
        else if (element.id.includes('length')) content = `**Comprimento:** ${product?.length || '40'}cm`;
        else if (element.id.includes('thickness')) content = `**Espessura:** ${product?.thickness || '5'}mm`;
        else if (element.id.includes('diameter')) content = `**Diâmetro:** ${product?.diameter || '10'}cm`;
        else if (element.id.includes('observations')) content = `**Observações:** ${product?.observation || 'Observações do produto...'}`;
        else content = element.label;
        break;
      case 'badge':
        content = element.id.includes('category') ? product?.categories?.name || 'Categoria' : element.label;
        break;
      case 'image':
        content = '📷';
        break;
      default:
        content = element.label;
    }

    return (
      <div
        key={element.id}
        style={style}
        onMouseDown={(e) => handleElementMouseDown(e, element)}
        onClick={(e) => handleElementClick(e, element)}
      >
        {/* Renderizar texto com formatação de negrito */}
        {content.includes('**') ? (
          <span 
            dangerouslySetInnerHTML={{
              __html: content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            }}
          />
        ) : (
          content
        )}
        {selectedElement?.id === element.id && (
          <>
            <div className="resize-handle" data-handle="nw" style={{
              position: 'absolute', top: -4, left: -4, width: 8, height: 8,
              backgroundColor: '#3b82f6', cursor: 'nw-resize', borderRadius: '50%'
            }} />
            <div className="resize-handle" data-handle="ne" style={{
              position: 'absolute', top: -4, right: -4, width: 8, height: 8,
              backgroundColor: '#3b82f6', cursor: 'ne-resize', borderRadius: '50%'
            }} />
            <div className="resize-handle" data-handle="sw" style={{
              position: 'absolute', bottom: -4, left: -4, width: 8, height: 8,
              backgroundColor: '#3b82f6', cursor: 'sw-resize', borderRadius: '50%'
            }} />
            <div className="resize-handle" data-handle="se" style={{
              position: 'absolute', bottom: -4, right: -4, width: 8, height: 8,
              backgroundColor: '#3b82f6', cursor: 'se-resize', borderRadius: '50%'
            }} />
          </>
        )}
      </div>
    );
  };

  const handleConfigurationSave = (config: any) => {
    console.log('Configuração salva:', config);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="flex h-16 items-center px-4">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              onClick={() => navigate('/catalog')}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Voltar ao Catálogo</span>
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <h1 className="text-xl font-semibold">Designer de Catálogo</h1>
          </div>
          
          <div className="ml-auto flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLayoutConfig(prev => ({ ...prev, scale: Math.max(0.5, prev.scale - 0.1) }))}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium">{Math.round((layoutConfig.scale || 1) * 100)}%</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLayoutConfig(prev => ({ ...prev, scale: Math.min(3, prev.scale + 0.1) }))}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Separator orientation="vertical" className="h-6" />
            <Button onClick={saveLayout} className="flex items-center space-x-2">
              <Save className="h-4 w-4" />
              <span>Salvar Layout</span>
            </Button>
            <Button variant="outline" onClick={generatePreviewPDF}>
              <Eye className="h-4 w-4 mr-2" />
              Visualizar PDF
            </Button>
          </div>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-[calc(100vh-4rem)]">
        <TabsList className="mx-4 mt-4">
          <TabsTrigger value="designer" className="flex items-center gap-2">
            <Layout className="h-4 w-4" />
            Designer Visual
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configurações Avançadas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="templates" className="h-full p-4">
          <CatalogTemplates onLoadTemplate={(template) => {
            setLayoutConfig(template.layoutConfig);
            setCatalogConfig(template.catalogConfig);
          }} />
        </TabsContent>

        <TabsContent value="settings" className="h-full p-4">
          <CatalogAdvancedSettings />
        </TabsContent>

        <TabsContent value="designer" className="h-full">
          <div className="flex h-full">
            {/* Sidebar - Elementos */}
            <div className="w-80 border-r bg-card p-4 overflow-y-auto">
              <div className="space-y-6">
                <div>
                  <h3 className="font-medium mb-3 flex items-center">
                    <Layers className="h-4 w-4 mr-2" />
                    Elementos
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {availableElements.map((element) => (
                      <div
                        key={element.id}
                        draggable
                        onDragStart={() => handleDragStart(element)}
                        className="p-3 border border-border rounded-lg cursor-grab hover:bg-accent transition-colors text-center text-sm"
                      >
                        <div className="flex flex-col items-center space-y-1">
                          {element.type === 'image' && <Image className="h-4 w-4" />}
                          {element.type === 'text' && <FileText className="h-4 w-4" />}
                          {element.type === 'badge' && <Tag className="h-4 w-4" />}
                          <span className="text-xs">{element.label}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>



                {selectedElement && (
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium">Propriedades</h3>
                      <div className="flex space-x-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => duplicateElement(selectedElement)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteElement(selectedElement.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label>X</Label>
                          <Input
                            type="number"
                            value={selectedElement.x}
                            onChange={(e) => updateElementProperty(selectedElement.id, 'x', Number(e.target.value))}
                          />
                        </div>
                        <div>
                          <Label>Y</Label>
                          <Input
                            type="number"
                            value={selectedElement.y}
                            onChange={(e) => updateElementProperty(selectedElement.id, 'y', Number(e.target.value))}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label>Largura (px)</Label>
                          <Input
                            type="number"
                            value={selectedElement.width}
                            onChange={(e) => updateElementProperty(selectedElement.id, 'width', Number(e.target.value))}
                            min={1}
                            max={500}
                          />
                        </div>
                        <div>
                          <Label>Altura (px)</Label>
                          <Input
                            type="number"
                            value={selectedElement.height}
                            onChange={(e) => updateElementProperty(selectedElement.id, 'height', Number(e.target.value))}
                            min={1}
                            max={500}
                          />
                        </div>
                      </div>

                      {selectedElement.type === 'image' ? (
                        <>
                          <div>
                            <Label>Borda (px)</Label>
                            <Input
                              type="number"
                              value={selectedElement.borderWidth}
                              onChange={(e) => updateElementProperty(selectedElement.id, 'borderWidth', Number(e.target.value))}
                              min={0}
                              max={10}
                            />
                          </div>
                          <div>
                            <Label>Cor da Borda</Label>
                            <Input
                              type="color"
                              value={selectedElement.borderColor}
                              onChange={(e) => updateElementProperty(selectedElement.id, 'borderColor', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label>Raio da Borda (px)</Label>
                            <Input
                              type="number"
                              value={selectedElement.borderRadius}
                              onChange={(e) => updateElementProperty(selectedElement.id, 'borderRadius', Number(e.target.value))}
                              min={0}
                              max={50}
                            />
                          </div>
                        </>
                      ) : (
                        <>
                          <div>
                            <Label>Tamanho da Fonte (px)</Label>
                            <Input
                              type="number"
                              value={selectedElement.fontSize}
                              onChange={(e) => updateElementProperty(selectedElement.id, 'fontSize', Number(e.target.value))}
                              min={1}
                              max={72}
                            />
                          </div>
                          <div>
                            <Label>Cor</Label>
                            <Input
                              type="color"
                              value={selectedElement.color}
                              onChange={(e) => updateElementProperty(selectedElement.id, 'color', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label>Cor de Fundo</Label>
                            <Input
                              type="color"
                              value={selectedElement.backgroundColor}
                              onChange={(e) => updateElementProperty(selectedElement.id, 'backgroundColor', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label>Alinhamento</Label>
                            <Select 
                              value={selectedElement.textAlign}
                              onValueChange={(value: 'left' | 'center' | 'right') => updateElementProperty(selectedElement.id, 'textAlign', value)}
                            >
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
                          <div>
                            <Label>Borda (px)</Label>
                            <Input
                              type="number"
                              value={selectedElement.borderWidth}
                              onChange={(e) => updateElementProperty(selectedElement.id, 'borderWidth', Number(e.target.value))}
                              min={0}
                              max={10}
                            />
                          </div>
                          <div>
                            <Label>Cor da Borda</Label>
                            <Input
                              type="color"
                              value={selectedElement.borderColor}
                              onChange={(e) => updateElementProperty(selectedElement.id, 'borderColor', e.target.value)}
                            />
                          </div>
                          <div>
                            <Label>Arredondamento (px)</Label>
                            <Input
                              type="number"
                              value={selectedElement.borderRadius}
                              onChange={(e) => updateElementProperty(selectedElement.id, 'borderRadius', Number(e.target.value))}
                              min={0}
                              max={50}
                            />
                          </div>
                          <div>
                            <Label>Opacidade</Label>
                            <Input
                              type="range"
                              min="0"
                              max="1"
                              step="0.1"
                              value={selectedElement.opacity}
                              onChange={(e) => updateElementProperty(selectedElement.id, 'opacity', Number(e.target.value))}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Canvas */}
            <div className="flex-1 overflow-auto p-8 bg-slate-100">
              <div className="flex justify-center">
                <div
                  ref={canvasRef}
                  className="relative bg-white shadow-lg"
                  style={{
                    width: layoutConfig.cardWidth * (layoutConfig.scale || 1),
                    height: layoutConfig.cardHeight * (layoutConfig.scale || 1),
                    backgroundColor: layoutConfig.backgroundColor,
                    border: `${layoutConfig.borderWidth}px solid ${layoutConfig.borderColor}`,
                    backgroundImage: layoutConfig.showGrid ? 
                      `radial-gradient(circle, #ccc 1px, transparent 1px)` : 'none',
                    backgroundSize: layoutConfig.showGrid ? 
                      `${layoutConfig.gridSize * (layoutConfig.scale || 1)}px ${layoutConfig.gridSize * (layoutConfig.scale || 1)}px` : 'auto',
                    backgroundPosition: '0 0'
                  }}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onClick={handleCanvasClick}
                >
                  {layoutConfig.elements
                    .sort((a, b) => a.zIndex - b.zIndex)
                    .map(renderElement)}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CatalogDesigner;