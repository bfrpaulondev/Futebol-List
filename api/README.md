# ⚽ Futebol API - Backend

Backend API completo para gestão de clube de futsal com autenticação JWT, Socket.io para tempo real, e algoritmo de IA para sorteio balanceado de times.

## 🚀 Features

- ✅ **Autenticação JWT** - Login/registro com tokens seguros
- 🎮 **Gestão de Jogos** - Confirmação de presença, sorteio de times
- 💬 **Chat em Tempo Real** - Socket.io com múltiplos canais
- 💰 **Sistema Financeiro** - Transações, saldo, sugestões com votação
- 👤 **Perfis de Jogadores** - Skills, stats, avatars
- 🤖 **IA para Times** - Algoritmo de balanceamento por habilidades
- 📊 **Leaderboards** - Rankings por vitórias, goals, assists, MVP

## 🛠️ Tech Stack

- **Node.js** + **Express** - Framework web
- **MongoDB** + **Mongoose** - Banco de dados
- **Socket.io** - WebSocket para tempo real
- **JWT** - Autenticação stateless
- **Bcrypt** - Hash de senhas
- **Multer** - Upload de arquivos
- **Helmet** - Segurança HTTP
- **Rate Limiting** - Proteção contra abuse

## 📦 Instalação

```bash
# Entrar na pasta da API
cd api

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Edite .env com suas configurações

# Iniciar servidor de desenvolvimento
npm run dev

# Ou produção
npm start
```

## 🔧 Configuração (.env)

```env
NODE_ENV=development
PORT=5000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/futebol-app

# JWT
JWT_SECRET=seu_segredo_super_secreto
JWT_EXPIRE=7d

# CORS
CORS_ORIGIN=http://localhost:5173

# Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads
```

## 📡 API Endpoints

### Authentication (`/api/auth`)

- `POST /register` - Registrar novo usuário
- `POST /login` - Login
- `GET /me` - Perfil do usuário autenticado
- `POST /logout` - Logout

### Games (`/api/games`)

- `GET /next` - Próximo jogo agendado
- `GET /:id` - Detalhes do jogo
- `POST /:id/confirm` - Confirmar presença
- `POST /:id/cancel` - Cancelar presença
- `POST /:id/draw` - Sortear times (IA)
- `PUT /:id/result` - Atualizar resultado (Admin)
- `POST /` - Criar novo jogo (Admin)

### Users (`/api/users`)

- `GET /profile` - Perfil do usuário
- `PUT /profile` - Atualizar perfil
- `POST /avatar` - Upload de avatar
- `GET /leaderboard` - Rankings
- `GET /` - Listar todos usuários (Admin)
- `GET /:id` - Detalhes de usuário
- `PUT /:id` - Atualizar usuário (Admin)
- `DELETE /:id` - Desativar usuário (Admin)

### Finance (`/api/finance`)

- `GET /balance` - Saldo e métricas
- `GET /transactions` - Listar transações
- `POST /transactions` - Criar transação (Admin)
- `GET /suggestions` - Listar sugestões
- `POST /suggestions` - Criar sugestão
- `POST /suggestions/:id/vote` - Votar em sugestão
- `DELETE /suggestions/:id/vote` - Remover voto
- `PUT /suggestions/:id/status` - Atualizar status (Admin)
- `POST /suggestions/:id/comments` - Adicionar comentário

### Chat (`/api/chat`)

- `GET /messages` - Listar mensagens
- `POST /messages` - Enviar mensagem
- `DELETE /messages/:id` - Deletar mensagem
- `POST /messages/:id/read` - Marcar como lida
- `POST /messages/:id/reactions` - Adicionar reação
- `DELETE /messages/:id/reactions/:emoji` - Remover reação

## 🔌 Socket.io Events

### Client -> Server

```javascript
// Chat
socket.emit('chat:message', { content, channel, replyTo });
socket.emit('chat:typing', { channel, isTyping });

// Game
socket.emit('game:presence_updated', gameData);
socket.emit('game:teams_drawn', teamsData);

// Finance
socket.emit('finance:suggestion_created', suggestionData);
socket.emit('finance:vote_changed', voteData);
```

### Server -> Client

```javascript
// Connection
socket.on('online_users', (users) => {});

// Chat
socket.on('chat:general', (message) => {});
socket.on('chat:typing:general', ({ user, isTyping }) => {});

// Game
socket.on('game:presence_changed', (data) => {});
socket.on('game:teams_updated', (data) => {});

// Finance
socket.on('finance:new_suggestion', (data) => {});
socket.on('finance:suggestion_updated', (data) => {});
```

## 🤖 Sistema de IA - Sorteio de Times

O algoritmo de balanceamento de times considera:

1. **Skills dos jogadores** (shooting, passing, dribbling, defense, physical, goalkeeping)
2. **Rating geral** calculado com pesos específicos
3. **Snake Draft** para distribuição inicial
4. **Otimização** por troca de jogadores para minimizar diferença

```javascript
// Exemplo de uso
const { teamA, teamB } = await drawTeamsAI(confirmedPlayers);
```

## 📊 Modelos de Dados

### User
```javascript
{
  name, email, password,
  avatar, role,
  skills: { shooting, passing, dribbling, defense, physical, goalkeeping },
  stats: { gamesPlayed, wins, draws, losses, goals, assists, mvpCount },
  preferredPosition
}
```

### Game
```javascript
{
  date, location, maxPlayers, status,
  attendees: [{ user, confirmedAt, status }],
  teams: { teamA: [], teamB: [] },
  result: { scoreA, scoreB, mvp, finishedAt },
  cost: { total, perPlayer }
}
```

### Transaction
```javascript
{
  type, category, amount, description, date,
  user, game, createdBy,
  isPaid, paymentDate, paymentMethod
}
```

### Suggestion
```javascript
{
  title, description, category, estimatedCost,
  status, createdBy,
  votes: [{ user, votedAt }],
  comments: [{ user, text, createdAt }]
}
```

### Message
```javascript
{
  user, content, type, channel,
  imageUrl, replyTo,
  reactions: [{ emoji, users: [] }],
  readBy: [{ user, readAt }]
}
```

## 🔒 Segurança

- **JWT** - Tokens com expiração configurável
- **Bcrypt** - Hash de senhas com salt
- **Helmet** - Headers de segurança HTTP
- **Rate Limiting** - Proteção contra DDoS
- **CORS** - Controle de origem
- **Validation** - Mongoose schemas com validação

## 🧪 Desenvolvimento

```bash
# Watch mode com nodemon
npm run dev

# Popular banco com dados de teste
npm run seed

# Produção
npm start
```

## 📁 Estrutura de Pastas

```
api/
├── src/
│   ├── config/         # Configurações (DB, env)
│   ├── controllers/    # Lógica de negócio
│   ├── middleware/     # Auth, error, upload
│   ├── models/         # Schemas Mongoose
│   ├── routes/         # Rotas Express
│   ├── services/       # AI, Socket.io
│   ├── utils/          # Utilitários
│   └── server.js       # Entry point
├── uploads/            # Arquivos enviados
├── .env.example        # Variáveis de ambiente
├── package.json
└── README.md
```

## 🚀 Deploy

### MongoDB Atlas
1. Criar cluster no [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Copiar connection string para `MONGODB_URI`

### Heroku / Railway / Render
```bash
# Adicionar variáveis de ambiente
# Fazer push do código
# A aplicação inicia automaticamente com npm start
```

## 📝 Notas

- **Uploads**: Arquivos são salvos em `/uploads` (criar pasta se não existir)
- **JWT Secret**: MUDE em produção!
- **MongoDB**: Certifique-se que está rodando localmente ou use Atlas
- **CORS**: Configure origins permitidas em produção

## 🤝 Integração com Frontend

O frontend espera a API em:
- **Base URL**: `http://localhost:5000/api`
- **Socket URL**: `http://localhost:5000`

Configure no frontend (`.env.local`):
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

## 📄 License

MIT

---

**Desenvolvido para gestão completa de clube de futsal** ⚽🔥
