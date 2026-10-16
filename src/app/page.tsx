import { Cabecalho, Navegacao } from '@/components/moldura';
import { SecaoAgro } from '@/components/secoes/agro';
import { SecaoEconomia } from '@/components/secoes/economia';
import { SecaoEmpresas } from '@/components/secoes/empresas';
import { SecaoFinancas } from '@/components/secoes/financas';
import { SecaoFontes } from '@/components/secoes/fontes';
import { SecaoRegional } from '@/components/secoes/regional';
import { SecaoSumario } from '@/components/secoes/sumario';
import { SecaoTerritorio } from '@/components/secoes/territorio';
import { meta, pib, populacao } from '@/lib/dados';
import { dataExtensa } from '@/lib/formato';

export default function Pagina() {
  return (
    <>
      <a
        href="#sumario"
        className="foco-visivel sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50 focus:rounded-md focus:px-3 focus:py-2"
        style={{ background: 'var(--superficie)' }}
      >
        Pular para o conteúdo
      </a>

      <Cabecalho />

      <div className="mx-auto flex max-w-[1400px] gap-8 px-4 py-8 sm:px-6">
        <aside className="sem-impressao hidden w-56 shrink-0 lg:block">
          <div className="sticky top-24">
            <Navegacao />
          </div>
        </aside>

        <main className="min-w-0 flex-1 space-y-12">
          <Capa />
          <SecaoSumario />
          <SecaoEconomia />
          <SecaoEmpresas />
          <SecaoAgro />
          <SecaoFinancas />
          <SecaoRegional />
          <SecaoTerritorio />
          <SecaoFontes />
        </main>
      </div>
    </>
  );
}

function Capa() {
  return (
    <section className="border-b pb-8" style={{ borderColor: 'var(--grade)' }}>
      <p
        className="text-xs font-semibold tracking-widest uppercase"
        style={{ color: 'var(--serie-1)' }}
      >
        Secretaria de Desenvolvimento Econômico
      </p>
      <h1 className="mt-2 text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">
        Panorama econômico de {meta.municipio.nome}
      </h1>
      <p className="mt-3 max-w-3xl leading-relaxed" style={{ color: 'var(--tinta-2)' }}>
        Relatório de indicadores construído exclusivamente com estatísticas públicas do IBGE e do
        Tesouro Nacional. Reúne, em um só lugar, população, produto interno bruto, estrutura
        empresarial, mercado de trabalho formal, produção agropecuária, execução orçamentária e
        posição do município dentro do {meta.municipio.circuito}.
      </p>
      <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-4">
        {[
          { termo: 'Município', definicao: `${meta.municipio.nome}/${meta.municipio.uf}` },
          { termo: 'Código IBGE', definicao: meta.municipio.codigo },
          { termo: 'População', definicao: `${populacao.censo2022.populacao.toLocaleString('pt-BR')} hab. (Censo 2022)` },
          { termo: 'PIB mais recente', definicao: String(pib.ultimoAno) },
          { termo: 'Coleta dos dados', definicao: dataExtensa(meta.atualizadoEm) },
        ].map((item) => (
          <div key={item.termo}>
            <dt className="text-xs" style={{ color: 'var(--tinta-3)' }}>
              {item.termo}
            </dt>
            <dd className="tabular mt-0.5 text-sm font-semibold">{item.definicao}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
