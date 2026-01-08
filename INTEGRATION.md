# 🔗 Integração Frontend + Backend

## ✅ Status Atual

### Backend (API)
- ✅ Deploy: https://futebol-api-6d10.onrender.com
- ✅ Swagger Docs: https://futebol-api-6d10.onrender.com/api-docs
- ✅ Health Check: https://futebol-api-6d10.onrender.com/health

### Frontend
- 🔄 Repositório: https://github.com/bfrpaulondev/Futebol-List
- 🔄 Aguardando configuração das variáveis de ambiente na Vercel

## 📝 Passo a Passo para Integração

### 1. Testar API em Produção

```bash
# Health Check
curl https://futebol-api-6d10.onrender.com/health

# Registrar usuário
curl -X POST https://futebol-api-6d10.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Seu Nome",
    "email": "seu@email.com",
    "password": "senha123"
  }'

# Login
curl -X POST https://futebol-api-6d10.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "seu@email.com",
    "password": "senha123"
  }'
```

### 2. Configurar Vercel (Frontend)

1. **Acesse:** https://vercel.com/dashboard
2. **Selecione o projeto:** Futebol-List
3. **Vá em:** Settings → Environment Variables
4. **Configure as variáveis:**

```bash
VITE_API_BASE_URL=https://futebol-api-6d10.onrender.com/api
VITE_SOCKET_URL=https://futebol-api-6d10.onrender.com
VITE_APP_NAME=Futebol App
VITE_MAX_PLAYERS=12
```

5. **Aplique para todos os ambientes:**
   - [x] Production
   - [x] Preview
   - [x] Development

6. **Salve as mudanças**

### 3. Redeploy do Frontend

1. Na Vercel, vá em **Deployments**
2. Clique nos **3 pontinhos** do último deployment
3. Clique em **Redeploy**
4. Aguarde ~2-3 minutos

### 4. Atualizar CORS no Backend

⚠️ **IMPORTANTE:** O backend precisa permitir o domínio do frontend

1. **Acesse:** https://dashboard.render.com
2. **Selecione:** futebol-api
3. **Vá em:** Environment
4. **Edite a variável:** `CORS_ORIGIN`
5. **Valor:** `https://futebol-list.vercel.app` (ou sua URL da Vercel)
6. **Salve** e aguarde o redeploy automático

### 5. Testar Integração

#### A) Abra o Frontend
```
https://futebol-list.vercel.app
```

#### B) Teste o Registro
1. Clique em "Registrar"
2. Preencha o formulário
3. Clique em "Criar Conta"
4. Você deve ser redirecionado para o Dashboard

#### C) Teste o Login
1. Use as credenciais de teste (se fez seed):
   - Email: `admin@futebol.com`
   - Senha: `admin123`
2. Você deve entrar no sistema

#### D) Teste o Chat (Socket.io)
1. Vá para a página de Chat
2. Envie uma mensagem
3. A mensagem deve aparecer em tempo real

#### E) Teste o Jogo
1. Vá para "Próximo Jogo"
2. Clique em "Confirmar Presença"
3. Você deve aparecer na lista de confirmados

## 🐛 Troubleshooting

### 1. CORS Error

**Problema:**
```
Access to fetch at 'https://futebol-api...' has been blocked by CORS policy
```

**Solução:**
- No Render, configure `CORS_ORIGIN` com a URL exata do frontend
- Exemplo: `https://futebol-list.vercel.app`
- **SEM** barra `/` no final

### 2. API não responde

**Problema:** Primeira requisição demora muito

**Explicação:** 
- Render Free "dorme" após 15 min de inatividade
- Primeira requisição demora ~30s para "acordar"
- Requisições seguintes são normais

**Solução:**
- Use cron-job.org para manter ativa (opcional)
- Ping a cada 10 minutos: `https://futebol-api-6d10.onrender.com/health`

### 3. Socket.io não conecta

**Problema:** Chat não funciona, mensagens não aparecem

**Soluções:**
1. Verifique `VITE_SOCKET_URL` no Vercel
2. Deve ser: `https://futebol-api-6d10.onrender.com` (sem `/api`)
3. Render suporta WebSocket no plano Free
4. Abra o console do navegador e procure por erros

### 4. 401 Unauthorized

**Problema:** Todas as requisições retornam 401

**Soluções:**
1. Faça logout e login novamente
2. Limpe o localStorage: `localStorage.clear()`
3. Verifique se o token está sendo enviado (DevTools → Network → Headers)

### 5. MongoDB Connection Error

**Problema:** API retorna erro 500

**Solução:**
1. Verifique no Render Dashboard se o serviço está "Live"
2. Confira os logs: Render Dashboard → Logs
3. Verifique `MONGODB_URI` nas variáveis de ambiente

## 📊 Verificação Final

### Checklist de Integração

- [ ] API está respondendo: `curl https://futebol-api-6d10.onrender.com/health`
- [ ] Swagger acessível: https://futebol-api-6d10.onrender.com/api-docs
- [ ] Variáveis configuradas na Vercel
- [ ] CORS configurado no Render
- [ ] Frontend faz redeploy
- [ ] Registro funciona
- [ ] Login funciona
- [ ] Chat (Socket.io) funciona
- [ ] Presença em jogo funciona
- [ ] Avatar upload funciona

## 🎯 URLs Finais

```
Backend API:     https://futebol-api-6d10.onrender.com
Swagger Docs:    https://futebol-api-6d10.onrender.com/api-docs
Frontend:        https://futebol-list.vercel.app
```

## 🧪 Teste via Swagger

1. Acesse: https://futebol-api-6d10.onrender.com/api-docs
2. Teste o endpoint **POST /api/auth/register**
3. Clique em "Try it out"
4. Preencha os dados:
   ```json
   {
     "name": "Test User",
     "email": "test@test.com",
     "password": "123456"
   }
   ```
5. Clique em "Execute"
6. Copie o **token** retornado
7. Clique em "Authorize" (cadeado no topo)
8. Cole o token: `Bearer SEU_TOKEN_AQUI`
9. Agora teste os outros endpoints protegidos!

## 🎉 Tudo Integrado!

Quando tudo estiver funcionando:

✅ Frontend conecta na API
✅ Login/Registro funciona
✅ Socket.io conectado
✅ Dados salvos no MongoDB
✅ Sistema 100% operacional

**Custo Total: R$ 0,00/mês** 🎉

---

**Dúvidas?** Consulte:
- Swagger: https://futebol-api-6d10.onrender.com/api-docs
- Backend Repo: https://github.com/bfrpaulondev/futebol-backend
- Frontend Repo: https://github.com/bfrpaulondev/Futebol-List
