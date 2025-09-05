import { supabase } from '@/integrations/supabase/client';

interface PDFConfig {
  header: {
    logoUrl?: string;
    height: number;
    backgroundColor: string;
    companyName: string;
    showLogo: boolean;
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
  };
  colors: {
    primary: string;
    dark: string;
    gray: string;
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
}

const DEFAULT_CONFIG: PDFConfig = {
  header: {
    height: 25,
    backgroundColor: '#0EA5E9',
    companyName: 'Sistema de Gestão',
    showLogo: true,
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
  },
  colors: {
    primary: '#0EA5E9',
    dark: '#1F2937',
    gray: '#6B7280',
  },
  sections: {
    clientInfo: {
      fontSize: 10,
      backgroundColor: '#F0F0F0',
      borderColor: '#D1D5DB',
      borderWidth: 1,
      lineSpacing: 4,
      showBorder: true,
      padding: {
        top: 5,
        right: 5,
        bottom: 5,
        left: 5,
      },
      titleMargin: {
        top: 8,
        right: 0,
        bottom: 8,
        left: 0,
      },
    },
    paymentInfo: {
      fontSize: 9,
      backgroundColor: '#F0F0F0',
      borderColor: '#D1D5DB',
      borderWidth: 1,
      lineSpacing: 4,
      showBorder: true,
      padding: {
        top: 5,
        right: 5,
        bottom: 5,
        left: 5,
      },
      titleMargin: {
        top: 8,
        right: 0,
        bottom: 8,
        left: 0,
      },
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
};

export const loadPrintConfig = async (): Promise<PDFConfig> => {
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

    if (data?.value && typeof data.value === 'object' && data.value !== null) {
      const savedConfig = data.value as Partial<PDFConfig>;
      return {
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
      };
    }

    return DEFAULT_CONFIG;
  } catch (error) {
    console.error('Erro ao carregar configurações do PDF:', error);
    return DEFAULT_CONFIG;
  }
};

export const generatePrintStyle = (config: PDFConfig) => {
  return `
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
      
      body { 
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        margin: 0;
        padding: 20px;
        line-height: 1.4;
        color: ${config.colors.dark};
        background: white;
      }
      
      .header { 
        text-align: center; 
        margin-bottom: 30px; 
        border-bottom: 3px solid ${config.colors.primary}; 
        padding-bottom: 20px;
        background: linear-gradient(135deg, ${config.colors.primary}10, ${config.colors.primary}05);
        margin: -20px -20px 30px -20px;
        padding: 20px 20px 20px 20px;
      }
      
      .company-name { 
        font-size: ${config.fonts.title + 8}px; 
        font-weight: 700; 
        color: ${config.colors.primary};
        margin-bottom: 8px;
        letter-spacing: -0.5px;
      }
      
      .document-title {
        font-size: ${config.fonts.subtitle + 2}px;
        font-weight: 600;
        color: ${config.colors.dark};
        margin-top: 8px;
      }
      
      .info-section { 
        margin-bottom: 24px; 
        background: ${config.sections.clientInfo.backgroundColor};
        border: ${config.sections.clientInfo.showBorder ? `1px solid ${config.sections.clientInfo.borderColor}` : 'none'};
        border-radius: 8px;
        padding: ${config.sections.clientInfo.padding.top * 2}px ${config.sections.clientInfo.padding.right * 2}px;
      }
      
      .info-section h3 {
        font-size: ${config.fonts.subtitle}px;
        font-weight: 600;
        color: ${config.colors.primary};
        margin: 0 0 12px 0;
        border-bottom: 2px solid ${config.colors.primary}20;
        padding-bottom: 6px;
      }
      
      .info-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 12px;
      }
      
      .info-row { 
        display: flex; 
        justify-content: space-between; 
        margin-bottom: 8px;
        padding: 4px 0;
      }
      
      .info-label { 
        font-weight: 600; 
        color: ${config.colors.dark};
        font-size: ${config.sections.clientInfo.fontSize + 1}px;
      }
      
      .info-value {
        font-weight: 400;
        color: ${config.colors.gray};
        font-size: ${config.sections.clientInfo.fontSize + 1}px;
      }
      
      .payment-section {
        background: ${config.sections.paymentInfo.backgroundColor};
        border: ${config.sections.paymentInfo.showBorder ? `1px solid ${config.sections.paymentInfo.borderColor}` : 'none'};
        border-radius: 8px;
        padding: ${config.sections.paymentInfo.padding.top * 2}px ${config.sections.paymentInfo.padding.right * 2}px;
        margin-bottom: 24px;
      }
      
      .payment-section h3 {
        font-size: ${config.fonts.subtitle}px;
        font-weight: 600;
        color: ${config.colors.primary};
        margin: 0 0 12px 0;
        border-bottom: 2px solid ${config.colors.primary}20;
        padding-bottom: 6px;
      }
      
      .payment-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 12px;
        margin-bottom: 16px;
      }
      
      .payment-item {
        background: white;
        padding: 8px 12px;
        border-radius: 6px;
        border: 1px solid ${config.sections.paymentInfo.borderColor};
      }
      
      .payment-label {
        font-size: ${config.sections.paymentInfo.fontSize}px;
        font-weight: 600;
        color: ${config.colors.dark};
        margin-bottom: 4px;
      }
      
      .payment-value {
        font-size: ${config.sections.paymentInfo.fontSize + 1}px;
        color: ${config.colors.gray};
      }
      
      table { 
        width: 100%; 
        border-collapse: collapse; 
        margin: 20px 0;
        background: white;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 1px 3px ${config.colors.primary}15;
      }
      
      th { 
        background: ${config.colors.primary}; 
        color: white;
        padding: 12px 8px; 
        text-align: left; 
        font-weight: 600;
        font-size: ${config.sections.tableHeaders.fontSize + 1}px;
        border: none;
      }
      
      td { 
        border-bottom: 1px solid ${config.colors.primary}10; 
        padding: 10px 8px; 
        font-size: ${config.fonts.normal}px;
        vertical-align: middle;
      }
      
      tr:nth-child(even) td {
        background-color: ${config.colors.primary}05;
      }
      
      tr:hover td {
        background-color: ${config.colors.primary}10;
      }
      
      .total-section { 
        background: linear-gradient(135deg, ${config.colors.primary}10, ${config.colors.primary}05);
        border: 2px solid ${config.colors.primary}20;
        border-radius: 12px;
        padding: 20px;
        margin: 24px 0;
      }
      
      .total-row { 
        display: flex; 
        justify-content: space-between; 
        margin-bottom: 8px;
        font-size: ${config.sections.financialSummary.fontSize + 1}px;
      }
      
      .total-label {
        font-weight: 500;
        color: ${config.colors.dark};
      }
      
      .total-value {
        font-weight: 600;
        color: ${config.colors.dark};
      }
      
      .final-total { 
        border-top: 2px solid ${config.colors.primary};
        padding-top: 12px;
        margin-top: 12px;
      }
      
      .final-total .total-label,
      .final-total .total-value {
        font-size: ${config.sections.financialSummary.totalFontSize + 4}px;
        font-weight: 700;
        color: ${config.colors.primary};
      }
      
      .observations-section {
        background: #FEF3C7;
        border: 1px solid #F59E0B;
        border-radius: 8px;
        padding: 16px;
        margin: 20px 0;
      }
      
      .observations-section h4 {
        color: #92400E;
        font-size: ${config.fonts.subtitle}px;
        font-weight: 600;
        margin: 0 0 8px 0;
      }
      
      .observations-section p {
        color: #78350F;
        font-size: ${config.fonts.normal}px;
        margin: 0;
        line-height: 1.5;
      }
      
      .footer { 
        margin-top: 40px; 
        text-align: center; 
        font-size: ${config.fonts.small}px; 
        color: ${config.colors.gray};
        border-top: 1px solid ${config.colors.primary}20;
        padding-top: 20px;
      }
      
      .footer p {
        margin: 4px 0;
      }
      
      @media print {
        body { 
          margin: 0; 
          padding: 15px;
          -webkit-print-color-adjust: exact;
          color-adjust: exact;
        }
        .no-print { 
          display: none !important; 
        }
        .header {
          margin: -15px -15px 20px -15px;
          padding: 15px;
        }
        table { 
          break-inside: avoid;
        }
        .info-section,
        .payment-section,
        .total-section {
          break-inside: avoid;
        }
        @page {
          margin: 1cm;
          size: A4;
        }
      }
    </style>
  `;
};

export const createPrintContent = async (
  elementId: string, 
  title: string, 
  documentType: 'Orçamento' | 'Venda'
) => {
  const config = await loadPrintConfig();
  const printContent = document.getElementById(elementId);
  
  if (!printContent) return;

  const printWindow = window.open('', '_blank');
  
  if (printWindow) {
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${title}</title>
          ${generatePrintStyle(config)}
        </head>
        <body>
          <div class="header">
            ${config.header.logoUrl ? `<img src="${config.header.logoUrl}" alt="Logo" style="max-height: 60px; margin-bottom: 12px;">` : ''}
            <div class="company-name">${config.header.companyName}</div>
            <div class="document-title">${title}</div>
          </div>
          ${printContent.innerHTML}
          <div class="footer">
            <p>${config.footer.validityText}</p>
            <p>${config.footer.copyrightText}</p>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
    printWindow.close();
  }
};