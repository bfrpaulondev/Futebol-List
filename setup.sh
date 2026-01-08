#!/bin/bash

echo "⚽ Futebol App - Setup Script"
echo "================================"
echo ""

# Check if MongoDB is running
echo "🔍 Verificando MongoDB..."
if ! pgrep -x "mongod" > /dev/null; then
    echo "⚠️  MongoDB não está rodando!"
    echo "Inicie o MongoDB primeiro:"
    echo "  - Linux/Mac: sudo systemctl start mongodb"
    echo "  - Docker: docker run -d -p 27017:27017 --name mongodb mongo:latest"
    exit 1
fi
echo "✅ MongoDB está rodando"
echo ""

# Setup API
echo "📦 Configurando API..."
cd api || exit

if [ ! -f ".env" ]; then
    echo "📝 Criando arquivo .env..."
    cp .env.example .env
fi

if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências da API..."
    npm install
fi

echo ""
echo "🌱 Deseja popular o banco com dados de teste? (s/n)"
read -r response
if [[ "$response" =~ ^([sS][iI][mM]|[sS])$ ]]; then
    echo "🌱 Populando banco de dados..."
    npm run seed
fi

echo ""
echo "✅ API configurada!"
echo ""

# Back to root
cd ..

# Setup Frontend
echo "📦 Configurando Frontend..."

if [ ! -f ".env.local" ]; then
    echo "📝 Criando arquivo .env.local..."
    cp .env.example .env.local
fi

if [ ! -d "node_modules" ]; then
    echo "📦 Instalando dependências do frontend..."
    npm install
fi

echo ""
echo "✅ Frontend configurado!"
echo ""
echo "================================"
echo "🎉 Setup concluído!"
echo ""
echo "Para iniciar a aplicação:"
echo ""
echo "1️⃣  API (em uma janela):"
echo "   cd api && npm run dev"
echo ""
echo "2️⃣  Frontend (em outra janela):"
echo "   npm run dev"
echo ""
echo "3️⃣  Acesse: http://localhost:5173"
echo ""
echo "👤 Login de teste:"
echo "   Email: admin@futebol.com"
echo "   Senha: admin123"
echo ""
echo "================================"
