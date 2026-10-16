'use client';

import { useState } from 'react';
import { Cartao, Legenda, Secao, SeletorAno } from '@/components/estrutura';
import { GraficoBarras, SERIES } from '@/components/graficos';
import { remuneracaoMedia } from '@/lib/analise';
import { cempre, cempreAtual, type SetorCempre } from '@/lib/dados';
import { numero, percentual, reais, reaisCurto, variacao } from '@/lib/formato';

type Metrica = 'empresas' | 'pessoalOcupado' | 'massaSalarial' | 'remuneracao';

const METRICAS: Record<
  Metrica,
  {
    rotulo: string;
    descricao: string;
    valor: (s: SetorCempre) => number | null;
    formatar: (v: number | null) => string;
    cor: string;
  }
> = {
  empresas: {
    rotulo: 'Empresas',
    descricao: 'Número de empresas e outras organizações ativas por setor.',
    valor: (s) => s.empresas,
    formatar: (v) => numero(v),
    cor: SERIES[0],
  },
  pessoalOcupado: {
    rotulo: 'Pessoal ocupado',
    descricao: 'Total de pessoas ocupadas, incluindo sócios e proprietários.',
    valor: (s) => s.pessoalOcupado,
    formatar: (v) => numero(v),
    cor: SERIES[2],
  },
  massaSalarial: {
    rotulo: 'Massa salarial',
    descricao: 'Salários e outras remunerações pagos no ano.',
    valor: (s) => (s.salariosMilReais == null ? null : s.salariosMilReais * 1000),
    formatar: (v) => reaisCurto(v),
    cor: SERIES[6],
  },
  remuneracao: {
    rotulo: 'Remuneração média',
    descricao: 'Remuneração anual média por pessoa assalariada, incluindo 13º.',
    valor: remuneracaoMedia,
    formatar: (v) => reais(v),
    cor: SERIES[4],
  },
};

export function SecaoEmpresas() {
  const [ano, setAno] = useState(cempre.ultimoAno);
  const [metrica, setMetrica] = useState<Metrica>('pessoalOcupado');

  const dadosAno = cempre.porAno.find((a) => a.ano === ano) ?? cempreAtual;
  const config = METRICAS[metrica];

  const barras = dadosAno.setores
    .map((s) => ({ setor: s.nome, valor: config.valor(s) }))
    .filter((s) => s.valor != null)
    .sort((a, b) => (b.valor ?? 0) - (a.valor ?? 0));

  // Variação do pessoal ocupado entre o primeiro e o último ano da série.
  const primeiro = cempre.porAno[0];
  const ultimo = cempre.porAno[cempre.porAno.length - 1];
  const crescimento = ultimo.setores
    .map((s) => {
      const antes = primeiro.setores.find((x) => x.letra === s.letra);
      const v = variacao(s.pessoalOcupado, antes?.pessoalOcupado);
      return v && s.pessoalOcupado != null && (antes?.pessoalOcupado ?? 0) >= 100
        ? { setor: s.nome, valor: v.percentual, saldo: (s.pessoalOcupado ?? 0) - (antes!.pessoalOcupado ?? 0) }
        : null;
    })
    .filter((x): x is { setor: string; valor: number; saldo: number } => x !== null)
    .sort((a, b) => b.valor - a.valor);

  return (
    <Secao
      id="empresas"
      numeroSecao="03"
      titulo="Empresas e emprego"
      quebraPagina
      resumo={
        `O Cadastro Central de Empresas registra ${numero(cempreAtual.total.empresas)} organizações ` +
        `ativas em ${cempreAtual.ano}, ocupando ${numero(cempreAtual.total.pessoalOcupado)} pessoas. ` +
        `É a base mais completa de estrutura produtiva municipal disponível, e cobre desde o ` +
        `produtor rural individual até a indústria de transformação.`
      }
    >
      <div className="sem-impressao flex flex-wrap items-center justify-between gap-4">
        <SeletorAno anos={cempre.anos} valor={ano} aoMudar={setAno} />
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium" style={{ color: 'var(--tinta-2)' }}>
            Indicador
          </span>
          <div
            role="group"
            aria-label="Indicador exibido"
            className="inline-flex flex-wrap overflow-hidden rounded-lg border"
            style={{ borderColor: 'var(--borda)' }}
          >
            {(Object.keys(METRICAS) as Metrica[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMetrica(m)}
                aria-pressed={metrica === m}
                className="foco-visivel px-3 py-1.5 text-xs font-semibold transition-colors"
                style={{
                  background: metrica === m ? 'var(--serie-1)' : 'transparent',
                  color: metrica === m ? '#ffffff' : 'var(--tinta-2)',
                }}
              >
                {METRICAS[m].rotulo}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Cartao
        titulo={`${config.rotulo} por setor de atividade — ${ano}`}
        descricao={config.descricao}
        fonte={cempre.fonte[0]}
        nota="Seções da CNAE 2.0. Setores sem dado divulgado foram omitidos por sigilo estatístico (poucos informantes)."
        tabela={{
          colunas: [
            'Setor (CNAE 2.0)',
            'Empresas',
            'Pessoal ocupado',
            'Pessoal assalariado',
            'Massa salarial (R$)',
            'Remuneração média (R$/ano)',
          ],
          linhas: dadosAno.setores.map((s) => [
            `${s.letra} — ${s.completo}`,
            s.empresas,
            s.pessoalOcupado,
            s.pessoalAssalariado,
            s.salariosMilReais == null ? null : s.salariosMilReais * 1000,
            remuneracaoMedia(s) == null ? null : Math.round(remuneracaoMedia(s)!),
          ]),
        }}
      >
        <GraficoBarras
          dados={barras}
          chaveCategoria="setor"
          chaveValor="valor"
          nome={config.rotulo}
          formatar={config.formatar}
          cor={config.cor}
          larguraRotulo={170}
        />
      </Cartao>

      <div className="grid gap-5 xl:grid-cols-2">
        <Cartao
          titulo={`Variação do pessoal ocupado por setor · ${primeiro.ano}–${ultimo.ano}`}
          descricao="Setores com ao menos 100 ocupados no início do período."
          fonte={cempre.fonte[0]}
          tabela={{
            colunas: ['Setor', 'Variação (%)', 'Saldo de ocupações'],
            linhas: crescimento.map((c) => [c.setor, numero(c.valor, 1), c.saldo]),
          }}
        >
          <GraficoBarras
            dados={crescimento}
            chaveCategoria="setor"
            chaveValor="valor"
            nome="Variação"
            formatar={(v) => percentual(v)}
            corDe={(l) => ((l.valor as number) >= 0 ? SERIES[0] : SERIES[7])}
            larguraRotulo={170}
          />
          <div className="mt-3">
            <Legenda
              itens={[
                { nome: 'Crescimento', cor: SERIES[0] },
                { nome: 'Retração', cor: SERIES[7] },
              ]}
            />
          </div>
        </Cartao>

        <Cartao
          titulo="Estrutura do mercado de trabalho formal"
          descricao={`Composição do pessoal ocupado em ${dadosAno.ano}.`}
          fonte={cempre.fonte[0]}
          nota="A diferença entre pessoal ocupado e assalariado corresponde a sócios e proprietários que trabalham no negócio."
        >
          <dl className="divide-y" style={{ borderColor: 'var(--grade)' }}>
            {[
              {
                rotulo: 'Pessoal ocupado total',
                valor: numero(dadosAno.total.pessoalOcupado),
                detalhe: 'inclui sócios e proprietários',
              },
              {
                rotulo: 'Pessoal assalariado',
                valor: numero(dadosAno.total.pessoalAssalariado),
                detalhe: percentual(
                  ((dadosAno.total.pessoalAssalariado ?? 0) /
                    (dadosAno.total.pessoalOcupado || 1)) *
                    100,
                ) + ' do total',
              },
              {
                rotulo: 'Sócios e proprietários',
                valor: numero(
                  (dadosAno.total.pessoalOcupado ?? 0) - (dadosAno.total.pessoalAssalariado ?? 0),
                ),
                detalhe: 'sem vínculo assalariado',
              },
              {
                rotulo: 'Massa salarial anual',
                valor: reaisCurto((dadosAno.total.salariosMilReais ?? 0) * 1000),
                detalhe: 'salários e outras remunerações',
              },
              {
                rotulo: 'Remuneração média anual',
                valor: reais(
                  ((dadosAno.total.salariosMilReais ?? 0) * 1000) /
                    (dadosAno.total.pessoalAssalariado || 1),
                ),
                detalhe: 'por pessoa assalariada',
              },
              {
                rotulo: 'Ocupados por empresa',
                valor: numero(
                  (dadosAno.total.pessoalOcupado ?? 0) / (dadosAno.total.empresas || 1),
                  1,
                ),
                detalhe: `${numero(dadosAno.total.empresas)} organizações ativas`,
              },
            ].map((linha) => (
              <div key={linha.rotulo} className="flex items-baseline gap-3 py-2.5">
                <dt className="text-sm" style={{ color: 'var(--tinta-2)' }}>
                  {linha.rotulo}
                  <span className="block text-xs" style={{ color: 'var(--tinta-3)' }}>
                    {linha.detalhe}
                  </span>
                </dt>
                <dd className="tabular ml-auto text-lg font-semibold">{linha.valor}</dd>
              </div>
            ))}
          </dl>
        </Cartao>
      </div>
    </Secao>
  );
}
