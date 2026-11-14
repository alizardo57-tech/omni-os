import { NextResponse } from 'next/server';
import { ClienteCreateSchema } from '@/lib/schemas';
import { lerOmniDb, salvarOmniDb } from '@/lib/store';

export async function GET() {
  const db = lerOmniDb();
  return NextResponse.json({ ok: true, clientes: db.clientes });
}

export async function POST(req: Request) {
  const parsed = ClienteCreateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ ok: false, erro: parsed.error.flatten() }, { status: 400 });
  }
  const tel = parsed.data.telefone.replace(/\D/g, '');
  const db = lerOmniDb();
  const existente = db.clientes.find(c => c.id === tel);
  if (existente) {
    existente.nome = parsed.data.nome;
    existente.endereco = parsed.data.endereco;
    salvarOmniDb(db);
    return NextResponse.json({ ok: true, cliente: existente });
  }
  const novo = {
    id: tel,
    nome: parsed.data.nome,
    telefone: tel,
    endereco: parsed.data.endereco,
    cashback: 0,
    totalPedidos: 0
  };
  db.clientes.unshift(novo);
  salvarOmniDb(db);
  return NextResponse.json({ ok: true, cliente: novo }, { status: 201 });
}
