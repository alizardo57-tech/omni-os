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
