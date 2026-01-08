# ⚽ Futebol Backend API

API completa para gestão de clube de futsal com Node.js, Express, MongoDB e Socket.io.

## 🚀 Deploy

### ⚠️ Importante: Vercel vs Railway

**A Vercel não é ideal para esta API** porque:
- ❌ Funções serverless não suportam Socket.io adequadamente
- ❌ Conexões WebSocket persistentes não funcionam
- ❌ Upload de arquivos local não persiste

**✅ Recomendado: Railway.app**

Railway é perfeito para esta API porque:
- ✅ Suporta Socket.io nativamente
- ✅ Servidor Node.js persistente
- ✅ MongoDB integrado
- ✅ Deploy automático via Git
- ✅ HTTPS e domínio grátis

## 🚂 Deploy no Railway (Recomendado)

### 1️⃣ Criar conta
- Acesse: https://railway.app
- Faça login com GitHub

### 2️⃣ Novo Projeto
```bash
# CLI (opcional)
npm i -g @railway/cli
railway login
railway init
```

### 3️⃣ Via Dashboard (mais fácil)
1. **New Project** → **Deploy from GitHub repo**
2. Selecione: `bfrpaulondev/futebol-backend`
3. **Add variables** (configurar depois)

### 4️⃣ Adicionar MongoDB
1. No projeto → **New** → **Database** → **Add MongoDB**
2. A `MONGODB_URI` será gerada automaticamente

### 5️⃣ Configurar Variáveis de Ambiente

No Railway Dashboard → **Variables**:

```env
NODE_ENV=production
PORT=5000
MONGODB_URI=${{MongoDB.MONGODB_URI}}
JWT_SECRET=seu_segredo_super_forte_aqui_minimo_32_caracteres
JWT_EXPIRE=7d
CORS_ORIGIN=https://seu-frontend.vercel.app
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads
```

**⚠️ Gerar JWT_SECRET forte:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 6️⃣ Deploy
- Railway faz deploy automático a cada push!
- URL gerada: `https://seu-app.up.railway.app`

### 7️⃣ Popular Banco (primeira vez)

Opção A - Via Railway CLI:
```bash
railway run npm run seed
```

Opção B - Localmente apontando para Railway:
```bash
cd api
MONGODB_URI="connection_string_do_railway" npm run seed
```

## 🌐 Deploy Alternativo: Render.com

### 1️⃣ Criar conta
- Acesse: https://render.com
- Login com GitHub

### 2️⃣ New Web Service
- **Repository**: `bfrpaulondev/futebol-backend`
- **Root Directory**: `api`
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### 3️⃣ Environment Variables
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_SECRET=seu_segredo_forte
CORS_ORIGIN=https://seu-frontend.app
```

### 4️⃣ MongoDB Atlas
1. Criar cluster: https://www.mongodb.com/cloud/atlas
2. Network Access: `0.0.0.0/0`
3. Copiar connection string

## 📦 Desenvolvimento Local

```bash
# Clonar repositório
git clone https://github.com/bfrpaulondev/futebol-backend.git
cd futebol-backend

# Instalar dependências da API
cd api
npm install

# Configurar ambiente
cp .env.example .env
# Editar .env com suas configurações

# Popular banco com dados de teste
npm run seed

# Iniciar servidor
npm run dev
```

API rodando em: **http://localhost:5000**

## 👤 Credenciais de Teste

Após `npm run seed`:
- **Admin**: `admin@futebol.com` / `admin123`
- **Usuário**: `joao@futebol.com` / `joao123`

## 🧪 Testar API

```bash
# Health check
curl https://seu-app.up.railway.app/health

# Login
curl -X POST https://seu-app.up.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@futebol.com","password":"admin123"}'
```

## 📡 Endpoints

- 🔐 **Auth**: `/api/auth/*` (login, register, me)
- ⚽ **Games**: `/api/games/*` (CRUD, presença, sorteio)
- 👤 **Users**: `/api/users/*` (perfil, avatar, rankings)
- 💰 **Finance**: `/api/finance/*` (transações, sugestões)
- 💬 **Chat**: `/api/chat/*` (mensagens, reações)

Documentação completa: [api/README.md](./api/README.md)

## 🔌 Socket.io

WebSocket URL: `https://seu-app.up.railway.app`

Events:
- `online_users` - Lista de usuários online
- `chat:general` - Mensagens do chat
- `game:presence_changed` - Mudanças de presença
- `finance:suggestion_updated` - Atualizações financeiras

## 🔒 Segurança

- ✅ JWT com expiração configurável
- ✅ Bcrypt para senhas (salt rounds: 10)
- ✅ Helmet para headers seguros
- ✅ CORS configurável
- ✅ Rate limiting (100 req/15min)
- ✅ Validação de entrada
- ✅ Error handling global

## 📚 Documentação

- [API README](./api/README.md) - Documentação completa
- [QUICK_START.md](./QUICK_START.md) - Início rápido
- [STRUCTURE.md](./STRUCTURE.md) - Estrutura do projeto
- [DEPLOY.md](./DEPLOY.md) - Guia de deploy detalhado

## 🛠️ Stack Tecnológico

- **Node.js** + **Express** - Framework web
- **MongoDB** + **Mongoose** - Banco de dados
- **Socket.io** - WebSocket real-time
- **JWT** + **Bcrypt** - Autenticação
- **Multer** - Upload de arquivos
- **Helmet** - Segurança

## 🤝 Integração com Frontend

Configure no frontend:

```env
# .env.local
VITE_API_BASE_URL=https://seu-app.up.railway.app/api
VITE_SOCKET_URL=https://seu-app.up.railway.app
```

## 📊 Features

- ✅ Autenticação JWT completa
- ✅ Sistema de jogos com presença
- ✅ Sorteio de times com IA balanceado
- ✅ Chat em tempo real (Socket.io)
- ✅ Sistema financeiro completo
- ✅ Sugestões com votação
- ✅ Perfis e rankings de jogadores
- ✅ Upload de avatares
- ✅ WebSocket para updates real-time

## 🐛 Troubleshooting

### MongoDB não conecta
```bash
# Verificar connection string
echo $MONGODB_URI

# Testar conexão
mongosh "sua_connection_string"
```

### CORS Error
```bash
# Adicionar URL do frontend em CORS_ORIGIN
CORS_ORIGIN=https://seu-frontend.vercel.app
```

### Socket.io não conecta
- Verificar `VITE_SOCKET_URL` no frontend
- Verificar CORS permite o origin
- WebSocket deve estar habilitado no host

## 📞 Suporte

- **Docs**: Ver arquivos `.md` na raiz
- **Issues**: [GitHub Issues](https://github.com/bfrpaulondev/futebol-backend/issues)
- **Repositório Frontend**: [Futebol-List](https://github.com/bfrpaulondev/Futebol-List)

## 📄 License

MIT

---

**Desenvolvido para gestão completa de clube de futsal** ⚽🔥
