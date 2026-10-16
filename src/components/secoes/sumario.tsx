'use client';

import { Indicador, Secao } from '@/components/estrutura';
import { destaques, remuneracaoMediaMunicipio, variacoes } from '@/lib/analise';
import {
  cempreAtual,
  financasAtual,
  meta,
  pib,
  pibAtual,
  populacao,
  populacaoAtual,
} from '@/lib/dados';
import { numero, numeroCurto, reais, reaisCurto } from '@/lib/formato';

const TONS = {
  positivo: { cor: 'var(--bom-texto)', simbolo: '↑', nome: 'Tendência positiva' },
  atencao: { cor: 'var(--critico)', simbolo: '!', nome: 'Ponto de atenção' },
  neutro: { cor: 'var(--serie-1)', simbolo: '•', nome: 'Contexto' },
} as const;

export function SecaoSumario() {
  const lista = destaques();

  return (
    <Secao
      id="sumario"
      numeroSecao="01"
      titulo="Sumário executivo"
      resumo={
        `Retrato econômico de ${meta.municipio.nome}/${meta.municipio.uf} montado apenas com ` +
        `estatísticas oficiais abertas. Cada indicador traz o ano de referência: as bases ` +
        `federais têm defasagens diferentes, e compará-las sem essa marcação leva a conclusões erradas.`
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Indicador
          rotulo="População estimada"
          valor={numero(populacaoAtual.valor)}
          unidade="hab."
          referencia={`IBGE · estimativa ${populacaoAtual.ano}`}
          variacao={variacoes.populacao}
          comparacao={`vs. Censo ${populacao.censo2022.ano}`}
        />
        <Indicador
          rotulo="Produto Interno Bruto"
          valor={reaisCurto(pibAtual.pibReais)}
          referencia={`IBGE · ${pibAtual.ano}`}
          variacao={variacoes.pib}
          comparacao={`vs. ${pibAtual.ano - 1}`}
          destaque
        />
        <Indicador
          rotulo="PIB por habitante"
          valor={reais(pibAtual.pibPerCapita)}
          referencia={`IBGE · ${pibAtual.ano}`}
          variacao={variacoes.pibPerCapita}
          comparacao={`vs. ${pibAtual.ano - 1}`}
        />
        <Indicador
          rotulo="Participação no PIB paulista"
          valor={numero(pibAtual.participacaoEstado, 3)}
          unidade="%"
          referencia={`IBGE · ${pibAtual.ano}`}
        />

        <Indicador
          rotulo="Empresas ativas"
          valor={numero(cempreAtual.total.empresas)}
          referencia={`IBGE/CEMPRE · ${cempreAtual.ano}`}
          variacao={variacoes.empresas}
          comparacao={`vs. ${cempreAtual.ano - 1}`}
        />
        <Indicador
          rotulo="Pessoal ocupado"
          valor={numero(cempreAtual.total.pessoalOcupado)}
          unidade="pessoas"
          referencia={`IBGE/CEMPRE · ${cempreAtual.ano}`}
          variacao={variacoes.pessoalOcupado}
          comparacao={`vs. ${cempreAtual.ano - 1}`}
        />
        <Indicador
          rotulo="Massa salarial anual"
          valor={reaisCurto((cempreAtual.total.salariosMilReais ?? 0) * 1000)}
          referencia={`IBGE/CEMPRE · ${cempreAtual.ano}`}
          variacao={variacoes.massaSalarial}
          comparacao={`vs. ${cempreAtual.ano - 1}`}
        />
        <Indicador
          rotulo="Receita municipal"
          valor={reaisCurto(financasAtual.receitaTotal)}
          referencia={`Tesouro/SICONFI · ${financasAtual.ano}`}
          variacao={variacoes.receita}
          comparacao={`vs. ${financasAtual.ano - 1}`}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {lista.map((d) => {
          const tom = TONS[d.tom];
          return (
            <article key={d.titulo} className="cartao p-4">
              <div className="flex items-center gap-2">
                <span
                  aria-hidden
                  className="flex h-5 w-5 items-center justify-center rounded-full text-[0.6875rem] font-bold text-white"
                  style={{ background: tom.cor }}
                >
                  {tom.simbolo}
                </span>
                <h3 className="text-sm font-semibold">{d.titulo}</h3>
                <span className="sr-only">{tom.nome}</span>
              </div>
              <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--tinta-2)' }}>
                {d.texto}
              </p>
            </article>
          );
        })}
      </div>

      <p className="text-xs leading-relaxed" style={{ color: 'var(--tinta-3)' }}>
        Remuneração média anual por assalariado em {cempreAtual.ano}:{' '}
        <strong style={{ color: 'var(--tinta-2)' }}>{reais(remuneracaoMediaMunicipio)}</strong>,
        considerando {numeroCurto(cempreAtual.total.pessoalAssalariado)} pessoas com vínculo
        assalariado. O PIB municipal mais recente é de {pib.ultimoAno}; a abertura por setor só
        existe até {pib.ultimoAnoSetorial}.
      </p>
    </Secao>
  );
}
