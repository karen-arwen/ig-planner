# Postaí — Setup

## 1. Instalar dependências

Abra o terminal dentro da pasta `mobile/`:

```bash
cd "Planner de Feed/mobile"
npm install
```

## 2. Configurar a chave da API

```bash
cp .env.example .env
```

Abra `.env` e coloque sua chave do Claude:
- Acesse https://console.anthropic.com
- Copie sua API key
- Cole no lugar do `sk-ant-xxxxx`

## 3. Testar no celular (via Expo Go)

1. Baixe o app **Expo Go** no celular (App Store ou Play Store)
2. No terminal, rode:
   ```bash
   npm start
   ```
3. Escaneie o QR code com a câmera (iPhone) ou com o Expo Go (Android)

## 4. Testar no emulador Android (opcional)

```bash
npm run android
```

---

## Estrutura do projeto

```
app/
  (tabs)/
    index.tsx    → Tela inicial (Início)
    feed.tsx     → Feed preview 3x3
    calendar.tsx → Calendário de posts
    inbox.tsx    → Inbox de fotos
  chat.tsx       → Chat com a Ami
  photo/[id].tsx → Detalhe da foto

store/           → Estado global (Zustand)
services/ami.ts  → Integração com Claude
types/           → Tipos TypeScript
constants/       → Cores e config
```

## Próximos passos

- [ ] Drag-and-drop no feed (react-native-draggable-flatlist)
- [ ] Edição de imagens (brilho, contraste)
- [ ] Integração Instagram API
- [ ] Persistência local (AsyncStorage ou MMKV)
- [ ] Notificações push
