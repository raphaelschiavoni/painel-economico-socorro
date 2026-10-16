# Painel de Desenvolvimento Econômico — Socorro/SP

Relatório interativo em formato de B.I. com indicadores econômicos do município de
Socorro/SP, montado exclusivamente com dados públicos federais.

## O que o painel mostra

| Seção | Conteúdo | Fonte |
|---|---|---|
| Sumário executivo | 8 indicadores-chave + 6 leituras em texto, todas calculadas a partir dos dados | todas |
| Economia e PIB | PIB 2002–2023, PIB por habitante, composição e evolução do valor adicionado | IBGE SIDRA 5938 |
| Empresas e emprego | Empresas, pessoal ocupado, massa salarial e remuneração média por seção da CNAE | IBGE SIDRA 9418 (CEMPRE) |
| Agropecuária | Valor da produção por cultura, rendimento por hectare, efetivo dos rebanhos | IBGE SIDRA 5457 e 3939 |
| Finanças públicas | Receita e despesa 2019–2024, receita por origem, despesa por função, seis termômetros tributários | Tesouro Nacional / SICONFI |
| Comparativo regional | Socorro frente aos 10 municípios do Circuito das Águas Paulista, com mapa | IBGE |
| População e território | Série populacional 2001–2025, censos, densidade | IBGE SIDRA 6579, 4714 e 1378 |
| Fontes e metodologia | Cobertura de cada base e as decisões de tratamento | — |

Nenhuma fonte exige chave de acesso ou cadastro.

## Como rodar

```bash
npm install
```

```bash
npm run dev
```

O painel abre em `http://localhost:3000`.

## Como atualizar os dados

```bash
npm run dados
```

O script `scripts/fetch-data.mjs` consulta as APIs oficiais e regrava os arquivos
JSON em `src/data/`. Ele é seguro para rodar a qualquer momento:

- Se uma API estiver fora do ar, o snapshot anterior é preservado e o aviso
  aparece na seção "Fontes e metodologia" do próprio painel.
- Nada é digitado à mão. Todo número exibido — inclusive os textos de análise do
  sumário executivo — é derivado dos JSON coletados.

Rode `npm run dados` sempre que o IBGE divulgar uma nova rodada (o PIB municipal
sai por volta de dezembro; o CEMPRE, em outubro; a DCA, a partir de maio).

## Como publicar

```bash
npm run build
```

A saída é um site estático completo na pasta `out/`. Basta copiá-la para qualquer
hospedagem — servidor interno da prefeitura, Netlify, Vercel, EasyPanel ou um
bucket de arquivos. Não há banco de dados nem servidor de aplicação.

## Relatório impresso

O botão **Imprimir / PDF** no topo gera um PDF em A4 com quebras de página por
seção, sem os controles de navegação e filtros. É o formato para levar a reunião.

## Estrutura

```
scripts/
  fontes.mjs        catálogo de municípios, seções da CNAE e fontes
  fetch-data.mjs    coleta e tratamento dos dados públicos
src/
  data/             snapshots JSON gerados pela coleta
  lib/
    dados.ts        tipagem e leitura dos snapshots
    formato.ts      formatação numérica em pt-BR
    analise.ts      indicadores derivados e as leituras em texto
  components/
    estrutura.tsx   seções, cartões, tabela-espelho e filtros
    graficos.tsx    gráficos (Recharts) com a paleta do painel
    mapa.tsx        mapa do circuito a partir da malha do IBGE
    moldura.tsx     cabeçalho, navegação e tema
    secoes/         uma seção do relatório por arquivo
```

## Decisões de tratamento

Todas estão descritas na seção 8 do painel, e implementadas em
`scripts/fetch-data.mjs`:

1. **Anos sem estimativa populacional.** O IBGE não publica estimativa em anos de
   Censo nem publicou para 2023. Usamos o Censo onde existe e interpolamos o
   resto, marcando a origem de cada ponto.
2. **Dupla contagem no agro.** As tabelas do IBGE trazem linhas agregadas e
   desagregadas lado a lado ("Café Total" e "Café Arábica"). Mantemos só o
   agregado — sem isso, o valor total da lavoura ficava 49% inflado.
3. **Mudança do plano de contas do SICONFI.** Os códigos das contas de receita
   mudaram em 2022. Cada tributo carrega os códigos das duas numerações, o que
   permite uma série contínua de 2019 a 2024.
4. **Níveis da árvore de contas.** Receita por origem usa apenas o segundo nível
   e despesa por função apenas as funções, para que os itens não se somem duas
   vezes no mesmo gráfico.

## Acessibilidade e visualização

- Paleta categórica validada para daltonismo (ordem fixa, nunca reciclada).
- Todo gráfico tem uma tabela equivalente com exportação em CSV.
- Variações trazem seta e texto além da cor.
- Tema claro, escuro e "seguir o sistema".
- Sem eixo duplo em nenhum gráfico.
