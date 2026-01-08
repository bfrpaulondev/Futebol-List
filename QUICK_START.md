# 🚀 Guia Rápido - Futebol App

## ⚡ Início Rápido

### 1️⃣ Iniciar MongoDB (necessário!)

```bash
# No macOS/Linux
sudo systemctl start mongodb
# ou
mongod

# No Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### 2️⃣ Configurar e Iniciar API

```bash
# Entrar na pasta da API
cd api

# Criar arquivo .env
cp .env.example .env

# Editar .env (opcional - já tem defaults)
# nano .env

# Popular banco com dados de teste (RECOMENDADO)
npm run seed

# Iniciar servidor
npm run dev
```

A API estará rodando em: **http://localhost:5000**

### 3️⃣ Iniciar Frontend

```bash
# Voltar para raiz e instalar dependências (se necessário)
cd ..
npm install

# Criar .env.local
cp .env.example .env.local

# Iniciar frontend
npm run dev
```

O frontend estará em: **http://localhost:5173**

## 👤 Credenciais de Teste

Após rodar `npm run seed` na API:

- **Admin**: `admin@futebol.com` / `admin123`
- **Usuário**: `joao@futebol.com` / `joao123`
- **Outros**: `pedro@futebol.com` / `pedro123`

## 🧪 Testar API

### Verificar se está rodando
```bash
curl http://localhost:5000/health
```

### Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@futebol.com","password":"admin123"}'
```

### Próximo jogo
```bash
curl http://localhost:5000/api/games/next \
  -H "Authorization: Bearer SEU_TOKEN_AQUI"
```

## 📁 Estrutura do Projeto

```
futebol-app/
├── api/                    # Backend API
│   ├── src/
│   │   ├── controllers/   # Lógica de negócio
│   │   ├── models/        # MongoDB models
│   │   ├── routes/        # Express routes
│   │   ├── middleware/    # Auth, error, upload
│   │   ├── services/      # AI, Socket.io
│   │   └── server.js      # Entry point
│   ├── uploads/           # Avatars, imagens
│   └── package.json
│
└── src/                   # Frontend React
    ├── components/        # Componentes React
    ├── pages/            # Páginas
    ├── services/         # API clients
    ├── store/            # State management
    └── App.jsx
```

## ⚙️ Configurações

### API (.env)
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/futebol-app
JWT_SECRET=seu_segredo_aqui
CORS_ORIGIN=http://localhost:5173
```

### Frontend (.env.local)
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## 🎯 Features Principais

### ✅ Gestão de Jogos
- Confirmação/cancelamento de presença
- Sorteio automático de times balanceados (IA)
- Histórico de jogos e resultados

### 💬 Chat em Tempo Real
- Socket.io para mensagens instantâneas
- Múltiplos canais (geral, jogo, finanças)
- Reações e respostas

### 💰 Sistema Financeiro
- Controle de receitas e despesas
- Sugestões com sistema de votação
- Relatórios e métricas

### 👤 Perfis de Jogadores
- Skills customizáveis (chute, passe, drible, etc.)
- Estatísticas de jogos
- Sistema de ranking

## 🐛 Problemas Comuns

### MongoDB não conecta
```bash
# Verificar se MongoDB está rodando
ps aux | grep mongod

# Iniciar MongoDB
sudo systemctl start mongodb
```

### Porta já em uso
```bash
# Matar processo na porta 5000
lsof -ti:5000 | xargs kill -9

# Ou mudar PORT no .env
PORT=5001
```

### Erro de CORS
Verifique se `CORS_ORIGIN` na API aponta para URL correta do frontend.

## 📚 Documentação Completa

- API: `api/README.md`
- Frontend: `README.md`

## 🔥 Dicas

1. **Sempre rode `npm run seed`** após limpar o banco
2. **Use nodemon** para auto-reload na API (`npm run dev`)
3. **Mantenha MongoDB rodando** em background
4. **Token JWT expira em 7 dias** (configurável)
5. **Uploads** salvos em `api/uploads/`

## 🚀 Deploy

### Backend (Railway/Render/Heroku)
1. Configure variáveis de ambiente
2. Use MongoDB Atlas para banco
3. Deploy automático via Git

### Frontend (Vercel/Netlify)
1. Build: `npm run build`
2. Configure VITE_API_BASE_URL com URL da API em produção
3. Deploy da pasta `dist/`

---

**Tudo pronto! Bom jogo! ⚽🔥**
