# 🆓 DEPLOY GRATUITO - Passo a Passo

╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║     ⚽ DEPLOY 100% GRATUITO - RENDER + MONGODB ATLAS ⚽     ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝

✅ TUDO GRATUITO PARA SEMPRE!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌐 Render.com    → Backend API (GRÁTIS)
🗄️ MongoDB Atlas → Banco de dados (GRÁTIS)
▲ Vercel         → Frontend (já está lá, GRÁTIS)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🗄️ PARTE 1: CRIAR MONGODB ATLAS (GRÁTIS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣  Criar Conta
    → Acesse: https://www.mongodb.com/cloud/atlas/register
    → Cadastre-se (pode usar Google/GitHub)
    → GRÁTIS PARA SEMPRE!

2️⃣  Criar Cluster Gratuito
    → Após login, clique "Build a Database"
    → Escolha "M0 FREE" (512MB grátis)
    → Provider: AWS
    → Region: Escolha a mais próxima (ex: São Paulo)
    → Cluster Name: futebol-cluster
    → Clique "Create"

3️⃣  Configurar Acesso ao Banco
    → Aparecerá tela "Security Quickstart"
    
    A) Username e Password:
       - Username: admin
       - Password: (clique em Autogenerate Secure Password)
       - COPIE E GUARDE ESSA SENHA! ⚠️
       - Clique "Create User"
    
    B) Network Access:
       - Escolha "My Local Environment"
       - IP Address: 0.0.0.0/0
       - Description: Allow all
       - Clique "Add Entry"
       - Clique "Finish and Close"

4️⃣  Pegar String de Conexão
    → Clique em "Connect" no seu cluster
    → Escolha "Drivers"
    → Copie a connection string (algo como):
    
    mongodb+srv://admin:<password>@futebol-cluster.xxxxx.mongodb.net/?retryWrites=true&w=majority
    
    → SUBSTITUA <password> pela senha que você copiou!
    → GUARDE ESSA STRING! Vamos usar no Render

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌐 PARTE 2: DEPLOY NO RENDER.COM (GRÁTIS)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣  Criar Conta no Render
    → Acesse: https://render.com
    → Clique "Get Started"
    → Login com GitHub
    → Autorize o Render

2️⃣  Criar Web Service
    → No Dashboard, clique "New +"
    → Escolha "Web Service"
    → Clique "Build and deploy from a Git repository"
    → Clique "Next"

3️⃣  Conectar Repositório
    → Procure: bfrpaulondev/futebol-backend
    → Clique "Connect"

4️⃣  Configurar o Serviço
    Preencha os campos:

    Name: futebol-api
    
    Region: Oregon (US West) - GRÁTIS
    
    Branch: main
    
    Root Directory: api
    
    Runtime: Node
    
    Build Command: npm install
    
    Start Command: npm start
    
    Instance Type: Free
    
    ⚠️ IMPORTANTE: Selecione "Free" no Instance Type!

5️⃣  Adicionar Variáveis de Ambiente
    Role para baixo até "Environment Variables"
    Clique em "Add Environment Variable" e adicione:

    NODE_ENV
    production

    PORT
    10000

    MONGODB_URI
    [COLE A STRING DO MONGODB ATLAS AQUI]

    JWT_SECRET
    e210af7dd8f645d49fc38f92606f17d9317fff4890b72f11b969209840da8dfb25e80a6722723d094a2cfeca30e9a6ac57f0e4a1809955efa1d87509607cc7e2

    JWT_EXPIRE
    7d

    CORS_ORIGIN
    https://seu-frontend.vercel.app

    MAX_FILE_SIZE
    5242880

    UPLOAD_PATH
    ./uploads

    ⚠️ SUBSTITUA:
    - MONGODB_URI: Cole a string do Atlas (com senha)
    - CORS_ORIGIN: URL do seu frontend no Vercel

6️⃣  Criar o Serviço
    → Clique em "Create Web Service"
    → Aguarde 3-5 minutos (primeira vez demora um pouco)
    → Status mudará para "Live" 🟢

7️⃣  Pegar URL da API
    → No topo da página verá: https://futebol-api.onrender.com
    → COPIE ESSA URL!
    → Use no próximo passo

⚠️ LIMITAÇÕES DO PLANO GRÁTIS RENDER:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

- API "dorme" após 15 minutos sem uso
- Primeiro acesso após "dormir" demora ~30 segundos
- 750 horas/mês gratuitas (suficiente!)
- Perfeito para projetos pessoais/testes

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

▲ PARTE 3: CONFIGURAR FRONTEND NO VERCEL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣  Acessar Vercel
    → https://vercel.com/dashboard
    → Entre no seu projeto do frontend

2️⃣  Adicionar Variáveis de Ambiente
    → Settings → Environment Variables
    → Adicione:

    VITE_API_BASE_URL
    https://futebol-api.onrender.com/api

    VITE_SOCKET_URL
    https://futebol-api.onrender.com

    (Use a URL que você copiou do Render)

3️⃣  Redeploy
    → Deployments → ... (3 pontos) → Redeploy
    → Aguarde 1-2 minutos

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌱 PARTE 4: POPULAR BANCO DE DADOS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Opção 1: Usar o Frontend (Mais Fácil)
    → Acesse seu frontend
    → Clique em "Registrar"
    → Crie primeira conta de admin

Opção 2: Localmente
    cd api
    MONGODB_URI="sua_string_mongodb" npm run seed

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🧪 TESTAR TUDO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1️⃣  Testar API
    curl https://futebol-api.onrender.com/health

2️⃣  Testar Frontend
    → Acesse seu site no Vercel
    → Tente registrar/login
    → Deve funcionar! 🎉

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🐛 PROBLEMAS COMUNS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❌ "API não responde"
   ✅ Aguarde 30 segundos (API acordando)
   ✅ Verifique logs no Render (Logs tab)

❌ "MongoDB connection failed"
   ✅ Verifique se IP 0.0.0.0/0 está permitido no Atlas
   ✅ Confira se senha está correta na connection string
   ✅ Certifique-se que substituiu <password>

❌ "CORS error"
   ✅ Verifique CORS_ORIGIN no Render
   ✅ Deve ser exatamente a URL do Vercel (com https://)
   ✅ Redeploy após mudar

❌ "Socket.io não conecta"
   ⚠️  LIMITAÇÃO: Socket.io pode ter problemas no Render free
   ✅ Chat básico funcionará mas pode ter delay
   ✅ Para Socket.io perfeito, considere Railway ($5/mês)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

💡 DICAS IMPORTANTES
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Render Free "dorme" - normal esperar na primeira request
✅ MongoDB Atlas M0 é grátis PARA SEMPRE (512MB)
✅ Vercel frontend é grátis para sempre
✅ Mantenha API ativa: use cron-job.org para ping a cada 10min
✅ Logs disponíveis no Render Dashboard

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 RESUMO RÁPIDO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. MongoDB Atlas → Criar cluster M0 (grátis)
2. Render.com → Deploy do repositório backend (grátis)
3. Vercel → Adicionar env vars com URL do Render
4. Testar e usar! 🎉

TUDO 100% GRATUITO! 💰 = 0

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔗 LINKS ÚTEIS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌐 Render:          https://render.com
🗄️ MongoDB Atlas:   https://www.mongodb.com/cloud/atlas
▲ Vercel:           https://vercel.com
📊 GitHub Backend:  https://github.com/bfrpaulondev/futebol-backend

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎉 PRONTO! 100% GRÁTIS E FUNCIONANDO! ⚽🔥

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
