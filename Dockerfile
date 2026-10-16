# O painel é um site estático: o Next compila para a pasta out/ e o nginx apenas
# entrega os arquivos. Não há Node em produção — nenhuma chamada ao IBGE ou ao
# Tesouro acontece quando alguém abre a página.

FROM node:24-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

FROM node:24-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Por padrão o build usa os snapshots JSON versionados em src/data — assim ele é
# determinístico e não quebra se uma API pública estiver fora do ar.
# Para recoletar durante o deploy, passe COLETAR_DADOS=true em Build Args.
ARG COLETAR_DADOS=false
RUN if [ "$COLETAR_DADOS" = "true" ]; then \
      echo "Recoletando dados públicos..."; \
      npm run dados; \
    else \
      echo "Usando os snapshots versionados em src/data."; \
    fi

RUN npm run build

FROM nginx:1.27-alpine AS runner
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/out /usr/share/nginx/html

EXPOSE 80
