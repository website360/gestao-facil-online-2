import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package } from 'lucide-react';

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
}

interface Product {
  id: string;
  name: string;
  internal_code: string;
  price: number;
  stock: number;
  photo_url: string | null;
  size?: string | null;
  color?: string | null;
  composition?: string | null;
  width?: number | null;
  length?: number | null;
  thickness?: number | null;
  diameter?: number | null;
  observation?: string | null;
  stock_unit?: string | null;
  categories?: {
    name: string;
  };
}

interface PDFPreviewProps {
  layoutConfig: LayoutConfig;
  exampleProduct?: Product;
  catalogConfig?: any;
}

export const PDFPreview: React.FC<PDFPreviewProps> = ({ 
  layoutConfig, 
  exampleProduct,
  catalogConfig 
}) => {
  const dimensions = useMemo(() => {
    const config = catalogConfig || {
      page: {
        paperSize: 'A4',
        orientation: 'portrait',
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
      }
    };

    let pageWidth = 210; // A4 em mm
    let pageHeight = 297;
    
    if (config.page.orientation === 'landscape') {
      [pageWidth, pageHeight] = [pageHeight, pageWidth];
    }

    const availableWidth = pageWidth - (config.page.marginLeft + config.page.marginRight);
    const availableHeight = pageHeight - (config.page.marginTop + config.page.marginBottom + 40); // 40mm para título
    
    const cardWidth = (availableWidth - (config.layout.cardSpacing * (config.layout.columns - 1))) / config.layout.columns;
    const cardHeight = (availableHeight - (config.layout.rowSpacing * (config.layout.rows - 1))) / config.layout.rows;

    // Converter para pixels para preview (escala maior para melhor visualização)
    const scale = 2.5; // Escala aumentada para preview em tela cheia
    return {
      pageWidth: pageWidth * scale,
      pageHeight: pageHeight * scale,
      cardWidth: cardWidth * scale,
      cardHeight: cardHeight * scale,
      marginTop: config.page.marginTop * scale,
      marginLeft: config.page.marginLeft * scale,
      cardSpacing: config.layout.cardSpacing * scale,
      rowSpacing: config.layout.rowSpacing * scale,
      rows: config.layout.rows,
      columns: config.layout.columns,
      scale
    };
  }, [catalogConfig]);

  const getElementContent = (element: ElementConfig) => {
    const product = exampleProduct;
    
    switch (element.type) {
      case 'text':
        if (element.id.includes('product-name')) return product?.name || 'Nome do Produto';
        else if (element.id.includes('internal-code')) return `Cód.: ${product?.internal_code || 'EX001'}`;
        else if (element.id.includes('price')) return product?.price?.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) || 'R$ 99,99';
        else if (element.id.includes('stock')) return `Estoque: ${product?.stock || '50'}`;
        else if (element.id.includes('unit')) return product?.stock_unit || 'Un';
        else if (element.id.includes('size')) return product?.size || 'P';
        else if (element.id.includes('color')) return product?.color || 'Preto';
        else if (element.id.includes('composition')) return product?.composition || 'Algodão';
        else if (element.id.includes('width')) return `L: ${product?.width || '20'}cm`;
        else if (element.id.includes('length')) return `C: ${product?.length || '40'}cm`;
        else if (element.id.includes('thickness')) return `E: ${product?.thickness || '5'}mm`;
        else if (element.id.includes('diameter')) return `D: ${product?.diameter || '10'}cm`;
        else if (element.id.includes('observations')) return product?.observation || 'Observações...';
        else return element.label;
      case 'badge':
        return element.id.includes('category') ? product?.categories?.name || 'Categoria' : element.label;
      case 'image':
        return null; // Será renderizado como imagem
      default:
        return element.label;
    }
  };

  const renderCard = (row: number, col: number) => {
    const x = dimensions.marginLeft + col * (dimensions.cardWidth + dimensions.cardSpacing);
    const y = dimensions.marginTop + 50 + row * (dimensions.cardHeight + dimensions.rowSpacing); // 50 para título maior

    return (
      <div
        key={`card-${row}-${col}`}
        className="absolute bg-white shadow-sm border"
        style={{
          left: `${x}px`,
          top: `${y}px`,
          width: `${dimensions.cardWidth}px`,
          height: `${dimensions.cardHeight}px`,
          borderWidth: `${(catalogConfig?.layout?.cardBorderWidth || 1) * dimensions.scale}px`,
          borderColor: catalogConfig?.layout?.cardBorderColor || '#e5e7eb',
          borderRadius: `${(catalogConfig?.layout?.cardBorderRadius || 0) * dimensions.scale}px`,
          backgroundColor: catalogConfig?.layout?.cardBackgroundColor || '#ffffff',
        }}
      >
        {/* Renderizar elementos do layout */}
        {layoutConfig.elements
          .filter(element => element.visible)
          .sort((a, b) => a.zIndex - b.zIndex)
          .map(element => {
            const elementX = element.x * dimensions.scale;
            const elementY = element.y * dimensions.scale;
            const elementWidth = element.width * dimensions.scale;
            const elementHeight = element.height * dimensions.scale;
            const fontSize = element.fontSize * dimensions.scale * 0.8; // Ajuste para preview maior

            const content = getElementContent(element);

            return (
              <div
                key={element.id}
                className="absolute overflow-hidden"
                style={{
                  left: `${elementX}px`,
                  top: `${elementY}px`,
                  width: `${elementWidth}px`,
                  height: `${elementHeight}px`,
                  fontSize: `${fontSize}px`,
                  fontWeight: element.fontWeight,
                  color: element.color,
                  textAlign: element.textAlign,
                  backgroundColor: element.type === 'badge' || element.backgroundColor !== 'transparent' 
                    ? element.backgroundColor 
                    : 'transparent',
                  borderRadius: element.type === 'badge' ? `${element.borderRadius * dimensions.scale}px` : '0px',
                  border: element.borderWidth > 0 
                    ? `${element.borderWidth * dimensions.scale}px solid ${element.borderColor}` 
                    : 'none',
                  padding: `${element.padding * dimensions.scale}px`,
                  margin: `${element.margin * dimensions.scale}px`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: element.textAlign === 'center' ? 'center' : element.textAlign === 'right' ? 'flex-end' : 'flex-start',
                  zIndex: element.zIndex,
                  opacity: element.opacity,
                  lineHeight: '1.1',
                }}
              >
                {element.type === 'image' ? (
                  <div className="w-full h-full bg-gray-100 border border-gray-300 flex items-center justify-center">
                    {exampleProduct?.photo_url ? (
                      <img 
                        src={exampleProduct.photo_url} 
                        alt="Product" 
                        className="w-full h-full object-cover"
                        style={{ fontSize: '8px' }}
                      />
                    ) : (
                      <Package className="w-3 h-3 text-gray-400" />
                    )}
                  </div>
                ) : (
                  <span className="w-full text-ellipsis whitespace-nowrap overflow-hidden">
                    {content}
                  </span>
                )}
              </div>
            );
          })}
      </div>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header com informações */}
      <div className="p-4 border-b bg-white">
        <h3 className="text-lg font-medium mb-2">Preview do PDF em Tempo Real</h3>
        <div className="flex gap-6 text-sm text-gray-600">
          <div>📄 Página: {Math.round(dimensions.pageWidth/dimensions.scale)} x {Math.round(dimensions.pageHeight/dimensions.scale)} mm</div>
          <div>📐 Layout: {dimensions.rows}x{dimensions.columns} ({dimensions.rows * dimensions.columns} cards/página)</div>
          <div>📏 Card: {Math.round(dimensions.cardWidth/dimensions.scale)} x {Math.round(dimensions.cardHeight/dimensions.scale)} mm</div>
        </div>
      </div>
      
      {/* Preview em tela cheia */}
      <div className="flex-1 overflow-auto bg-gray-100 p-8">
        <div className="flex justify-center">
          <div
            className="relative bg-white shadow-xl border border-gray-300"
            style={{
              width: `${dimensions.pageWidth}px`,
              height: `${dimensions.pageHeight}px`,
              backgroundColor: '#ffffff',
            }}
          >
            {/* Título da categoria */}
            <div
              className="absolute text-center font-bold"
              style={{
                left: '50%',
                top: `${dimensions.marginTop}px`,
                transform: 'translateX(-50%)',
                fontSize: `${(catalogConfig?.categoryTitle?.fontSize || 22) * dimensions.scale * 0.8}px`,
                color: catalogConfig?.categoryTitle?.fontColor || '#1e3a8a',
                fontWeight: catalogConfig?.categoryTitle?.fontWeight || 'bold',
              }}
            >
              CATEGORIA EXEMPLO
            </div>

            {/* Linha decorativa */}
            <div
              className="absolute"
              style={{
                left: `${dimensions.marginLeft}px`,
                right: `${dimensions.marginLeft}px`,
                top: `${dimensions.marginTop + 25}px`,
                height: '2px',
                backgroundColor: catalogConfig?.categoryTitle?.fontColor || '#1e3a8a',
              }}
            />

            {/* Renderizar cards */}
            {Array.from({ length: dimensions.rows }, (_, row) =>
              Array.from({ length: dimensions.columns }, (_, col) =>
                renderCard(row, col)
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};