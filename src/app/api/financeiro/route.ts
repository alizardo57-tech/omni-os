import { NextResponse } from 'next/server';
import { MovimentacaoFinanceiraSchema } from '@/lib/schemas';
import { lerOmniDb, salvarOmniDb } from '@/lib/store';

export async function GET() {
  const db = lerOmniDb();
  return NextResponse.json({
    ok: true,
    movimentacoes: db.movimentacoesFinanceiras || []
  });
}

export async function POST(req: Request) {
  const parsed = MovimentacaoFinanceiraSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ ok: false, erro: parsed.error.flatten() }, { status: 400 });
  }
  const db = lerOmniDb();
  const nova = {
    id: `FIN-${Date.now()}`,
    criadoEm: new Date().toISOString(),
    ...parsed.data
  };
  db.movimentacoesFinanceiras = [nova, ...(db.movimentacoesFinanceiras || [])];
  salvarOmniDb(db);
  return NextResponse.json({ ok: true, movimentacao: nova }, { status: 201 });
}

export async function DELETE(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ ok: false }, { status: 400 });
  const db = lerOmniDb();
  db.movimentacoesFinanceiras = (db.movimentacoesFinanceiras || []).filter(m => m.id !== id);
  salvarOmniDb(db);
  return NextResponse.json({ ok: true });
}
