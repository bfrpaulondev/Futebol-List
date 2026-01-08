# 📁 Estrutura do Projeto

```
futebol-app/
│
├── 📱 Frontend (React + Vite)
│   ├── src/
│   │   ├── components/      # Componentes React
│   │   ├── pages/          # Páginas da aplicação
│   │   ├── services/       # Clients da API
│   │   ├── store/          # Zustand state
│   │   ├── hooks/          # Custom hooks
│   │   ├── context/        # React Context
│   │   ├── styles/         # Estilos globais
│   │   └── utils/          # Utilitários
│   ├── public/             # Assets estáticos
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── 🔧 Backend API (Node.js + Express)
│   ├── src/
│   │   ├── config/         # Configurações (DB, env)
│   │   ├── controllers/    # Lógica de negócio
│   │   │   ├── authController.js
│   │   │   ├── gameController.js
│   │   │   ├── userController.js
│   │   │   ├── financeController.js
│   │   │   └── chatController.js
│   │   ├── models/         # MongoDB Schemas
│   │   │   ├── User.js
│   │   │   ├── Game.js
│   │   │   ├── Transaction.js
│   │   │   ├── Suggestion.js
│   │   │   └── Message.js
│   │   ├── routes/         # Express Routes
│   │   │   ├── auth.js
│   │   │   ├── games.js
│   │   │   ├── users.js
│   │   │   ├── finance.js
│   │   │   └── chat.js
│   │   ├── middleware/     # Middlewares
│   │   │   ├── auth.js         # JWT auth
│   │   │   ├── error.js        # Error handler
│   │   │   └── upload.js       # Multer upload
│   │   ├── services/       # Serviços
│   │   │   ├── aiService.js    # Sorteio de times
│   │   │   └── socketService.js # Socket.io
│   │   ├── utils/          # Utilitários
│   │   │   └── seed.js         # Popular DB
│   │   └── server.js       # Entry point
│   ├── uploads/            # Avatars e imagens
│   ├── .env.example
│   ├── package.json
│   └── README.md
│
├── 📚 Documentação
│   ├── README.md           # Documentação principal
│   ├── QUICK_START.md      # Guia rápido
│   └── api/README.md       # Docs da API
│
├── 🔧 Scripts & Config
│   ├── setup.sh            # Script de configuração
│   ├── .env.example        # Env do frontend
│   ├── .gitignore
│   └── package.json
│
└── 🗄️ Banco de Dados (MongoDB)
    └── futebol-app
        ├── users           # Jogadores e admins
        ├── games           # Jogos agendados
        ├── transactions    # Finanças
        ├── suggestions     # Sugestões com votos
        └── messages        # Chat
```

## 🔌 Fluxo de Comunicação

```
┌─────────────────┐
│   Frontend      │
│  React + Vite   │
│  localhost:5173 │
└────────┬────────┘
         │
         │ HTTP (Axios)
         │ WebSocket (Socket.io)
         │
         ▼
┌─────────────────┐
│   Backend API   │
│ Express + JWT   │
│  localhost:5000 │
└────────┬────────┘
         │
         │ Mongoose ODM
         │
         ▼
┌─────────────────┐
│    MongoDB      │
│   localhost:    │
│      27017      │
└─────────────────┘
```

## 📡 API Endpoints Overview

### 🔐 Auth
- `POST /api/auth/register` - Registrar
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Perfil atual

### ⚽ Games
- `GET /api/games/next` - Próximo jogo
- `POST /api/games/:id/confirm` - Confirmar presença
- `POST /api/games/:id/draw` - Sortear times

### 👤 Users
- `GET /api/users/profile` - Meu perfil
- `PUT /api/users/profile` - Atualizar perfil
- `POST /api/users/avatar` - Upload avatar
- `GET /api/users/leaderboard` - Rankings

### 💰 Finance
- `GET /api/finance/balance` - Saldo
- `GET /api/finance/transactions` - Transações
- `GET /api/finance/suggestions` - Sugestões
- `POST /api/finance/suggestions/:id/vote` - Votar

### 💬 Chat
- `GET /api/chat/messages` - Mensagens
- `POST /api/chat/messages` - Enviar mensagem
- Socket events para tempo real

## 🛠️ Tecnologias por Camada

### Frontend
```json
{
  "framework": "React 18",
  "bundler": "Vite",
  "routing": "React Router v6",
  "state": "Zustand",
  "http": "Axios",
  "realtime": "Socket.io Client",
  "animations": "Framer Motion",
  "forms": "React Hook Form + Zod"
}
```

### Backend
```json
{
  "runtime": "Node.js",
  "framework": "Express",
  "database": "MongoDB + Mongoose",
  "auth": "JWT + Bcrypt",
  "realtime": "Socket.io",
  "upload": "Multer",
  "security": "Helmet + Rate Limiting"
}
```

## 🚀 Comandos Úteis

```bash
# Setup completo
./setup.sh

# Desenvolvimento
cd api && npm run dev        # API
npm run dev                  # Frontend

# Popular banco
cd api && npm run seed

# Build produção
npm run build               # Frontend
cd api && npm start         # API

# Testes
curl http://localhost:5000/health
```

## 🔒 Segurança

- ✅ JWT com expiração configurável
- ✅ Bcrypt para hash de senhas
- ✅ Helmet para headers HTTP seguros
- ✅ Rate limiting contra DDoS
- ✅ CORS configurável
- ✅ Validação de entrada com Mongoose
- ✅ Upload seguro com Multer

## 📊 Features Implementadas

- [x] Autenticação JWT completa
- [x] CRUD de jogos com presença
- [x] Sorteio de times com IA
- [x] Chat em tempo real
- [x] Sistema financeiro
- [x] Sugestões com votação
- [x] Perfis e rankings
- [x] Upload de avatares
- [x] Socket.io para realtime
- [x] Sistema de roles (admin/player)

## 📝 Próximos Passos

- [ ] Notificações push
- [ ] Integração com calendário
- [ ] Estatísticas avançadas
- [ ] Sistema de penalties/cards
- [ ] Galeria de fotos
- [ ] Sistema de troféus/badges
- [ ] API de pagamentos
- [ ] PWA support

---

**Projeto completo e pronto para uso! ⚽🔥**
