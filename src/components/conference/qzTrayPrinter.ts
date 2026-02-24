/**
 * QZ Tray integration for raw DPL printing to Datamax printers.
 * QZ Tray must be installed on the user's machine: https://qz.io/download
 */
import qz from 'qz-tray';

let isConnected = false;
let securityConfigured = false;

/**
 * Configure QZ Tray security for unsigned/demo mode.
 * This allows printing without a paid certificate.
 */
function configureQZSecurity(): void {
  if (securityConfigured) return;
  
  // Override certificate promise - return empty for unsigned mode
  qz.security.setCertificatePromise(function(resolve: (cert: string) => void, reject: (err: Error) => void) {
    // For demo/development, resolve with empty string
    // QZ Tray will show a warning but will still work
    resolve('');
  });
  
  // Override signature promise - return empty for unsigned mode
  qz.security.setSignaturePromise(function(toSign: string) {
    return function(resolve: (sig: string) => void, reject: (err: Error) => void) {
      // Return empty signature for unsigned mode
      resolve('');
    };
  });
  
  securityConfigured = true;
  console.log('QZ Tray security configured for unsigned mode');
}

export async function connectQZTray(): Promise<boolean> {
  if (qz.websocket.isActive()) {
    isConnected = true;
    return true;
  }

  try {
    // Configure security BEFORE connecting
    configureQZSecurity();

    await qz.websocket.connect();
    isConnected = true;
    console.log('QZ Tray conectado com sucesso');
    return true;
  } catch (error) {
    console.warn('QZ Tray não está instalado ou não está rodando:', error);
    isConnected = false;
    return false;
  }
}

export async function isQZTrayAvailable(): Promise<boolean> {
  if (qz.websocket.isActive()) return true;
  try {
    // Configure security before checking availability
    configureQZSecurity();
    await qz.websocket.connect();
    return true;
  } catch {
    return false;
  }
}

export async function findPrinters(): Promise<string[]> {
  if (!qz.websocket.isActive()) {
    const connected = await connectQZTray();
    if (!connected) return [];
  }
  try {
    const printers = await qz.printers.find();
    return Array.isArray(printers) ? printers : [printers];
  } catch {
    return [];
  }
}

export async function findDatamaxPrinter(): Promise<string | null> {
  const printers = await findPrinters();
  const datamax = printers.find(p =>
    p.toLowerCase().includes('datamax') ||
    p.toLowerCase().includes('e-4204') ||
    p.toLowerCase().includes('honeywell')
  );
  return datamax || null;
}

/**
 * Generate DPL commands for a single volume label.
 * Datamax O'Neil E-Class Mark III at 203 DPI (8 dots/mm)
 * Label: 100mm x 60mm = 800 x 480 dots
 *
 * DPL format for E-Class Mark III:
 * - STX + n = Clear buffer and start label
 * - m = Set metric mode (mm)
 * - D = Density/Darkness (00-15, higher = darker)
 * - H = Heat setting (00-30)  
 * - S = Speed (0=slowest)
 * - 1 = Text command prefix
 * - E = End and print
 *
 * Text format: 1X1100YYYYXXXXXdata
 * X = font (0-9), Y = row position, X = column position
 */
function generateDPLLabel(
  clientName: string,
  invoiceNumber: string,
  volumeNumber: number,
  totalVolumes: number,
  date: string
): string {
  const clientText = clientName.toUpperCase().substring(0, 30);
  const volText = `${volumeNumber}/${totalVolumes}`;
  const nf = invoiceNumber || 'S/N';

  // Build single string with CR line endings for DPL
  // Using simpler DPL format compatible with E-Class Mark III
  let label = '';
  
  // Start label format mode, clear buffer
  label += '\x02n\r';           // STX + n = new label, clear image buffer
  label += '\x02M0500\r';       // Set label length to 500 dots (~62mm)
  label += '\x02O0220\r';       // Set label width offset
  label += '\x02D15\r';         // Maximum darkness (0-15)
  label += '\x02H30\r';         // Maximum heat (0-30)  
  label += '\x02S0\r';          // Slowest speed for best quality
  label += '\x02L\r';           // Start label format
  
  // Header - IRMAOS MANTOVANI TEXTIL (font 4, row 20, col 50)
  label += '191100020000050IRMAOS MANTOVANI TEXTIL\r';
  
  // CLIENTE label (font 2, row 80, col 10)
  label += '121100080000010CLIENTE:\r';
  // Client name (font 2, row 80, col 150)
  label += '121100080000150' + clientText + '\r';
  
  // NF label (font 2, row 140, col 10)
  label += '121100140000010NF:\r';
  // NF value (font 2, row 140, col 80)
  label += '121100140000080' + nf + '\r';
  
  // VOLUME label (font 2, row 200, col 10)
  label += '121100200000010VOLUME:\r';
  // Volume value (font 2, row 200, col 150)
  label += '121100200000150' + volText + '\r';
  
  // DATA label (font 2, row 200, col 350)
  label += '121100200000350DATA:\r';
  // Date value (font 2, row 200, col 450)
  label += '121100200000450' + date + '\r';
  
  // End label and print 1 copy
  label += 'Q0001\r';
  label += 'E\r';
  
  return label;
}

export function generateAllDPLLabels(
  clientName: string,
  totalVolumes: number,
  invoiceNumber: string = ''
): string {
  const date = new Date().toLocaleDateString('pt-BR');
  let allLabels = '';

  for (let i = 0; i < totalVolumes; i++) {
    allLabels += generateDPLLabel(clientName, invoiceNumber, i + 1, totalVolumes, date);
  }

  return allLabels;
}

/**
 * Send a minimal test label to validate printer communication.
 */
export async function printTestLabel(printerName: string): Promise<void> {
  if (!qz.websocket.isActive()) {
    await connectQZTray();
  }

  const config = qz.configs.create(printerName, { raw: true });
  
  // Simple test label with maximum darkness settings
  let testLabel = '';
  testLabel += '\x02n\r';
  testLabel += '\x02D15\r';
  testLabel += '\x02H30\r';
  testLabel += '\x02S0\r';
  testLabel += '\x02L\r';
  testLabel += '121100100000050TESTE DE IMPRESSAO\r';
  testLabel += 'Q0001\r';
  testLabel += 'E\r';

  console.log('Test DPL:', testLabel);
  await qz.print(config, [{ type: 'raw', format: 'plain', data: testLabel }]);
}

export async function printRawDPL(
  printerName: string,
  clientName: string,
  totalVolumes: number,
  invoiceNumber: string = ''
): Promise<void> {
  if (!qz.websocket.isActive()) {
    await connectQZTray();
  }

  const config = qz.configs.create(printerName, { raw: true });
  const dplData = generateAllDPLLabels(clientName, totalVolumes, invoiceNumber);

  console.log('DPL data being sent (first 200 chars):', dplData.substring(0, 200));

  // QZ Tray raw printing: send as raw data
  await qz.print(config, [{ type: 'raw', format: 'plain', data: dplData }]);
}

/**
 * Print a PDF (base64-encoded) directly to a printer via QZ Tray.
 * Uses pixel mode so the PDF renders exactly as designed.
 * Returns a result object with success/error info for the UI.
 */
export async function printPdfDirect(
  pdfBase64: string,
  preferredPrinter?: string
): Promise<{ success: boolean; message: string }> {
  try {
    // 1. Connect
    const connected = await connectQZTray();
    if (!connected) {
      return {
        success: false,
        message: 'QZ Tray não está instalado ou não está rodando. Instale em https://qz.io/download e reinicie.',
      };
    }

    // 2. Find printer
    let printerName = preferredPrinter || (await findDatamaxPrinter());
    if (!printerName) {
      // Fallback: try first available printer
      const allPrinters = await findPrinters();
      if (allPrinters.length > 0) {
        printerName = allPrinters[0];
      } else {
        return {
          success: false,
          message: 'Nenhuma impressora encontrada. Verifique se a Datamax está ligada e instalada.',
        };
      }
    }

    // 3. Configure and print
    const config = qz.configs.create(printerName, {
      units: 'mm',
      size: { width: 100, height: 60 },
      scaleContent: false,
      rasterize: true,
    });

    await qz.print(config, [
      {
        type: 'pixel',
        format: 'pdf',
        flavor: 'base64',
        data: pdfBase64,
      },
    ]);

    return {
      success: true,
      message: `Etiquetas enviadas para ${printerName}`,
    };
  } catch (error) {
    console.error('QZ Tray print error:', error);
    return {
      success: false,
      message: `Erro ao imprimir: ${(error as Error).message || 'falha desconhecida'}`,
    };
  }
}

export async function disconnectQZTray(): Promise<void> {
  if (qz.websocket.isActive()) {
    try {
      await qz.websocket.disconnect();
    } catch {
      // ignore
    }
  }
  isConnected = false;
}
