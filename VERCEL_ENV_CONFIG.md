# 🔧 CONFIGURAÇÃO URGENTE - Vercel Environment Variables

## ⚠️ PROBLEMA IDENTIFICADO

O frontend está tentando conectar em `localhost:5000` ao invés da API em produção!

## ✅ SOLUÇÃO: Configurar Variáveis de Ambiente na Vercel

### Passo a Passo (5 minutos):

#### 1. Acesse o Dashboard da Vercel
```
https://vercel.com/dashboard
```

#### 2. Selecione o Projeto
- Clique em **"Futebol-List"** (ou nome do seu projeto frontend)

#### 3. Vá em Settings
- No menu lateral ou topo, clique em **"Settings"**

#### 4. Environment Variables
- No menu lateral, clique em **"Environment Variables"**

#### 5. Adicione as Variáveis

Clique em **"Add New"** e adicione CADA uma dessas variáveis:

##### Variável 1: API Base URL
```
Name:  VITE_API_BASE_URL
Value: https://futebol-api-6d10.onrender.com/api
```
Environments: ✅ Production ✅ Preview ✅ Development

##### Variável 2: Socket URL
```
Name:  VITE_SOCKET_URL
Value: https://futebol-api-6d10.onrender.com
```
Environments: ✅ Production ✅ Preview ✅ Development

##### Variável 3: App Name
```
Name:  VITE_APP_NAME
Value: Futebol App
```
Environments: ✅ Production ✅ Preview ✅ Development

##### Variável 4: Max Players
```
Name:  VITE_MAX_PLAYERS
Value: 12
```
Environments: ✅ Production ✅ Preview ✅ Development

#### 6. Salvar
- Clique em **"Save"** em cada variável

#### 7. Redeploy (IMPORTANTE!)

⚠️ **As variáveis só entram em vigor após redeploy!**

Opção A - Via Dashboard:
1. Vá em **"Deployments"**
2. Clique nos **3 pontinhos (...)** do último deployment
3. Clique em **"Redeploy"**
4. Confirme
5. Aguarde ~2-3 minutos

Opção B - Novo Commit:
```bash
# Qualquer mudança no código fará redeploy automático
git commit --allow-empty -m "trigger: redeploy com env vars"
git push origin main
```

## 🧪 Verificar se Funcionou

Após o redeploy, teste:

1. **Abra o Console do Navegador**
   - F12 → Console
   - Acesse: https://futebol-list.vercel.app

2. **Verifique as Variáveis**
   ```javascript
   console.log(import.meta.env.VITE_API_BASE_URL)
   // Deve mostrar: https://futebol-api-6d10.onrender.com/api
   ```

3. **Teste o Registro**
   - Clique em "Registrar"
   - Preencha os dados
   - Submeta

4. **Verifique no Network**
   - F12 → Network → XHR
   - Deve aparecer requisição para: `futebol-api-6d10.onrender.com`
   - NÃO deve aparecer: `localhost:5000`

## 📸 Como Deve Ficar

```
┌─────────────────────────────────────────────────────┐
│ Environment Variables                               │
├─────────────────────────────────────────────────────┤
│                                                     │
│ VITE_API_BASE_URL                                   │
│ https://futebol-api-6d10.onrender.com/api           │
│ ☑ Production ☑ Preview ☑ Development              │
│                                                     │
│ VITE_SOCKET_URL                                     │
│ https://futebol-api-6d10.onrender.com               │
│ ☑ Production ☑ Preview ☑ Development              │
│                                                     │
│ VITE_APP_NAME                                       │
│ Futebol App                                         │
│ ☑ Production ☑ Preview ☑ Development              │
│                                                     │
│ VITE_MAX_PLAYERS                                    │
│ 12                                                  │
│ ☑ Production ☑ Preview ☑ Development              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## ⏱️ Tempo Estimado

- Configurar variáveis: 3 minutos
- Redeploy: 2-3 minutos
- **Total: ~5-6 minutos**

## 🎯 Após Configurar

1. ✅ Frontend conectará na API em produção
2. ✅ Registro funcionará
3. ✅ Login funcionará
4. ✅ Socket.io (chat) funcionará
5. ✅ Todas as funcionalidades estarão operacionais

## 🆘 Se Não Funcionar

### Problema: Ainda conecta em localhost

**Solução:**
1. Limpe o cache do navegador (Ctrl+Shift+Delete)
2. Abra em aba anônima
3. Verifique se o redeploy terminou (Vercel Dashboard)
4. Espere 1-2 minutos após redeploy

### Problema: Erro de CORS

**Solução:**
1. Acesse Render Dashboard
2. Vá no serviço **futebol-api**
3. Environment → **CORS_ORIGIN**
4. Deve estar: `https://futebol-list.vercel.app`
5. **SEM** barra `/` no final

## 📞 Links Úteis

- Vercel Dashboard: https://vercel.com/dashboard
- Render Dashboard: https://dashboard.render.com
- API Swagger: https://futebol-api-6d10.onrender.com/api-docs
- Frontend: https://futebol-list.vercel.app

---

**⚠️ AÇÃO NECESSÁRIA: Configure as variáveis agora!**

Sem essa configuração, o frontend não consegue se comunicar com a API.

**Tempo: 5 minutos | Dificuldade: Fácil**
