# Postaí — Setup

## 1. Abra o terminal na pasta do projeto

No Windows Explorer, navegue até `ig-planner/Planner de Feed` e clique com o botão direito → "Abrir no Terminal" (ou Git Bash).

## 2. Delete a pasta node_modules existente e reinstale

```bash
rmdir /s /q node_modules
npm install
```

Ou no Git Bash:
```bash
rm -rf node_modules
npm install
```

## 3. Rode o servidor de desenvolvimento

```bash
npm run dev
```

Acesse: **http://localhost:3000**

---

## Chaves de API (já configuradas no .env.local)

O arquivo `.env.local` já contém suas chaves. Ele está no `.gitignore` — nunca suba ele pro GitHub.

---

## Como usar o app

1. Acesse `http://localhost:3000`
2. Clique em **Começar agora**
3. **Arraste suas fotos** ou clique para selecionar (até 50 por vez)
4. Clique em **✨ Processar com IA** — a Lumi vai:
   - Analisar todas as fotos
   - Editar automaticamente (brilho, contraste, cores)
   - Organizar o feed na melhor ordem
   - Criar legendas e hashtags
   - Montar o calendário de postagens
5. Revise o feed, **arraste para reordenar**
6. Clique numa foto para editar individualmente
7. Converse com a **Lumi** (chat) para pedir mudanças
8. Clique **✓ Aprovar tudo** quando estiver pronto

---

## Próximos passos (v2)

- Integração com Instagram API para publicar automaticamente
- Editor de Reels
- Histórico e análise de performance
- Modo mobile
