'use client';

import { Cartao, Secao } from '@/components/estrutura';
import { BarraComposicao, GraficoAreaEmpilhada, GraficoLinha, SERIES } from '@/components/graficos';
import { pesoAgro, pesoIndustria, pesoPublico, pesoServicos } from '@/lib/analise';
import { pib, pibAtual, pibSetorial } from '@/lib/dados';
import { numero, percentual, reais, reaisCurto } from '@/lib/formato';

/** Só a partir de 2010 a série tem densidade suficiente para leitura de tendência. */
const DESDE = 2010;

export function SecaoEconomia() {
  const serie = pib.serie.filter((a) => a.ano >= DESDE);

  const seriePib = serie.map((a) => ({ ano: a.ano, pib: a.pibReais }));
  const seriePerCapita = serie
    .filter((a) => a.pibPerCapita != null)
    .map((a) => ({ ano: a.ano, valor: a.pibPerCapita }));

  const serieSetorial = serie
    .filter((a) => a.vabTotal != null)
    .map((a) => ({
      ano: a.ano,
      servicos: (a.servicos ?? 0) * 1000,
      publico: (a.administracaoPublica ?? 0) * 1000,
      industria: (a.industria ?? 0) * 1000,
      agropecuaria: (a.agropecuaria ?? 0) * 1000,
      impostos: (a.impostos ?? 0) * 1000,
    }));

  const composicao = [
    { nome: 'Serviços e comércio', valor: (pibSetorial.servicos ?? 0) * 1000, cor: SERIES[0] },
    { nome: 'Administração pública', valor: (pibSetorial.administracaoPublica ?? 0) * 1000, cor: SERIES[1] },
    { nome: 'Indústria', valor: (pibSetorial.industria ?? 0) * 1000, cor: SERIES[2] },
    { nome: 'Agropecuária', valor: (pibSetorial.agropecuaria ?? 0) * 1000, cor: SERIES[3] },
  ];

  return (
    <Secao
      id="economia"
      numeroSecao="02"
      titulo="Economia e PIB"
      quebraPagina
      resumo={
        `O PIB municipal alcançou ${reaisCurto(pibAtual.pibReais)} em ${pibAtual.ano}. ` +
        `A economia é dominada por serviços (${percentual(pesoServicos)} do valor adicionado), ` +
        `com participação relevante da administração pública (${percentual(pesoPublico)}) e ` +
        `da agropecuária (${percentual(pesoAgro)}), acima da média de municípios do mesmo porte.`
      }
    >
      <div className="grid gap-5 xl:grid-cols-2">
        <Cartao
          titulo="Produto Interno Bruto a preços correntes"
          descricao={`Série ${DESDE}–${pib.ultimoAno}. Valores nominais, sem correção pela inflação.`}
          fonte={pib.fonte[0]}
          nota="Preços correntes: parte do crescimento observado corresponde à variação de preços do período."
          tabela={{
            colunas: ['Ano', 'PIB (R$)', 'PIB por habitante (R$)', 'Participação em SP (%)'],
            linhas: serie.map((a) => [
              String(a.ano),
              a.pibReais,
              a.pibPerCapita == null ? null : Math.round(a.pibPerCapita),
              a.participacaoEstado == null ? null : numero(a.participacaoEstado, 3),
            ]),
          }}
        >
          <GraficoLinha
            dados={seriePib}
            chaveX="ano"
            series={[{ chave: 'pib', nome: 'PIB', cor: SERIES[0] }]}
            formatar={(v) => reaisCurto(v)}
          />
        </Cartao>

        <Cartao
          titulo="PIB por habitante"
          descricao="Riqueza gerada dividida pela população residente do respectivo ano."
          fonte={pib.fonte[0]}
          nota={`Nos anos sem estimativa oficial do IBGE (2022 e 2023), a população usada é a do Censo 2022 ou interpolada — o valor de ${pibAtual.ano} é aproximado.`}
          tabela={{
            colunas: ['Ano', 'PIB por habitante (R$)', 'População'],
            linhas: serie
              .filter((a) => a.pibPerCapita != null)
              .map((a) => [String(a.ano), Math.round(a.pibPerCapita!), a.populacao]),
          }}
        >
          <GraficoLinha
            dados={seriePerCapita}
            chaveX="ano"
            series={[{ chave: 'valor', nome: 'PIB por habitante', cor: SERIES[2] }]}
            formatar={(v) => reais(v)}
            formatarEixo={(v) => reaisCurto(v)}
          />
        </Cartao>
      </div>

      <Cartao
        titulo={`Composição do valor adicionado em ${pibSetorial.ano}`}
        descricao="Participação de cada setor no valor adicionado bruto, antes dos impostos sobre produtos."
        fonte={pib.fonte[0]}
        nota={`A abertura setorial do PIB tem defasagem maior que o total: o dado mais recente é de ${pibSetorial.ano}.`}
        tabela={{
          colunas: ['Setor', 'Valor adicionado (R$)', 'Participação (%)'],
          linhas: composicao.map((c) => [
            c.nome,
            c.valor,
            numero((c.valor / composicao.reduce((s, x) => s + x.valor, 0)) * 100, 1),
          ]),
        }}
      >
        <BarraComposicao partes={composicao} formatar={(v) => reaisCurto(v)} />
      </Cartao>

      <Cartao
        titulo="Evolução do valor adicionado por setor"
        descricao={`Composição da economia entre ${DESDE} e ${pibSetorial.ano}, incluindo impostos sobre produtos.`}
        fonte={pib.fonte[0]}
        tabela={{
          colunas: ['Ano', 'Serviços', 'Adm. pública', 'Indústria', 'Agropecuária', 'Impostos'],
          linhas: serieSetorial.map((a) => [
            String(a.ano),
            a.servicos,
            a.publico,
            a.industria,
            a.agropecuaria,
            a.impostos,
          ]),
        }}
      >
        <GraficoAreaEmpilhada
          dados={serieSetorial}
          chaveX="ano"
          series={[
            { chave: 'servicos', nome: 'Serviços e comércio', cor: SERIES[0] },
            { chave: 'publico', nome: 'Administração pública', cor: SERIES[1] },
            { chave: 'industria', nome: 'Indústria', cor: SERIES[2] },
            { chave: 'agropecuaria', nome: 'Agropecuária', cor: SERIES[3] },
            { chave: 'impostos', nome: 'Impostos sobre produtos', cor: SERIES[4] },
          ]}
          formatar={(v) => reaisCurto(v)}
          altura={300}
        />
        <p className="mt-3 text-sm" style={{ color: 'var(--tinta-2)' }}>
          Em {pibSetorial.ano}, serviços respondiam por {percentual(pesoServicos)} do valor
          adicionado, indústria por {percentual(pesoIndustria)} e agropecuária por{' '}
          {percentual(pesoAgro)}.
        </p>
      </Cartao>
    </Secao>
  );
}
