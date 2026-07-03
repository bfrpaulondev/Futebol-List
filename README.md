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

> 🚨 **CRÍTICO — Problema de persistência em serverless (Vercel/Netlify)**
>
> Se a app for deployada num ambiente serverless (Vercel, Netlify) com SQLite **local** (`file:...`), **TODOS os dados são perdidos a cada cold start**:
> - Mensagens de chat desaparecem
> - Contas criadas pelos utilizadores desaparecem (não conseguem fazer login novamente)
> - Jogos lançados, confirmações de presença e outras ações não persistem
>
> Isto acontece porque o filesystem é efémero nesses ambientes. A solução é usar **Turso (libSQL)** — um SQLite hosted na nuvem, persistente em serverless. As instruções completas estão abaixo.

### Backend de base de dados — dois modos (auto-deteção)

A app suporta **automaticamente** dois backends, selecionados pelo formato do `DATABASE_URL`:

| `DATABASE_URL` | Modo | Quando usar |
|----------------|------|-------------|
| `file:...` | SQLite local | Desenvolvimento local (persiste no disco) |
| `libsql://...` ou `https://...` | Turso / libSQL | **Produção serverless (Vercel)** — persiste na nuvem |

A deteção é feita em `src/lib/db.ts`. Não é preciso mudar código — só as variáveis de ambiente.

### Configurar Turso (passo a passo) — OBRIGATÓRIO para Vercel

1. **Criar conta Turso** (gratuito, sem cartão): https://app.turso.tech
2. **Criar uma base de dados**:
   ```bash
   # Instalar a CLI do Turso (opcional, também dá pela web)
   curl -sSfL https://get.tur.so/install.sh | bash
   
   # Login
   turso auth login
   
   # Criar base de dados
   turso db create futebol-bonfim
   
   # Obter a URL de ligação
   turso db show futebol-bonfim --url
   # -> algo como: libsql://futebol-bonfim-teu-usuario.turso.io
   
   # Criar um token de acesso
   turso db tokens create futebol-bonfim
   # -> uma string longa de caracteres
   ```
3. **Popular a base de dados** com o schema (a partir do repositório local):
   ```bash
   # Na pasta do projeto, com a URL e token do Turso:
   DATABASE_URL="libsql://futebol-bonfim-teu-usuario.turso.io" \
   TURSO_AUTH_TOKEN="o-teu-token" \
   npx prisma db push
   ```
   Isto cria todas as tabelas. A app auto-seeda com dados de demonstração na primeira chamada à API.
4. **Configurar no Vercel** (Settings → Environment Variables):
   - `DATABASE_URL` = `libsql://futebol-bonfim-teu-usuario.turso.io`
   - `TURSO_AUTH_TOKEN` = o token criado no passo 2
   - `JWT_SECRET` = uma string aleatória forte (ex: `openssl rand -hex 32`)
   - `OPENAI_API_KEY` = (opcional) chave OpenAI para features do Palestrinha
5. **Fazer redeploy** no Vercel.

### Verificar o backend ativo em produção

Depois do deploy, visitar:

```
https://a-teu-app.vercel.app/api/health
```

Retorna JSON com o modo ativo:
```json
{
  "status": "ok",
  "database": { "mode": "turso", "reachable": true, "userCount": 13 },
  "warning": null
}
```

Se `mode` for `"sqlite-local"` em produção, o endpoint retorna um `warning` a indicar que os dados serão perdidos. **Não ignorar este warning.**

### Vercel (recomendado)

1. Importar o repositório em [vercel.com](https://vercel.com)
2. Framework preset: **Next.js**
3. Build command: `npm run build` (auto-detectado)
4. Configurar as variáveis de ambiente conforme a secção "Configurar Turso" acima
5. Deploy
6. Verificar `/api/health` — deve mostrar `mode: "turso"`

### Alternativas (VPS com Node.js runtime)

Em **Render / Railway / Fly.io / VPS próprio**, o filesystem é persistente, pelo que SQLite local (`file:...`) funciona sem Turso:

1. Configurar `DATABASE_URL="file:../db/custom.db"` (ou path absoluto persistente)
2. `npm run build` → gera `.next/standalone`
3. `npm run start` (ou `node .next/standalone/server.js`)
4. Na primeira chamada à API, a base de dados é criada e seedada automaticamente.

### Docker

Usar o build standalone:
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY .next/standalone ./
COPY .next/standalone/.next ./.next
COPY public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```
Configurar as mesmas variáveis de ambiente (Turso para persistência multi-instância).

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
