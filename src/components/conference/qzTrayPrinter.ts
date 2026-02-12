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
    // Skip certificate validation for unsigned/demo usage
    qz.security.setCertificatePromise(() => {
      return Promise.resolve(
        '-----BEGIN CERTIFICATE-----\n' +
        'MIIBszCCAVmgAwIBAgIJALB2ZxEbfmqJMAoGCCqGSM49BAMCMBgxFjAUBgNVBAMM\n' +
        'DXFpbm90ZWNoLmNvbTAeFw0yNDAxMDEwMDAwMDBaFw0yNjAxMDEwMDAwMDBaMBgx\n' +
        'FjAUBgNVBAMMDXFpbm90ZWNoLmNvbTBZMBMGByqGSM49AgEGCCqGSM49AwEHA0IA\n' +
        'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\n' +
        'AAAAAAAAAAAAAAAjEDAOMAwGA1UdEwQFMAMBAf8wCgYIKoZIzj0EAwIDSAAwRQIh\n' +
        'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\n' +
        '-----END CERTIFICATE-----'
      );
    });

    qz.security.setSignatureAlgorithm('SHA512');
    qz.security.setSignaturePromise(() => {
      return (resolve: (value: string) => void) => {
        resolve('');
      };
    });

    await qz.websocket.connect();
    isConnected = true;
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
  const CR = '\r\n';

  let cmd = '';
  
  // Start label format
  cmd += STX + 'L' + CR;
  cmd += 'D11' + CR;    // Density/darkness (0-30, higher = darker)
  cmd += 'H15' + CR;    // Heat setting
  cmd += 'S2' + CR;     // Speed 2 ips (slower = better quality)
  cmd += 'q800' + CR;   // Label width in dots (100mm * 8)
  cmd += 'Q480,24' + CR; // Label height, gap between labels

  // === OUTER BORDER ===
  // Line draw: 1X1100WWWWHHHHRRRRCCCCC
  // Top border
  cmd += '1X1100' + '0780' + '0004' + '0010' + '0010' + CR;
  // Bottom border
  cmd += '1X1100' + '0780' + '0004' + '0010' + '0460' + CR;
  // Left border
  cmd += '1X1100' + '0004' + '0454' + '0010' + '0010' + CR;
  // Right border
  cmd += '1X1100' + '0004' + '0454' + '0786' + '0010' + CR;

  // === HEADER: IRMAOS MANTOVANI TEXTIL ===
  // Text: 1<font><size><gap>RRRRCCCCC<data>
  // Font 9 = scalable, size in 0.1mm increments
  cmd += '161300002000' + '0025' + 'IRMAOS MANTOVANI TEXTIL' + CR;

  // Separator line below header
  cmd += '1X1100' + '0760' + '0002' + '0020' + '0065' + CR;

  // === CLIENTE ===
  cmd += '161200001500' + '0085' + 'CLIENTE' + CR;

  // Client box
  cmd += '1X1100' + '0540' + '0003' + '0200' + '0080' + CR;  // top
  cmd += '1X1100' + '0540' + '0003' + '0200' + '0160' + CR;  // bottom
  cmd += '1X1100' + '0003' + '0083' + '0200' + '0080' + CR;  // left
  cmd += '1X1100' + '0003' + '0083' + '0737' + '0080' + CR;  // right

  // Client name (truncate to 28 chars)
  const clientText = clientName.toUpperCase().substring(0, 28);
  cmd += '161200002100' + '0105' + clientText + CR;

  // === NOTA FISCAL ===
  cmd += '161200001500' + '0185' + 'NOTA FISCAL' + CR;

  // NF box
  cmd += '1X1100' + '0540' + '0003' + '0200' + '0175' + CR;  // top
  cmd += '1X1100' + '0540' + '0003' + '0200' + '0235' + CR;  // bottom
  cmd += '1X1100' + '0003' + '0063' + '0200' + '0175' + CR;  // left
  cmd += '1X1100' + '0003' + '0063' + '0737' + '0175' + CR;  // right

  // NF value
  cmd += '161200002100' + '0198' + (invoiceNumber || '') + CR;

  // === VOLUME ===
  cmd += '161200001500' + '0275' + 'VOLUME' + CR;

  // Volume box
  cmd += '1X1100' + '0130' + '0003' + '0145' + '0265' + CR;  // top
  cmd += '1X1100' + '0130' + '0003' + '0145' + '0325' + CR;  // bottom
  cmd += '1X1100' + '0003' + '0063' + '0145' + '0265' + CR;  // left
  cmd += '1X1100' + '0003' + '0063' + '0272' + '0265' + CR;  // right

  // Volume value
  const volText = `${volumeNumber}/${totalVolumes}`;
  cmd += '161200001700' + '0285' + volText + CR;

  // === DATA ===
  cmd += '161200003200' + '0275' + 'DATA' + CR;

  // Date box
  cmd += '1X1100' + '0360' + '0003' + '0370' + '0265' + CR;  // top
  cmd += '1X1100' + '0360' + '0003' + '0370' + '0325' + CR;  // bottom
  cmd += '1X1100' + '0003' + '0063' + '0370' + '0265' + CR;  // left
  cmd += '1X1100' + '0003' + '0063' + '0727' + '0265' + CR;  // right

  // Date value
  cmd += '161200003900' + '0285' + date + CR;

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

  const data: any[] = [{
    type: 'raw',
    format: 'command',
    flavor: 'plain',
    data: dplCommands
  }];

  await qz.print(config, data);
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
