'use client';

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { numero, SEM_DADO } from '@/lib/formato';

/**
 * Mede a largura disponível do contêiner. Sem isso, a faixa fixa de rótulos das
 * barras horizontais consome o gráfico inteiro em tela estreita e as barras
 * chegam a ficar com largura zero.
 */
function useLargura<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [largura, setLargura] = useState(0);

  useEffect(() => {
    const elemento = ref.current;
    if (!elemento) return;
    setLargura(elemento.getBoundingClientRect().width);
    const observador = new ResizeObserver(([entrada]) => setLargura(entrada.contentRect.width));
    observador.observe(elemento);
    return () => observador.disconnect();
  }, []);

  return [ref, largura] as const;
}

/* Ordem fixa da paleta categórica — nunca reciclada, nunca gerada. */
export const SERIES = [
  'var(--serie-1)',
  'var(--serie-2)',
  'var(--serie-3)',
  'var(--serie-4)',
  'var(--serie-5)',
  'var(--serie-6)',
  'var(--serie-7)',
  'var(--serie-8)',
] as const;

const EIXO = {
  stroke: 'var(--eixo)',
  tick: { fill: 'var(--tinta-3)', fontSize: 11 },
  tickLine: false as const,
};

type Formatador = (valor: number | null) => string;

function Dica({
  ativo,
  itens,
  rotulo,
  formatar,
}: {
  ativo?: boolean;
  itens?: { name?: string; value?: number | null; color?: string; dataKey?: string }[];
  rotulo?: ReactNode;
  formatar: Formatador;
}) {
  if (!ativo || !itens?.length) return null;
  return (
    <div
      className="rounded-lg border px-3 py-2 text-xs shadow-lg"
      style={{ background: 'var(--superficie)', borderColor: 'var(--borda)' }}
    >
      <p className="mb-1 font-semibold">{rotulo}</p>
      <ul className="space-y-0.5">
        {itens.map((item, i) => (
          <li key={i} className="flex items-center gap-2">
            <span
              aria-hidden
              className="h-2 w-2 shrink-0 rounded-sm"
              style={{ background: item.color }}
            />
            <span style={{ color: 'var(--tinta-2)' }}>{item.name}</span>
            <span className="tabular ml-auto font-semibold">
              {item.value == null ? SEM_DADO : formatar(item.value)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Adapta o payload do Recharts para o formato da nossa dica. */
function conteudoDica(formatar: Formatador) {
  const Conteudo = (props: {
    active?: boolean;
    payload?: { name?: string; value?: number; color?: string; dataKey?: string }[];
    label?: ReactNode;
  }) => <Dica ativo={props.active} itens={props.payload} rotulo={props.label} formatar={formatar} />;
  return Conteudo;
}

/* ─────────────────────────────────────────────────── linha temporal */

export function GraficoLinha({
  dados,
  chaveX,
  series,
  formatar,
  formatarEixo,
  altura = 260,
  marcos = [],
}: {
  dados: Record<string, number | string | null>[];
  chaveX: string;
  series: { chave: string; nome: string; cor: string }[];
  formatar: Formatador;
  formatarEixo?: Formatador;
  altura?: number;
  marcos?: { x: number | string; y: number; rotulo: string }[];
}) {
  return (
    <ResponsiveContainer width="100%" height={altura}>
      <LineChart data={dados} margin={{ top: 8, right: 16, bottom: 4, left: 4 }}>
        <CartesianGrid stroke="var(--grade)" strokeWidth={1} vertical={false} />
        <XAxis dataKey={chaveX} {...EIXO} axisLine={{ stroke: 'var(--eixo)' }} minTickGap={16} />
        <YAxis
          {...EIXO}
          axisLine={false}
          width={82}
          tickFormatter={(v) => (formatarEixo ?? formatar)(v as number)}
        />
        <Tooltip content={conteudoDica(formatar) as never} cursor={{ stroke: 'var(--eixo)' }} />
        {series.map((s) => (
          <Line
            key={s.chave}
            type="monotone"
            dataKey={s.chave}
            name={s.nome}
            stroke={s.cor}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 2, stroke: 'var(--superficie)' }}
            connectNulls
            isAnimationActive={false}
          />
        ))}
        {marcos.map((m) => (
          <ReferenceDot
            key={`${m.x}`}
            x={m.x}
            y={m.y}
            r={4}
            fill={SERIES[1]}
            stroke="var(--superficie)"
            strokeWidth={2}
            label={{ value: m.rotulo, position: 'top', fill: 'var(--tinta-3)', fontSize: 10 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

/* ───────────────────────────────────────────── área empilhada temporal */

export function GraficoAreaEmpilhada({
  dados,
  chaveX,
  series,
  formatar,
  formatarEixo,
  altura = 280,
}: {
  dados: Record<string, number | string | null>[];
  chaveX: string;
  series: { chave: string; nome: string; cor: string }[];
  formatar: Formatador;
  formatarEixo?: Formatador;
  altura?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={altura}>
      <AreaChart data={dados} margin={{ top: 8, right: 16, bottom: 4, left: 4 }}>
        <CartesianGrid stroke="var(--grade)" strokeWidth={1} vertical={false} />
        <XAxis dataKey={chaveX} {...EIXO} axisLine={{ stroke: 'var(--eixo)' }} minTickGap={16} />
        <YAxis
          {...EIXO}
          axisLine={false}
          width={82}
          tickFormatter={(v) => (formatarEixo ?? formatar)(v as number)}
        />
        <Tooltip content={conteudoDica(formatar) as never} cursor={{ stroke: 'var(--eixo)' }} />
        {series.map((s) => (
          <Area
            key={s.chave}
            type="monotone"
            dataKey={s.chave}
            name={s.nome}
            stackId="total"
            stroke={s.cor}
            strokeWidth={1}
            fill={s.cor}
            fillOpacity={0.85}
            isAnimationActive={false}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* ──────────────────────────────────────────── barras horizontais */

export function GraficoBarras({
  dados,
  chaveCategoria,
  chaveValor,
  nome,
  formatar,
  cor = SERIES[0],
  destacar,
  corDe,
  altura,
  larguraRotulo = 150,
}: {
  dados: Record<string, number | string | null>[];
  chaveCategoria: string;
  chaveValor: string;
  nome: string;
  formatar: Formatador;
  cor?: string;
  /** Quando informado, só a categoria correspondente recebe cor; o resto fica neutro. */
  destacar?: string;
  /** Para escalas divergentes: define a cor de cada barra a partir da linha. */
  corDe?: (linha: Record<string, number | string | null>) => string;
  altura?: number;
  larguraRotulo?: number;
}) {
  const [ref, largura] = useLargura<HTMLDivElement>();
  const alturaFinal = altura ?? Math.max(180, dados.length * 30 + 30);

  // Em telas estreitas o rótulo cede espaço para a barra, nunca o contrário.
  const estreito = largura > 0 && largura < 440;
  const rotuloFinal = largura ? Math.min(larguraRotulo, Math.max(84, largura * 0.4)) : larguraRotulo;
  const fonteRotulo = estreito ? 10 : 11;
  // A margem direita acompanha o maior valor formatado, senão ele sai do gráfico.
  const maiorRotulo = Math.max(
    ...dados.map((d) => formatar(d[chaveValor] as number | null).length),
    4,
  );
  const margemDireita = Math.ceil(maiorRotulo * fonteRotulo * 0.6) + 8;
  const eixoEstreito = estreito
    ? { ...EIXO, tick: { ...EIXO.tick, fontSize: 10 } }
    : EIXO;

  return (
    <div ref={ref}>
      <ResponsiveContainer width="100%" height={alturaFinal}>
      <BarChart
        data={dados}
        layout="vertical"
        margin={{ top: 4, right: margemDireita, bottom: 4, left: 4 }}
        barCategoryGap={6}
      >
        <CartesianGrid stroke="var(--grade)" strokeWidth={1} horizontal={false} />
        <XAxis
          type="number"
          {...eixoEstreito}
          axisLine={false}
          tickFormatter={(v) => formatar(v as number)}
          minTickGap={estreito ? 28 : 12}
        />
        <YAxis
          type="category"
          dataKey={chaveCategoria}
          {...eixoEstreito}
          axisLine={false}
          width={rotuloFinal}
          interval={0}
        />
        <Tooltip
          content={conteudoDica(formatar) as never}
          cursor={{ fill: 'var(--superficie-2)' }}
        />
        <Bar
          dataKey={chaveValor}
          name={nome}
          radius={[0, 4, 4, 0]}
          barSize={16}
          isAnimationActive={false}
          label={{
            position: 'right',
            fill: 'var(--tinta-2)',
            fontSize: fonteRotulo,
            formatter: (v: number) => formatar(v),
          }}
        >
          {dados.map((linha, i) => (
            <Cell
              key={i}
              fill={
                corDe
                  ? corDe(linha)
                  : destacar === undefined || linha[chaveCategoria] === destacar
                    ? cor
                    : 'var(--serie-neutra)'
              }
            />
          ))}
        </Bar>
      </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/* ─────────────────────────────────────────── barras agrupadas verticais */

export function GraficoBarrasAgrupadas({
  dados,
  chaveX,
  series,
  formatar,
  formatarEixo,
  altura = 260,
}: {
  dados: Record<string, number | string | null>[];
  chaveX: string;
  series: { chave: string; nome: string; cor: string }[];
  formatar: Formatador;
  formatarEixo?: Formatador;
  altura?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={altura}>
      <BarChart data={dados} margin={{ top: 8, right: 16, bottom: 4, left: 4 }} barGap={2}>
        <CartesianGrid stroke="var(--grade)" strokeWidth={1} vertical={false} />
        <XAxis dataKey={chaveX} {...EIXO} axisLine={{ stroke: 'var(--eixo)' }} />
        <YAxis
          {...EIXO}
          axisLine={false}
          width={82}
          tickFormatter={(v) => (formatarEixo ?? formatar)(v as number)}
        />
        <Tooltip
          content={conteudoDica(formatar) as never}
          cursor={{ fill: 'var(--superficie-2)' }}
        />
        {series.map((s) => (
          <Bar
            key={s.chave}
            dataKey={s.chave}
            name={s.nome}
            fill={s.cor}
            radius={[4, 4, 0, 0]}
            maxBarSize={26}
            isAnimationActive={false}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ────────────────────────────── barra única de composição (parte-todo) */

export function BarraComposicao({
  partes,
  formatar,
}: {
  partes: { nome: string; valor: number; cor: string }[];
  formatar: Formatador;
}) {
  const total = partes.reduce((s, p) => s + p.valor, 0);
  if (!total) return null;

  return (
    <div>
      <div className="flex h-9 w-full gap-[2px] overflow-hidden rounded-md" role="img"
        aria-label={partes.map((p) => `${p.nome}: ${formatar(p.valor)}`).join('; ')}>
        {partes.map((p) => (
          <div
            key={p.nome}
            className="h-full first:rounded-l-md last:rounded-r-md"
            style={{ background: p.cor, width: `${(p.valor / total) * 100}%` }}
            title={`${p.nome} — ${formatar(p.valor)}`}
          />
        ))}
      </div>
      <ul className="mt-3 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
        {partes.map((p) => (
          <li key={p.nome} className="flex items-center gap-2 text-sm">
            <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: p.cor }} />
            <span style={{ color: 'var(--tinta-2)' }}>{p.nome}</span>
            <span className="tabular ml-auto font-semibold">
              {numero((p.valor / total) * 100, 1)}%
            </span>
            <span className="tabular w-24 text-right" style={{ color: 'var(--tinta-3)' }}>
              {formatar(p.valor)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ────────────────────────────────────────────────────── minissérie */

export function MiniSerie({
  dados,
  cor = SERIES[0],
  altura = 44,
}: {
  dados: { ano: number; valor: number }[];
  cor?: string;
  altura?: number;
}) {
  const valores = dados.map((d) => d.valor);
  const min = Math.min(...valores);
  const max = Math.max(...valores);
  const amplitude = max - min || 1;
  const largura = 100;
  const pontos = dados.map((d, i) => {
    const x = (i / Math.max(1, dados.length - 1)) * largura;
    const y = altura - 6 - ((d.valor - min) / amplitude) * (altura - 12);
    return `${x},${y}`;
  });
  const ultimo = pontos[pontos.length - 1].split(',').map(Number);

  return (
    <svg
      viewBox={`0 0 ${largura} ${altura}`}
      preserveAspectRatio="none"
      className="h-11 w-full"
      aria-hidden
    >
      <polyline
        points={pontos.join(' ')}
        fill="none"
        stroke={cor}
        strokeWidth={2}
        vectorEffect="non-scaling-stroke"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={ultimo[0]} cy={ultimo[1]} r={2.5} fill={cor} />
    </svg>
  );
}
