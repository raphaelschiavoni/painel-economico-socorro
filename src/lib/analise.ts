/**
 * Leituras derivadas dos dados brutos. Ficam aqui, e não nos componentes,
 * para que a interpretação seja auditável e recalculada a cada coleta —
 * nenhum número do painel é digitado à mão.
 */
import {
  agro,
  cempre,
  cempreAnterior,
  cempreAtual,
  financas,
  financasAnterior,
  financasAtual,
  pib,
  pibAtual,
  pibSetorial,
  populacao,
  populacaoAtual,
  type SetorCempre,
} from './dados';
import { numero, participacao, percentual, reais, reaisCurto, variacao } from './formato';

const ordenarPor = <T,>(lista: T[], chave: (item: T) => number | null) =>
  [...lista].sort((a, b) => (chave(b) ?? 0) - (chave(a) ?? 0));

/** Setores do CEMPRE ordenados por uma métrica, sem os que não têm dado. */
export function setoresPor(
  metrica: keyof Pick<SetorCempre, 'empresas' | 'pessoalOcupado' | 'salariosMilReais'>,
  ano = cempreAtual,
) {
  return ordenarPor(
    ano.setores.filter((s) => s[metrica] != null),
    (s) => s[metrica],
  );
}

/** Remuneração média anual por assalariado, em reais. */
export function remuneracaoMedia(setor: SetorCempre): number | null {
  if (!setor.salariosMilReais || !setor.pessoalAssalariado) return null;
  return (setor.salariosMilReais * 1000) / setor.pessoalAssalariado;
}

export const remuneracaoMediaMunicipio = (() => {
  const t = cempreAtual.total;
  if (!t.salariosMilReais || !t.pessoalAssalariado) return null;
  return (t.salariosMilReais * 1000) / t.pessoalAssalariado;
})();

/** Peso das transferências no total arrecadado — mede autonomia fiscal. */
export function dependenciaTransferencias(ano = financasAtual) {
  const transferencias = ano.receitasPorOrigem
    .filter((r) => /Transfer/i.test(r.nome))
    .reduce((s, r) => s + r.valor, 0);
  return {
    valor: transferencias,
    percentual: participacao(transferencias, ano.receitaTotal),
  };
}

/** Arrecadação própria: impostos, taxas e contribuições de melhoria. */
export function arrecadacaoPropria(ano = financasAtual) {
  const proprios = ano.tributos.filter((t) => t.proprio).reduce((s, t) => s + t.valor, 0);
  return { valor: proprios, percentual: participacao(proprios, ano.receitaTotal) };
}

export const serieTributo = (chave: string) =>
  financas.anos
    .map((a) => ({ ano: a.ano, valor: a.tributos.find((t) => t.chave === chave)?.valor ?? null }))
    .filter((p): p is { ano: number; valor: number } => p.valor != null);

/* ───────────────────────────────────────────── leituras em texto */

export type Destaque = {
  titulo: string;
  texto: string;
  tom: 'positivo' | 'atencao' | 'neutro';
};

export function destaques(): Destaque[] {
  const lista: Destaque[] = [];

  // 1. Concentração do emprego
  const porEmprego = setoresPor('pessoalOcupado');
  const lider = porEmprego[0];
  const segundo = porEmprego[1];
  const pesoLider = participacao(lider.pessoalOcupado, cempreAtual.total.pessoalOcupado);
  lista.push({
    titulo: 'Onde está o emprego',
    texto:
      `${lider.nome} responde por ${percentual(pesoLider)} do pessoal ocupado ` +
      `(${numero(lider.pessoalOcupado)} pessoas), seguido de ${segundo.nome.toLowerCase()} ` +
      `com ${numero(segundo.pessoalOcupado)}. Juntos, os dois concentram ` +
      `${percentual(
        (participacao(lider.pessoalOcupado, cempreAtual.total.pessoalOcupado) ?? 0) +
          (participacao(segundo.pessoalOcupado, cempreAtual.total.pessoalOcupado) ?? 0),
      )} das ocupações formais de ${cempreAtual.ano}.`,
    tom: 'neutro',
  });

  // 2. Empresas por porte aparente: muitas empresas, pouco assalariado
  const semAssalariado =
    (cempreAtual.total.pessoalOcupado ?? 0) - (cempreAtual.total.pessoalAssalariado ?? 0);
  lista.push({
    titulo: 'Perfil das empresas',
    texto:
      `São ${numero(cempreAtual.total.empresas)} empresas e organizações ativas para ` +
      `${numero(cempreAtual.total.pessoalOcupado)} pessoas ocupadas — média de ` +
      `${numero((cempreAtual.total.pessoalOcupado ?? 0) / (cempreAtual.total.empresas ?? 1), 1)} ` +
      `ocupados por empresa. ${numero(semAssalariado)} são sócios ou proprietários sem ` +
      `vínculo assalariado, o que indica predomínio de micro e pequenos negócios.`,
    tom: 'neutro',
  });

  // 3. Dinâmica fiscal do ISS — termômetro do setor de serviços
  const iss = serieTributo('iss');
  const varIss = variacao(iss.at(-1)?.valor, iss.at(-2)?.valor);
  const varIssLonga = variacao(iss.at(-1)?.valor, iss[0]?.valor);
  if (varIss && varIssLonga) {
    lista.push({
      titulo: 'Serviços em expansão',
      texto:
        `A arrecadação de ISS chegou a ${reaisCurto(iss.at(-1)!.valor)} em ${iss.at(-1)!.ano}, ` +
        `${varIss.rotulo} sobre ${iss.at(-2)!.ano} e ${varIssLonga.rotulo} sobre ${iss[0].ano}. ` +
        `Como o ISS incide sobre serviços prestados no município, é o indicador mais ` +
        `tempestivo de atividade econômica local disponível publicamente.`,
      tom: varIss.sentido === 'alta' ? 'positivo' : 'atencao',
    });
  }

  // 4. Autonomia fiscal
  const dependencia = dependenciaTransferencias();
  lista.push({
    titulo: 'Autonomia fiscal',
    texto:
      `${percentual(dependencia.percentual)} da receita de ${financasAtual.ano} veio de ` +
      `transferências da União e do Estado (${reaisCurto(dependencia.valor)}). ` +
      `A arrecadação própria de impostos somou ${reaisCurto(arrecadacaoPropria().valor)}, ` +
      `${percentual(arrecadacaoPropria().percentual)} do total.`,
    tom: (dependencia.percentual ?? 0) > 65 ? 'atencao' : 'neutro',
  });

  // 5. Agropecuária
  const principal = agro.produtos[0];
  const pesoPrincipal = participacao(principal?.valorMilReais ?? null, agro.valorTotalMilReais);
  lista.push({
    titulo: 'Base agrícola',
    texto:
      `A lavoura gerou ${reaisCurto(agro.valorTotalMilReais * 1000)} em ${agro.ano}, ` +
      `com ${principal.produto.toLowerCase()} respondendo por ${percentual(pesoPrincipal)} ` +
      `do valor da produção em ${numero(principal.areaColhidaHa)} hectares colhidos. ` +
      `O rebanho principal é de ${agro.rebanhos[0].tipo.toLowerCase()}, com ` +
      `${numero(agro.rebanhos[0].cabecas)} cabeças.`,
    tom: 'neutro',
  });

  // 6. Posição no PIB per capita do circuito
  const ranking = ordenarPor(
    pib.comparativo.filter((m) => m.pibPerCapita != null),
    (m) => m.pibPerCapita,
  );
  const posicao = ranking.findIndex((m) => m.codigo === '3552106') + 1;
  const mediana = ranking[Math.floor(ranking.length / 2)];
  lista.push({
    titulo: 'Posição regional',
    texto:
      `No PIB per capita, Socorro ocupa a ${posicao}ª posição entre os ${ranking.length} ` +
      `municípios do Circuito das Águas Paulista, com ${reais(
        ranking[posicao - 1].pibPerCapita,
      )} contra ${reais(mediana.pibPerCapita)} da mediana do circuito.`,
    tom: posicao > ranking.length / 2 ? 'atencao' : 'positivo',
  });

  return lista;
}

/* ───────────────────────────────────────────── variações de capa */

export const variacoes = {
  populacao: variacao(populacaoAtual.valor, populacao.censo2022.populacao),
  pib: variacao(pibAtual.pibReais, pib.serie.find((a) => a.ano === pibAtual.ano - 1)?.pibReais),
  pibPerCapita: variacao(
    pibAtual.pibPerCapita,
    pib.serie.find((a) => a.ano === pibAtual.ano - 1)?.pibPerCapita,
  ),
  empresas: variacao(cempreAtual.total.empresas, cempreAnterior.total.empresas),
  pessoalOcupado: variacao(cempreAtual.total.pessoalOcupado, cempreAnterior.total.pessoalOcupado),
  massaSalarial: variacao(
    cempreAtual.total.salariosMilReais,
    cempreAnterior.total.salariosMilReais,
  ),
  receita: variacao(financasAtual.receitaTotal, financasAnterior.receitaTotal),
  despesa: variacao(financasAtual.despesaTotal, financasAnterior.despesaTotal),
};

/** Serviços + comércio dentro do valor adicionado do município. */
export const pesoServicos = participacao(pibSetorial.servicos, pibSetorial.vabTotal);
export const pesoAgro = participacao(pibSetorial.agropecuaria, pibSetorial.vabTotal);
export const pesoIndustria = participacao(pibSetorial.industria, pibSetorial.vabTotal);
export const pesoPublico = participacao(pibSetorial.administracaoPublica, pibSetorial.vabTotal);

/** Resultado orçamentário do último exercício (receita menos despesa empenhada). */
export const resultadoOrcamentario =
  financasAtual.receitaTotal != null && financasAtual.despesaTotal != null
    ? financasAtual.receitaTotal - financasAtual.despesaTotal
    : null;

export { cempre, financas };
