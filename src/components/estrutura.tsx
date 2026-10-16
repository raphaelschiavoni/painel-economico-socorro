'use client';

import { useId, useState, type ReactNode } from 'react';
import type { Fonte } from '@/lib/dados';
import { numero, SEM_DADO, type Variacao } from '@/lib/formato';

/* ─────────────────────────────────────────────── seção do relatório */

export function Secao({
  id,
  numeroSecao,
  titulo,
  resumo,
  children,
  quebraPagina = false,
}: {
  id: string;
  numeroSecao: string;
  titulo: string;
  resumo?: string;
  children: ReactNode;
  quebraPagina?: boolean;
}) {
  return (
    <section
      id={id}
      className={`scroll-mt-24 ${quebraPagina ? 'quebra-antes' : ''}`}
      aria-labelledby={`${id}-titulo`}
    >
      <header className="mb-5 border-b pb-4" style={{ borderColor: 'var(--grade)' }}>
        <p
          className="tabular text-xs font-semibold tracking-widest uppercase"
          style={{ color: 'var(--serie-1)' }}
        >
          {numeroSecao}
        </p>
        <h2 id={`${id}-titulo`} className="mt-1 text-2xl font-semibold tracking-tight">
          {titulo}
        </h2>
        {resumo && (
          <p className="mt-2 max-w-3xl text-sm leading-relaxed" style={{ color: 'var(--tinta-2)' }}>
            {resumo}
          </p>
        )}
      </header>
      <div className="space-y-5">{children}</div>
    </section>
  );
}

/* ─────────────────────────────────────────── cartão de indicador (stat tile) */

export function Indicador({
  rotulo,
  valor,
  unidade,
  referencia,
  variacao,
  comparacao,
  destaque = false,
}: {
  rotulo: string;
  valor: string;
  unidade?: string;
  referencia: string;
  variacao?: Variacao | null;
  comparacao?: string;
  destaque?: boolean;
}) {
  return (
    <div
      className="cartao flex flex-col justify-between p-4"
      style={destaque ? { borderColor: 'var(--serie-1)' } : undefined}
    >
      <p className="text-xs font-medium" style={{ color: 'var(--tinta-2)' }}>
        {rotulo}
      </p>
      <p className="mt-2 flex items-baseline gap-1.5">
        <span className="text-[1.75rem] leading-none font-semibold tracking-tight">{valor}</span>
        {unidade && (
          <span className="text-sm font-medium" style={{ color: 'var(--tinta-2)' }}>
            {unidade}
          </span>
        )}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1">
        {variacao && <SinalVariacao variacao={variacao} sufixo={comparacao} />}
        <span className="tabular text-xs" style={{ color: 'var(--tinta-3)' }}>
          {referencia}
        </span>
      </div>
    </div>
  );
}

/**
 * O sentido da variação vem com ícone e texto, nunca só com cor — a cor sozinha
 * não é legível para daltonismo nem no modo de alto contraste.
 */
export function SinalVariacao({ variacao, sufixo }: { variacao: Variacao; sufixo?: string }) {
  const cor =
    variacao.sentido === 'alta'
      ? 'var(--bom-texto)'
      : variacao.sentido === 'baixa'
        ? 'var(--critico)'
        : 'var(--tinta-2)';
  const seta = variacao.sentido === 'alta' ? '▲' : variacao.sentido === 'baixa' ? '▼' : '▬';

  return (
    <span className="tabular inline-flex items-center gap-1 text-xs font-semibold" style={{ color: cor }}>
      <span aria-hidden>{seta}</span>
      {variacao.rotulo}
      {sufixo && (
        <span className="font-normal" style={{ color: 'var(--tinta-3)' }}>
          {sufixo}
        </span>
      )}
    </span>
  );
}

/* ───────────────────────────────────────────────── cartão de gráfico */

export type Tabela = {
  colunas: string[];
  linhas: (string | number | null)[][];
};

export function Cartao({
  titulo,
  descricao,
  fonte,
  nota,
  acoes,
  tabela,
  children,
  className = '',
}: {
  titulo: string;
  descricao?: string;
  fonte?: Fonte | Fonte[];
  nota?: string;
  acoes?: ReactNode;
  tabela?: Tabela;
  children: ReactNode;
  className?: string;
}) {
  const [vendoTabela, setVendoTabela] = useState(false);
  const idTabela = useId();
  const fontes = fonte ? (Array.isArray(fonte) ? fonte : [fonte]) : [];

  return (
    <figure className={`cartao overflow-hidden ${className}`}>
      <figcaption className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5 pb-3">
        <div className="min-w-0">
          <h3 className="text-base font-semibold tracking-tight">{titulo}</h3>
          {descricao && (
            <p className="mt-1 text-sm" style={{ color: 'var(--tinta-2)' }}>
              {descricao}
            </p>
          )}
        </div>
        <div className="sem-impressao flex shrink-0 items-center gap-2">
          {acoes}
          {tabela && (
            <button
              type="button"
              onClick={() => setVendoTabela((v) => !v)}
              aria-expanded={vendoTabela}
              aria-controls={idTabela}
              className="foco-visivel rounded-md border px-2.5 py-1.5 text-xs font-medium transition-colors"
              style={{ borderColor: 'var(--borda)', color: 'var(--tinta-2)' }}
            >
              {vendoTabela ? 'Ver gráfico' : 'Ver tabela'}
            </button>
          )}
        </div>
      </figcaption>

      <div className="px-5 pb-4">
        {tabela && vendoTabela ? (
          <VisaoTabela id={idTabela} tabela={tabela} titulo={titulo} />
        ) : (
          children
        )}
      </div>

      {(fontes.length > 0 || nota) && (
        <div
          className="border-t px-5 py-3 text-xs leading-relaxed"
          style={{ borderColor: 'var(--grade)', color: 'var(--tinta-3)' }}
        >
          {nota && <p>{nota}</p>}
          {fontes.length > 0 && (
            <p className={nota ? 'mt-1' : ''}>
              Fonte:{' '}
              {fontes.map((f, i) => (
                <span key={f.id}>
                  {i > 0 && ' · '}
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noreferrer"
                    className="foco-visivel underline underline-offset-2"
                  >
                    {f.orgao} — {f.titulo} ({f.tabela})
                  </a>
                </span>
              ))}
            </p>
          )}
        </div>
      )}
    </figure>
  );
}

/** Toda visualização tem uma gêmea em tabela, exportável para planilha. */
function VisaoTabela({ id, tabela, titulo }: { id: string; tabela: Tabela; titulo: string }) {
  function baixarCsv() {
    const escapar = (v: string | number | null) => {
      const texto = v == null ? '' : String(v);
      return /[";\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
    };
    const linhas = [tabela.colunas, ...tabela.linhas].map((l) => l.map(escapar).join(';'));
    // BOM para o Excel em português abrir com acentuação correta.
    const blob = new Blob(['﻿' + linhas.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${titulo.toLowerCase().replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div id={id}>
      <div className="max-h-96 overflow-auto rounded-lg border" style={{ borderColor: 'var(--grade)' }}>
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0" style={{ background: 'var(--superficie-2)' }}>
            <tr>
              {tabela.colunas.map((c, i) => (
                <th
                  key={c}
                  scope="col"
                  className={`px-3 py-2 font-semibold whitespace-nowrap ${i === 0 ? 'text-left' : 'text-right'}`}
                  style={{ color: 'var(--tinta-2)' }}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tabela.linhas.map((linha, i) => (
              <tr key={i} className="border-t" style={{ borderColor: 'var(--grade)' }}>
                {linha.map((celula, j) => (
                  <td
                    key={j}
                    className={`px-3 py-1.5 ${j === 0 ? 'text-left' : 'tabular text-right'}`}
                  >
                    {celula == null
                      ? SEM_DADO
                      : typeof celula === 'number'
                        ? numero(celula)
                        : celula}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        onClick={baixarCsv}
        className="foco-visivel mt-3 rounded-md border px-2.5 py-1.5 text-xs font-medium"
        style={{ borderColor: 'var(--borda)', color: 'var(--tinta-2)' }}
      >
        Baixar CSV
      </button>
    </div>
  );
}

/* ──────────────────────────────────────────────────────── legenda */

export function Legenda({
  itens,
}: {
  itens: { nome: string; cor: string; valor?: string }[];
}) {
  return (
    <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      {itens.map((item) => (
        <li key={item.nome} className="flex items-center gap-1.5 text-xs">
          <span
            aria-hidden
            className="h-2.5 w-2.5 shrink-0 rounded-sm"
            style={{ background: item.cor }}
          />
          <span style={{ color: 'var(--tinta-2)' }}>{item.nome}</span>
          {item.valor && <span className="tabular font-semibold">{item.valor}</span>}
        </li>
      ))}
    </ul>
  );
}

/* ─────────────────────────────────── seletor de recorte (filtro) */

export function SeletorAno({
  anos,
  valor,
  aoMudar,
  rotulo = 'Ano de referência',
}: {
  anos: number[];
  valor: number;
  aoMudar: (ano: number) => void;
  rotulo?: string;
}) {
  return (
    <div className="sem-impressao flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium" style={{ color: 'var(--tinta-2)' }}>
        {rotulo}
      </span>
      <div
        role="group"
        aria-label={rotulo}
        className="inline-flex overflow-hidden rounded-lg border"
        style={{ borderColor: 'var(--borda)' }}
      >
        {anos.map((ano) => {
          const ativo = ano === valor;
          return (
            <button
              key={ano}
              type="button"
              onClick={() => aoMudar(ano)}
              aria-pressed={ativo}
              className="tabular foco-visivel px-3 py-1.5 text-xs font-semibold transition-colors"
              style={{
                background: ativo ? 'var(--serie-1)' : 'transparent',
                color: ativo ? '#ffffff' : 'var(--tinta-2)',
              }}
            >
              {ano}
            </button>
          );
        })}
      </div>
    </div>
  );
}
