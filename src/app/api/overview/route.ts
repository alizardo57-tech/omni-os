import { NextResponse } from 'next/server';
import { lerOmniDb } from '@/lib/store';

export async function GET() {
  const db = lerOmniDb();
  const receitaVendas = db.vendas.reduce((acc, v) => acc + Number(v.total || 0), 0);
  const totalEstoque = db.produtos.reduce((acc, p) => acc + Number(p.estoque || 0), 0);
  return NextResponse.json({
    ok: true,
    empresa: db.empresa,
    produtos: db.produtos,
    clientes: db.clientes,
    vendas: db.vendas,
    kpis: {
      vendasMes: receitaVendas,
      produtosEstoque: totalEstoque,
      receitaTotal: receitaVendas + 178462.7,
      clientesAtivos: db.clientes.length
    }
  });
}
