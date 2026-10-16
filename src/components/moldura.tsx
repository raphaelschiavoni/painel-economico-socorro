'use client';

import { useEffect, useState } from 'react';
import { meta } from '@/lib/dados';
import { dataExtensa } from '@/lib/formato';

export const SECOES = [
  { id: 'sumario', numero: '01', titulo: 'Sumário executivo' },
  { id: 'economia', numero: '02', titulo: 'Economia e PIB' },
  { id: 'empresas', numero: '03', titulo: 'Empresas e emprego' },
  { id: 'agro', numero: '04', titulo: 'Agropecuária' },
  { id: 'financas', numero: '05', titulo: 'Finanças públicas' },
  { id: 'regional', numero: '06', titulo: 'Comparativo regional' },
  { id: 'territorio', numero: '07', titulo: 'População e território' },
  { id: 'fontes', numero: '08', titulo: 'Fontes e metodologia' },
];

/* ────────────────────────────────────────────────── tema claro/escuro */

type Tema = 'sistema' | 'claro' | 'escuro';

function AlternadorTema() {
  const [tema, setTema] = useState<Tema>('sistema');

  useEffect(() => {
    const salvo = (localStorage.getItem('painel-tema') as Tema | null) ?? 'sistema';
    setTema(salvo);
  }, []);

  useEffect(() => {
    const raiz = document.documentElement;
    if (tema === 'sistema') raiz.removeAttribute('data-tema');
    else raiz.setAttribute('data-tema', tema);
    localStorage.setItem('painel-tema', tema);
  }, [tema]);

  const opcoes: { valor: Tema; rotulo: string; icone: string }[] = [
    { valor: 'claro', rotulo: 'Tema claro', icone: '☀' },
    { valor: 'sistema', rotulo: 'Seguir o sistema', icone: '◐' },
    { valor: 'escuro', rotulo: 'Tema escuro', icone: '☾' },
  ];

  return (
    <div
      role="group"
      aria-label="Tema da interface"
      className="inline-flex overflow-hidden rounded-lg border"
      style={{ borderColor: 'var(--borda)' }}
    >
      {opcoes.map((o) => (
        <button
          key={o.valor}
          type="button"
          onClick={() => setTema(o.valor)}
          aria-pressed={tema === o.valor}
          title={o.rotulo}
          className="foco-visivel px-2.5 py-1.5 text-xs transition-colors"
          style={{
            background: tema === o.valor ? 'var(--superficie-2)' : 'transparent',
            color: tema === o.valor ? 'var(--tinta)' : 'var(--tinta-3)',
          }}
        >
          <span aria-hidden>{o.icone}</span>
          <span className="sr-only">{o.rotulo}</span>
        </button>
      ))}
    </div>
  );
}

/* ───────────────────────────────────────────────────────── cabeçalho */

export function Cabecalho() {
  return (
    <header
      className="sem-impressao sticky top-0 z-40 border-b backdrop-blur"
      style={{ borderColor: 'var(--borda)', background: 'color-mix(in srgb, var(--plano) 88%, transparent)' }}
    >
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
            style={{ background: 'var(--serie-1)' }}
          >
            SO
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight">
              Painel de Desenvolvimento Econômico
            </p>
            <p className="truncate text-xs" style={{ color: 'var(--tinta-2)' }}>
              {meta.municipio.nome}/{meta.municipio.uf} · Estância Turística
            </p>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <p className="hidden text-xs sm:block" style={{ color: 'var(--tinta-3)' }}>
            Dados de {dataExtensa(meta.atualizadoEm)}
          </p>
          <button
            type="button"
            onClick={() => window.print()}
            className="foco-visivel rounded-lg border px-3 py-1.5 text-xs font-medium"
            style={{ borderColor: 'var(--borda)', color: 'var(--tinta-2)' }}
          >
            Imprimir / PDF
          </button>
          <AlternadorTema />
        </div>
      </div>
    </header>
  );
}

/* ───────────────────────────────────────────────────────── navegação */

export function Navegacao() {
  const [ativa, setAtiva] = useState(SECOES[0].id);

  useEffect(() => {
    const observador = new IntersectionObserver(
      (entradas) => {
        const visivel = entradas
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visivel) setAtiva(visivel.target.id);
      },
      { rootMargin: '-96px 0px -70% 0px', threshold: 0 },
    );

    for (const secao of SECOES) {
      const elemento = document.getElementById(secao.id);
      if (elemento) observador.observe(elemento);
    }
    return () => observador.disconnect();
  }, []);

  return (
    <nav aria-label="Seções do relatório" className="sem-impressao">
      <p
        className="mb-2 px-3 text-[0.6875rem] font-semibold tracking-widest uppercase"
        style={{ color: 'var(--tinta-3)' }}
      >
        Neste relatório
      </p>
      <ul className="space-y-0.5">
        {SECOES.map((s) => {
          const atual = ativa === s.id;
          return (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                aria-current={atual ? 'true' : undefined}
                className="foco-visivel flex items-baseline gap-2.5 rounded-md px-3 py-1.5 text-sm transition-colors"
                style={{
                  background: atual ? 'var(--superficie-2)' : 'transparent',
                  color: atual ? 'var(--tinta)' : 'var(--tinta-2)',
                  fontWeight: atual ? 600 : 400,
                  boxShadow: atual ? 'inset 2px 0 0 var(--serie-1)' : undefined,
                }}
              >
                <span className="tabular text-[0.6875rem]" style={{ color: 'var(--tinta-3)' }}>
                  {s.numero}
                </span>
                {s.titulo}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
