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
  const STX = '\x02';
  const lines: string[] = [];

  // Each line MUST end with \n for QZ Tray raw printing
  const add = (line: string) => lines.push(line + '\n');

  // Start label format
  add(STX + 'L');
  add('D11');      // Density
  add('H15');      // Heat
  add('S2');       // Speed
  add('q800');     // Label width in dots
  add('Q0480,024'); // Label height, gap

  // === OUTER BORDER ===
  add('1X1100' + '0780' + '0003' + '0008' + '00008'); // top
  add('1X1100' + '0780' + '0003' + '0468' + '00008'); // bottom
  add('1X1100' + '0003' + '0463' + '0008' + '00008'); // left
  add('1X1100' + '0003' + '0463' + '0008' + '00785'); // right

  // === HEADER: IRMAOS MANTOVANI TEXTIL ===
  add('14111' + '0020' + '00193' + 'IRMAOS MANTOVANI TEXTIL');

  // Separator line below header
  add('1X1100' + '0760' + '0002' + '0055' + '00020');

  // === CLIENTE label ===
  add('16111' + '0072' + '00015' + 'CLIENTE');

  // Client box
  add('1X1100' + '0635' + '0002' + '0068' + '00150'); // top
  add('1X1100' + '0635' + '0002' + '0128' + '00150'); // bottom
  add('1X1100' + '0002' + '0062' + '0068' + '00150'); // left
  add('1X1100' + '0002' + '0062' + '0068' + '00783'); // right

  // Client name - font 2, rotation 1, h1, w1
  const clientText = clientName.toUpperCase().substring(0, 30);
  add('12111' + '0090' + '00160' + clientText);

  // === NOTA FISCAL label ===
  add('16111' + '0150' + '00015' + 'NOTA FISCAL');

  // NF box
  add('1X1100' + '0635' + '0002' + '0145' + '00150'); // top
  add('1X1100' + '0635' + '0002' + '0200' + '00150'); // bottom
  add('1X1100' + '0002' + '0057' + '0145' + '00150'); // left
  add('1X1100' + '0002' + '0057' + '0145' + '00783'); // right

  // NF value - font 2
  add('12111' + '0165' + '00160' + (invoiceNumber || ''));

  // === VOLUME label ===
  add('16111' + '0225' + '00015' + 'VOLUME');

  // Volume box
  add('1X1100' + '0140' + '0002' + '0220' + '00150'); // top
  add('1X1100' + '0140' + '0002' + '0275' + '00150'); // bottom
  add('1X1100' + '0002' + '0057' + '0220' + '00150'); // left
  add('1X1100' + '0002' + '0057' + '0220' + '00288'); // right

  // Volume value - font 2
  const volText = `${volumeNumber}/${totalVolumes}`;
  add('12111' + '0240' + '00165' + volText);

  // === DATA label ===
  add('16111' + '0225' + '00320' + 'DATA');

  // Date box
  add('1X1100' + '0385' + '0002' + '0220' + '00400'); // top
  add('1X1100' + '0385' + '0002' + '0275' + '00400'); // bottom
  add('1X1100' + '0002' + '0057' + '0220' + '00400'); // left
  add('1X1100' + '0002' + '0057' + '0220' + '00783'); // right

  // Date value - font 2
  add('12111' + '0240' + '00420' + date);

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
    '12111' + '0003' + '00015' + 'TEST 1 2 3\n',
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
