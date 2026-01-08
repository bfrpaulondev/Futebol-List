# 🚀 Guia de Deploy

## 📦 Deploy do Backend (API)

### Opção 1: Railway.app (Recomendado)

1. **Criar conta no Railway**: https://railway.app
2. **Novo Projeto**:
   ```bash
   railway login
   railway init
   railway link
   ```
3. **Adicionar MongoDB**:
   - Dashboard → New → Database → MongoDB
   - Copiar `MONGODB_URI` gerada
4. **Variáveis de ambiente**:
   ```env
   NODE_ENV=production
   PORT=5000
   MONGODB_URI=mongodb://... (do Railway)
   JWT_SECRET=gerar_segredo_forte_aqui
   JWT_EXPIRE=7d
   CORS_ORIGIN=https://seu-frontend.vercel.app
   ```
5. **Deploy**:
   ```bash
   railway up
   ```

### Opção 2: Render.com

1. **Criar conta no Render**: https://render.com
2. **New Web Service**:
   - Conectar repositório GitHub
   - Root Directory: `api`
   - Build Command: `npm install`
   - Start Command: `npm start`
3. **Adicionar variáveis de ambiente** (igual acima)
4. **MongoDB Atlas**:
   - Criar cluster: https://www.mongodb.com/cloud/atlas
   - Whitelist IP: 0.0.0.0/0 (allow all)
   - Copiar connection string

### Opção 3: Heroku

```bash
# Instalar Heroku CLI
heroku login
heroku create nome-do-app

# Adicionar MongoDB
heroku addons:create mongolab:sandbox

# Configurar vars
heroku config:set JWT_SECRET=seu_segredo
heroku config:set CORS_ORIGIN=https://seu-frontend.app

# Deploy
git subtree push --prefix api heroku main
```

## 🌐 Deploy do Frontend

### Opção 1: Vercel (Recomendado)

1. **Instalar Vercel CLI**:
   ```bash
   npm i -g vercel
   ```
2. **Deploy**:
   ```bash
   vercel
   ```
3. **Variáveis de ambiente** (Dashboard):
   ```env
   VITE_API_BASE_URL=https://sua-api.railway.app/api
   VITE_SOCKET_URL=https://sua-api.railway.app
   ```
4. **Redeploy após configurar env vars**

### Opção 2: Netlify

1. **Criar conta**: https://netlify.com
2. **Novo site do Git**:
   - Conectar repositório
   - Build command: `npm run build`
   - Publish directory: `dist`
3. **Environment variables**:
   ```env
   VITE_API_BASE_URL=https://sua-api.railway.app/api
   VITE_SOCKET_URL=https://sua-api.railway.app
   ```

### Opção 3: GitHub Pages + Backend separado

```bash
# Build
npm run build

# Deploy para gh-pages branch
npm install -g gh-pages
gh-pages -d dist
```

## 🗄️ MongoDB Atlas (Produção)

1. **Criar conta**: https://www.mongodb.com/cloud/atlas
2. **Criar cluster grátis** (M0)
3. **Database Access**:
   - Add new user (username/password)
4. **Network Access**:
   - Allow access from anywhere: `0.0.0.0/0`
5. **Conectar**:
   - Connect → Connect your application
   - Copiar connection string
   - Substituir `<password>` pela senha
6. **String de conexão**:
   ```
   mongodb+srv://user:password@cluster.mongodb.net/futebol-app?retryWrites=true&w=majority
   ```

## 🔒 Segurança em Produção

### Checklist Essencial

- [ ] **JWT_SECRET** único e forte (mínimo 32 caracteres)
- [ ] **CORS_ORIGIN** restrito ao domínio do frontend
- [ ] **Rate Limiting** ativado
- [ ] **MongoDB** com senha forte
- [ ] **Network Access** do MongoDB configurado
- [ ] **HTTPS** ativado (automático na maioria dos hosts)
- [ ] **.env** NUNCA commitado no Git
- [ ] **Logs** configurados para produção
- [ ] **Error handling** sem expor detalhes internos

### Gerar JWT Secret forte

```bash
# Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# OpenSSL
openssl rand -hex 64

# Online (use com cuidado)
https://www.grc.com/passwords.htm
```

## 📊 Variáveis de Ambiente

### Backend (.env production)

```env
NODE_ENV=production
PORT=5000

# MongoDB Atlas
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/futebol-app

# JWT (MUDAR!)
JWT_SECRET=seu_segredo_super_forte_minimo_32_caracteres_aqui
JWT_EXPIRE=7d

# CORS (URL do frontend)
CORS_ORIGIN=https://seu-app.vercel.app

# Upload
MAX_FILE_SIZE=5242880
UPLOAD_PATH=./uploads
```

### Frontend (.env production)

```env
VITE_API_BASE_URL=https://sua-api.railway.app/api
VITE_SOCKET_URL=https://sua-api.railway.app
VITE_APP_NAME=Futebol App
```

## 🧪 Testar Produção

```bash
# Testar API
curl https://sua-api.railway.app/health

# Testar login
curl -X POST https://sua-api.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@futebol.com","password":"admin123"}'
```

## 📝 Pós-Deploy

### Popular Banco de Produção

**⚠️ CUIDADO**: Só faça isso uma vez!

```bash
# Localmente, apontando para MongoDB Atlas
cd api
MONGODB_URI="mongodb+srv://..." npm run seed
```

### Ou via Railway CLI

```bash
railway run npm run seed
```

### Ou criar admin manualmente

Use a rota `/api/auth/register` com os dados:

```json
{
  "name": "Admin",
  "email": "admin@futebol.com",
  "password": "admin123",
  "role": "admin"
}
```

## 🔄 CI/CD Automático

### Railway (Automático)

- Cada push para `main` → auto-deploy

### GitHub Actions (para Vercel)

Criar `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## 🐛 Troubleshooting

### API não conecta ao MongoDB

```
Error: connect ECONNREFUSED
```

**Solução**: Verificar:
- String de conexão correta
- Username/password corretos
- Network Access permite seu IP
- Cluster está ativo

### CORS Error no Frontend

```
Access-Control-Allow-Origin blocked
```

**Solução**: 
- Adicionar URL do frontend em `CORS_ORIGIN`
- Reiniciar API após mudar env vars

### Socket.io não conecta

**Solução**:
- Verificar `VITE_SOCKET_URL` aponta para API
- Verificar CORS inclui origin do frontend
- Verificar WebSocket não está bloqueado

### Upload de arquivos falha

**Solução**:
- Verificar pasta `uploads/` existe
- Verificar permissões de escrita
- Para Railway/Render: usar serviço externo (S3, Cloudinary)

## 📚 Recursos Úteis

- Railway Docs: https://docs.railway.app
- Vercel Docs: https://vercel.com/docs
- MongoDB Atlas: https://docs.atlas.mongodb.com
- Render Docs: https://render.com/docs

## 💾 Backup do Banco

```bash
# Export (local)
mongodump --uri="mongodb+srv://..." --out=./backup

# Import
mongorestore --uri="mongodb+srv://..." ./backup
```

---

**Boa sorte com o deploy! 🚀⚽**
