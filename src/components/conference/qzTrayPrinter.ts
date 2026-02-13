/**
 * QZ Tray integration for raw DPL printing to Datamax printers.
 * QZ Tray must be installed on the user's machine: https://qz.io/download
 */
import qz from 'qz-tray';

let isConnected = false;

export async function connectQZTray(): Promise<boolean> {
  if (qz.websocket.isActive()) {
    isConnected = true;
    return true;
  }

  try {
    qz.security.setCertificatePromise(function(resolve: (cert: string) => void) {
      resolve('');
    });
    qz.security.setSignatureAlgorithm('SHA512');
    qz.security.setSignaturePromise(function() {
      return function(resolve: (sig: string) => void) {
        resolve('');
      };
    });

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
 * Datamax E-4204B at 203 DPI (8 dots/mm)
 * Label: 100mm x 60mm = 800 x 480 dots
 *
 * DPL text record format:
 *   1<font><rotation><height_mult><width_mult><RRRR><CCCCC><data>
 *   font: 0-8 bitmap
 *   rotation: 1=0°, 2=90°CW, 3=180°, 4=90°CCW
 *   height_mult: 1-9 (1=normal)
 *   width_mult: 1-9 (1=normal)
 *   RRRR: 4-digit row, CCCCC: 5-digit column
 *
 * Returns array of strings, one per DPL line.
 */
function generateDPLLabel(
  clientName: string,
  invoiceNumber: string,
  volumeNumber: number,
  totalVolumes: number,
  date: string
): string[] {
  const lines: string[] = [];

  // Using \n as line terminator per official QZ Tray DPL examples
  const add = (line: string) => lines.push(line + '\n');

  // Start label format
  add('\x02L');
  add('D14');      // Density (higher = darker)
  add('H15');      // Heat
  add('S2');       // Speed
  add('q800');     // Label width 100mm = 800 dots at 203dpi

  // === HEADER ===
  add('141110020000150IRMAOS MANTOVANI TEXTIL');

  // === CLIENTE ===
  add('161110072000015CLIENTE');
  const clientText = clientName.toUpperCase().substring(0, 30);
  add('121110090000160' + clientText);

  // === NOTA FISCAL ===
  add('161110150000015NOTA FISCAL');
  add('121110165000160' + (invoiceNumber || ''));

  // === VOLUME ===
  add('161110225000015VOLUME');
  const volText = `${volumeNumber}/${totalVolumes}`;
  add('121110240000165' + volText);

  // === DATA ===
  add('161110225000320DATA');
  add('121110240000420' + date);

  // Quantity and end
  add('Q0001');
  add('E');

  return lines;
}

export function generateAllDPLLabels(
  clientName: string,
  totalVolumes: number,
  invoiceNumber: string = ''
): string[] {
  const date = new Date().toLocaleDateString('pt-BR');
  let allLines: string[] = [];

  for (let i = 0; i < totalVolumes; i++) {
    const labelLines = generateDPLLabel(clientName, invoiceNumber, i + 1, totalVolumes, date);
    allLines = allLines.concat(labelLines);
  }

  return allLines;
}

/**
 * Send a minimal test label to validate printer communication.
 */
export async function printTestLabel(printerName: string): Promise<void> {
  if (!qz.websocket.isActive()) {
    await connectQZTray();
  }

  const config = qz.configs.create(printerName);
  const testLines = [
    '\x02L\n',
    'D11\n',
    'H14\n',
    '121100000300015TEST 1 2 3 4 5 6 7 8 9 10\n',
    'Q0001\n',
    'E\n'
  ];

  console.log('Test DPL lines:', testLines);
  await qz.print(config, testLines);
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

  const config = qz.configs.create(printerName);
  const dplLines = generateAllDPLLabels(clientName, totalVolumes, invoiceNumber);

  console.log('DPL lines being sent:', dplLines.slice(0, 5));

  // QZ Tray raw printing: pass array of strings, one per line
  await qz.print(config, dplLines);
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
