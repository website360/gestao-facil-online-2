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
 * Label: 100mm x 60mm in landscape
 */
// Max row coordinate allowed (mm/10). 60mm label = 0600.
const MAX_ROW_MM10 = 600;

const DPL_SYSTEM_SETUP = {
  metricMode: '\x02m\r',          // STX m -> metric mode (mm/10)
  edgeSensor: '\x02e\r',          // STX e -> gap/edge sensing
  gapLength: '\x02c0000\r',       // STX c0000 -> gap media mode
  maxLabelTravel: '\x02M0700\r',  // STX M0700 -> max TOF search = 70.0mm (just above 60mm label)
  zeroOffset: '\x02O0000\r',      // STX O0000 -> no start-of-print offset
  startFormat: '\x02L\r',         // STX L -> enter label format mode
} as const;

const DPL_LABEL_HEADER = {
  widthAndDotSize: 'D11\r',        // Dot density inside format
  heat: 'H30\r',                   // Max heat for darker print
  printSpeed: 'P0\r',              // Slowest print speed
  feedSpeed: 'S0\r',               // Slow feed speed
  quantityOne: 'Q0001\r',          // Print exactly 1 label per format
  endAndPrint: 'E\r',              // End format and print
} as const;

/**
 * Build system setup commands (sent ONCE per batch).
 */
function buildDPLSystemSetup(): string {
  return (
    DPL_SYSTEM_SETUP.metricMode +
    DPL_SYSTEM_SETUP.edgeSensor +
    DPL_SYSTEM_SETUP.gapLength +
    DPL_SYSTEM_SETUP.maxLabelTravel +
    DPL_SYSTEM_SETUP.zeroOffset
  );
}

/**
 * Validate that all row coordinates fit within the physical label height.
 * Row values are in mm/10 (metric mode). Returns true if all rows <= MAX_ROW_MM10.
 */
function validateDPLCoordinates(records: string[]): boolean {
  for (const rec of records) {
    // Text record format: 1[font][rot]1100[row:4][col:5]data
    // Row is at characters index 6..9 (4 digits after "1X1100")
    if (rec.length >= 10 && /^1\d\d1100/.test(rec)) {
      const row = parseInt(rec.substring(6, 10), 10);
      if (isNaN(row) || row > MAX_ROW_MM10) {
        console.error(`DPL coordinate validation failed: row ${row} exceeds max ${MAX_ROW_MM10}`);
        return false;
      }
    }
  }
  return true;
}

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

  // Text records — coordinates in mm/10, ALL rows must be <= 0600 (60mm)
  // Row layout: 0020=2mm, 0100=10mm, 0200=20mm, 0350=35mm, 0500=50mm
  const textRecords = [
    '191100020000050IRMAOS MANTOVANI TEXTIL',  // row 0020 = 2mm
    '121100100000010CLIENTE:',                  // row 0100 = 10mm
    '121100100000150' + clientText,             // row 0100 = 10mm
    '121100200000010NF:',                       // row 0200 = 20mm
    '121100200000080' + nf,                     // row 0200 = 20mm
    '121100350000010VOLUME:',                   // row 0350 = 35mm
    '121100350000150' + volText,                // row 0350 = 35mm
    '121100500000010DATA:',                     // row 0500 = 50mm
    '121100500000150' + date,                   // row 0500 = 50mm
  ];

  // Safety: validate coordinates before generating (prevents "meters of paper")
  if (!validateDPLCoordinates(textRecords)) {
    throw new Error('Layout inválido para etiqueta 60mm; impressão bloqueada para evitar desperdício.');
  }

  // Build single label block (no system setup — that's sent once per batch)
  let label = '';
  label += DPL_SYSTEM_SETUP.startFormat;
  label += DPL_LABEL_HEADER.widthAndDotSize;
  label += DPL_LABEL_HEADER.heat;
  label += DPL_LABEL_HEADER.printSpeed;
  label += DPL_LABEL_HEADER.feedSpeed;
  for (const rec of textRecords) {
    label += rec + '\r';
  }
  label += DPL_LABEL_HEADER.quantityOne;
  label += DPL_LABEL_HEADER.endAndPrint;

  return label;
}

/**
 * Generate DPL for all volumes. System setup is sent ONCE, then each label
 * is just STX L ... E (no repeated system commands = no extra feeds).
 */
export function generateAllDPLLabels(
  clientName: string,
  totalVolumes: number,
  invoiceNumber: string = ''
): string {
  const date = new Date().toLocaleDateString('pt-BR');

  // System setup ONCE at the start of the batch
  let allLabels = buildDPLSystemSetup();

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

  // Test label using the same validated structure as production labels
  let testLabel = '';
  testLabel += buildDPLSystemSetup();
  testLabel += DPL_SYSTEM_SETUP.startFormat;
  testLabel += DPL_LABEL_HEADER.widthAndDotSize;
  testLabel += DPL_LABEL_HEADER.heat;
  testLabel += DPL_LABEL_HEADER.printSpeed;
  testLabel += DPL_LABEL_HEADER.feedSpeed;
  testLabel += '121100100000050TESTE DE IMPRESSAO\r';
  testLabel += DPL_LABEL_HEADER.quantityOne;
  testLabel += DPL_LABEL_HEADER.endAndPrint;

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
const QZ_CONNECT_TIMEOUT_MS = 8000;
const QZ_PRINT_TIMEOUT_MS = 20000;

const VIRTUAL_PRINTER_PATTERNS = [
  /microsoft print to pdf/i,
  /adobe pdf/i,
  /xps document writer/i,
  /onenote/i,
  /fax/i,
];

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, timeoutMessage: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(timeoutMessage)), timeoutMs);

    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

function isDatamaxCompatiblePrinter(printerName: string): boolean {
  const name = printerName.toLowerCase();
  return (
    name.includes('datamax') ||
    name.includes('e-4204') ||
    name.includes('e4204') ||
    name.includes('honeywell') ||
    name.includes('e-class') ||
    name.includes('mark iii')
  );
}

function isVirtualPrinter(printerName: string): boolean {
  return VIRTUAL_PRINTER_PATTERNS.some((pattern) => pattern.test(printerName));
}

export async function printPdfDirect(
  pdfBase64: string,
  preferredPrinter?: string
): Promise<{ success: boolean; message: string }> {
  try {
    // 1. Connect with timeout
    const connected = await withTimeout(
      connectQZTray(),
      QZ_CONNECT_TIMEOUT_MS,
      'Timeout ao conectar no QZ Tray.'
    );

    if (!connected) {
      return {
        success: false,
        message: 'QZ Tray não está instalado ou não está rodando. Instale em https://qz.io/download e reinicie.',
      };
    }

    // 2. Validate payload
    const normalizedBase64 = (pdfBase64 || '').replace(/\s+/g, '');
    if (!normalizedBase64) {
      return {
        success: false,
        message: 'PDF inválido para impressão.',
      };
    }

    // 3. Discover printers
    const allPrinters = await withTimeout(
      findPrinters(),
      5000,
      'Timeout ao buscar impressoras no QZ Tray.'
    );

    if (allPrinters.length === 0) {
      return {
        success: false,
        message: 'Nenhuma impressora encontrada no QZ Tray.',
      };
    }

    // 4. Select printer (never fallback to virtual printers)
    const selectedPrinter = preferredPrinter
      ? allPrinters.find((name) => name === preferredPrinter)
      : allPrinters.find((name) => isDatamaxCompatiblePrinter(name) && !isVirtualPrinter(name));

    if (!selectedPrinter) {
      const availableList = allPrinters.slice(0, 5).join(', ');
      return {
        success: false,
        message: preferredPrinter
          ? `Impressora selecionada não encontrada no QZ: ${preferredPrinter}.`
          : `Datamax não encontrada no QZ Tray. Impressoras detectadas: ${availableList || 'nenhuma'}.`,
      };
    }

    // 5. Configure and print
    const config = qz.configs.create(selectedPrinter, {
      units: 'mm',
      size: { width: 100, height: 60 },
      scaleContent: false,
      rasterize: false,
      orientation: 'landscape',
    });

    await withTimeout(
      qz.print(config, [
        {
          type: 'pixel',
          format: 'pdf',
          flavor: 'base64',
          data: normalizedBase64,
        },
      ]),
      QZ_PRINT_TIMEOUT_MS,
      'Timeout no envio de impressão para a Datamax.'
    );

    return {
      success: true,
      message: `Etiquetas enviadas para ${selectedPrinter}`,
    };
  } catch (error) {
    console.error('QZ Tray print error:', error);
    return {
      success: false,
      message: `Erro ao imprimir: ${(error as Error).message || 'falha desconhecida'}`,
    };
  }
}

/**
 * High-level function: print volume labels via native RAW DPL on Datamax.
 * Uses D15/H30/S0 for maximum darkness (comparable to BarTender).
 * Returns result object for UI feedback.
 */
export async function printVolumeLabelsDPL(
  clientName: string,
  totalVolumes: number,
  invoiceNumber: string = ''
): Promise<{ success: boolean; message: string }> {
  try {
    // 1. Connect with timeout
    const connected = await withTimeout(
      connectQZTray(),
      QZ_CONNECT_TIMEOUT_MS,
      'Timeout ao conectar no QZ Tray.'
    );

    if (!connected) {
      return {
        success: false,
        message: 'QZ Tray não está instalado ou não está rodando. Instale em https://qz.io/download e reinicie.',
      };
    }

    // 2. Discover printers
    const allPrinters = await withTimeout(
      findPrinters(),
      5000,
      'Timeout ao buscar impressoras no QZ Tray.'
    );

    if (allPrinters.length === 0) {
      return { success: false, message: 'Nenhuma impressora encontrada no QZ Tray.' };
    }

    // 3. Find Datamax physical printer (exclude virtual)
    const datamaxPrinter = allPrinters.find(
      (name) => isDatamaxCompatiblePrinter(name) && !isVirtualPrinter(name)
    );

    if (!datamaxPrinter) {
      const availableList = allPrinters.slice(0, 5).join(', ');
      return {
        success: false,
        message: `Datamax não encontrada. Impressoras detectadas: ${availableList || 'nenhuma'}. Use "Baixar PDF" como alternativa.`,
      };
    }

    // 4. Generate DPL and send RAW
    const dplData = generateAllDPLLabels(clientName, totalVolumes, invoiceNumber);
    const config = qz.configs.create(datamaxPrinter, { raw: true });

    console.log(`Enviando ${totalVolumes} etiqueta(s) DPL nativo para ${datamaxPrinter}`);

    await withTimeout(
      qz.print(config, [{ type: 'raw', format: 'plain', data: dplData }]),
      QZ_PRINT_TIMEOUT_MS,
      'Timeout no envio de impressão DPL para a Datamax.'
    );

    return {
      success: true,
      message: `${totalVolumes} etiqueta(s) enviada(s) para ${datamaxPrinter} (modo nativo escuro)`,
    };
  } catch (error) {
    console.error('DPL print error:', error);
    return {
      success: false,
      message: `Erro na impressão nativa: ${(error as Error).message || 'falha desconhecida'}`,
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
