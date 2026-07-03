# Futebol Bonfim — Society Nº5

App de gestão do Society Futebol Nº5 (Futebol Bonfim). Aplicação full-stack para gestão de jogos, equipas, jogadores, finanças, chat, ratings, badges, notificações push e mais.

## Stack tecnológica

- **Framework**: Next.js 16 (App Router, Turbopack)
- **Linguagem**: TypeScript 5
- **Base de dados**: SQLite via Prisma ORM
- **Auth**: JWT (jose) + bcrypt, cookies httpOnly
- **UI**: Tailwind CSS 4 + shadcn/ui + Lucide icons + Framer Motion
- **Estado**: Zustand (cliente)
- **PWA**: manifest + service worker + web push (VAPID)
- **IA**: Palestrinha (cronistas, pré-jogo, reviews) — opcional, via OpenAI API

## Setup local

```bash
# 1. Instalar dependências
npm install

# 2. Configurar ambiente
cp .env.example .env
# Editar .env se necessário (DATABASE_URL já aponta para db/custom.db)

# 3. Criar/sincronizar base de dados
npm run db:push

# 4. Iniciar dev server
npm run dev
```

A app corre em `http://localhost:3000`. Na primeira chamada à API, a base de dados é automaticamente criada e populada com dados de demonstração (`ensureSeeded`).

### Credenciais de demonstração

| Email             | Role    | Tipo        | Senha   |
|-------------------|---------|-------------|---------|
| bruno@test.com    | master  | mensalista  | 123456  |
| rodrigo@test.com  | admin   | mensalista  | 123456  |

## Scripts

```bash
npm run dev        # Dev server (porta 3000)
npm run build      # Build de produção (standalone)
npm run start      # Servir build standalone
npm run lint       # ESLint
npm run db:push    # Sincronizar schema Prisma
npm run test       # Testes E2E (Playwright)
```

## Testes E2E (Playwright)

```bash
# Instalar browsers (primeira vez)
npx playwright install chromium

# Correr testes (inicia o dev server automaticamente)
npm run test
```

Os testes cobrem: redirect de auth, login, dashboard, navegação (Teams/Chat), persistência de sessão em refresh, e viewport mobile.

## Build de produção

```bash
npm run build
```

Gera `.next/standalone` (servidor Node.js otimizado) com assets estáticos copiados.

## Deploy

> ⚠️ **Esta aplicação NÃO pode ser deployada no GitHub Pages.**
>
> O GitHub Pages serve apenas ficheiros estáticos. Esta app é full-stack: tem API routes (serverless), autenticação server-side (JWT + cookies httpOnly + bcrypt), base de dados SQLite (Prisma) e service worker. Nenhuma destas funcionalidades funciona em hosting puramente estático.

### Recomendado: Vercel

1. Importar o repositório em [vercel.com](https://vercel.com)
2. Framework preset: **Next.js**
3. Build command: `npm run build` (auto-detectado)
4. Variáveis de ambiente (Settings → Environment Variables):
   - `DATABASE_URL` — usar Turso (libSQL) ou um SQLite persistente. SQLite local NÃO persiste em serverless.
   - `OPENAI_API_KEY` — opcional (features de IA têm fallback graceful sem chave)
   - `JWT_SECRET` — definir um secret forte (senão usa o default, **não recomendado em produção**)
5. Deploy

> **Nota sobre SQLite em serverless**: o SQLite local (`file:...`) perde dados em cada cold start em plataformas serverless (Vercel/Netlify). Para produção usar [Turso](https://turso.tech) (libSQL compatível com Prisma) ou outra base de dados externa. O schema Prisma já usa `@prisma/adapter-libsql` disponível nas dependências.

### Alternativas

- **Render / Railway / Fly.io**: VPS com Node.js runtime — SQLite local persiste.
- **Docker**: usar o build standalone (`node .next/standalone/server.js`).

## Segurança

- O ficheiro `.env` **não é committed** (ver `.gitignore`).
- O `JWT_SECRET` tem um default inseguro — **definir em produção** via variável de ambiente.
- Cookies são `httpOnly` + `sameSite=lax` + `secure` em produção.
- A base de dados SQLite (`db/*.db`) **não é committed** (runtime artifact).

## Estrutura

```
src/
  app/
    (auth)/         # Login, Register
    (app)/          # App principal (dashboard, teams, chat, finances, admin, ...)
    api/            # API routes (auth, games, users, finance, chat, push, ...)
    layout.tsx      # Root layout
  components/       # Componentes UI (shadcn/ui + custom)
  lib/              # Auth, db, push, AI helpers
  stores/           # Zustand stores
  middleware.ts     # Auth middleware (redirects + role guards)
prisma/
  schema.prisma     # Schema da base de dados
tests/
  e2e.spec.ts       # Testes E2E Playwright
```

## Funcionalidades

- ⚽ Gestão de jogos (confirmar presença, lista de espera, sorteio de equipas)
- 👥 Equipas com visualização de campo
- 💬 Chat em tempo real (auto-refresh)
- 💰 Finanças (apenas mensalistas/admins)
- 🏅 Badges e conquistas
- 📋 Bureau de Queixas
- 📰 Revista Palestrinha (IA)
- 📊 Estatísticas e ranking
- 🔔 Notificações + web push (PWA)
- 👤 Perfis com skills e ratings
- 🛡️ Admin panel (apenas admins/masters)
