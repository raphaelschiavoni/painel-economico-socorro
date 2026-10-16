/**
 * Tipos e leitura dos snapshots gravados por scripts/fetch-data.mjs.
 * Os JSON entram no bundle em tempo de build — o painel não faz chamada
 * externa em produção, então nunca fica em branco se uma API cair.
 */
import populacaoJson from '@/data/populacao.json';
import pibJson from '@/data/pib.json';
import cempreJson from '@/data/cempre.json';
import agroJson from '@/data/agro.json';
import financasJson from '@/data/financas.json';
import malhaJson from '@/data/malha.json';
import metaJson from '@/data/meta.json';
import municipalJson from '@/data/municipal.json';

export type Fonte = {
  id: string;
  titulo: string;
  orgao: string;
  tabela: string;
  url: string;
};

export type PontoPopulacao = {
  ano: number;
  valor: number;
  origem: 'estimativa' | 'censo' | 'interpolada';
};

export type Municipio = {
  codigo: string;
  nome: string;
  populacao: number | null;
  areaKm2: number | null;
  densidade: number | null;
};

export type AnoPib = {
  ano: number;
  pibMilReais: number | null;
  impostos: number | null;
  vabTotal: number | null;
  agropecuaria: number | null;
  industria: number | null;
  servicos: number | null;
  administracaoPublica: number | null;
  populacao: number | null;
  populacaoInterpolada: boolean;
  pibReais: number | null;
  pibPerCapita: number | null;
  participacaoEstado: number | null;
};

export type SetorCempre = {
  letra: string;
  nome: string;
  completo: string;
  macrossetor: string;
  empresas: number | null;
  pessoalOcupado: number | null;
  pessoalAssalariado: number | null;
  salariosMilReais: number | null;
};

export type AnoCempre = {
  ano: number;
  total: {
    empresas: number | null;
    pessoalOcupado: number | null;
    pessoalAssalariado: number | null;
    salariosMilReais: number | null;
  };
  setores: SetorCempre[];
};

export type Tributo = {
  chave: string;
  nome: string;
  descricao: string;
  proprio: boolean;
  valor: number;
};

export type AnoFinancas = {
  ano: number;
  populacao: number | null;
  receitaTotal: number | null;
  receitaLiquida: number | null;
  receitasCorrentes: number | null;
  receitasCapital: number | null;
  despesaTotal: number | null;
  despesaPaga: number | null;
  receitasPorOrigem: { nome: string; valor: number }[];
  despesasPorFuncao: { nome: string; valor: number }[];
  tributos: Tributo[];
};

export const populacao = populacaoJson as unknown as {
  fonte: Fonte[];
  serie: PontoPopulacao[];
  anosInterpolados: number[];
  censo2022: { ano: number; populacao: number; areaKm2: number; densidade: number };
  comparativo: Municipio[];
};

export const pib = pibJson as unknown as {
  fonte: Fonte[];
  serie: AnoPib[];
  ultimoAno: number;
  ultimoAnoSetorial: number;
  comparativo: {
    codigo: string;
    nome: string;
    ano: number | null;
    pibReais: number | null;
    pibPerCapita: number | null;
  }[];
};

export const cempre = cempreJson as unknown as {
  fonte: Fonte[];
  anos: number[];
  ultimoAno: number;
  porAno: AnoCempre[];
  comparativo: {
    codigo: string;
    nome: string;
    ano: number | null;
    empresas: number | null;
    pessoalOcupado: number | null;
    salariosMilReais: number | null;
  }[];
};

export type ProdutoAgro = {
  produto: string;
  /** Área plantada ou destinada à colheita. */
  areaPlantadaHa: number | null;
  areaColhidaHa: number | null;
  quantidadeToneladas: number | null;
  valorMilReais: number | null;
  /** Anos seguidos com a mesma área colhida na estimativa do IBGE. */
  anosParados: number | null;
  /** Primeiro ano da sequência parada, quando ela passa do limite. */
  paradoDesde: number | null;
  /** Contraprova do Censo Agropecuário, quando há produto equivalente. */
  censo2017: { areaColhidaHa: number; produtos: string[] } | null;
};

export const agro = agroJson as unknown as {
  fonte: Fonte[];
  ano: number;
  anoRebanho: number;
  limiteAnosParados: number;
  censo2017: { ano: number; produtos: { produto: string; areaColhidaHa?: number; valorMilReais?: number }[] };
  produtos: ProdutoAgro[];
  valorTotalMilReais: number;
  areaTotalHa: number;
  areaPlantadaTotalHa: number;
  rebanhos: { tipo: string; cabecas: number }[];
};

export const financas = financasJson as unknown as {
  fonte: Fonte[];
  anos: AnoFinancas[];
  ultimoAno: number;
};

export const malha = malhaJson as unknown as {
  fonte: Fonte[];
  type: 'FeatureCollection';
  features: {
    type: 'Feature';
    geometry: { type: string; coordinates: unknown };
    properties: { codigo: string; nome: string; foco: boolean };
  }[];
};

export const meta = metaJson as unknown as {
  municipio: {
    codigo: string;
    nome: string;
    uf: string;
    gentilico: string;
    regiaoImediata: string;
    circuito: string;
  };
  atualizadoEm: string;
  comparativo: { codigo: string; nome: string }[];
  fontes: Fonte[];
  avisos: string[];
};

/** Último ano da série do CEMPRE, já resolvido. */
export const cempreAtual = cempre.porAno[cempre.porAno.length - 1];
export const cempreAnterior = cempre.porAno[cempre.porAno.length - 2];

/** Último exercício fiscal disponível no SICONFI. */
export const financasAtual = financas.anos[financas.anos.length - 1];
export const financasAnterior = financas.anos[financas.anos.length - 2];

/** Último ano do PIB e último ano com abertura por setor (defasagem diferente). */
export const pibAtual = pib.serie.find((a) => a.ano === pib.ultimoAno)!;
export const pibSetorial = pib.serie.find((a) => a.ano === pib.ultimoAnoSetorial)!;
export const pibAnterior = pib.serie.find((a) => a.ano === pib.ultimoAno - 1);

export const populacaoAtual = populacao.serie[populacao.serie.length - 1];

/** Composição do valor adicionado no último ano com abertura setorial. */
export const composicaoVab = [
  { chave: 'servicos', nome: 'Serviços', valor: pibSetorial.servicos, cor: 'var(--serie-1)' },
  { chave: 'administracaoPublica', nome: 'Setor público', valor: pibSetorial.administracaoPublica, cor: 'var(--serie-2)' },
  { chave: 'industria', nome: 'Indústria', valor: pibSetorial.industria, cor: 'var(--serie-3)' },
  { chave: 'agropecuaria', nome: 'Agropecuária', valor: pibSetorial.agropecuaria, cor: 'var(--serie-4)' },
] as const;

export type LavouraMunicipal = {
  produto: string;
  areaColhidaHa: number | null;
  quantidadeToneladas: number | null;
  valorMilReais?: number | null;
  fonte: string;
  apuradoEm: string;
  observacao?: string;
};

/** Levantamento próprio do município, mantido à mão em src/data/municipal.json. */
export const municipal = municipalJson as unknown as {
  responsavel: string;
  atualizadoEm: string | null;
  lavouras: LavouraMunicipal[];
};

export const temDadoMunicipal = municipal.lavouras.length > 0;

export const lavouraMunicipal = (produto: string) =>
  municipal.lavouras.find((l) => l.produto === produto) ?? null;
