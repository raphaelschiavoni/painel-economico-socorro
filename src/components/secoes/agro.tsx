'use client';

import { Cartao, Secao } from '@/components/estrutura';
import { GraficoBarras, SERIES } from '@/components/graficos';
import { agro } from '@/lib/dados';
import { numero, participacao, percentual, reaisCurto } from '@/lib/formato';

export function SecaoAgro() {
  const topo = agro.produtos.slice(0, 10).map((p) => ({
    produto: p.produto,
    valor: (p.valorMilReais ?? 0) * 1000,
  }));

  const rebanhos = agro.rebanhos.map((r) => ({ tipo: r.tipo, cabecas: r.cabecas }));

  const principal = agro.produtos[0];

  return (
    <Secao
      id="agro"
      numeroSecao="04"
      titulo="Agropecuária"
      quebraPagina
      resumo={
        `A produção agrícola somou ${reaisCurto(agro.valorTotalMilReais * 1000)} em ${agro.ano}, ` +
        `distribuídos em ${numero(agro.areaTotalHa)} hectares colhidos. ` +
        `${principal.produto} é a principal cultura, com ${percentual(
          participacao(principal.valorMilReais, agro.valorTotalMilReais),
        )} do valor gerado.`
      }
    >
      <div className="grid gap-5 xl:grid-cols-2">
        <Cartao
          titulo={`Valor da produção agrícola por cultura — ${agro.ano}`}
          descricao="Dez principais culturas por valor da produção."
          fonte={agro.fonte[0]}
          nota="Lavouras temporárias e permanentes. Valores nominais do ano de referência."
          tabela={{
            colunas: [
              'Cultura',
              'Área colhida (ha)',
              'Quantidade (t)',
              'Valor da produção (R$)',
              'Participação (%)',
            ],
            linhas: agro.produtos.map((p) => [
              p.produto,
              p.areaColhidaHa,
              p.quantidadeToneladas,
              (p.valorMilReais ?? 0) * 1000,
              numero(participacao(p.valorMilReais, agro.valorTotalMilReais), 1),
            ]),
          }}
        >
          <GraficoBarras
            dados={topo}
            chaveCategoria="produto"
            chaveValor="valor"
            nome="Valor da produção"
            formatar={(v) => reaisCurto(v)}
            cor={SERIES[3]}
            larguraRotulo={130}
          />
        </Cartao>

        <Cartao
          titulo={`Efetivo dos rebanhos — ${agro.anoRebanho}`}
          descricao="Cabeças por tipo de rebanho em 31 de dezembro."
          fonte={agro.fonte[1]}
          nota="Rebanhos com subdivisões (matrizes, galinhas poedeiras) aparecem apenas no total, para não haver dupla contagem."
          tabela={{
            colunas: ['Rebanho', 'Cabeças'],
            linhas: rebanhos.map((r) => [r.tipo, r.cabecas]),
          }}
        >
          <GraficoBarras
            dados={rebanhos}
            chaveCategoria="tipo"
            chaveValor="cabecas"
            nome="Cabeças"
            formatar={(v) => numero(v)}
            cor={SERIES[2]}
            larguraRotulo={110}
          />
        </Cartao>
      </div>

      <Cartao
        titulo="Produtividade e ocupação do solo"
        descricao={`Área colhida e rendimento das principais culturas em ${agro.ano}.`}
        fonte={agro.fonte[0]}
        nota="O rendimento é calculado como quantidade produzida dividida pela área colhida."
      >
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--grade)' }}>
                {['Cultura', 'Área colhida', 'Produção', 'Rendimento', 'Valor', 'Valor/ha'].map(
                  (c, i) => (
                    <th
                      key={c}
                      scope="col"
                      className={`px-3 py-2 text-xs font-semibold whitespace-nowrap ${i === 0 ? 'text-left' : 'text-right'}`}
                      style={{ color: 'var(--tinta-2)' }}
                    >
                      {c}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {agro.produtos.slice(0, 12).map((p) => {
                const rendimento =
                  p.quantidadeToneladas && p.areaColhidaHa
                    ? p.quantidadeToneladas / p.areaColhidaHa
                    : null;
                const valorHa =
                  p.valorMilReais && p.areaColhidaHa
                    ? (p.valorMilReais * 1000) / p.areaColhidaHa
                    : null;
                return (
                  <tr key={p.produto} className="border-b" style={{ borderColor: 'var(--grade)' }}>
                    <td className="px-3 py-2">{p.produto}</td>
                    <td className="tabular px-3 py-2 text-right">
                      {numero(p.areaColhidaHa)} ha
                    </td>
                    <td className="tabular px-3 py-2 text-right">
                      {numero(p.quantidadeToneladas)} t
                    </td>
                    <td className="tabular px-3 py-2 text-right">
                      {numero(rendimento, 1)} t/ha
                    </td>
                    <td className="tabular px-3 py-2 text-right">
                      {reaisCurto((p.valorMilReais ?? 0) * 1000)}
                    </td>
                    <td className="tabular px-3 py-2 text-right font-semibold">
                      {reaisCurto(valorHa)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Cartao>
    </Secao>
  );
}
