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
    // Allow unsigned connections (community/demo mode)
    // QZ Tray uses callback-style promises (RSVP pattern), not native Promises
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
  // Look for Datamax printer
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
 */
function generateDPLLabel(
  clientName: string,
  invoiceNumber: string,
  volumeNumber: number,
  totalVolumes: number,
  date: string
): string {
  const STX = '\x02';
  const CR = '\n';

  // Label: 100mm x 60mm = 800 x 480 dots at 203 DPI (8 dots/mm)
  // DPL text record format: 1<font><rotation><RRRR><CCCCC><data>
  // font: 0-8 bitmap, 9 scalable
  // rotation: 1=0°, 2=90°CW, 3=180°, 4=90°CCW
  // RRRR: 4-digit row (0-479), CCCCC: 5-digit column (0-799)
  // Line record: 1X1100WWWWHHHHRRRRCCCCC

  let cmd = '';
  
  // Start label format
  cmd += STX + 'L' + CR;
  cmd += 'D11' + CR;     // Density
  cmd += 'H15' + CR;     // Heat
  cmd += 'S2' + CR;      // Speed
  cmd += 'q800' + CR;    // Label width in dots
  cmd += 'Q480,24' + CR; // Label height, gap

  // === OUTER BORDER ===
  cmd += '1X1100' + '0780' + '0003' + '0008' + '00008' + CR; // top
  cmd += '1X1100' + '0780' + '0003' + '0468' + '00008' + CR; // bottom
  cmd += '1X1100' + '0003' + '0463' + '0008' + '00008' + CR; // left
  cmd += '1X1100' + '0003' + '0463' + '0008' + '00785' + CR; // right

  // === HEADER: IRMAOS MANTOVANI TEXTIL ===
  // Font 4 (18x28 bold). 23 chars * 18 = 414 dots. Center: (800-414)/2 = 193
  cmd += '141' + '0020' + '00193' + 'IRMAOS MANTOVANI TEXTIL' + CR;

  // Separator line below header
  cmd += '1X1100' + '0760' + '0002' + '0055' + '00020' + CR;

  // === CLIENTE label ===
  // Font 6 (14x22 bold)
  cmd += '161' + '0072' + '00015' + 'CLIENTE' + CR;

  // Client box (row 68 to 128, col 150 to 785)
  cmd += '1X1100' + '0635' + '0002' + '0068' + '00150' + CR; // top
  cmd += '1X1100' + '0635' + '0002' + '0128' + '00150' + CR; // bottom
  cmd += '1X1100' + '0002' + '0062' + '0068' + '00150' + CR; // left
  cmd += '1X1100' + '0002' + '0062' + '0068' + '00783' + CR; // right

  // Client name (font 2, 18x28) - truncate to fit box
  const clientText = clientName.toUpperCase().substring(0, 30);
  cmd += '121' + '0090' + '00160' + clientText + CR;

  // === NOTA FISCAL label ===
  cmd += '161' + '0150' + '00015' + 'NOTA FISCAL' + CR;

  // NF box (row 145 to 200, col 150 to 785)
  cmd += '1X1100' + '0635' + '0002' + '0145' + '00150' + CR; // top
  cmd += '1X1100' + '0635' + '0002' + '0200' + '00150' + CR; // bottom
  cmd += '1X1100' + '0002' + '0057' + '0145' + '00150' + CR; // left
  cmd += '1X1100' + '0002' + '0057' + '0145' + '00783' + CR; // right

  // NF value (font 2)
  cmd += '121' + '0165' + '00160' + (invoiceNumber || '') + CR;

  // === VOLUME label ===
  cmd += '161' + '0225' + '00015' + 'VOLUME' + CR;

  // Volume box (row 220 to 275, col 150 to 290)
  cmd += '1X1100' + '0140' + '0002' + '0220' + '00150' + CR; // top
  cmd += '1X1100' + '0140' + '0002' + '0275' + '00150' + CR; // bottom
  cmd += '1X1100' + '0002' + '0057' + '0220' + '00150' + CR; // left
  cmd += '1X1100' + '0002' + '0057' + '0220' + '00288' + CR; // right

  // Volume value (font 2)
  const volText = `${volumeNumber}/${totalVolumes}`;
  cmd += '121' + '0240' + '00165' + volText + CR;

  // === DATA label ===
  cmd += '161' + '0225' + '00320' + 'DATA' + CR;

  // Date box (row 220 to 275, col 400 to 785)
  cmd += '1X1100' + '0385' + '0002' + '0220' + '00400' + CR; // top
  cmd += '1X1100' + '0385' + '0002' + '0275' + '00400' + CR; // bottom
  cmd += '1X1100' + '0002' + '0057' + '0220' + '00400' + CR; // left
  cmd += '1X1100' + '0002' + '0057' + '0220' + '00783' + CR; // right

  // Date value (font 2)
  cmd += '121' + '0240' + '00420' + date + CR;

  // End and print label
  cmd += 'E' + CR;

  return cmd;
}

export function generateAllDPLLabels(
  clientName: string,
  totalVolumes: number,
  invoiceNumber: string = ''
): string {
  const date = new Date().toLocaleDateString('pt-BR');
  let allCommands = '';

  for (let i = 0; i < totalVolumes; i++) {
    allCommands += generateDPLLabel(clientName, invoiceNumber, i + 1, totalVolumes, date);
  }

  return allCommands;
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
  const dplCommands = generateAllDPLLabels(clientName, totalVolumes, invoiceNumber);

  console.log('DPL commands being sent:', JSON.stringify(dplCommands.substring(0, 200)));
  
  // QZ Tray raw printing: pass array of raw strings
  await qz.print(config, [dplCommands]);
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
