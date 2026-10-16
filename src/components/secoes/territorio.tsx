'use client';

import { Cartao, Indicador, Secao } from '@/components/estrutura';
import { GraficoLinha, SERIES } from '@/components/graficos';
import { meta, populacao, populacaoAtual } from '@/lib/dados';
import { numero, percentual, variacao } from '@/lib/formato';

export function SecaoTerritorio() {
  const serie = populacao.serie.map((p) => ({ ano: p.ano, valor: p.valor }));

  const censo = populacao.censo2022;
  const crescimentoDecada = variacao(
    censo.populacao,
    populacao.serie.find((p) => p.ano === 2010)?.valor,
  );
  const crescimentoAnual =
    crescimentoDecada != null ? (Math.pow(1 + crescimentoDecada.percentual / 100, 1 / 12) - 1) * 100 : null;

  return (
    <Secao
      id="territorio"
      numeroSecao="07"
      titulo="População e território"
      quebraPagina
      resumo={
        `O Censo 2022 apurou ${numero(censo.populacao)} residentes em ${numero(censo.areaKm2, 0)} km², ` +
        `densidade de ${numero(censo.densidade, 1)} habitantes por km². ` +
        `A contagem ficou abaixo das estimativas então vigentes, o que revisou para baixo toda a ` +
        `série anterior e afeta qualquer indicador calculado por habitante.`
      }
    >
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Indicador
          rotulo="População (Censo 2022)"
          valor={numero(censo.populacao)}
          unidade="hab."
          referencia="IBGE · Censo Demográfico 2022"
          variacao={crescimentoDecada}
          comparacao="vs. Censo 2010"
        />
        <Indicador
          rotulo="População estimada"
          valor={numero(populacaoAtual.valor)}
          unidade="hab."
          referencia={`IBGE · estimativa ${populacaoAtual.ano}`}
        />
        <Indicador
          rotulo="Área territorial"
          valor={numero(censo.areaKm2, 0)}
          unidade="km²"
          referencia="IBGE · 2022"
        />
        <Indicador
          rotulo="Densidade demográfica"
          valor={numero(censo.densidade, 1)}
          unidade="hab./km²"
          referencia="IBGE · Censo 2022"
        />
      </div>

      <Cartao
        titulo="Evolução da população residente"
        descricao={`Série de ${serie[0].ano} a ${serie.at(-1)!.ano}, combinando censos e estimativas anuais.`}
        fonte={populacao.fonte}
        nota={
          `Os anos ${populacao.anosInterpolados.join(' e ')} não têm divulgação do IBGE e foram ` +
          `interpolados linearmente entre os pontos vizinhos; 2010 e 2022 são resultados de Censo.`
        }
        tabela={{
          colunas: ['Ano', 'População', 'Origem do dado'],
          linhas: populacao.serie.map((p) => [
            String(p.ano),
            p.valor,
            p.origem === 'censo'
              ? 'Censo Demográfico'
              : p.origem === 'estimativa'
                ? 'Estimativa IBGE'
                : 'Interpolação',
          ]),
        }}
      >
        <GraficoLinha
          dados={serie}
          chaveX="ano"
          series={[{ chave: 'valor', nome: 'População residente', cor: SERIES[0] }]}
          formatar={(v) => numero(v)}
          altura={280}
          marcos={[
            { x: 2010, y: populacao.serie.find((p) => p.ano === 2010)?.valor ?? 0, rotulo: 'Censo 2010' },
            { x: 2022, y: censo.populacao, rotulo: 'Censo 2022' },
          ]}
        />
      </Cartao>

      <Cartao
        titulo="Contexto territorial"
        descricao="Referências de localização e recortes administrativos do município."
      >
        <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
          {[
            { termo: 'Código IBGE', definicao: meta.municipio.codigo },
            { termo: 'Unidade da Federação', definicao: 'São Paulo' },
            { termo: 'Região imediata', definicao: meta.municipio.regiaoImediata },
            { termo: 'Recorte turístico', definicao: meta.municipio.circuito },
            {
              termo: 'Crescimento populacional 2010–2022',
              definicao: `${crescimentoDecada?.rotulo ?? '—'} no período (${percentual(crescimentoAnual)} ao ano)`,
            },
            {
              termo: 'Gentílico',
              definicao: meta.municipio.gentilico,
            },
          ].map((item) => (
            <div key={item.termo} className="border-b pb-2" style={{ borderColor: 'var(--grade)' }}>
              <dt className="text-xs" style={{ color: 'var(--tinta-3)' }}>
                {item.termo}
              </dt>
              <dd className="mt-0.5 text-sm font-medium capitalize">{item.definicao}</dd>
            </div>
          ))}
        </dl>
      </Cartao>
    </Secao>
  );
}
