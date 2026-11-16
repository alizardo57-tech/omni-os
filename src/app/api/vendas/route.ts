import { NextResponse } from 'next/server';
import { z } from 'zod';
import { VendaCreateSchema } from '@/lib/schemas';
import { lerOmniDb, salvarOmniDb } from '@/lib/store';
import { imprimirComandaOmni } from '@/lib/impressao';

export async function GET() {
  const db = lerOmniDb();
  return NextResponse.json({ ok: true, vendas: db.vendas });
}

export async function POST(req: Request) {
  const parsed = VendaCreateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ ok: false, erro: parsed.error.flatten() }, { status: 400 });
  }
  const db = lerOmniDb();
  for (const item of parsed.data.itens) {
    const prod = db.produtos.find(p => p.id === item.produtoId);
    if (prod) prod.estoque = Math.max(0, prod.estoque - item.qtd);
  }
  const subtotal = parsed.data.itens.reduce((s, i) => s + i.qtd * i.precoUnit, 0);
  const taxaEntrega = parsed.data.taxaEntrega ?? 0;
  const desconto = parsed.data.desconto ?? 0;
  const total = Math.max(0, subtotal + taxaEntrega - desconto);
  const valorPago = parsed.data.valorPago ?? 0;
  const troco = valorPago > total ? Number((valorPago - total).toFixed(2)) : 0;
  const venda = {
    id: `OS-${10473 + db.vendas.length}`,
    criadoEm: new Date().toISOString(),
    ...parsed.data,
    subtotal: Number(subtotal.toFixed(2)),
    taxaEntrega: Number(taxaEntrega.toFixed(2)),
    desconto: Number(desconto.toFixed(2)),
    valorPago: Number(valorPago.toFixed(2)),
    troco,
    total: Number(total.toFixed(2)),
    status: 'preparando' as const
  };
  db.vendas.unshift(venda);
  salvarOmniDb(db);
  imprimirComandaOmni(venda, false, db.empresa.nome);
  return NextResponse.json({ ok: true, venda }, { status: 201 });
}

const PatchSchema = z.object({
  id: z.string().min(1),
  status: z.enum(['preparando', 'forno', 'pronto', 'saiu_entrega', 'entregue']).optional(),
  motoboy: z.string().optional(),
  reimprimir: z.boolean().optional()
});

export async function PATCH(req: Request) {
  const parsed = PatchSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 });
  const db = lerOmniDb();
  const v = db.vendas.find(x => x.id === parsed.data.id);
  if (!v) return NextResponse.json({ ok: false }, { status: 404 });
  let alterou = false;
  if (parsed.data.status) {
    v.status = parsed.data.status;
    alterou = true;
  }
  if (parsed.data.motoboy !== undefined) {
    v.motoboy = parsed.data.motoboy.trim();
    alterou = true;
  }
  if (alterou) salvarOmniDb(db);
  if (parsed.data.reimprimir) imprimirComandaOmni(v, true, db.empresa.nome);
  return NextResponse.json({ ok: true, venda: v });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const excluir = searchParams.get('excluir') === 'true';
  const db = lerOmniDb();

  if (excluir && id) {
    const idx = db.vendas.findIndex(x => x.id === id);
    if (idx === -1) return NextResponse.json({ ok: false }, { status: 404 });
    const removida = db.vendas[idx];
    db.comandasFantasmas = [
      {
        ...removida,
        excluidoEm: new Date().toISOString(),
        excluidoPor: db.empresa.operador || 'Operador',
        statusAntesExclusao: removida.status
      },
      ...(db.comandasFantasmas || [])
    ];
    for (const item of removida.itens) {
      const prod = db.produtos.find(p => p.id === item.produtoId);
      if (prod) prod.estoque += item.qtd;
    }
    db.vendas.splice(idx, 1);
    salvarOmniDb(db);
    return NextResponse.json({ ok: true, excluida: true });
  }

  if (id) {
    const v = db.vendas.find(x => x.id === id);
    if (v) v.ocultoCozinha = true;
  } else {
    for (const v of db.vendas) {
      if (v.status === 'entregue' || v.status === 'pronto') v.ocultoCozinha = true;
    }
  }
  salvarOmniDb(db);
  return NextResponse.json({ ok: true });
}
