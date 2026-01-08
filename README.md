# ⚽ Futebol App - Frontend

Aplicação React para gestão completa de clube de futsal.

## 🚀 Features

- ✅ **Confirmação de presenças** em tempo real
- 🎲 **Sorteio de equipas com IA** 
- 💬 **Chat em tempo real** com Socket.io
- 💰 **Gestão financeira** e sugestões com votação
- 📊 **Avaliação de jogadores** e estatísticas
- 👤 **Perfis completos** com skills e rankings
- 📱 **100% Responsivo**

## 🛠️ Tech Stack

- **React 18** + **Vite** - Framework e build tool
- **React Router v6** - Navegação
- **Axios** - Cliente HTTP
- **Socket.io Client** - WebSocket real-time
- **Zustand** - Gerenciamento de estado
- **Framer Motion** - Animações
- **React Hook Form + Zod** - Formulários e validação
- **date-fns** - Formatação de datas

## 📦 Instalação

```bash
# Instalar dependências
npm install

# Configurar ambiente
cp .env.example .env.local
# Editar .env.local com a URL da sua API

# Rodar em desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview do build
npm run preview
```

## 🔧 Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz:

```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_APP_NAME=Futebol App
VITE_MAX_PLAYERS=12
```

## 🚀 Deploy

### Vercel (Recomendado)

1. **Push para GitHub**
   ```bash
   git push origin main
   ```

2. **Importar no Vercel**
   - Acesse: https://vercel.com
   - New Project → Import seu repositório
   - Configure as variáveis de ambiente
   - Deploy!

3. **Variáveis de Ambiente no Vercel**
   ```
   VITE_API_BASE_URL = https://sua-api.onrender.com/api
   VITE_SOCKET_URL = https://sua-api.onrender.com
   ```

### Netlify

```bash
npm run build
# Upload da pasta dist/ no Netlify
```

## 🏗️ Estrutura do Projeto

```
src/
├── components/     # Componentes React reutilizáveis
│   ├── chat/      # Componentes de chat
│   ├── finance/   # Componentes financeiros
│   ├── game/      # Componentes de jogos
│   ├── layout/    # Layout e navegação
│   ├── profile/   # Perfis de usuário
│   └── teams/     # Times e sorteios
├── pages/         # Páginas da aplicação
├── services/      # Integração com API
├── store/         # Zustand stores
├── hooks/         # Custom hooks
├── context/       # React Context
├── styles/        # Estilos globais
├── utils/         # Utilitários
└── router.jsx     # Configuração de rotas
```

## 📡 Integração com Backend

Este frontend requer a API backend rodando.

**Repositório Backend:** https://github.com/bfrpaulondev/futebol-backend

### Endpoints Utilizados

- **Auth**: `/api/auth/*` - Login e registro
- **Games**: `/api/games/*` - Jogos e presenças
- **Users**: `/api/users/*` - Perfis e rankings
- **Finance**: `/api/finance/*` - Finanças e sugestões
- **Chat**: `/api/chat/*` - Mensagens

### WebSocket Events

- `online_users` - Usuários online
- `chat:general` - Mensagens do chat
- `game:presence_changed` - Atualizações de presença
- `game:teams_updated` - Times sorteados

## 🧪 Scripts Disponíveis

```bash
npm run dev      # Desenvolvimento (localhost:5173)
npm run build    # Build de produção
npm run preview  # Preview do build
npm run lint     # Verificar código
```

## 🎨 Componentes Principais

### Dashboard
Visão geral com próximo jogo, presenças confirmadas e acesso rápido.

### Games
Sistema de confirmação/cancelamento de presença, visualização de jogadores confirmados.

### Teams
Sorteio de times com IA, visualização em campo, histórico de jogos.

### Chat
Chat em tempo real com Socket.io, múltiplos canais, reações.

### Finance
Controle financeiro, transações, sugestões com votação.

### Profile
Perfil do jogador, skills editáveis, estatísticas, histórico.

## 🔒 Autenticação

Sistema de autenticação JWT. O token é armazenado no localStorage e enviado automaticamente em todas as requisições.

```javascript
// Login
authService.login(email, password)

// Registro
authService.register(userData)

// Logout
authService.logout()
```

## 🐛 Troubleshooting

### API não conecta
- Verifique se a API está rodando
- Confirme as variáveis `VITE_API_BASE_URL` e `VITE_SOCKET_URL`
- Teste: `curl https://sua-api.com/health`

### CORS Error
- API deve ter o frontend na lista CORS
- Backend: `CORS_ORIGIN=https://seu-frontend.vercel.app`

### Socket.io não conecta
- Verifique `VITE_SOCKET_URL`
- Deve ser a URL base da API (sem `/api`)
- Backend deve permitir WebSocket

## 📝 Desenvolvimento

### Adicionar Nova Feature

1. Criar componente em `src/components/`
2. Criar página em `src/pages/` se necessário
3. Adicionar rota em `src/router.jsx`
4. Integrar com API via `src/services/`
5. Testar localmente
6. Commit e push

### Boas Práticas

- Componentes pequenos e reutilizáveis
- Use hooks customizados em `src/hooks/`
- Centralize estado global no Zustand
- Valide formulários com React Hook Form + Zod
- Mantenha API calls em `services/`

## 📄 License

MIT

---

**Frontend do sistema completo de gestão de futebol** ⚽🔥

**Backend:** https://github.com/bfrpaulondev/futebol-backend
