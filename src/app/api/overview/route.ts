import { NextResponse } from 'next/server';
import { z } from 'zod';
import { lerOmniDb, salvarOmniDb } from '@/lib/store';
import { ordenarProdutosAlfabeticamente } from '@/lib/ordenacao';
import { gerarBackupExterno } from '@/lib/backup';

export async function GET() {
  const db = lerOmniDb();
  const receitaVendas = db.vendas.reduce((acc, v) => acc + Number(v.total || 0), 0);
  const totalEstoque = db.produtos.reduce((acc, p) => acc + Number(p.estoque || 0), 0);
  return NextResponse.json({
    ok: true,
    empresa: db.empresa,
    produtos: ordenarProdutosAlfabeticamente(db.produtos),
    clientes: db.clientes,
    vendas: db.vendas,
    comandasFantasmas: db.comandasFantasmas || [],
    resumoDiaAnterior: db.resumoDiaAnterior || null,
    historicoDiario: db.historicoDiario || [],
    motoboys: db.motoboys || ['Motoboy 1', 'Motoboy 2', 'Motoboy 3'],
    caixaAbertura: db.caixaAbertura || null,
    movimentacoesFinanceiras: db.movimentacoesFinanceiras || [],
    bairrosLoja: db.bairrosLoja || {},
    kpis: {
      vendasMes: receitaVendas,
      produtosEstoque: totalEstoque,
      receitaTotal: receitaVendas,
      clientesAtivos: db.clientes.length
    }
  });
}

const ConfigOverviewSchema = z.object({
  tempoPreparoMin: z.number().int().min(5).max(180).optional(),
  empresaNome: z.string().min(1).optional(),
  operador: z.string().min(1).optional(),
  cargo: z.string().min(1).optional(),
  whatsappDono: z.string().optional(),
  camilaWebhookUrl: z.string().optional(),
  bairrosLoja: z.record(z.string(), z.enum(['Loja 1', 'Loja 2'])).optional(),
  motoboys: z.array(z.string().min(1)).optional(),
  fundoTroco: z.number().nonnegative().optional(),
  zerarValoresTeste: z.boolean().optional()
});

export async function PATCH(req: Request) {
  const parsed = ConfigOverviewSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });
  const db = lerOmniDb();
  if (parsed.data.zerarValoresTeste) {
    gerarBackupExterno('antes-zerar-teste');
    db.vendas = [];
    db.comandasFantasmas = [];
    db.movimentacoesFinanceiras = [];
    db.caixaAbertura = null;
  }
  if (parsed.data.motoboys !== undefined) {
    db.motoboys = parsed.data.motoboys.map(m => m.trim()).filter(Boolean);
  }
  if (parsed.data.fundoTroco !== undefined) {
    const agora = new Date();
    const hoje = [
      agora.getFullYear(),
      String(agora.getMonth() + 1).padStart(2, '0'),
      String(agora.getDate()).padStart(2, '0')
    ].join('-');
    db.caixaAbertura = {
      data: hoje,
      fundoTroco: Number(parsed.data.fundoTroco.toFixed(2)),
      abertoPor: db.empresa.operador || 'Operador',
      abertoEm: agora.toISOString()
    };
  }
  if (parsed.data.tempoPreparoMin !== undefined) {
    db.empresa.tempoPreparoMin = parsed.data.tempoPreparoMin;
  }
  if (parsed.data.empresaNome !== undefined) {
    db.empresa.nome = parsed.data.empresaNome.trim();
  }
  if (parsed.data.operador !== undefined) {
    db.empresa.operador = parsed.data.operador.trim();
  }
  if (parsed.data.cargo !== undefined) {
    db.empresa.cargo = parsed.data.cargo.trim();
  }
  if (parsed.data.whatsappDono !== undefined) {
    db.empresa.whatsappDono = parsed.data.whatsappDono.replace(/\D/g, '');
  }
  if (parsed.data.camilaWebhookUrl !== undefined) {
    db.empresa.camilaWebhookUrl = parsed.data.camilaWebhookUrl.trim();
  }
  if (parsed.data.bairrosLoja !== undefined) {
    db.bairrosLoja = parsed.data.bairrosLoja;
  }
  salvarOmniDb(db);
  return NextResponse.json({
    ok: true,
    tempoPreparoMin: db.empresa.tempoPreparoMin,
    empresa: db.empresa,
    bairrosLoja: db.bairrosLoja
  });
}
