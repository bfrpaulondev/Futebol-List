# 🚀 Deploy Frontend na Vercel - Guia Rápido

## ✅ Pré-requisitos

- [x] Build local testado e funcionando (`npm run build`)
- [x] Código commitado e pusheado para GitHub
- [x] Repositório: https://github.com/bfrpaulondev/Futebol-List

## 📝 Passos para Deploy

### 1. Acesse a Vercel

1. Vá para: https://vercel.com
2. Faça login com sua conta GitHub
3. Autorize a Vercel a acessar seus repositórios

### 2. Importe o Projeto

1. Clique em **"Add New..."** → **"Project"**
2. Procure por `Futebol-List` na lista de repositórios
3. Clique em **"Import"**

### 3. Configure o Projeto

**Framework Preset**: Vite
**Root Directory**: `./` (raiz do projeto)
**Build Command**: `npm run build`
**Output Directory**: `dist`
**Install Command**: `npm install`

### 4. Configure as Variáveis de Ambiente

Clique em **"Environment Variables"** e adicione:

```
VITE_API_BASE_URL = https://sua-api-backend.onrender.com/api
VITE_SOCKET_URL = https://sua-api-backend.onrender.com
VITE_APP_NAME = Futebol App
VITE_MAX_PLAYERS = 12
```

⚠️ **IMPORTANTE**: 
- Substitua `sua-api-backend.onrender.com` pela URL do seu backend quando fizer o deploy da API
- Por enquanto, deixe como `http://localhost:5000` se quiser testar localmente

### 5. Deploy!

1. Clique em **"Deploy"**
2. Aguarde 2-3 minutos
3. Sua aplicação estará disponível em: `https://futebol-list.vercel.app` (ou URL gerada)

## 🔄 Atualizações Automáticas

Após o deploy inicial, qualquer push para a branch `main` irá:
- ✅ Disparar build automático
- ✅ Deploy automático se o build passar
- ✅ URL permanece a mesma

## 🎯 Próximos Passos

### Após Deploy do Frontend

1. **Deploy da API Backend**
   - Repositório: https://github.com/bfrpaulondev/futebol-backend
   - Plataforma recomendada: **Render.com** (100% grátis)
   - Siga as instruções em: `futebol-backend/README.md`

2. **Atualizar URLs da API**
   - Na Vercel, vá em **Settings** → **Environment Variables**
   - Atualize `VITE_API_BASE_URL` e `VITE_SOCKET_URL` com a URL do Render
   - Faça um **Redeploy** do frontend

3. **Configurar CORS no Backend**
   - No Render, adicione a variável de ambiente:
   ```
   CORS_ORIGIN = https://futebol-list.vercel.app
   ```

## 🧪 Testando o Deploy

### 1. Acesse a URL do Vercel
```
https://futebol-list.vercel.app
```

### 2. Verifique se:
- [x] A página carrega corretamente
- [x] Design está responsivo
- [x] Navegação funciona
- [ ] API conecta (só funcionará após deploy do backend)

### 3. Teste a Integração com API

Após deploy do backend, teste:

1. **Registro**: Crie uma conta
2. **Login**: Faça login com a conta criada
3. **Chat**: Envie uma mensagem (Socket.io)
4. **Presença**: Confirme presença em um jogo
5. **Perfil**: Atualize seu perfil

## 🐛 Troubleshooting

### Build falha na Vercel

**Erro**: `terser not found`
**Solução**: Já resolvido! `terser` está em `dependencies`

### CORS Error

**Erro**: `Access-Control-Allow-Origin`
**Solução**: 
1. Certifique-se que o backend tem a URL do frontend em `CORS_ORIGIN`
2. Backend: `CORS_ORIGIN=https://futebol-list.vercel.app`

### API não conecta

**Erro**: `Network Error` ou `Connection refused`
**Solução**:
1. Verifique se a URL da API está correta nas env vars
2. Teste o endpoint: `curl https://sua-api.onrender.com/health`
3. Backend deve estar rodando

### Socket.io não conecta

**Erro**: `WebSocket connection failed`
**Solução**:
1. `VITE_SOCKET_URL` deve ser a URL base (sem `/api`)
2. Backend deve suportar WebSocket
3. Plataformas gratuitas que suportam WebSocket: Render, Railway

## 📊 Monitoramento

### Ver Logs no Vercel

1. Vá para o projeto na Vercel
2. Clique em **"Deployments"**
3. Selecione um deployment
4. Clique em **"Building"** ou **"Function Logs"**

### Analytics

A Vercel oferece analytics gratuito:
- Visitas
- Performance
- Web Vitals

## 🎉 Pronto!

Seu frontend está no ar! 🚀

**URL do Frontend**: https://futebol-list.vercel.app
**Repositório**: https://github.com/bfrpaulondev/Futebol-List

---

**Próximo passo**: Deploy da API no Render.com
**Repositório Backend**: https://github.com/bfrpaulondev/futebol-backend
