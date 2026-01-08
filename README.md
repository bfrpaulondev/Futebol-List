# ⚽ Futebol App - Full Stack

Aplicação Full Stack para gestão completa de clube de futsal com React + Node.js + MongoDB.

## 🚀 Features

- ✅ **Confirmação de presenças** em tempo real
- 🎲 **Sorteio de equipas com IA** - Algoritmo de balanceamento por skills
- 💬 **Chat em tempo real** - Socket.io com múltiplos canais
- 💰 **Gestão financeira** - Transações, saldo e sugestões com votação
- 📊 **Avaliação de jogadores** pós-jogo e estatísticas
- 📅 **Calendário de responsabilidades**
- 👤 **Perfil completo** com skills, stats e rankings
- 🔒 **Autenticação JWT** - Sistema seguro de login/registro
- 📱 **Responsivo** - Interface adaptada para mobile

## 🛠️ Tech Stack

### Frontend
- **React 18** + **Vite** - UI Framework
- **React Router v6** - Routing
- **Axios** - HTTP client
- **Socket.io Client** - WebSocket real-time
- **Zustand** - State management
- **Framer Motion** - Animations
- **React Hook Form** + **Zod** - Forms & validation
- **date-fns** - Date formatting

### Backend (API)
- **Node.js** + **Express** - Server framework
- **MongoDB** + **Mongoose** - Database
- **Socket.io** - WebSocket server
- **JWT** - Authentication
- **Bcrypt** - Password hashing
- **Multer** - File uploads
- **Helmet** - Security headers
- **Rate Limiting** - DDoS protection

## ⚡ Início Rápido

### Opção 1: Script Automático (Recomendado)

```bash
# Executar script de setup
./setup.sh

# Seguir instruções na tela
```

### Opção 2: Manual

#### 1️⃣ MongoDB (obrigatório)
```bash
# Iniciar MongoDB
sudo systemctl start mongodb
# ou com Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

#### 2️⃣ Backend API
```bash
cd api
npm install
cp .env.example .env
npm run seed    # Popular com dados de teste
npm run dev     # Iniciar servidor
```

API rodando em: **http://localhost:5000**

#### 3️⃣ Frontend
```bash
npm install
cp .env.example .env.local
npm run dev
```

Frontend em: **http://localhost:5173**

## 👤 Credenciais de Teste

Após executar `npm run seed` na API:

- **Admin**: `admin@futebol.com` / `admin123`
- **Usuário**: `joao@futebol.com` / `joao123`

## 📦 Instalação Completa

```bash
# Instalar dependências do frontend
npm install

# Instalar dependências da API
cd api
npm install

# Configurar variáveis de ambiente
cp .env.example .env        # API
cd ..
cp .env.example .env.local  # Frontend

# Popular banco (recomendado)
cd api
npm run seed

# Iniciar em modo desenvolvimento
npm run dev
