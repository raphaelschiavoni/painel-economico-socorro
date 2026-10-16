'use client';

import { Secao } from '@/components/estrutura';
import { agro, cempre, financas, meta, pib, populacao } from '@/lib/dados';
import { dataExtensa } from '@/lib/formato';

const COBERTURA: Record<string, string> = {
  'ibge-6579': `Série anual de ${populacao.serie[0].ano} a ${populacao.serie.at(-1)!.ano}`,
  'ibge-4714': 'Censo Demográfico 2022',
  'ibge-5938': `Série anual de ${pib.serie[0].ano} a ${pib.ultimoAno} (abertura setorial até ${pib.ultimoAnoSetorial})`,
  'ibge-9418': `Exercícios ${cempre.anos.join(', ')}`,
  'ibge-5457': `Safra ${agro.ano}`,
  'ibge-3939': `Efetivo em ${agro.anoRebanho}`,
  'siconfi-dca': `Exercícios ${financas.anos[0].ano} a ${financas.ultimoAno}`,
  'ibge-malhas': 'Malha vigente, qualidade intermediária',
};

const NOTAS = [
  {
    titulo: 'Anos de referência não coincidem',
    texto:
      'Cada pesquisa tem seu próprio calendário de divulgação. O PIB municipal sai com cerca de ' +
      'dois anos de defasagem, o CEMPRE com um ano, e a execução orçamentária no ano seguinte ao ' +
      'encerramento. Todo indicador do painel exibe o ano a que se refere; comparar dois números ' +
      'de anos diferentes exige atenção.',
  },
  {
    titulo: 'Valores nominais',
    texto:
      'PIB, receitas, despesas e valor da produção agrícola estão a preços correntes do ano de ' +
      'referência, sem deflacionamento. Parte da variação observada entre anos corresponde à ' +
      'inflação do período, não a crescimento real.',
  },
  {
    titulo: 'População nos anos sem estimativa',
    texto:
      'O IBGE não divulga estimativa populacional em anos de Censo nem divulgou para 2023. ' +
      'O painel usa o resultado do Censo onde existe e interpola linearmente os anos restantes, ' +
      'marcando cada ponto pela origem. Indicadores por habitante nesses anos são aproximados.',
  },
  {
    titulo: 'Omissões por sigilo estatístico',
    texto:
      'O IBGE suprime valores quando o número de informantes é pequeno o bastante para permitir ' +
      'identificação. Setores nessa situação aparecem sem dado, e não com valor zero.',
  },
  {
    titulo: 'Dupla contagem removida',
    texto:
      'As tabelas de produção agrícola e de rebanhos publicam linhas agregadas e desagregadas ' +
      'lado a lado. O painel mantém apenas o nível agregado, para que os totais não fiquem ' +
      'inflados.',
  },
  {
    titulo: 'Atualização',
    texto:
      'Os dados são coletados diretamente das APIs oficiais pelo comando "npm run dados" e ' +
      'gravados como arquivos JSON no projeto. O painel não faz chamadas externas em produção, ' +
      'o que garante que ele continue funcionando mesmo com as APIs indisponíveis.',
  },
];

export function SecaoFontes() {
  return (
    <Secao
      id="fontes"
      numeroSecao="08"
      titulo="Fontes e metodologia"
      quebraPagina
      resumo="Todos os números deste relatório vêm de bases públicas federais, acessadas por API aberta e sem tratamento além do descrito abaixo."
    >
      <div className="cartao overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b" style={{ borderColor: 'var(--grade)' }}>
              {['Fonte', 'Órgão', 'Referência', 'Cobertura'].map((c) => (
                <th
                  key={c}
                  scope="col"
                  className="px-4 py-3 text-left text-xs font-semibold"
                  style={{ color: 'var(--tinta-2)' }}
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {meta.fontes.map((f) => (
              <tr key={f.id} className="border-b last:border-0" style={{ borderColor: 'var(--grade)' }}>
                <td className="px-4 py-3">
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noreferrer"
                    className="foco-visivel font-medium underline underline-offset-2"
                  >
                    {f.titulo}
                  </a>
                </td>
                <td className="px-4 py-3" style={{ color: 'var(--tinta-2)' }}>
                  {f.orgao}
                </td>
                <td className="px-4 py-3" style={{ color: 'var(--tinta-2)' }}>
                  {f.tabela}
                </td>
                <td className="px-4 py-3" style={{ color: 'var(--tinta-3)' }}>
                  {COBERTURA[f.id] ?? '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {NOTAS.map((n) => (
          <article key={n.titulo} className="cartao p-4">
            <h3 className="text-sm font-semibold">{n.titulo}</h3>
            <p className="mt-1.5 text-sm leading-relaxed" style={{ color: 'var(--tinta-2)' }}>
              {n.texto}
            </p>
          </article>
        ))}
      </div>

      {meta.avisos.length > 0 && (
        <div
          className="cartao p-4"
          style={{ borderColor: 'var(--atencao)' }}
          role="status"
        >
          <h3 className="text-sm font-semibold">Avisos da última coleta</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm" style={{ color: 'var(--tinta-2)' }}>
            {meta.avisos.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs" style={{ color: 'var(--tinta-3)' }}>
        Última coleta: {dataExtensa(meta.atualizadoEm)}. Painel produzido para a Secretaria de
        Desenvolvimento Econômico de {meta.municipio.nome}/{meta.municipio.uf}.
      </p>
    </Secao>
  );
}
