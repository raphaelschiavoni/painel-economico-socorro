// Catálogo central de fontes públicas usadas pelo painel.
// Tudo aqui é API aberta, sem chave de acesso.

export const MUNICIPIO = {
  codigo: '3552106',
  nome: 'Socorro',
  uf: 'SP',
  gentilico: 'socorrense',
  regiaoImediata: 'Bragança Paulista',
  circuito: 'Circuito das Águas Paulista',
};

// Circuito das Águas Paulista — recorte oficial de comparação regional.
export const COMPARATIVO = [
  { codigo: '3552106', nome: 'Socorro' },
  { codigo: '3500501', nome: 'Águas de Lindóia' },
  { codigo: '3501905', nome: 'Amparo' },
  { codigo: '3519055', nome: 'Holambra' },
  { codigo: '3522604', nome: 'Itapira' },
  { codigo: '3524709', nome: 'Jaguariúna' },
  { codigo: '3527009', nome: 'Lindóia' },
  { codigo: '3531209', nome: 'Monte Alegre do Sul' },
  { codigo: '3537107', nome: 'Pedreira' },
  { codigo: '3551603', nome: 'Serra Negra' },
];

// Seções da CNAE 2.0 na classificação 12762 do SIDRA.
export const SECOES_CNAE = [
  { id: '116830', letra: 'A', nome: 'Agropecuária', completo: 'Agricultura, pecuária, produção florestal, pesca e aquicultura' },
  { id: '116880', letra: 'B', nome: 'Indústrias extrativas', completo: 'Indústrias extrativas' },
  { id: '116910', letra: 'C', nome: 'Indústria de transformação', completo: 'Indústrias de transformação' },
  { id: '117296', letra: 'D', nome: 'Eletricidade e gás', completo: 'Eletricidade e gás' },
  { id: '117307', letra: 'E', nome: 'Água e saneamento', completo: 'Água, esgoto e gestão de resíduos' },
  { id: '117329', letra: 'F', nome: 'Construção', completo: 'Construção' },
  { id: '117363', letra: 'G', nome: 'Comércio', completo: 'Comércio; reparação de veículos' },
  { id: '117484', letra: 'H', nome: 'Transporte e logística', completo: 'Transporte, armazenagem e correio' },
  { id: '117543', letra: 'I', nome: 'Alojamento e alimentação', completo: 'Alojamento e alimentação' },
  { id: '117555', letra: 'J', nome: 'Informação e comunicação', completo: 'Informação e comunicação' },
  { id: '117608', letra: 'K', nome: 'Serviços financeiros', completo: 'Atividades financeiras e de seguros' },
  { id: '117666', letra: 'L', nome: 'Atividades imobiliárias', completo: 'Atividades imobiliárias' },
  { id: '117673', letra: 'M', nome: 'Serviços profissionais', completo: 'Atividades profissionais, científicas e técnicas' },
  { id: '117714', letra: 'N', nome: 'Serviços administrativos', completo: 'Atividades administrativas e serviços complementares' },
  { id: '117774', letra: 'O', nome: 'Administração pública', completo: 'Administração pública, defesa e seguridade social' },
  { id: '117788', letra: 'P', nome: 'Educação', completo: 'Educação' },
  { id: '117810', letra: 'Q', nome: 'Saúde e serviços sociais', completo: 'Saúde humana e serviços sociais' },
  { id: '117838', letra: 'R', nome: 'Artes, cultura e esporte', completo: 'Artes, cultura, esporte e recreação' },
  { id: '117861', letra: 'S', nome: 'Outros serviços', completo: 'Outras atividades de serviços' },
  { id: '117888', letra: 'T', nome: 'Serviços domésticos', completo: 'Serviços domésticos' },
];

// Agrupamento macro usado nos gráficos de composição.
export const MACROSSETOR = {
  A: 'Agropecuária', B: 'Indústria', C: 'Indústria', D: 'Indústria', E: 'Indústria', F: 'Construção',
  G: 'Comércio', H: 'Serviços', I: 'Turismo e alimentação', J: 'Serviços', K: 'Serviços', L: 'Serviços',
  M: 'Serviços', N: 'Serviços', O: 'Setor público', P: 'Serviços', Q: 'Serviços', R: 'Turismo e alimentação',
  S: 'Serviços', T: 'Serviços',
};

export const FONTES = {
  ibgePop: {
    id: 'ibge-6579',
    titulo: 'Estimativas da População',
    orgao: 'IBGE',
    tabela: 'SIDRA 6579',
    url: 'https://sidra.ibge.gov.br/tabela/6579',
  },
  ibgeCenso: {
    id: 'ibge-4714',
    titulo: 'Censo Demográfico 2022',
    orgao: 'IBGE',
    tabela: 'SIDRA 4714',
    url: 'https://sidra.ibge.gov.br/tabela/4714',
  },
  ibgePib: {
    id: 'ibge-5938',
    titulo: 'Produto Interno Bruto dos Municípios',
    orgao: 'IBGE',
    tabela: 'SIDRA 5938',
    url: 'https://sidra.ibge.gov.br/tabela/5938',
  },
  ibgeCempre: {
    id: 'ibge-9418',
    titulo: 'Cadastro Central de Empresas (CEMPRE)',
    orgao: 'IBGE',
    tabela: 'SIDRA 9418',
    url: 'https://sidra.ibge.gov.br/tabela/9418',
  },
  ibgePam: {
    id: 'ibge-5457',
    titulo: 'Produção Agrícola Municipal',
    orgao: 'IBGE',
    tabela: 'SIDRA 5457',
    url: 'https://sidra.ibge.gov.br/tabela/5457',
  },
  ibgePpm: {
    id: 'ibge-3939',
    titulo: 'Pesquisa da Pecuária Municipal',
    orgao: 'IBGE',
    tabela: 'SIDRA 3939',
    url: 'https://sidra.ibge.gov.br/tabela/3939',
  },
  siconfi: {
    id: 'siconfi-dca',
    titulo: 'Declaração de Contas Anuais (DCA)',
    orgao: 'Tesouro Nacional / SICONFI',
    tabela: 'DCA Anexos I-C e I-E',
    url: 'https://siconfi.tesouro.gov.br/siconfi/pages/public/consulta_finbra/finbra_list.jsf',
  },
  censoAgro: {
    id: 'ibge-censo-agro',
    titulo: 'Censo Agropecuário 2017',
    orgao: 'IBGE',
    tabela: 'SIDRA 6957 e 6966',
    url: 'https://sidra.ibge.gov.br/pesquisa/censo-agropecuario/censo-agropecuario-2017',
  },
  municipal: {
    id: 'levantamento-municipal',
    titulo: 'Levantamento da Secretaria de Desenvolvimento Econômico',
    orgao: 'Prefeitura de Socorro',
    tabela: 'src/data/municipal.json',
    url: '#fontes',
  },
  malha: {
    id: 'ibge-malhas',
    titulo: 'Malha Territorial Municipal',
    orgao: 'IBGE',
    tabela: 'API de Malhas v3',
    url: 'https://servicodados.ibge.gov.br/api/docs/malhas',
  },
};

/**
 * Equivalência entre os nomes de produto da PAM (estimativa anual) e os do
 * Censo Agropecuário (levantamento real, de 2017). Os recortes não coincidem:
 * o Censo separa o feijão por tipo e distingue milho em grão de milho
 * forrageiro. O mapeamento é explícito de propósito — casar nome por
 * semelhança silenciosamente juntaria coisas diferentes.
 */
export const EQUIVALENCIA_CENSO = {
  'Abacate': ['Abacate'],
  'Abóbora': ['Abóbora, moranga, jerimum'],
  'Arroz (em casca)': ['Arroz em casca'],
  'Banana (cacho)': ['Banana'],
  'Batata-doce': ['Batata-doce'],
  'Batata-inglesa': ['Batata-inglesa'],
  'Café (em grão)': ['Café arábica em grão (verde)', 'Café canephora (conilon) em grão (verde)'],
  'Cana-de-açúcar': ['Cana-de-açúcar'],
  'Cenoura': ['Cenoura'],
  'Feijão (em grão)': [
    'Feijão de cor em grão',
    'Feijão preto em grão',
    'Feijão fradinho em grão',
    'Feijão verde',
  ],
  'Laranja': ['Laranja'],
  'Limão': ['Limão'],
  'Mandioca': ['Mandioca (aipim, macaxeira)'],
  'Milho (em grão)': ['Milho em grão'],
  'Soja (em grão)': ['Soja em grão'],
  'Tangerina': ['Tangerina, bergamota, mexerica'],
  'Tomate': ['Tomate rasteiro (industrial)', 'Tomate envarado (mesa)'],
  'Trigo (em grão)': ['Trigo em grão'],
  'Uva': ['Uva (mesa)', 'Uva (vinho ou suco)'],
};

/** A partir de quantos anos parados consideramos a estimativa suspeita. */
export const LIMITE_ANOS_PARADOS = 4;
