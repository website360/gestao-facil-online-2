
import { supabase } from '@/integrations/supabase/client';

export interface PDFConfig {
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
    title: 18,
    subtitle: 14,
    normal: 10,
    small: 9,
    family: 'helvetica', // Note: Montserrat adicionada ao projeto para uso futuro
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
    columnWidths: { item: 70, quantity: 8, unitPrice: 12, discount: 5, total: 5 },
    headerBackgroundColor: '#0EA5E9',
    zebraColor: '#F8F8F8',
    rowHeight: 10,
  },
};

export const loadPDFConfig = async (): Promise<PDFConfig> => {
  try {
    const { data, error } = await supabase
      .from('system_configurations')
      .select('value')
      .eq('key', 'pdf_budget_config')
      .maybeSingle();

    if (error) {
      console.error('Erro ao carregar configurações do PDF:', error);
      return DEFAULT_CONFIG;
    }

    if (data?.value) {
      let savedConfig: Partial<PDFConfig>;
      
      // Parse JSON se for string, ou use direto se já for objeto
      if (typeof data.value === 'string') {
        savedConfig = JSON.parse(data.value);
      } else {
        savedConfig = data.value as Partial<PDFConfig>;
      }

      return {
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
      };
    }

    return DEFAULT_CONFIG;
  } catch (error) {
    console.error('Erro ao carregar configurações do PDF:', error);
    return DEFAULT_CONFIG;
  }
};
