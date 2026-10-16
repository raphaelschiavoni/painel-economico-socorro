'use client';

import { useState } from 'react';
import { Cartao, Secao } from '@/components/estrutura';
import { GraficoBarras, SERIES } from '@/components/graficos';
import { MapaCircuito } from '@/components/mapa';
import { cempre, meta, pib, populacao } from '@/lib/dados';
import { numero, reais, reaisCurto } from '@/lib/formato';

type Recorte = 'pibPerCapita' | 'pib' | 'empresas' | 'populacao';

const RECORTES: Record<
  Recorte,
  { rotulo: string; descricao: string; formatar: (v: number | null) => string; cor: string }
> = {
  pibPerCapita: {
    rotulo: 'PIB por habitante',
    descricao: `PIB de ${pib.ultimoAno} dividido pela população do Censo 2022.`,
    formatar: (v) => reais(v),
    cor: SERIES[0],
  },
  pib: {
    rotulo: 'PIB total',
    descricao: `Produto Interno Bruto a preços correntes de ${pib.ultimoAno}.`,
    formatar: (v) => reaisCurto(v),
    cor: SERIES[2],
  },
  empresas: {
    rotulo: 'Empresas ativas',
    descricao: `Empresas e organizações ativas em ${cempre.ultimoAno}.`,
    formatar: (v) => numero(v),
    cor: SERIES[6],
  },
  populacao: {
    rotulo: 'População',
    descricao: 'População residente apurada no Censo 2022.',
    formatar: (v) => numero(v),
    cor: SERIES[4],
  },
};

export function SecaoRegional() {
  const [recorte, setRecorte] = useState<Recorte>('pibPerCapita');
  const config = RECORTES[recorte];

  const linhas = meta.comparativo.map((m) => {
    const dadosPib = pib.comparativo.find((x) => x.codigo === m.codigo);
    const dadosCempre = cempre.comparativo.find((x) => x.codigo === m.codigo);
    const dadosPop = populacao.comparativo.find((x) => x.codigo === m.codigo);
    return {
      codigo: m.codigo,
      municipio: m.nome,
      pibPerCapita: dadosPib?.pibPerCapita ?? null,
      pib: dadosPib?.pibReais ?? null,
      empresas: dadosCempre?.empresas ?? null,
      pessoalOcupado: dadosCempre?.pessoalOcupado ?? null,
      populacao: dadosPop?.populacao ?? null,
      areaKm2: dadosPop?.areaKm2 ?? null,
    };
  });

  const barras = linhas
    .map((l) => ({ municipio: l.municipio, valor: l[recorte] }))
    .filter((l) => l.valor != null)
    .sort((a, b) => (b.valor ?? 0) - (a.valor ?? 0));

  const valoresMapa = Object.fromEntries(linhas.map((l) => [l.codigo, l[recorte]]));

  return (
    <Secao
      id="regional"
      numeroSecao="06"
      titulo="Comparativo regional"
      quebraPagina
      resumo={
        `Socorro integra o ${meta.municipio.circuito}, recorte turístico de dez municípios com ` +
        `perfis econômicos bastante distintos — de economias industriais como Jaguariúna a ` +
        `estâncias de pequeno porte. A comparação situa o município no que é possível esperar ` +
        `da região, não de uma média estadual.`
      }
    >
      <div className="sem-impressao flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium" style={{ color: 'var(--tinta-2)' }}>
          Indicador comparado
        </span>
        <div
          role="group"
          aria-label="Indicador comparado"
          className="inline-flex flex-wrap overflow-hidden rounded-lg border"
          style={{ borderColor: 'var(--borda)' }}
        >
          {(Object.keys(RECORTES) as Recorte[]).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRecorte(r)}
              aria-pressed={recorte === r}
              className="foco-visivel px-3 py-1.5 text-xs font-semibold transition-colors"
              style={{
                background: recorte === r ? 'var(--serie-1)' : 'transparent',
                color: recorte === r ? '#ffffff' : 'var(--tinta-2)',
              }}
            >
              {RECORTES[r].rotulo}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Cartao
          titulo={`${config.rotulo} no Circuito das Águas Paulista`}
          descricao={config.descricao}
          fonte={[pib.fonte[0], cempre.fonte[0]]}
          nota="Socorro aparece em cor; os demais municípios ficam em cinza para servir de referência."
          tabela={{
            colunas: ['Município', config.rotulo],
            linhas: barras.map((b) => [b.municipio, b.valor]),
          }}
        >
          <GraficoBarras
            dados={barras}
            chaveCategoria="municipio"
            chaveValor="valor"
            nome={config.rotulo}
            formatar={config.formatar}
            cor={config.cor}
            destacar={meta.municipio.nome}
            larguraRotulo={140}
          />
        </Cartao>

        <Cartao
          titulo="Distribuição territorial"
          descricao={`${config.rotulo} no mapa do circuito.`}
          fonte={[
            { id: 'malha', titulo: 'Malha Territorial Municipal', orgao: 'IBGE', tabela: 'API de Malhas v3', url: 'https://servicodados.ibge.gov.br/api/docs/malhas' },
          ]}
          nota="Escala sequencial de um único matiz: quanto mais escuro, maior o valor."
        >
          <MapaCircuito valores={valoresMapa} rotuloValor={config.rotulo} />
        </Cartao>
      </div>

      <Cartao
        titulo="Quadro comparativo completo"
        descricao="Todos os municípios do circuito nos principais indicadores disponíveis."
        fonte={[pib.fonte[0], cempre.fonte[0], populacao.fonte[1]]}
        nota={`PIB de ${pib.ultimoAno}, empresas e pessoal ocupado de ${cempre.ultimoAno}, população do Censo 2022.`}
      >
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b" style={{ borderColor: 'var(--grade)' }}>
                {['Município', 'População', 'Área (km²)', 'PIB', 'PIB/hab.', 'Empresas', 'Pessoal ocupado'].map(
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
              {linhas
                .slice()
                .sort((a, b) => (b.pibPerCapita ?? 0) - (a.pibPerCapita ?? 0))
                .map((l) => {
                  const foco = l.municipio === meta.municipio.nome;
                  return (
                    <tr
                      key={l.codigo}
                      className="border-b"
                      style={{
                        borderColor: 'var(--grade)',
                        background: foco ? 'var(--superficie-2)' : undefined,
                        fontWeight: foco ? 600 : undefined,
                      }}
                    >
                      <td className="px-3 py-2 whitespace-nowrap">
                        {foco && (
                          <span
                            aria-hidden
                            className="mr-1.5 inline-block h-2 w-2 rounded-full align-middle"
                            style={{ background: 'var(--serie-1)' }}
                          />
                        )}
                        {l.municipio}
                        {foco && <span className="sr-only"> (município deste relatório)</span>}
                      </td>
                      <td className="tabular px-3 py-2 text-right">{numero(l.populacao)}</td>
                      <td className="tabular px-3 py-2 text-right">{numero(l.areaKm2)}</td>
                      <td className="tabular px-3 py-2 text-right">{reaisCurto(l.pib)}</td>
                      <td className="tabular px-3 py-2 text-right">{reais(l.pibPerCapita)}</td>
                      <td className="tabular px-3 py-2 text-right">{numero(l.empresas)}</td>
                      <td className="tabular px-3 py-2 text-right">{numero(l.pessoalOcupado)}</td>
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
