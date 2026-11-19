# Mundo BJJ

App para achar academias de Jiu-Jitsu por cidade ou perto de você, com professor, horário e lojas da modalidade.

## Stack

Next.js na Vercel, Postgres no Neon, código no GitHub.

## Local

1. Copie `.env.example` para `.env.local`.
2. Preencha `DATABASE_URL` (pooled, host com `-pooler`) e `DATABASE_URL_UNPOOLED` (direct) com as strings do Neon.
3. Preencha `AUTH_SECRET` (`npx auth secret`) e `AUTH_URL=http://localhost:3000`. Em ambientes com proxy corporativo, use `NODE_EXTRA_CA_CERTS` apontando para o PEM da raiz local.
4. Rode `npm run db:setup` para criar as tabelas e carregar países, estados, cidades e categorias de loja.
5. Rode `npm run dev`.

Rotas principais: `/` busca, `/cadastro`, `/entrar`, `/painel`, `/painel/academia`, `/atleta/[slug]`, `/academia/[slug]`.

## Vercel

- Framework Next.js, Node 22, funções em São Paulo (`gru1`).
- Variáveis: `DATABASE_URL`, `DATABASE_URL_UNPOOLED`, `AUTH_SECRET`, `AUTH_URL=https://mundobjj.vercel.app`, `AUTH_TRUST_HOST=true`.
- Build: `next build`. Migrações novas rodam localmente com `npm run db:migrate` antes do push.
