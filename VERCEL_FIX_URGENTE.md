# 🚨 PROBLEMA: Frontend não conecta à API

## ❌ Problema Identificado

O site https://futebol-list.vercel.app **não consegue se conectar à API** porque as **variáveis de ambiente não estão configuradas no Vercel**.

### Por que isso acontece?

O Vite injeta as variáveis `VITE_*` durante o **build**. Se elas não estiverem configuradas no Vercel, o build usará os valores padrão do `.env.example` (que apontam para `localhost:5000`).

---

## ✅ SOLUÇÃO RÁPIDA (5 minutos)

### Passo 1: Acessar o Vercel Dashboard

1. Acesse: https://vercel.com/dashboard
2. Clique no projeto **futebol-list** (ou Futebol-List)
3. Vá em **Settings** (no topo)
4. No menu lateral, clique em **Environment Variables**

### Passo 2: Adicionar as Variáveis

Adicione cada uma dessas 4 variáveis:

#### Variável 1:
```
Name: VITE_API_BASE_URL
Value: https://futebol-api-6d10.onrender.com/api
Environments: ✅ Production ✅ Preview ✅ Development
```

#### Variável 2:
```
Name: VITE_SOCKET_URL
Value: https://futebol-api-6d10.onrender.com
Environments: ✅ Production ✅ Preview ✅ Development
```

#### Variável 3:
```
Name: VITE_APP_NAME
Value: Futebol App
Environments: ✅ Production ✅ Preview ✅ Development
```

#### Variável 4:
```
Name: VITE_MAX_PLAYERS
Value: 12
Environments: ✅ Production ✅ Preview ✅ Development
```

### Passo 3: Redeploy

1. Após adicionar as 4 variáveis, vá em **Deployments** (no topo)
2. Clique no último deployment (o mais recente)
3. Clique nos três pontos `...` (canto direito)
4. Clique em **Redeploy**
5. Marque a opção **"Use existing Build Cache"** (opcional, para ser mais rápido)
6. Clique em **Redeploy**

### Passo 4: Aguardar

- O build levará ~2-3 minutos
- Aguarde até ver **"Ready"** (checkmark verde)
- Acesse novamente: https://futebol-list.vercel.app

---

## 🎯 Como Verificar se Funcionou

Após o redeploy:

1. Acesse: https://futebol-list.vercel.app
2. Abra o **DevTools** (F12)
3. Vá em **Console**
4. Tente fazer login com:
   - Email: `admin@futebol.com`
   - Password: `admin123456`

Se funcionar, você verá:
- ✅ Token JWT salvo no localStorage
- ✅ Redirecionamento para /dashboard
- ✅ Dados carregando da API

---

## 🔍 Diagnosticar Problema Atual

Para verificar o que está acontecendo agora:

### Via Browser (DevTools)

1. Acesse: https://futebol-list.vercel.app
2. Abra **DevTools** (F12)
3. Vá em **Console**
4. Procure por erros de:
   - `CORS`
   - `Network Error`
   - `localhost:5000` (indica variável não configurada)

### Via Código

O frontend provavelmente está tentando acessar:
```
http://localhost:5000/api
```

Ao invés de:
```
https://futebol-api-6d10.onrender.com/api
```

---

## ⚠️ IMPORTANTE

### Vite e Variáveis de Ambiente

O Vite funciona assim:

1. **Durante o build**, ele pega as variáveis `VITE_*`
2. **Substitui** no código JavaScript
3. **Gera** o bundle final com os valores

**Consequência:**
- Se você adicionar variáveis **DEPOIS** do build, precisa fazer **REDEPLOY**
- O arquivo `.env.production` é usado apenas localmente, **NÃO no Vercel**
- O Vercel usa as variáveis configuradas no Dashboard

### Diferença entre .env.local e Vercel

| Arquivo | Onde é usado | Como configurar |
|---------|--------------|-----------------|
| `.env.example` | Template (não usado) | - |
| `.env.local` | Desenvolvimento local | Criar o arquivo |
| `.env.production` | Build local | Criar o arquivo |
| **Vercel Env Vars** | **Build na Vercel** | **Dashboard → Settings** |

---

## 📸 Guia Visual (Passo a Passo)

### 1. Acessar Vercel Dashboard
```
https://vercel.com/dashboard
↓
Clicar no projeto "futebol-list"
↓
Settings (menu superior)
↓
Environment Variables (menu lateral)
```

### 2. Adicionar Variável
```
Clicar em "Add New"
↓
Name: VITE_API_BASE_URL
Value: https://futebol-api-6d10.onrender.com/api
Environments: Marcar todos
↓
Save
```

### 3. Repetir para as 4 Variáveis
- VITE_API_BASE_URL
- VITE_SOCKET_URL
- VITE_APP_NAME
- VITE_MAX_PLAYERS

### 4. Redeploy
```
Deployments (menu superior)
↓
Último deployment
↓
⋮ (três pontos)
↓
Redeploy
↓
Confirmar
```

---

## 🚀 Alternativa: Deploy Manual (se Vercel não funcionar)

Se você tiver problemas com o Vercel, pode tentar:

### Opção 1: Netlify (Grátis)

1. Acesse: https://www.netlify.com
2. Login com GitHub
3. **New site from Git**
4. Escolher repositório: `Futebol-List`
5. **Build settings:**
   - Build command: `npm run build`
   - Publish directory: `dist`
6. **Environment variables:**
   - Adicionar as 4 variáveis `VITE_*`
7. Deploy

### Opção 2: Cloudflare Pages (Grátis)

1. Acesse: https://dash.cloudflare.com
2. Pages → Create a project
3. Connect to Git → GitHub → `Futebol-List`
4. **Build settings:**
   - Framework preset: `Vite`
   - Build command: `npm run build`
   - Build output directory: `dist`
5. **Environment variables:**
   - Adicionar as 4 variáveis `VITE_*`
6. Save and Deploy

---

## 🔧 Troubleshooting

### Problema: "Still not working after redeploy"

**Possíveis causas:**

1. **Cache do Browser:**
   - Limpar cache (Ctrl+Shift+Delete)
   - Ou abrir em aba anônima (Ctrl+Shift+N)

2. **Variáveis não salvas:**
   - Voltar em Settings → Environment Variables
   - Verificar se as 4 variáveis estão listadas

3. **CORS não configurado:**
   - Verificar se `CORS_ORIGIN` no backend inclui o domínio do frontend
   - Render Dashboard → futebol-api → Environment Variables
   - Adicionar: `CORS_ORIGIN=https://futebol-list.vercel.app`

### Problema: "Network Error" no console

**Causa:** API offline ou CORS

**Solução:**
1. Testar API diretamente: https://futebol-api-6d10.onrender.com/health
2. Se não responder, o Render pode ter hibernado (free tier)
3. Aguardar 30-60 segundos e tentar novamente

### Problema: "localhost:5000" aparece nos erros

**Causa:** Variáveis de ambiente não configuradas

**Solução:** Voltar ao Passo 1 deste guia

---

## ✅ Checklist Final

Antes de considerar resolvido:

- [ ] 4 variáveis adicionadas no Vercel
- [ ] Redeploy realizado
- [ ] Build completado com sucesso (checkmark verde)
- [ ] Site acessível em https://futebol-list.vercel.app
- [ ] Login funciona
- [ ] API responde
- [ ] Sem erros no console

---

## 📞 Precisa de Ajuda?

Se após seguir este guia o problema persistir:

1. **Verificar logs do Vercel:**
   - Deployments → Último deployment → View Build Logs
   - Procurar por erros no build

2. **Verificar console do browser:**
   - F12 → Console
   - Copiar mensagens de erro

3. **Testar API diretamente:**
   - https://futebol-api-6d10.onrender.com/health
   - Se não responder, o problema é no backend

---

**Tempo estimado para resolução:** ~5 minutos  
**Dificuldade:** Fácil  
**Custo:** R$ 0,00

---

**Atualizado em:** 08 de Janeiro de 2026  
**Criado por:** Claude AI
