# Publicar no EasyPanel

O projeto está commitado e com `Dockerfile` pronto. Falta criar o repositório e o
app no painel.

Diferente do painel comercial da Rede dos Sonhos, aqui **não há volume para
montar nem variável de ambiente para configurar**. O site é estático: o Next
compila para `out/` e o nginx entrega os arquivos. Nenhum processo Node roda em
produção e nenhuma chamada ao IBGE ou ao Tesouro acontece quando alguém abre a
página — os dados já estão dentro do HTML.

---

## 1. Mandar o código para o GitHub

O `gh` não está instalado nesta máquina, então crie o repositório pela interface
do github.com — sugestão de nome: `painel-economico-socorro` — **sem** README,
.gitignore ou licença, e rode:

```bash
cd socorro-bi
git remote add origin https://github.com/raphaelschiavoni/painel-economico-socorro.git
git push -u origin main
```

Público ou privado, tanto faz: o repositório não contém segredo nenhum. Tudo que
está nele vem de bases abertas do IBGE e do Tesouro Nacional, e não há token,
senha ou chave de API em lugar algum do projeto. Se quiser deixar público como
gesto de transparência para a secretaria, não há impedimento técnico.

---

## 2. Criar o app no EasyPanel

**Novo serviço → App**, apontando para o repositório.

| Campo | Valor |
|---|---|
| Fonte | GitHub, branch `main` |
| Build | **Dockerfile** (o `Dockerfile` na raiz) |
| Porta | `80` |

Nada de comando de build ou start: o Dockerfile já resolve. Não adicione volume
e não há variáveis de ambiente obrigatórias.

---

## 3. Domínio

Em **Domains**, aponte o subdomínio que a prefeitura usar e deixe o EasyPanel
emitir o certificado. O painel funciona igual em qualquer caminho, inclusive em
subpasta, porque não depende de rota de servidor.

Se for usar um domínio da prefeitura (`*.socorro.sp.gov.br`), o pessoal de TI
deles precisa criar o registro CNAME apontando para o servidor do EasyPanel.

---

## 4. Consumo

A imagem final é o `nginx:alpine` com **1,3 MB de arquivos estáticos**. Servir
isso é entregar arquivos de um diretório: o container fica na casa de poucas
dezenas de MB de RAM em repouso e não usa CPU entre requisições. Pode dividir
servidor com os outros apps sem preocupação.

Há um endpoint de health check em `/healthz`, caso queira configurá-lo no
EasyPanel.

---

## 5. Atualizar os dados depois

Os dados do painel são snapshots JSON versionados em `src/data/`. Existem dois
caminhos para atualizá-los.

**Pelo seu computador** — o jeito recomendado, porque você vê o que mudou antes
de publicar:

```bash
cd socorro-bi
npm run dados
git add src/data && git commit -m "Atualiza dados públicos" && git push
```

O EasyPanel refaz o deploy sozinho a cada push na `main`.

**Pelo próprio deploy** — em **Build Args** do app, adicione:

```
COLETAR_DADOS=true
```

Assim cada deploy recoleta das APIs antes de compilar. Útil se você não estiver
na sua máquina, mas tem um porém: se uma API pública estiver fora do ar na hora,
o build falha. Por isso o padrão é `false`.

### Quando vale atualizar

As fontes são anuais. Rodar a coleta com mais frequência que isso não traz dado
novo — só gasta requisição nos servidores do IBGE.

| Fonte | Divulgação costumeira |
|---|---|
| PIB dos Municípios | dezembro |
| CEMPRE (empresas e emprego) | outubro |
| Produção Agrícola e Pecuária Municipal | setembro/outubro |
| DCA do Tesouro (finanças) | a partir de maio |
| Estimativas de população | agosto |

Uma coleta por trimestre cobre o calendário inteiro com folga.
