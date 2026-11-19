# Mundo BJJ

App para achar academias de Jiu-Jitsu por cidade ou perto de você, com professor, horário e lojas da modalidade.

## Stack

Next.js na Vercel, Postgres no Neon, código no GitHub.

## Local

1. Copie `.env.example` para `.env.local`.
2. Preencha `DATABASE_URL` (pooled, host com `-pooler`) e `DATABASE_URL_UNPOOLED` (direct) com as strings do Neon.
3. Rode `npm run db:setup` para criar as tabelas e carregar países, estados, cidades e categorias de loja.
4. Rode `npm run dev`.

## Vercel

Importe o repositório depois que este código estiver no `main`.

- Framework Next.js, Node 22, funções em São Paulo (`gru1`).
- Integração Neon no projeto `mundobjj`. Ela grava `DATABASE_URL` e `DATABASE_URL_UNPOOLED`.
- Adicione `AUTH_SECRET` e `AUTH_URL` quando o login entrar.
- O build de produção continua `next build` até a migração estar ligada. Com o banco conectado, use `npm run db:setup && next build` só se quiser migrar no deploy. O caminho previsto é `npx drizzle-kit migrate && next build`.
