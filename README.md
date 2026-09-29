# 🏐 Clube de Vôlei

App simples para substituir a lista do WhatsApp: quem vai em cada jogo, lista de espera,
divisão do valor da quadra e controle de quem já pagou. Os comprovantes continuam no WhatsApp —
o app guarda só o status (não pago → aguardando → pago).

**Stack:** Next.js 16 (App Router + Server Actions) · Prisma 7 + Postgres (Neon) · Tailwind v4 + daisyUI 5 ·
auth própria (bcrypt + cookie JWT com `jose`).

## Papéis

| Papel | Pode |
| --- | --- |
| Membro | Entrar/sair de agendas abertas, marcar “paguei” |
| Organizador (`ADMIN`) | Criar/editar agendas e modelos, mexer na lista, confirmar pagamentos, redefinir senhas |
| Superadmin | Tudo acima + cadastrar pessoas, definir papéis, nome do clube e temas |

Não há envio de e-mail: o superadmin cadastra cada pessoa com uma senha provisória (passada pelo
WhatsApp) e o primeiro login obriga a troca. Esqueceu a senha? Um organizador define outra provisória.

## Regras

- Vagas opcionais por agenda; quem passa da capacidade entra na **lista de espera** por ordem de chegada.
  Se alguém sai, o primeiro da espera sobe automaticamente.
- **Valor por pessoa** = valor da quadra ÷ confirmados (sem a espera), arredondado para cima no centavo.
- Ao **fechar** a agenda o valor por pessoa congela. Reabrir e fechar de novo recalcula.
- Datas são digitadas e exibidas no fuso de São Paulo.
- Organizadores veem um **tutorial guiado** de como criar uma agenda no primeiro acesso (e pelo botão “Como criar?”).
- Tema claro/escuro segue o aparelho (ou o botão ◐ na barra); o superadmin escolhe quais temas do daisyUI
  são o “claro” e o “escuro” em **Configurações**.

## Rodando localmente

```bash
cp .env.example .env          # preencha DATABASE_URL, AUTH_SECRET e SEED_*
npm install
npm run db:migrate            # cria as tabelas
npm run db:seed               # cria o superadmin
npm run dev
```

Um Postgres local rápido com Docker:

```bash
docker run -d --name volei-pg -e POSTGRES_PASSWORD=volei -e POSTGRES_DB=volei -p 54329:5432 postgres:17-alpine
# DATABASE_URL="postgresql://postgres:volei@localhost:54329/volei"
```

## Deploy na Vercel (plano free)

1. Suba o repositório no GitHub e importe o projeto na Vercel.
2. Em **Storage → Marketplace**, adicione o **Neon** ao projeto (injeta `DATABASE_URL` e `DATABASE_URL_UNPOOLED`).
3. Em **Settings → Environment Variables**, defina `AUTH_SECRET` (`openssl rand -base64 32`).
   Opcional: `RESEND_API_KEY` e `EMAIL_FROM`.
4. Faça o deploy. O script `vercel-build` roda `prisma migrate deploy` antes do `next build`.
5. Crie o superadmin uma vez, apontando para o banco de produção:
   ```bash
   DATABASE_URL="<url do Neon>" SEED_ADMIN_EMAIL="voce@exemplo.com" SEED_ADMIN_PASSWORD="provisoria" npm run db:seed
   ```

## Estrutura

```
app/
  login/, trocar-senha/, sair/        # auth
  (app)/page.tsx                      # próximas agendas
  (app)/agendas/[id]/                 # lista, entrar/sair, paguei, controles do organizador
  (app)/admin/{agendas,templates,usuarios,config}/
lib/
  auth.ts session.ts                  # senha, cookie, requireUser/requireRole
  queue.ts pricing.ts                 # confirmados × espera, divisão do valor
  actions/*.ts                        # server actions (todas checam papel no servidor)
  email.ts                            # Resend opcional (no-op sem RESEND_API_KEY)
proxy.ts                              # sem login → /login; senha provisória → /trocar-senha
prisma/schema.prisma, prisma/seed.ts
```
