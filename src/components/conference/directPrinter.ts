/**
 * Impressão direta de etiquetas via window.print()
 * Estilo simples e limpo para impressoras térmicas Datamax
 * Etiqueta 100mm x 60mm com bordas finas
 */

interface LabelData {
  clientName: string;
  totalVolumes: number;
  invoiceNumber?: string;
}

function generateLabelHTML(
  clientName: string,
  invoiceNumber: string,
  volumeNumber: number,
  totalVolumes: number,
  date: string
): string {
  const clientText = clientName.toUpperCase().substring(0, 35);
  const volText = `${volumeNumber}/${totalVolumes}`;
  const nf = invoiceNumber || '';

  return `
<div class="label">
  <div class="header">IRMAOS MANTOVANI TEXTIL</div>
  <div class="sep"></div>
  <table class="fields">
    <tr>
      <td class="lbl">CLIENTE</td>
      <td class="val">${clientText}</td>
    </tr>
    <tr>
      <td class="lbl">NOTA FISCAL</td>
      <td class="val">${nf}</td>
    </tr>
  </table>
  <table class="bottom">
    <tr>
      <td class="lbl2">VOLUME</td>
      <td class="val2">${volText}</td>
      <td class="lbl2">DATA</td>
      <td class="val2">${date}</td>
    </tr>
  </table>
</div>
  `;
}

export function printLabelsDirectly(data: LabelData): boolean {
  const { clientName, totalVolumes, invoiceNumber = '' } = data;
  const currentDate = new Date().toLocaleDateString('pt-BR');

  let labelsHTML = '';
  for (let i = 0; i < totalVolumes; i++) {
    labelsHTML += generateLabelHTML(
      clientName,
      invoiceNumber,
      i + 1,
      totalVolumes,
      currentDate
    );
  }

  const fullHTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<title>Etiquetas</title>
<style>
@page {
  size: 100mm 60mm;
  margin: 0;
}
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: Arial, Helvetica, sans-serif; }
.label {
  width: 100mm;
  height: 60mm;
  padding: 2mm 3mm;
  page-break-after: always;
  border: 0.3pt solid #000;
}
.header {
  text-align: center;
  font-size: 11pt;
  font-weight: bold;
  padding: 1mm 0;
}
.sep {
  border-bottom: 0.3pt solid #000;
  margin: 1mm 0;
}
.fields {
  width: 100%;
  border-collapse: collapse;
}
.fields td {
  padding: 1mm 1.5mm;
  font-size: 9pt;
  vertical-align: middle;
}
.fields .lbl {
  font-weight: bold;
  width: 22mm;
  white-space: nowrap;
}
.fields .val {
  border: 0.3pt solid #000;
  font-weight: bold;
  font-size: 9pt;
}
.bottom {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1mm;
}
.bottom td {
  padding: 1mm 1.5mm;
  font-size: 9pt;
  vertical-align: middle;
}
.bottom .lbl2 {
  font-weight: bold;
  white-space: nowrap;
  width: 16mm;
}
.bottom .val2 {
  border: 0.3pt solid #000;
  font-weight: bold;
  text-align: center;
  width: 18mm;
}
</style>
</head>
<body>
${labelsHTML}
</body>
</html>`;

  const printWindow = window.open('', '_blank', 'width=400,height=300');
  
  if (!printWindow) {
    return false;
  }

  printWindow.document.write(fullHTML);
  printWindow.document.close();

  printWindow.onload = () => {
    printWindow.focus();
    printWindow.print();
    setTimeout(() => {
      printWindow.close();
    }, 2000);
  };

  return true;
}
