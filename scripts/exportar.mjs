/**
 * Gera o PDF do relatório e o print da página inteira em exports/.
 * Rode com: npm run exportar
 *
 * Usa o Chrome já instalado na máquina em modo headless: o PDF sai pelo mesmo
 * CSS de impressão do botão "Imprimir / PDF" do painel, em A4 e tema claro.
 */
import { spawn, spawnSync } from 'node:child_process';
import { createServer } from 'node:http';
import { createReadStream, existsSync, mkdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SAIDA = path.join(RAIZ, 'exports');
const PASTA_SITE = path.join(RAIZ, 'out');
// Porta 0: o sistema escolhe uma livre, entao o export nunca esbarra em outro
// servidor de desenvolvimento ja rodando.
const PORTA = 0;
const LARGURA = 1440;
// O Chrome captura exatamente a altura da janela, sem recortar sobra. A pagina
// inteira tem ~11.600px a 1440 de largura; ajuste se o relatorio crescer.
const ALTURA_PRINT = Number(process.env.ALTURA_PRINT ?? 11700);

const CAMINHOS_CHROME = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  `${process.env.LOCALAPPDATA ?? ''}/Google/Chrome/Application/chrome.exe`,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);

function acharChrome() {
  const encontrado = CAMINHOS_CHROME.find((c) => existsSync(c));
  if (!encontrado) {
    throw new Error(
      'Chrome não encontrado. Instale o Google Chrome ou aponte a variável CHROME_PATH para o executável.',
    );
  }
  return encontrado;
}

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.woff2': 'font/woff2',
};

/** Servidor mínimo para o Chrome abrir o build por http (file:// quebra os assets). */
function servir() {
  const servidor = createServer((req, res) => {
    const caminhoUrl = decodeURIComponent((req.url ?? '/').split('?')[0]);
    let alvo = path.join(PASTA_SITE, caminhoUrl);
    if (!alvo.startsWith(PASTA_SITE)) {
      res.writeHead(403).end();
      return;
    }
    if (existsSync(alvo) && statSync(alvo).isDirectory()) alvo = path.join(alvo, 'index.html');
    if (!existsSync(alvo)) alvo = path.join(PASTA_SITE, 'index.html');

    res.writeHead(200, { 'Content-Type': TIPOS[path.extname(alvo)] ?? 'application/octet-stream' });
    createReadStream(alvo).pipe(res);
  });
  return new Promise((resolve) => servidor.listen(PORTA, () => resolve(servidor)));
}

function rodarChrome(chrome, argumentos) {
  return new Promise((resolve, reject) => {
    const processo = spawn(chrome, argumentos, { stdio: 'ignore' });
    processo.on('error', reject);
    processo.on('exit', (codigo) => (codigo === 0 ? resolve() : reject(new Error(`Chrome saiu com código ${codigo}`))));
  });
}

async function principal() {
  if (!existsSync(PASTA_SITE)) {
    console.log('Pasta out/ não existe — rodando o build antes.');
    const build = spawnSync('npm', ['run', 'build'], { cwd: RAIZ, stdio: 'inherit', shell: true });
    if (build.status !== 0) throw new Error('O build falhou.');
  }

  mkdirSync(SAIDA, { recursive: true });
  const chrome = acharChrome();
  const servidor = await servir();
  const url = `http://localhost:${servidor.address().port}/`;

  const comuns = [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--no-first-run',
    '--no-default-browser-check',
    '--virtual-time-budget=20000',
    '--run-all-compositor-stages-before-draw',
    // O relatório impresso é sempre claro, mesmo com o sistema em tema escuro.
    '--blink-settings=preferredColorScheme=1',
  ];

  const pdf = path.join(SAIDA, 'painel-socorro-desenvolvimento-economico.pdf');
  const png = path.join(SAIDA, 'painel-socorro-pagina-completa.png');

  console.log('Gerando o PDF...');
  await rodarChrome(chrome, [...comuns, '--no-pdf-header-footer', `--print-to-pdf=${pdf}`, url]);

  console.log('Gerando o print da página inteira...');
  await rodarChrome(chrome, [
    ...comuns,
    '--hide-scrollbars',
    '--force-color-profile=srgb',
    `--window-size=${LARGURA},${ALTURA_PRINT}`,
    `--screenshot=${png}`,
    url,
  ]);

  servidor.close();
  console.log(`\nPronto:\n  ${pdf}\n  ${png}\n`);
}

principal().catch((erro) => {
  console.error('\nFalha ao exportar:', erro.message);
  process.exit(1);
});
