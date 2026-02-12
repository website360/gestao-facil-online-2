/**
 * Generates DPL (Datamax Programming Language) commands for volume labels.
 * Designed for Datamax-O'Neil E-4204B Mark III at 203 DPI.
 * 
 * Label size: 100mm x 60mm
 * 203 DPI = 8 dots/mm
 * Width: 100mm = 800 dots
 * Height: 60mm = 480 dots
 */

const STX = '\x02';
const CR = '\x0D';
const LF = '\x0A';

// 203 DPI: 1mm = 8 dots
const MM_TO_DOTS = 8;

function mmToDots(mm: number): number {
  return Math.round(mm * MM_TO_DOTS);
}

function truncateText(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  return text.substring(0, maxChars);
}

function generateSingleLabel(
  clientName: string,
  invoiceNumber: string,
  volumeNumber: number,
  totalVolumes: number,
  date: string
): string {
  let cmd = '';

  // Start of label format
  cmd += STX + 'L' + CR;

  // Set heat/darkness (D = density, 0-30, higher = darker)
  cmd += 'D11' + CR;

  // Set print speed (S = speed in ips, lower = better quality)
  // p = speed value: 2 = 2 ips
  cmd += STX + 'K' + CR; // Clear previous format

  // Label setup
  cmd += STX + 'L' + CR;
  cmd += 'H15' + CR; // Heat setting (darkness) - high for bold black
  cmd += 'D11' + CR; // Density
  cmd += 'S2' + CR;  // Speed 2 ips for quality

  // === BORDER (rectangle around entire label) ===
  // DPL line command: 1lhwxxyyyy (l=line thickness, h=hor length, w=ver length, xx=col, yyyy=row)
  // Draw outer border using line commands
  // Top line
  cmd += '1X1100' + '0800' + '0003' + '0005' + '0005' + CR;
  // Bottom line  
  cmd += '1X1100' + '0800' + '0003' + '0005' + '0460' + CR;
  // Left line
  cmd += '1X1100' + '0003' + '0458' + '0005' + '0005' + CR;
  // Right line
  cmd += '1X1100' + '0003' + '0458' + '0795' + '0005' + CR;

  // === HEADER: IRMÃOS [logo space] MANTOVANI TÊXTIL ===
  // Font 4 = 18x32 scalable, bold appearance
  // Using font size 2 (medium) for header
  const headerY = '0020';
  
  // "IRMAOS" text (left side of header) - using font 1 size 3
  cmd += '161300002000' + headerY + 'IRMAOS' + CR;
  
  // "MANTOVANI TEXTIL" text (right side) 
  cmd += '161300003500' + headerY + 'MANTOVANI TEXTIL' + CR;

  // === Separator line below header ===
  cmd += '1X1100' + '0750' + '0002' + '0025' + '0060' + CR;

  // === CLIENTE field ===
  const clienteY = '0075';
  // Label "CLIENTE"
  cmd += '161200001000' + clienteY + 'CLIENTE' + CR;
  
  // Client name value (truncate to fit)
  const clientText = truncateText(clientName.toUpperCase(), 30);
  // Box around client name
  cmd += '1X1100' + '0580' + '0002' + '0180' + '0070' + CR; // top
  cmd += '1X1100' + '0580' + '0002' + '0180' + '0140' + CR; // bottom
  cmd += '1X1100' + '0002' + '0072' + '0180' + '0070' + CR; // left
  cmd += '1X1100' + '0002' + '0072' + '0760' + '0070' + CR; // right
  // Client text inside box
  cmd += '161200001900' + '0090' + clientText + CR;

  // === NOTA FISCAL field ===
  const nfY = '0160';
  // Label "NOTA FISCAL"
  cmd += '161200001000' + nfY + 'NOTA FISCAL' + CR;
  
  // NF value box
  cmd += '1X1100' + '0580' + '0002' + '0180' + nfY + CR;
  const nfBottomY = String(parseInt(nfY) + 50).padStart(4, '0');
  cmd += '1X1100' + '0580' + '0002' + '0180' + nfBottomY + CR;
  cmd += '1X1100' + '0002' + '0052' + '0180' + nfY + CR;
  cmd += '1X1100' + '0002' + '0052' + '0760' + nfY + CR;
  // NF text
  const nfValueY = String(parseInt(nfY) + 15).padStart(4, '0');
  cmd += '161200001900' + nfValueY + (invoiceNumber || '') + CR;

  // === VOLUME and DATA fields (bottom row) ===
  const bottomY = '0250';
  
  // "VOLUME" label
  cmd += '161200001000' + bottomY + 'VOLUME' + CR;
  
  // Volume value box
  cmd += '1X1100' + '0120' + '0002' + '0130' + bottomY + CR;
  const volBottomY = String(parseInt(bottomY) + 50).padStart(4, '0');
  cmd += '1X1100' + '0120' + '0002' + '0130' + volBottomY + CR;
  cmd += '1X1100' + '0002' + '0052' + '0130' + bottomY + CR;
  cmd += '1X1100' + '0002' + '0052' + '0250' + bottomY + CR;
  // Volume text
  const volValueY = String(parseInt(bottomY) + 15).padStart(4, '0');
  cmd += '161200001400' + volValueY + `${volumeNumber}/${totalVolumes}` + CR;

  // "DATA" label  
  cmd += '161200002800' + bottomY + 'DATA' + CR;
  
  // Date value box
  cmd += '1X1100' + '0380' + '0002' + '0350' + bottomY + CR;
  cmd += '1X1100' + '0380' + '0002' + '0350' + volBottomY + CR;
  cmd += '1X1100' + '0002' + '0052' + '0350' + bottomY + CR;
  cmd += '1X1100' + '0002' + '0052' + '0730' + bottomY + CR;
  // Date text
  cmd += '161200003700' + volValueY + date + CR;

  // End label / print
  cmd += 'E' + CR;

  return cmd;
}

export function generateDPLFile(
  clientName: string,
  totalVolumes: number,
  invoiceNumber: string = '',
  date?: string
): string {
  const currentDate = date || new Date().toLocaleDateString('pt-BR');
  
  let fullCommands = '';
  
  // Set quantity and other global settings
  fullCommands += STX + 'n' + CR; // Set imperial mode off (metric)
  fullCommands += STX + 'M0480' + CR; // Label length in dots (60mm = 480 dots)
  fullCommands += STX + 'O0' + CR; // Direct thermal mode
  
  for (let i = 0; i < totalVolumes; i++) {
    fullCommands += generateSingleLabel(
      clientName,
      invoiceNumber,
      i + 1,
      totalVolumes,
      currentDate
    );
  }
  
  return fullCommands;
}

export function downloadDPLFile(
  clientName: string,
  totalVolumes: number,
  invoiceNumber: string = ''
): void {
  const dplContent = generateDPLFile(clientName, totalVolumes, invoiceNumber);
  
  const blob = new Blob([dplContent], { type: 'application/octet-stream' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  
  // Clean filename
  const safeName = clientName
    .replace(/[^a-zA-Z0-9]/g, '_')
    .substring(0, 20);
  a.download = `etiquetas_${safeName}_${totalVolumes}vol.prn`;
  
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
