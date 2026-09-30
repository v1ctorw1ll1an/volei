# 🏐 Clube de Vôlei

App simples para substituir a lista do WhatsApp: quem vai em cada jogo, lista de espera,
divisão do valor da quadra e controle de quem já pagou. Os comprovantes continuam no WhatsApp —
o app guarda só o status (não pago → aguardando → pago).

**Stack:** Next.js 16 (App Router + Server Actions) · Prisma 7 + Postgres (Neon) · Tailwind v4 + daisyUI 5 ·
auth própria (bcrypt + cookie JWT com `jose`).

## Como funciona

- **Qualquer pessoa cria uma conta** (nome, e-mail, WhatsApp e senha) e **cria eventos**.
- O evento é compartilhado **por link** (botões "Enviar no WhatsApp" / "Copiar link"). Quem abre o link sem
  estar logado passa pelo login ou cadastro e volta direto para o evento.
- **Meus eventos** mostra só os eventos que a pessoa criou ou dos quais participa; os demais são privados.
  Quem abre o link vê data, local, valor e número de vagas, mas só vê **quem participa** depois de entrar na lista.
- Só **quem criou o evento** (ou um superadmin) edita: dados, lista, pagamentos, fechar/cancelar/excluir.
  O organizador vê o WhatsApp dos participantes, pode **remover** alguém (que pode voltar pelo link) ou
  **remover e bloquear** (a pessoa não abre mais aquele evento; dá para desbloquear).
- Vagas opcionais; quem passa da capacidade entra na **lista de espera** por ordem de chegada.
- **Valor por pessoa** = valor da quadra ÷ confirmados (sem a espera), arredondado para cima no centavo;
  congela ao **fechar** o evento.
- "Paguei" do participante → organizador confirma. Os comprovantes continuam no WhatsApp.
- Cada pessoa tem os próprios **modelos** de evento (setup reutilizável).
- **Tutorial guiado** de como criar um evento no primeiro acesso (e no botão "Como criar?").

| Papel | Pode |
| --- | --- |
| Usuário | Criar e organizar os próprios eventos; entrar em eventos pelo link |
| Superadmin | Tudo acima + editar qualquer evento, ver todos os eventos, gerenciar pessoas (senha provisória, desativar), temas e nome do clube |

Esqueceu a senha? Só o superadmin redefine (senha provisória, com troca obrigatória no próximo login).
O WhatsApp de suporte configurado em **Configurações** aparece na tela de login.

**Proteções:** campo-armadilha contra robôs no cadastro; limite de 5 cadastros/hora por IP e de erros de login
(8 por e-mail e 20 por IP a cada 15 minutos).

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
  (app)/page.tsx                      # meus eventos
  cadastro/, completar-cadastro/      # conta nova; WhatsApp para contas antigas
  (app)/eventos/[id]/                 # evento: visitante / participante / organizador
  (app)/eventos/novo, modelos/, perfil/
  (app)/admin/{eventos,usuarios,config}/   # só superadmin
lib/
  auth.ts session.ts                  # senha, cookie, requireUser/requireAuth/requireManager
  rate-limit.ts whatsapp.ts           # limite de tentativas; normalização do WhatsApp
  queue.ts pricing.ts                 # confirmados × espera, divisão do valor
  actions/*.ts                        # server actions (todas checam papel no servidor)
  email.ts                            # Resend opcional (no-op sem RESEND_API_KEY)
proxy.ts                              # sem login → /login; senha provisória → /trocar-senha
prisma/schema.prisma, prisma/seed.ts
```
