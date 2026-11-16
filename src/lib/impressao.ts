import { execFile } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import type { Venda } from './schemas';
import { logger } from './logger';

function quebrarLinha(texto: string, max = 32): string[] {
  const limpo = texto.trim();
  if (limpo.length <= max) return [limpo];
  const palavras = limpo.split(/\s+/);
  const saida: string[] = [];
  let atual = '';
  for (const p of palavras) {
    if (!atual) {
      atual = p.slice(0, max);
    } else if (`${atual} ${p}`.length <= max) {
      atual = `${atual} ${p}`;
    } else {
      saida.push(atual);
      atual = p.slice(0, max);
    }
  }
  if (atual) saida.push(atual);
  return saida;
}

function centralizar32(texto: string): string {
  const limpo = texto.trim().toUpperCase().slice(0, 32);
  const espacos = Math.max(0, Math.floor((32 - limpo.length) / 2));
  return `${' '.repeat(espacos)}${limpo}`;
}

export function formatarVia(venda: Venda, tituloVia: string, nomeEmpresa = 'BELLA PIZZA'): string[] {
  const linhas: string[] = [
    '================================',
    centralizar32(nomeEmpresa || 'BELLA PIZZA'),
    `       ${tituloVia}       `,
    '================================',
    `PEDIDO: #${venda.id}`,
    `DATA:   ${new Date(venda.criadoEm).toLocaleString('pt-BR')}`,
    ...quebrarLinha(`CLIENTE: ${venda.clienteNome}`),
    `FONE:    ${venda.clienteTelefone || 'Nao informado'}`,
    `TIPO:    ${venda.modalidade.toUpperCase()}`,
    `PAGTO:   ${venda.pagamento}`
  ];
  if (venda.loja) linhas.push(`LOJA:    ${venda.loja}`);
  if (venda.bairro) linhas.push(...quebrarLinha(`BAIRRO:  ${venda.bairro}`));
  if (venda.endereco) linhas.push(...quebrarLinha(`END: ${venda.endereco}`));
  linhas.push('--------------------------------', 'ITENS:');
  for (const it of venda.itens) {
    const partes = it.nome.split(/\s+\+\s+/);
    linhas.push(...quebrarLinha(`${it.qtd}x ${partes[0]}`));
    for (let i = 1; i < partes.length; i++) {
      linhas.push(...quebrarLinha(`  + ${partes[i]}`));
    }
    if (it.observacao?.trim()) {
      linhas.push(...quebrarLinha(`  OBS: ${it.observacao.trim()}`));
    }
    linhas.push(`   R$ ${(it.qtd * it.precoUnit).toFixed(2)}`);
  }
  if (venda.observacao?.trim()) {
    linhas.push('--------------------------------', ...quebrarLinha(`OBS PEDIDO: ${venda.observacao.trim()}`));
  }
  const taxa = venda.taxaEntrega ?? 0;
  const desconto = venda.desconto ?? 0;
  const subtotal = venda.subtotal ?? Math.max(0, venda.total - taxa + desconto);
  const valorPago = venda.valorPago ?? 0;
  const troco = venda.troco ?? (valorPago > venda.total ? valorPago - venda.total : 0);

  linhas.push('--------------------------------');
  if (taxa > 0 || desconto > 0) {
    linhas.push(`SUBTOTAL: R$ ${subtotal.toFixed(2)}`);
    if (taxa > 0) linhas.push(`TAXA ENT: R$ ${taxa.toFixed(2)}`);
    if (desconto > 0) linhas.push(`DESCONTO: -R$ ${desconto.toFixed(2)}`);
  }
  linhas.push(`TOTAL:    R$ ${venda.total.toFixed(2)}`);
  if (valorPago > 0) {
    linhas.push(`PAGO:     R$ ${valorPago.toFixed(2)}`);
    linhas.push(`TROCO:    R$ ${troco.toFixed(2)}`);
  }
  linhas.push('================================', '', '');
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
      $rect = New-Object System.Drawing.RectangleF(2, 2, 276, 4000)
      $e.Graphics.DrawString($txt, $font, [System.Drawing.Brushes]::Black, $rect)
    })
    $pd.Print()
    Remove-Item -Path '${tmpTxt.replace(/'/g, "''")}' -Force -ErrorAction SilentlyContinue
  `;
  execFile('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', psScript], err => {
    if (err) logger.warn({ err: err.message }, 'Falha ao imprimir via Bematech');
  });
}

export function imprimirComandaOmni(venda: Venda, forcar = false, nomeEmpresa = 'BELLA PIZZA'): boolean {
  if (!forcar && process.env.AUTO_PRINT !== 'true') return false;
  if (process.platform !== 'win32') return false;
  enviarTrabalhoWindows(formatarVia(venda, 'COMANDA DE PEDIDO', nomeEmpresa), 'comanda');
  return true;
}

export function imprimirFechamentoOmni(
  porPagamento: Record<string, number>,
  totalGeral: number,
  qtdPedidos: number,
  nomeEmpresa = 'BELLA PIZZA'
): boolean {
  if (process.platform !== 'win32') return false;
  const linhas = [
    '================================',
    centralizar32(nomeEmpresa || 'BELLA PIZZA'),
    '      FECHAMENTO DE CAIXA       ',
    '================================',
    `DATA:    ${new Date().toLocaleString('pt-BR')}`,
    `PEDIDOS: ${qtdPedidos}`,
    '--------------------------------'
  ];
  for (const [forma, valor] of Object.entries(porPagamento)) {
    linhas.push(`${forma}: R$ ${valor.toFixed(2)}`);
  }
  linhas.push('--------------------------------', `TOTAL CAIXA: R$ ${totalGeral.toFixed(2)}`, '================================', '', '');
  enviarTrabalhoWindows(linhas, 'fechamento');
  return true;
}
