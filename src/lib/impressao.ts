import { execFile } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import type { Venda } from './schemas';
import { logger } from './logger';

function formatarVia(venda: Venda, tituloVia: string): string[] {
  const linhas: string[] = [
    '================================',
    '          BELLA PIZZA           ',
    `       ${tituloVia}       `,
    '================================',
    `PEDIDO: #${venda.id}`,
    `DATA:   ${new Date(venda.criadoEm).toLocaleString('pt-BR')}`,
    `CLIENTE: ${venda.clienteNome}`,
    `FONE:    ${venda.clienteTelefone || 'Nao informado'}`,
    `TIPO:    ${venda.modalidade.toUpperCase()}`,
    `PAGTO:   ${venda.pagamento}`
  ];
  if (venda.endereco) linhas.push(`END: ${venda.endereco}`);
  linhas.push('--------------------------------', 'ITENS:');
  for (const it of venda.itens) {
    linhas.push(`${it.qtd}x ${it.nome}`);
    linhas.push(`   R$ ${(it.qtd * it.precoUnit).toFixed(2)}`);
  }
  linhas.push('--------------------------------', `TOTAL: R$ ${venda.total.toFixed(2)}`, '================================', '', '');
  return linhas;
}

function enviarTrabalhoWindows(linhas: string[], sufixo: string): void {
  const tmpTxt = path.join(os.tmpdir(), `omni_cupom_${sufixo}_${Date.now()}.txt`);
  fs.writeFileSync(tmpTxt, linhas.join('\r\n'), 'utf8');
  const psScript = `
    Add-Type -AssemblyName System.Drawing
    $txt = Get-Content -Path '${tmpTxt.replace(/'/g, "''")}' -Raw -Encoding UTF8
    $pd = New-Object System.Drawing.Printing.PrintDocument
    $bematech = [System.Drawing.Printing.PrinterSettings]::InstalledPrinters | Where-Object { $_ -match 'Bematech|MP-|POS|Thermal|EPSON' } | Select-Object -First 1
    if ($bematech) { $pd.PrinterSettings.PrinterName = $bematech }
    $font = New-Object System.Drawing.Font('Consolas', 10, [System.Drawing.FontStyle]::Bold)
    $pd.add_PrintPage({
      param($sender, $e)
      $e.Graphics.DrawString($txt, $font, [System.Drawing.Brushes]::Black, 2, 2)
    })
    $pd.Print()
    Remove-Item -Path '${tmpTxt.replace(/'/g, "''")}' -Force -ErrorAction SilentlyContinue
  `;
  execFile('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', psScript], err => {
    if (err) logger.warn({ err: err.message }, 'Falha ao imprimir via Bematech');
  });
}

export function imprimirComandaOmni(venda: Venda, forcar = false): boolean {
  if (!forcar && process.env.AUTO_PRINT !== 'true') return false;
  if (process.platform !== 'win32') return false;
  enviarTrabalhoWindows(formatarVia(venda, 'VIA 1 - COZINHA'), 'cozinha');
  setTimeout(() => {
    enviarTrabalhoWindows(formatarVia(venda, 'VIA 2 - MOTOBOY / CLIENTE'), 'motoboy');
  }, 900);
  return true;
}
