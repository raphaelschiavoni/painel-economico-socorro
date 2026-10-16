'use client';

import { useState } from 'react';
import { Cartao, Indicador, Secao, SeletorAno, SinalVariacao } from '@/components/estrutura';
import { GraficoBarras, GraficoBarrasAgrupadas, MiniSerie, SERIES } from '@/components/graficos';
import {
  arrecadacaoPropria,
  dependenciaTransferencias,
  resultadoOrcamentario,
  serieTributo,
  variacoes,
} from '@/lib/analise';
import { financas, financasAtual } from '@/lib/dados';
import { numero, percentual, reais, reaisCurto, variacao } from '@/lib/formato';

/** Cada tributo é uma entidade: mantém sempre a mesma cor, em qualquer recorte. */
const COR_TRIBUTO: Record<string, string> = {
  iss: SERIES[0],
  iptu: SERIES[1],
  itbi: SERIES[2],
  icms: SERIES[3],
  fpm: SERIES[4],
  ipva: SERIES[6],
};

export function SecaoFinancas() {
  const [ano, setAno] = useState(financas.ultimoAno);
  const dadosAno = financas.anos.find((a) => a.ano === ano) ?? financasAtual;
  const anos = financas.anos.map((a) => a.ano);

  const serieOrcamento = financas.anos.map((a) => ({
    ano: a.ano,
    receita: a.receitaTotal,
    despesa: a.despesaTotal,
  }));

  const origens = dadosAno.receitasPorOrigem.map((r) => ({ origem: r.nome, valor: r.valor }));
  const funcoes = dadosAno.despesasPorFuncao
    .slice(0, 10)
    .map((f) => ({ funcao: f.nome, valor: f.valor }));

  const dependencia = dependenciaTransferencias(dadosAno);
  const propria = arrecadacaoPropria(dadosAno);

  return (
    <Secao
      id="financas"
      numeroSecao="05"
      titulo="Finanças públicas"
      quebraPagina
      resumo={
        `Em ${financasAtual.ano} o município arrecadou ${reaisCurto(financasAtual.receitaTotal)} ` +
        `e empenhou ${reaisCurto(financasAtual.despesaTotal)}. ` +
        `${percentual(dependenciaTransferencias().percentual)} da receita veio de transferências ` +
        `da União e do Estado — o principal condicionante do orçamento municipal.`
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Indicador
          rotulo="Receita total realizada"
          valor={reaisCurto(financasAtual.receitaTotal)}
          referencia={`SICONFI · ${financasAtual.ano}`}
          variacao={variacoes.receita}
          comparacao={`vs. ${financasAtual.ano - 1}`}
        />
        <Indicador
          rotulo="Despesa empenhada"
          valor={reaisCurto(financasAtual.despesaTotal)}
          referencia={`SICONFI · ${financasAtual.ano}`}
          variacao={variacoes.despesa}
          comparacao={`vs. ${financasAtual.ano - 1}`}
        />
        <Indicador
          rotulo="Resultado orçamentário"
          valor={reaisCurto(resultadoOrcamentario)}
          referencia="receita menos despesa empenhada"
        />
        <Indicador
          rotulo="Receita por habitante"
          valor={reais(
            financasAtual.populacao
              ? (financasAtual.receitaTotal ?? 0) / financasAtual.populacao
              : null,
          )}
          referencia={`população de referência: ${numero(financasAtual.populacao)}`}
        />
      </div>

      <Cartao
        titulo="Receita e despesa por exercício"
        descricao="Receita bruta realizada e despesa empenhada, exceto operações intraorçamentárias."
        fonte={financas.fonte[0]}
        tabela={{
          colunas: ['Exercício', 'Receita realizada (R$)', 'Despesa empenhada (R$)', 'Resultado (R$)'],
          linhas: financas.anos.map((a) => [
            String(a.ano),
            a.receitaTotal,
            a.despesaTotal,
            a.receitaTotal != null && a.despesaTotal != null ? a.receitaTotal - a.despesaTotal : null,
          ]),
        }}
      >
        <GraficoBarrasAgrupadas
          dados={serieOrcamento}
          chaveX="ano"
          series={[
            { chave: 'receita', nome: 'Receita realizada', cor: SERIES[0] },
            { chave: 'despesa', nome: 'Despesa empenhada', cor: SERIES[1] },
          ]}
          formatar={(v) => reaisCurto(v)}
        />
        <div className="mt-3 flex flex-wrap gap-4 text-xs">
          <span className="flex items-center gap-1.5" style={{ color: 'var(--tinta-2)' }}>
            <span aria-hidden className="h-2.5 w-2.5 rounded-sm" style={{ background: SERIES[0] }} />
            Receita realizada
          </span>
          <span className="flex items-center gap-1.5" style={{ color: 'var(--tinta-2)' }}>
            <span aria-hidden className="h-2.5 w-2.5 rounded-sm" style={{ background: SERIES[1] }} />
            Despesa empenhada
          </span>
        </div>
      </Cartao>

      <div>
        <h3 className="mb-1 text-base font-semibold">Termômetros tributários</h3>
        <p className="mb-3 max-w-3xl text-sm" style={{ color: 'var(--tinta-2)' }}>
          Impostos próprios reagem à atividade econômica dentro do município; as cotas-parte
          refletem decisões e bases de cálculo estaduais e federais. Acompanhá-los separadamente
          evita atribuir à economia local uma variação que veio de repasse.
        </p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {financasAtual.tributos.map((t) => {
            const serie = serieTributo(t.chave);
            const v = variacao(serie.at(-1)?.valor, serie.at(-2)?.valor);
            return (
              <div key={t.chave} className="cartao p-4">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-sm font-semibold">{t.nome}</p>
                  <span
                    className="rounded px-1.5 py-0.5 text-[0.625rem] font-semibold tracking-wide uppercase"
                    style={{
                      background: 'var(--superficie-2)',
                      color: 'var(--tinta-3)',
                    }}
                  >
                    {t.proprio ? 'Próprio' : 'Repasse'}
                  </span>
                </div>
                <p className="mt-2 text-2xl leading-none font-semibold">
                  {reaisCurto(serie.at(-1)?.valor)}
                </p>
                <div className="mt-1.5 flex items-center gap-2">
                  {v && <SinalVariacao variacao={v} sufixo={`vs. ${serie.at(-2)?.ano}`} />}
                </div>
                <div className="mt-2">
                  <MiniSerie dados={serie} cor={COR_TRIBUTO[t.chave]} />
                </div>
                <p className="mt-1 text-xs" style={{ color: 'var(--tinta-3)' }}>
                  {serie[0].ano}–{serie.at(-1)!.ano} · {t.descricao}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="sem-impressao">
        <SeletorAno anos={anos} valor={ano} aoMudar={setAno} rotulo="Exercício detalhado" />
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Cartao
          titulo={`Receita por origem — ${dadosAno.ano}`}
          descricao="Segundo nível do plano de contas, sem os totais que já somam os demais."
          fonte={financas.fonte[0]}
          nota={
            `Transferências correntes e de capital somam ${reaisCurto(dependencia.valor)} ` +
            `(${percentual(dependencia.percentual)} da receita).`
          }
          tabela={{
            colunas: ['Origem', 'Valor (R$)', 'Participação (%)'],
            linhas: origens.map((o) => [
              o.origem,
              o.valor,
              numero((o.valor / (dadosAno.receitaTotal || 1)) * 100, 1),
            ]),
          }}
        >
          <GraficoBarras
            dados={origens}
            chaveCategoria="origem"
            chaveValor="valor"
            nome="Receita"
            formatar={(v) => reaisCurto(v)}
            cor={SERIES[0]}
            larguraRotulo={190}
          />
        </Cartao>

        <Cartao
          titulo={`Despesa por função de governo — ${dadosAno.ano}`}
          descricao="Dez maiores funções por despesa empenhada."
          fonte={financas.fonte[0]}
          tabela={{
            colunas: ['Função', 'Despesa empenhada (R$)', 'Participação (%)'],
            linhas: dadosAno.despesasPorFuncao.map((f) => [
              f.nome,
              f.valor,
              numero((f.valor / (dadosAno.despesaTotal || 1)) * 100, 1),
            ]),
          }}
        >
          <GraficoBarras
            dados={funcoes}
            chaveCategoria="funcao"
            chaveValor="valor"
            nome="Despesa"
            formatar={(v) => reaisCurto(v)}
            cor={SERIES[1]}
            larguraRotulo={150}
          />
        </Cartao>
      </div>

      <Cartao
        titulo={`Estrutura da receita — ${dadosAno.ano}`}
        descricao="Quanto o município arrecada por conta própria e quanto depende de repasses."
        fonte={financas.fonte[0]}
        nota="Arrecadação própria considera IPTU, ISS e ITBI. Repasses consideram as transferências correntes e de capital registradas no exercício."
      >
        <dl className="grid gap-4 sm:grid-cols-3">
          {[
            {
              rotulo: 'Arrecadação própria de impostos',
              valor: reaisCurto(propria.valor),
              percentual: propria.percentual,
              cor: SERIES[0],
            },
            {
              rotulo: 'Transferências recebidas',
              valor: reaisCurto(dependencia.valor),
              percentual: dependencia.percentual,
              cor: SERIES[1],
            },
            {
              rotulo: 'Demais receitas',
              valor: reaisCurto(
                (dadosAno.receitaTotal ?? 0) - propria.valor - dependencia.valor,
              ),
              percentual:
                (((dadosAno.receitaTotal ?? 0) - propria.valor - dependencia.valor) /
                  (dadosAno.receitaTotal || 1)) *
                100,
              cor: SERIES[2],
            },
          ].map((item) => (
            <div key={item.rotulo}>
              <dt className="text-sm" style={{ color: 'var(--tinta-2)' }}>
                {item.rotulo}
              </dt>
              <dd className="mt-1 text-2xl font-semibold">{item.valor}</dd>
              <div
                className="mt-2 h-1.5 w-full overflow-hidden rounded-full"
                style={{ background: 'var(--superficie-2)' }}
              >
                <div
                  className="h-full rounded-full"
                  style={{ width: `${item.percentual}%`, background: item.cor }}
                />
              </div>
              <p className="tabular mt-1 text-xs" style={{ color: 'var(--tinta-3)' }}>
                {percentual(item.percentual)} da receita total
              </p>
            </div>
          ))}
        </dl>
      </Cartao>
    </Secao>
  );
}
