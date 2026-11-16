import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { criarTokenSessao, hashSenha, lerTokenSessao, verificarSenha } from '@/lib/auth';
import type { Usuario, UsuarioPublico } from '@/lib/schemas';
import { lerOmniDb, salvarOmniDb } from '@/lib/store';

const COOKIE_NAME = 'omni_session';

function sanitizarUsuario(u: Usuario): UsuarioPublico {
  return {
    id: u.id,
    nome: u.nome,
    login: u.login,
    cargo: u.cargo,
    perfil: u.perfil || 'funcionario',
    lojaPadrao: u.lojaPadrao,
    criadoEm: u.criadoEm
  };
}

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  const uid = lerTokenSessao(token);
  const db = lerOmniDb();
  const usuarios = db.usuarios || [];
  const achado = uid ? usuarios.find(u => u.id === uid) : undefined;
  return NextResponse.json({
    ok: true,
    usuario: achado ? sanitizarUsuario(achado) : null,
    usuarios: usuarios.map(sanitizarUsuario)
  });
}

const AuthActionSchema = z.discriminatedUnion('acao', [
  z.object({
    acao: z.literal('login'),
    login: z.string().min(1),
    senha: z.string().min(1)
  }),
  z.object({
    acao: z.literal('registrar'),
    nome: z.string().min(2),
    login: z.string().min(2),
    senha: z.string().min(4),
    cargo: z.string().min(1).default('Caixa & Atendimento'),
    perfil: z.enum(['admin', 'funcionario']).optional().default('funcionario'),
    lojaPadrao: z.enum(['Loja 1', 'Loja 2']).default('Loja 1'),
    entrarAutomatico: z.boolean().optional().default(true)
  })
]);

export async function POST(req: Request) {
  const parsed = AuthActionSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ ok: false, erro: 'Preencha todos os campos (senha mín. 4 caracteres).' }, { status: 400 });
  }

  const db = lerOmniDb();
  const usuarios = db.usuarios || [];

  if (parsed.data.acao === 'login') {
    const loginLimpo = parsed.data.login.trim().toLowerCase();
    const user = usuarios.find(u => u.login.toLowerCase() === loginLimpo);
    if (!user || !verificarSenha(parsed.data.senha, user.senhaHash)) {
      return NextResponse.json({ ok: false, erro: 'Usuário ou senha inválidos.' }, { status: 401 });
    }
    db.empresa.operador = user.nome;
    db.empresa.cargo = user.cargo;
    salvarOmniDb(db);

    const res = NextResponse.json({ ok: true, usuario: sanitizarUsuario(user) });
    res.cookies.set(COOKIE_NAME, criarTokenSessao(user.id), {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7
    });
    return res;
  }

  const loginNovo = parsed.data.login.trim().toLowerCase();
  if (usuarios.some(u => u.login.toLowerCase() === loginNovo)) {
    return NextResponse.json({ ok: false, erro: 'Este login já está em uso.' }, { status: 409 });
  }

  const novo: Usuario = {
    id: `usr-${Date.now()}`,
    nome: parsed.data.nome.trim(),
    login: loginNovo,
    senhaHash: hashSenha(parsed.data.senha),
    cargo: parsed.data.cargo.trim(),
    perfil: parsed.data.perfil,
    lojaPadrao: parsed.data.lojaPadrao,
    criadoEm: new Date().toISOString()
  };
  db.usuarios = [...usuarios, novo];
  if (parsed.data.entrarAutomatico) {
    db.empresa.operador = novo.nome;
    db.empresa.cargo = novo.cargo;
  }
  salvarOmniDb(db);

  const res = NextResponse.json({ ok: true, usuario: sanitizarUsuario(novo) }, { status: 201 });
  if (parsed.data.entrarAutomatico) {
    res.cookies.set(COOKIE_NAME, criarTokenSessao(novo.id), {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7
    });
  }
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, '', { httpOnly: true, path: '/', maxAge: 0 });
  return res;
}
