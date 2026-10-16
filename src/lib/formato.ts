/** Formatação numérica em português do Brasil, usada em todo o painel. */

const formatadores = new Map<number, Intl.NumberFormat>();

/** Um Intl.NumberFormat por número de casas decimais, criado sob demanda. */
function formatador(casas: number): Intl.NumberFormat {
  let existente = formatadores.get(casas);
  if (!existente) {
    existente = new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: casas,
      maximumFractionDigits: casas,
    });
    formatadores.set(casas, existente);
  }
  return existente;
}

const inteiro = formatador(0);
const umaCasa = formatador(1);
const duasCasas = formatador(2);

export const SEM_DADO = '—';

/**
 * Espaço não separável. Sem ele, os rótulos dentro dos gráficos quebram entre
 * o símbolo e o número ("R$" numa linha, "17,9 mi" na outra).
 */
const ESPACO = ' ';

export function numero(valor: number | null | undefined, casas = 0): string {
  if (valor == null || !Number.isFinite(valor)) return SEM_DADO;
  return formatador(casas).format(valor);
}

export function reais(valor: number | null | undefined, casas = 0): string {
  if (valor == null || !Number.isFinite(valor)) return SEM_DADO;
  return `R$${ESPACO}${numero(valor, casas)}`;
}

/** Abrevia valores grandes para caber em rótulos de eixo e cartões. */
export function reaisCurto(valor: number | null | undefined): string {
  if (valor == null || !Number.isFinite(valor)) return SEM_DADO;
  const absoluto = Math.abs(valor);
  const prefixo = `R$${ESPACO}`;
  // Duas casas nos bilhões: com uma só, R$ 1,449 bi e R$ 1,351 bi virariam o mesmo número.
  if (absoluto >= 1_000_000_000) {
    return `${prefixo}${duasCasas.format(valor / 1_000_000_000)}${ESPACO}bi`;
  }
  if (absoluto >= 1_000_000) return `${prefixo}${umaCasa.format(valor / 1_000_000)}${ESPACO}mi`;
  if (absoluto >= 1_000) return `${prefixo}${inteiro.format(valor / 1_000)}${ESPACO}mil`;
  return `${prefixo}${inteiro.format(valor)}`;
}

export function numeroCurto(valor: number | null | undefined): string {
  if (valor == null || !Number.isFinite(valor)) return SEM_DADO;
  const absoluto = Math.abs(valor);
  if (absoluto >= 1_000_000) return `${umaCasa.format(valor / 1_000_000)}${ESPACO}mi`;
  if (absoluto >= 10_000) return `${inteiro.format(valor / 1_000)}${ESPACO}mil`;
  return inteiro.format(valor);
}

export function percentual(valor: number | null | undefined, casas = 1): string {
  if (valor == null || !Number.isFinite(valor)) return SEM_DADO;
  return `${numero(valor, casas)}%`;
}

export type Variacao = {
  percentual: number;
  rotulo: string;
  sentido: 'alta' | 'baixa' | 'estavel';
};

/** Variação relativa entre dois pontos, já com sinal e rótulo prontos. */
export function variacao(
  atual: number | null | undefined,
  anterior: number | null | undefined,
): Variacao | null {
  if (atual == null || anterior == null || !anterior) return null;
  const pct = ((atual - anterior) / Math.abs(anterior)) * 100;
  const sentido = Math.abs(pct) < 0.05 ? 'estavel' : pct > 0 ? 'alta' : 'baixa';
  const sinal = pct > 0 ? '+' : '';
  return { percentual: pct, rotulo: `${sinal}${numero(pct, 1)}%`, sentido };
}

/** Participação de uma parte no todo, em pontos percentuais. */
export function participacao(parte: number | null, total: number | null): number | null {
  if (parte == null || total == null || !total) return null;
  return (parte / total) * 100;
}

export function dataExtensa(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}
