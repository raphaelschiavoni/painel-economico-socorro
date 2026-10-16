/**
 * Coleta os dados públicos do painel e grava snapshots JSON em src/data.
 * Rode com: npm run dados
 *
 * Nenhuma fonte exige chave de acesso. Se uma delas cair, o script avisa e
 * mantém o snapshot anterior em disco — o painel nunca fica sem dado.
 */
import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MUNICIPIO,
  COMPARATIVO,
  SECOES_CNAE,
  MACROSSETOR,
  FONTES,
  EQUIVALENCIA_CENSO,
  LIMITE_ANOS_PARADOS,
} from './fontes.mjs';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DESTINO = path.join(RAIZ, 'src', 'data');

const avisos = [];

async function buscar(url, { tentativas = 3 } = {}) {
  let ultimoErro;
  for (let i = 0; i < tentativas; i++) {
    try {
      const resposta = await fetch(url, {
        headers: { 'User-Agent': 'painel-socorro-desenvolvimento-economico' },
        signal: AbortSignal.timeout(60_000),
      });
      if (!resposta.ok) throw new Error(`HTTP ${resposta.status}`);
      return await resposta.json();
    } catch (erro) {
      ultimoErro = erro;
      await new Promise((r) => setTimeout(r, 1200 * (i + 1)));
    }
  }
  throw new Error(`${url} -> ${ultimoErro.message}`);
}

/** SIDRA devolve a primeira linha como dicionário de rótulos; descartamos. */
async function sidra(caminho) {
  const dados = await buscar(`https://apisidra.ibge.gov.br/values${caminho}`);
  if (!Array.isArray(dados)) {
    throw new Error(`resposta inesperada: ${JSON.stringify(dados).slice(0, 200)}`);
  }
  return dados.slice(1);
}

/** "..." , "-" e "X" sao marcadores de ausencia de dado no SIDRA. */
const num = (v) => {
  const n = Number(String(v).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
};

async function gravar(nome, conteudo) {
  await writeFile(path.join(DESTINO, nome), JSON.stringify(conteudo, null, 2) + '\n', 'utf8');
  console.log(`  OK  ${nome}`);
}

/** Executa um coletor; se falhar, preserva o snapshot anterior e registra o aviso. */
async function etapa(rotulo, arquivo, coletor) {
  console.log(`> ${rotulo}`);
  try {
    const dados = await coletor();
    await gravar(arquivo, dados);
    return dados;
  } catch (erro) {
    const caminho = path.join(DESTINO, arquivo);
    const temAnterior = existsSync(caminho);
    avisos.push(
      `${rotulo}: ${erro.message}${temAnterior ? ' (mantido snapshot anterior)' : ' (SEM DADOS)'}`,
    );
    console.log(`  !!  falhou: ${erro.message}`);
    return temAnterior ? JSON.parse(await readFile(caminho, 'utf8')) : null;
  }
}

const CODIGOS_COMPARATIVO = COMPARATIVO.map((m) => m.codigo).join(',');

// --------------------------------------------------------------- populacao

async function coletarPopulacao() {
  const estimativas = await sidra(`/t/6579/n6/${MUNICIPIO.codigo}/v/9324/p/all`);
  const censo = await sidra(`/t/4714/n6/${MUNICIPIO.codigo}/v/all/p/last%201`);
  const censo2010 = await sidra(`/t/1378/n6/${MUNICIPIO.codigo}/v/93/p/2010/c1/0/c2/0/c455/0`);
  const censoComparativo = await sidra(`/t/4714/n6/${CODIGOS_COMPARATIVO}/v/93,6318,614/p/last%201`);

  const porVariavel = (linhas, codigo) => num(linhas.find((l) => l.D2C === codigo)?.V);

  // O IBGE nao divulga estimativa nos anos de Censo (2010, 2022) nem em 2023.
  // Ancoramos esses anos no Censo e interpolamos o que sobrar, sempre rotulado.
  const pontos = new Map();
  for (const l of estimativas) {
    const valor = num(l.V);
    if (valor !== null) pontos.set(Number(l.D3N), { valor, origem: 'estimativa' });
  }
  const pop2010 = num(censo2010[0]?.V);
  if (pop2010) pontos.set(2010, { valor: pop2010, origem: 'censo' });
  const pop2022 = porVariavel(censo, '93');
  if (pop2022) pontos.set(2022, { valor: pop2022, origem: 'censo' });

  const anosConhecidos = [...pontos.keys()].sort((a, b) => a - b);
  const serie = [];
  for (let ano = anosConhecidos[0]; ano <= anosConhecidos.at(-1); ano++) {
    if (pontos.has(ano)) {
      serie.push({ ano, ...pontos.get(ano) });
      continue;
    }
    const anterior = anosConhecidos.filter((a) => a < ano).at(-1);
    const posterior = anosConhecidos.find((a) => a > ano);
    const a = pontos.get(anterior).valor;
    const b = pontos.get(posterior).valor;
    const peso = (ano - anterior) / (posterior - anterior);
    serie.push({ ano, valor: Math.round(a + (b - a) * peso), origem: 'interpolada' });
  }

  return {
    fonte: [FONTES.ibgePop, FONTES.ibgeCenso],
    serie,
    anosInterpolados: serie.filter((s) => s.origem === 'interpolada').map((s) => s.ano),
    censo2022: {
      ano: Number(censo[0]?.D3N) || 2022,
      populacao: porVariavel(censo, '93'),
      areaKm2: porVariavel(censo, '6318'),
      densidade: porVariavel(censo, '614'),
    },
    comparativo: COMPARATIVO.map((m) => {
      const linhas = censoComparativo.filter((l) => l.D1C === m.codigo);
      return {
        ...m,
        populacao: porVariavel(linhas, '93'),
        areaKm2: porVariavel(linhas, '6318'),
        densidade: porVariavel(linhas, '614'),
      };
    }),
  };
}

// --------------------------------------------------------------------- PIB

const VARIAVEIS_PIB = {
  37: 'pibMilReais',
  543: 'impostos',
  498: 'vabTotal',
  513: 'agropecuaria',
  517: 'industria',
  6575: 'servicos',
  525: 'administracaoPublica',
};

async function coletarPib(populacao) {
  const codigos = Object.keys(VARIAVEIS_PIB).join(',');
  const municipio = await sidra(`/t/5938/n6/${MUNICIPIO.codigo}/v/${codigos}/p/all`);
  const regiao = await sidra(`/t/5938/n6/${CODIGOS_COMPARATIVO}/v/37/p/last%201`);
  const estado = await sidra('/t/5938/n3/35/v/37/p/all');

  const porAno = new Map();
  for (const linha of municipio) {
    const ano = Number(linha.D3N);
    if (!porAno.has(ano)) porAno.set(ano, { ano });
    porAno.get(ano)[VARIAVEIS_PIB[linha.D2C]] = num(linha.V);
  }

  const habitantes = new Map(populacao.serie.map((p) => [p.ano, p]));
  const pibEstado = new Map(estado.map((l) => [Number(l.D3N), num(l.V)]));

  const serie = [...porAno.values()]
    .sort((a, b) => a.ano - b.ano)
    .map((a) => {
      const pop = habitantes.get(a.ano);
      const pibEst = pibEstado.get(a.ano);
      return {
        ...a,
        populacao: pop?.valor ?? null,
        populacaoInterpolada: pop?.origem === 'interpolada',
        // Os valores do SIDRA vem em mil reais.
        pibReais: a.pibMilReais == null ? null : a.pibMilReais * 1000,
        pibPerCapita: a.pibMilReais && pop ? (a.pibMilReais * 1000) / pop.valor : null,
        participacaoEstado: a.pibMilReais && pibEst ? (a.pibMilReais / pibEst) * 100 : null,
      };
    });

  const ultimo = [...serie].reverse().find((a) => a.pibMilReais);
  const ultimoSetorial = [...serie].reverse().find((a) => a.vabTotal);

  return {
    fonte: [FONTES.ibgePib],
    serie,
    ultimoAno: ultimo?.ano ?? null,
    ultimoAnoSetorial: ultimoSetorial?.ano ?? null,
    comparativo: COMPARATIVO.map((m) => {
      const linha = regiao.find((l) => l.D1C === m.codigo);
      const pibMil = num(linha?.V);
      const pop = populacao.comparativo.find((c) => c.codigo === m.codigo)?.populacao;
      return {
        ...m,
        ano: Number(linha?.D3N) || null,
        pibReais: pibMil == null ? null : pibMil * 1000,
        pibPerCapita: pibMil && pop ? (pibMil * 1000) / pop : null,
      };
    }),
  };
}

// ------------------------------------------------------- empresas e emprego

async function coletarCempre() {
  const secoes = SECOES_CNAE.map((s) => s.id).join(',');
  const municipio = await sidra(
    `/t/9418/n6/${MUNICIPIO.codigo}/v/2585,707,708,662/p/all/c12762/117897,${secoes}`,
  );
  const regiao = await sidra(
    `/t/9418/n6/${CODIGOS_COMPARATIVO}/v/2585,707,662/p/last%201/c12762/117897`,
  );

  const VAR = { 2585: 'empresas', 707: 'pessoalOcupado', 708: 'pessoalAssalariado', 662: 'salarios' };
  const chave = (ano, cat) => `${ano}|${cat}`;
  const mapa = new Map();

  for (const linha of municipio) {
    const k = chave(linha.D3N, linha.D4C);
    if (!mapa.has(k)) mapa.set(k, { ano: Number(linha.D3N) });
    mapa.get(k)[VAR[linha.D2C]] = num(linha.V);
  }

  const anos = [...new Set([...mapa.values()].map((v) => v.ano))].sort((a, b) => a - b);

  const porAno = anos.map((ano) => {
    const total = mapa.get(chave(String(ano), '117897')) ?? {};
    const setores = SECOES_CNAE.map((s) => {
      const d = mapa.get(chave(String(ano), s.id)) ?? {};
      return {
        letra: s.letra,
        nome: s.nome,
        completo: s.completo,
        macrossetor: MACROSSETOR[s.letra],
        empresas: d.empresas ?? null,
        pessoalOcupado: d.pessoalOcupado ?? null,
        pessoalAssalariado: d.pessoalAssalariado ?? null,
        salariosMilReais: d.salarios ?? null,
      };
    });
    return {
      ano,
      total: {
        empresas: total.empresas ?? null,
        pessoalOcupado: total.pessoalOcupado ?? null,
        pessoalAssalariado: total.pessoalAssalariado ?? null,
        salariosMilReais: total.salarios ?? null,
      },
      setores,
    };
  });

  return {
    fonte: [FONTES.ibgeCempre],
    anos,
    ultimoAno: anos.at(-1) ?? null,
    porAno,
    comparativo: COMPARATIVO.map((m) => {
      const linhas = regiao.filter((l) => l.D1C === m.codigo);
      const pega = (cod) => num(linhas.find((l) => l.D2C === cod)?.V);
      return {
        ...m,
        ano: Number(linhas[0]?.D3N) || null,
        empresas: pega('2585'),
        pessoalOcupado: pega('707'),
        salariosMilReais: pega('662'),
      };
    }),
  };
}

// -------------------------------------------------------------------- agro

/**
 * O IBGE publica linhas agregadas e desagregadas lado a lado ("Café (em grão) Total"
 * e "Café (em grão) Arábica"; "Galináceos - total" e "Galináceos - galinhas").
 * Somar as duas infla o resultado, então mantemos só o agregado.
 */
function semDuplaContagem(itens, rotulo) {
  const agregados = itens
    .map(rotulo)
    .filter((n) => /(\bTotal|-\s*total)$/i.test(n))
    .map((n) => n.replace(/(\s*-\s*total|\s+Total)$/i, '').trim());

  return itens.filter((item) => {
    const nome = rotulo(item);
    if (/(\bTotal|-\s*total)$/i.test(nome)) return true;
    return !agregados.some((base) => nome.startsWith(base) && nome !== base);
  });
}

/**
 * Há quantos anos seguidos a área colhida não muda. A PAM é estimativa de
 * painel técnico: quando não entra informação nova do município, ela repete o
 * número do ano anterior. Série parada por muitos anos é o sintoma disso.
 */
function anosParados(serieDoProduto, anoReferencia) {
  const area = (ano) => serieDoProduto[String(ano)];
  const referencia = area(anoReferencia);
  if (referencia == null) return null;

  let anos = 0;
  for (let ano = anoReferencia; ano >= anoReferencia - 40; ano--) {
    if (area(ano) === referencia) anos++;
    else break;
  }
  return { anos, desde: anoReferencia - anos + 1 };
}

/** Censo Agropecuário 2017: levantamento real, serve de contraprova da PAM. */
async function coletarCensoAgro() {
  const temporarias = await sidra(
    `/t/6957/n6/${MUNICIPIO.codigo}/v/10089,10087/p/2017/c226/all`,
  );
  const permanentes = await sidra(`/t/6966/n6/${MUNICIPIO.codigo}/v/10078/p/2017/c227/all`);

  const porProduto = new Map();
  const registrar = (nome, campo, valor) => {
    if (valor == null) return;
    if (!porProduto.has(nome)) porProduto.set(nome, { produto: nome });
    porProduto.get(nome)[campo] = valor;
  };

  for (const linha of temporarias) {
    if (linha.D4C === '0') continue;
    registrar(linha.D4N, linha.D2C === '10089' ? 'areaColhidaHa' : 'valorMilReais', num(linha.V));
  }
  for (const linha of permanentes) {
    if (linha.D4C === '0') continue;
    registrar(linha.D4N, 'areaColhidaHa', num(linha.V));
  }

  return [...porProduto.values()].filter((p) => p.areaColhidaHa);
}

async function coletarAgro() {
  const lavouras = await sidra(`/t/5457/n6/${MUNICIPIO.codigo}/v/8331,216,214,215/p/last%201/c782/all`);
  const rebanhos = await sidra(`/t/3939/n6/${MUNICIPIO.codigo}/v/105/p/last%201/c79/all`);
  const historico = await sidra(`/t/5457/n6/${MUNICIPIO.codigo}/v/216/p/all/c782/all`);
  const censo = await coletarCensoAgro();

  const VAR = {
    8331: 'areaPlantadaHa',
    216: 'areaColhidaHa',
    214: 'quantidadeToneladas',
    215: 'valorMilReais',
  };
  const mapa = new Map();
  for (const linha of lavouras) {
    if (linha.D4C === '0') continue; // linha "Total"
    if (!mapa.has(linha.D4C)) mapa.set(linha.D4C, { produto: linha.D4N.replace(/\*+$/, '').trim() });
    mapa.get(linha.D4C)[VAR[linha.D2C]] = num(linha.V);
  }

  const produtos = semDuplaContagem(
    [...mapa.values()].filter((p) => p.valorMilReais || p.areaColhidaHa),
    (p) => p.produto,
  )
    .map((p) => ({ ...p, produto: p.produto.replace(/\s+Total$/i, '') }))
    .sort((a, b) => (b.valorMilReais ?? 0) - (a.valorMilReais ?? 0));

  const ano = Number(lavouras[0]?.D3N) || null;

  // Série de área colhida por produto, para medir há quanto tempo cada uma parou.
  const serie = {};
  for (const linha of historico) {
    if (linha.D4C === '0') continue;
    const nome = linha.D4N.replace(/\*+$/, '').replace(/\s+Total$/i, '').trim();
    serie[nome] = serie[nome] ?? {};
    serie[nome][linha.D3N] = num(linha.V);
  }

  const enriquecidos = produtos.map((p) => {
    const parado = ano ? anosParados(serie[p.produto] ?? {}, ano) : null;
    const equivalentes = EQUIVALENCIA_CENSO[p.produto] ?? [];
    const linhasCenso = censo.filter((c) => equivalentes.includes(c.produto));
    return {
      ...p,
      anosParados: parado?.anos ?? null,
      paradoDesde: parado && parado.anos >= LIMITE_ANOS_PARADOS ? parado.desde : null,
      censo2017:
        linhasCenso.length > 0
          ? {
              areaColhidaHa: linhasCenso.reduce((s, c) => s + (c.areaColhidaHa ?? 0), 0),
              produtos: linhasCenso.map((c) => c.produto),
            }
          : null,
    };
  });

  return {
    fonte: [FONTES.ibgePam, FONTES.ibgePpm, FONTES.censoAgro],
    ano,
    anoRebanho: Number(rebanhos[0]?.D3N) || null,
    produtos: enriquecidos,
    censo2017: { ano: 2017, produtos: censo },
    limiteAnosParados: LIMITE_ANOS_PARADOS,
    valorTotalMilReais: produtos.reduce((s, p) => s + (p.valorMilReais ?? 0), 0),
    areaTotalHa: produtos.reduce((s, p) => s + (p.areaColhidaHa ?? 0), 0),
    areaPlantadaTotalHa: produtos.reduce((s, p) => s + (p.areaPlantadaHa ?? 0), 0),
    rebanhos: semDuplaContagem(
      rebanhos.map((l) => ({ tipo: l.D4N, cabecas: num(l.V) })).filter((r) => r.cabecas),
      (r) => r.tipo,
    )
      .map((r) => ({ ...r, tipo: r.tipo.replace(/\s*-\s*total$/i, '') }))
      .sort((a, b) => b.cabecas - a.cabecas),
  };
}

// --------------------------------------------------------- financas publicas

const ANOS_FINANCAS = [2019, 2020, 2021, 2022, 2023, 2024];

/**
 * Tributos acompanhados de perto pela secretaria: ISS e ITBI reagem a servicos e
 * ao mercado imobiliario; a cota-parte do ICMS reflete o valor adicionado gerado
 * no municipio dois anos antes.
 *
 * Cada tributo lista os codigos do plano de contas atual e os da numeracao usada
 * ate 2021 — as duas variantes nunca aparecem no mesmo exercicio.
 */
const TRIBUTOS_CHAVE = [
  {
    chave: 'iss',
    nome: 'ISS',
    descricao: 'Imposto sobre Serviços de Qualquer Natureza',
    proprio: true,
    contas: ['RO1.1.1.4.51.0.0', 'RO1.1.1.8.02.3.0'],
  },
  {
    chave: 'iptu',
    nome: 'IPTU',
    descricao: 'Imposto Predial e Territorial Urbano',
    proprio: true,
    contas: ['RO1.1.1.2.50.0.0', 'RO1.1.1.8.01.1.0'],
  },
  {
    chave: 'itbi',
    nome: 'ITBI',
    descricao: 'Transmissão de bens imóveis',
    proprio: true,
    contas: ['RO1.1.1.2.53.0.0', 'RO1.1.1.8.01.4.0'],
  },
  {
    chave: 'icms',
    nome: 'Cota-parte do ICMS',
    descricao: 'Repasse estadual proporcional ao valor adicionado do município',
    proprio: false,
    contas: ['RO1.7.2.1.50.0.0', 'RO1.7.2.8.01.1.0'],
  },
  {
    chave: 'fpm',
    nome: 'FPM',
    descricao: 'Fundo de Participação dos Municípios',
    proprio: false,
    contas: ['RO1.7.1.1.51.0.0', 'RO1.7.1.8.01.2.0', 'RO1.7.1.8.01.3.0', 'RO1.7.1.8.01.4.0'],
  },
  {
    chave: 'ipva',
    nome: 'Cota-parte do IPVA',
    descricao: 'Repasse estadual sobre veículos licenciados no município',
    proprio: false,
    contas: ['RO1.7.2.1.51.0.0', 'RO1.7.2.8.01.2.0'],
  },
];

async function siconfi(ano, anexo) {
  const url =
    'https://apidatalake.tesouro.gov.br/ords/siconfi/tt/dca' +
    `?an_exercicio=${ano}&no_anexo=${encodeURIComponent(anexo)}&id_ente=${MUNICIPIO.codigo}`;
  const dados = await buscar(url);
  return dados.items ?? [];
}

async function coletarFinancas() {
  const anos = [];
  for (const ano of ANOS_FINANCAS) {
    let receitasBrutas = [];
    let despesasBrutas = [];
    try {
      receitasBrutas = await siconfi(ano, 'DCA-Anexo I-C');
      despesasBrutas = await siconfi(ano, 'DCA-Anexo I-E');
    } catch (erro) {
      avisos.push(`SICONFI ${ano}: ${erro.message}`);
      continue;
    }
    if (!receitasBrutas.length && !despesasBrutas.length) continue;

    const realizadas = receitasBrutas.filter((i) => i.coluna === 'Receitas Brutas Realizadas');
    const deducoes = receitasBrutas.filter((i) => String(i.coluna).startsWith('Deduções'));
    const empenhadas = despesasBrutas.filter((i) => i.coluna === 'Despesas Empenhadas');
    const pagas = despesasBrutas.filter((i) => i.coluna === 'Despesas Pagas');

    // O codigo da conta de totalizacao mudou de exercicio para exercicio.
    const conta = (lista, ...cods) =>
      lista.find((i) => cods.includes(i.cod_conta))?.valor ?? null;
    const somaContas = (lista, cods) => {
      const encontradas = lista.filter((i) => cods.includes(i.cod_conta));
      return encontradas.length ? encontradas.reduce((s, i) => s + (i.valor ?? 0), 0) : null;
    };
    const totalDespesa = (lista) =>
      conta(lista, 'DespesasExcetoIntraOrcamentarias', 'TotalDespesas');

    // Recorta so um nivel da arvore de contas, para os itens nao se somarem duas vezes.
    const nivel = (lista, regex) =>
      lista
        .filter((i) => regex.test(i.conta ?? ''))
        .map((i) => ({ nome: String(i.conta).replace(regex, '').trim(), valor: i.valor }))
        .filter((i) => i.valor)
        .sort((a, b) => b.valor - a.valor);

    const receitaTotal = conta(realizadas, 'ReceitasExcetoIntraOrcamentarias');
    const deducaoTotal = deducoes
      .filter((i) => i.cod_conta === 'ReceitasExcetoIntraOrcamentarias')
      .reduce((s, i) => s + (i.valor ?? 0), 0);

    anos.push({
      ano,
      populacao: receitasBrutas[0]?.populacao ?? despesasBrutas[0]?.populacao ?? null,
      receitaTotal,
      receitaLiquida: receitaTotal == null ? null : receitaTotal - deducaoTotal,
      receitasCorrentes: conta(realizadas, 'RO1.0.0.0.00.0.0'),
      receitasCapital: conta(realizadas, 'RO2.0.0.0.00.0.0'),
      despesaTotal: totalDespesa(empenhadas),
      despesaPaga: totalDespesa(pagas),
      // Segundo nivel da receita ("1.1 Impostos", "1.7 Transferencias"...), sem os totais 1.0/2.0.
      receitasPorOrigem: nivel(realizadas, /^\d\.[1-9]\.0\.0\.00\.0\.0\s*-?\s*/),
      // Funcoes de governo ("04 - Administracao"), sem as subfuncoes ("04.122 - ...").
      despesasPorFuncao: nivel(empenhadas, /^\d{2}\s*-\s*/),
      // Tributos que servem de termometro da atividade economica local.
      tributos: TRIBUTOS_CHAVE.map((t) => ({
        chave: t.chave,
        nome: t.nome,
        descricao: t.descricao,
        proprio: t.proprio,
        valor: somaContas(realizadas, t.contas),
      })).filter((t) => t.valor !== null),
    });
  }

  return { fonte: [FONTES.siconfi], anos, ultimoAno: anos.at(-1)?.ano ?? null };
}

// ------------------------------------------------------------------- malha

async function coletarMalha() {
  const url = (cod) =>
    `https://servicodados.ibge.gov.br/api/v3/malhas/municipios/${cod}` +
    '?formato=application/vnd.geo+json&qualidade=intermediaria';

  const features = [];
  for (const m of COMPARATIVO) {
    const geo = await buscar(url(m.codigo));
    for (const f of geo.features ?? []) {
      features.push({
        ...f,
        properties: { codigo: m.codigo, nome: m.nome, foco: m.codigo === MUNICIPIO.codigo },
      });
    }
  }
  return { fonte: [FONTES.malha], type: 'FeatureCollection', features };
}

// --------------------------------------------------------------- execucao

async function principal() {
  await mkdir(DESTINO, { recursive: true });
  console.log(`\nPainel ${MUNICIPIO.nome}/${MUNICIPIO.uf} - coletando dados publicos\n`);

  const populacao = await etapa('Populacao (IBGE)', 'populacao.json', coletarPopulacao);
  if (populacao) {
    await etapa('PIB e valor adicionado (IBGE)', 'pib.json', () => coletarPib(populacao));
  }
  await etapa('Empresas e emprego (IBGE/CEMPRE)', 'cempre.json', coletarCempre);
  await etapa('Agropecuaria (IBGE/PAM e PPM)', 'agro.json', coletarAgro);
  await etapa('Financas publicas (Tesouro/SICONFI)', 'financas.json', coletarFinancas);
  await etapa('Malha territorial (IBGE)', 'malha.json', coletarMalha);

  await gravar('meta.json', {
    municipio: MUNICIPIO,
    atualizadoEm: new Date().toISOString(),
    comparativo: COMPARATIVO,
    fontes: Object.values(FONTES),
    avisos,
  });

  console.log(avisos.length ? `\nConcluido com ${avisos.length} aviso(s):` : '\nConcluido sem avisos.');
  avisos.forEach((a) => console.log(`  - ${a}`));
  console.log('');
}

principal().catch((erro) => {
  console.error('\nFalha geral na coleta:', erro);
  process.exit(1);
});
