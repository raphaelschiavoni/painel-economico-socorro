'use client';

import { Cartao, Secao } from '@/components/estrutura';
import { GraficoBarras, SERIES } from '@/components/graficos';
import { agro, lavouraMunicipal, municipal, temDadoMunicipal, type ProdutoAgro } from '@/lib/dados';
import { numero, participacao, percentual, reais, reaisCurto, SEM_DADO } from '@/lib/formato';

/** Receita bruta por hectare colhido. Não é lucro: não desconta custo de produção. */
const valorPorHectare = (p: ProdutoAgro) =>
  p.valorMilReais && p.areaColhidaHa ? (p.valorMilReais * 1000) / p.areaColhidaHa : null;

const TOPO = 10;

export function SecaoAgro() {
  const principal = agro.produtos[0];

  const porValor = agro.produtos
    .filter((p) => p.valorMilReais)
    .slice(0, TOPO)
    .map((p) => ({ produto: p.produto, valor: (p.valorMilReais ?? 0) * 1000 }));

  const porRentabilidade = [...agro.produtos]
    .map((p) => ({ produto: p.produto, valor: valorPorHectare(p) }))
    .filter((p): p is { produto: string; valor: number } => p.valor != null)
    .sort((a, b) => b.valor - a.valor)
    .slice(0, TOPO);

  const porArea = [...agro.produtos]
    .filter((p) => p.areaPlantadaHa)
    .sort((a, b) => (b.areaPlantadaHa ?? 0) - (a.areaPlantadaHa ?? 0))
    .slice(0, TOPO)
    .map((p) => ({ produto: p.produto, valor: p.areaPlantadaHa }));

  const rebanhos = agro.rebanhos.map((r) => ({ tipo: r.tipo, cabecas: r.cabecas }));

  const campeaRentabilidade = porRentabilidade[0];
  const congeladas = agro.produtos.filter((p) => p.paradoDesde);

  return (
    <Secao
      id="agro"
      numeroSecao="04"
      titulo="Agropecuária"
      quebraPagina
      resumo={
        `A produção agrícola somou ${reaisCurto(agro.valorTotalMilReais * 1000)} em ${agro.ano}, ` +
        `em ${numero(agro.areaPlantadaTotalHa)} hectares plantados. ${principal.produto} é a ` +
        `principal cultura em valor, com ${percentual(
          participacao(principal.valorMilReais, agro.valorTotalMilReais),
        )} do total — mas quem rende mais por hectare é ${campeaRentabilidade.produto.toLowerCase()}, ` +
        `com ${reais(campeaRentabilidade.valor)} por hectare colhido.`
      }
    >
      <div className="grid gap-5 xl:grid-cols-2">
        <Cartao
          titulo={`Valor da produção por cultura — ${agro.ano}`}
          descricao={`As ${TOPO} culturas que mais geram receita no município.`}
          fonte={agro.fonte[0]}
          nota="Lavouras temporárias e permanentes, em valores nominais do ano. A PAM é estimativa de painel técnico, não levantamento campo a campo — veja o confronto de fontes logo abaixo."
          tabela={{
            colunas: [
              'Cultura',
              'Área plantada (ha)',
              'Área colhida (ha)',
              'Quantidade (t)',
              'Rendimento (t/ha)',
              'Valor da produção (R$)',
              'Valor por hectare (R$)',
              'Participação (%)',
            ],
            linhas: agro.produtos.map((p) => [
              p.produto,
              p.areaPlantadaHa,
              p.areaColhidaHa,
              p.quantidadeToneladas,
              p.quantidadeToneladas && p.areaColhidaHa
                ? numero(p.quantidadeToneladas / p.areaColhidaHa, 1)
                : null,
              (p.valorMilReais ?? 0) * 1000,
              valorPorHectare(p) == null ? null : Math.round(valorPorHectare(p)!),
              numero(participacao(p.valorMilReais, agro.valorTotalMilReais), 1),
            ]),
          }}
        >
          <GraficoBarras
            dados={porValor}
            chaveCategoria="produto"
            chaveValor="valor"
            nome="Valor da produção"
            formatar={(v) => reaisCurto(v)}
            cor={SERIES[3]}
            larguraRotulo={130}
          />
        </Cartao>

        <Cartao
          titulo={`Valor da produção por hectare — ${agro.ano}`}
          descricao={`As ${TOPO} culturas que mais rendem por área colhida.`}
          fonte={agro.fonte[0]}
          nota="É receita bruta por hectare, não lucro: não desconta custo de produção, mão de obra nem investimento. Serve para comparar o potencial de cada cultura, não a margem do produtor."
          tabela={{
            colunas: ['Cultura', 'Valor por hectare (R$)', 'Área colhida (ha)', 'Valor total (R$)'],
            linhas: [...agro.produtos]
              .filter((p) => valorPorHectare(p) != null)
              .sort((a, b) => (valorPorHectare(b) ?? 0) - (valorPorHectare(a) ?? 0))
              .map((p) => [
                p.produto,
                Math.round(valorPorHectare(p)!),
                p.areaColhidaHa,
                (p.valorMilReais ?? 0) * 1000,
              ]),
          }}
        >
          <GraficoBarras
            dados={porRentabilidade}
            chaveCategoria="produto"
            chaveValor="valor"
            nome="Valor por hectare"
            formatar={(v) => reaisCurto(v)}
            cor={SERIES[0]}
            larguraRotulo={130}
          />
        </Cartao>

        <Cartao
          titulo={`Área plantada por cultura — ${agro.ano}`}
          descricao={`As ${TOPO} culturas que mais ocupam terra no município.`}
          fonte={agro.fonte[0]}
          nota={`Área plantada ou destinada à colheita, somando ${numero(agro.areaPlantadaTotalHa)} hectares no município.`}
          tabela={{
            colunas: ['Cultura', 'Área plantada (ha)', 'Área colhida (ha)', 'Participação (%)'],
            linhas: [...agro.produtos]
              .filter((p) => p.areaPlantadaHa)
              .sort((a, b) => (b.areaPlantadaHa ?? 0) - (a.areaPlantadaHa ?? 0))
              .map((p) => [
                p.produto,
                p.areaPlantadaHa,
                p.areaColhidaHa,
                numero(participacao(p.areaPlantadaHa, agro.areaPlantadaTotalHa), 1),
              ]),
          }}
        >
          <GraficoBarras
            dados={porArea}
            chaveCategoria="produto"
            chaveValor="valor"
            nome="Área plantada"
            formatar={(v) => `${numero(v)} ha`}
            cor={SERIES[6]}
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

      <ConfrontoDeFontes congeladas={congeladas.length} />
    </Secao>
  );
}

/* ─────────────────────────────────── confronto entre as três fontes */

function ConfrontoDeFontes({ congeladas }: { congeladas: number }) {
  const linhas = agro.produtos.map((p) => {
    const censo = p.censo2017?.areaColhidaHa ?? null;
    const local = lavouraMunicipal(p.produto);
    const divergencia =
      censo && p.areaColhidaHa ? ((p.areaColhidaHa - censo) / censo) * 100 : null;
    return { p, censo, local, divergencia };
  });

  return (
    <Cartao
      titulo="Confronto de fontes"
      descricao={`Estimativa anual do IBGE, contraprova do Censo Agropecuário ${agro.censo2017.ano} e levantamento do município, lado a lado.`}
      fonte={[agro.fonte[0], agro.fonte[2]]}
      nota={
        `A estimativa anual e o Censo medem coisas diferentes: o Censo percorreu estabelecimento ` +
        `por estabelecimento em ${agro.censo2017.ano}, enquanto a PAM é estimada por painel técnico todo ano. ` +
        `Divergência grande não prova erro, mas indica onde vale conferir em campo. ` +
        (congeladas > 0
          ? `Hoje ${congeladas} culturas estão com a área repetida há ${agro.limiteAnosParados} anos ou mais.`
          : '')
      }
      tabela={{
        colunas: [
          'Cultura',
          `PAM ${agro.ano} (ha)`,
          `Censo ${agro.censo2017.ano} (ha)`,
          'Divergência (%)',
          'Anos sem mudança',
          'Levantamento municipal (ha)',
        ],
        linhas: linhas.map((l) => [
          l.p.produto,
          l.p.areaColhidaHa,
          l.censo,
          l.divergencia == null ? null : numero(l.divergencia, 0),
          l.p.anosParados,
          l.local?.areaColhidaHa ?? null,
        ]),
      }}
    >
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: 'var(--grade)' }}>
              {[
                'Cultura',
                `IBGE · estimativa ${agro.ano}`,
                `IBGE · Censo ${agro.censo2017.ano}`,
                'Divergência',
                'Situação da estimativa',
                'Município',
              ].map((c, i) => (
                <th
                  key={c}
                  scope="col"
                  className={`px-3 py-2 text-xs font-semibold whitespace-nowrap ${i === 0 ? 'text-left' : 'text-right'}`}
                  style={{ color: 'var(--tinta-2)' }}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {linhas.map(({ p, censo, local, divergencia }) => (
              <tr key={p.produto} className="border-b" style={{ borderColor: 'var(--grade)' }}>
                <td className="px-3 py-2 whitespace-nowrap">{p.produto}</td>
                <td className="tabular px-3 py-2 text-right">{numero(p.areaColhidaHa)}</td>
                <td className="tabular px-3 py-2 text-right" style={{ color: 'var(--tinta-2)' }}>
                  {censo == null ? SEM_DADO : numero(censo)}
                </td>
                <td className="tabular px-3 py-2 text-right">
                  {divergencia == null ? (
                    SEM_DADO
                  ) : (
                    <span
                      style={{
                        color: Math.abs(divergencia) >= 50 ? 'var(--critico)' : 'var(--tinta-2)',
                        fontWeight: Math.abs(divergencia) >= 50 ? 600 : 400,
                      }}
                    >
                      {divergencia > 0 ? '+' : ''}
                      {numero(divergencia, 0)}%
                      {Math.abs(divergencia) >= 50 && (
                        <span className="sr-only"> — divergência alta, vale conferir</span>
                      )}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-right whitespace-nowrap">
                  {p.paradoDesde ? (
                    <span
                      className="inline-flex items-center gap-1 text-xs font-semibold"
                      style={{ color: 'var(--critico)' }}
                    >
                      <span aria-hidden>!</span>
                      parada desde {p.paradoDesde}
                    </span>
                  ) : (
                    <span className="text-xs" style={{ color: 'var(--tinta-3)' }}>
                      atualizada
                    </span>
                  )}
                </td>
                <td className="tabular px-3 py-2 text-right">
                  {local?.areaColhidaHa != null ? (
                    <span className="font-semibold" title={`${local.fonte} · ${local.apuradoEm}`}>
                      {numero(local.areaColhidaHa)}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--tinta-3)' }}>{SEM_DADO}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {!temDadoMunicipal && (
        <p className="mt-3 text-xs leading-relaxed" style={{ color: 'var(--tinta-3)' }}>
          A coluna <strong>Município</strong> está vazia porque ainda não há levantamento próprio
          registrado. Para preencher, edite <code>src/data/municipal.json</code> — o arquivo tem as
          instruções dentro. O número do município aparece ao lado do oficial, nunca no lugar dele.
        </p>
      )}
      {temDadoMunicipal && municipal.atualizadoEm && (
        <p className="mt-3 text-xs" style={{ color: 'var(--tinta-3)' }}>
          Levantamento municipal atualizado em {municipal.atualizadoEm}
          {municipal.responsavel ? ` por ${municipal.responsavel}` : ''}.
        </p>
      )}
    </Cartao>
  );
}
