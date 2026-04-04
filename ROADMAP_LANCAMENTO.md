# ROADMAP DE LANÇAMENTO — Saiu Delivery SaaS
> Documento de trabalho do CTO · Atualizado em: 2026-04-01
> **Objetivo:** Colocar o 1º cliente pagante para dentro.

---

## Diagnóstico Rápido (Estado Atual)

| Área | Status | Observação |
|---|---|---|
| Landing Page B2B | 🟡 90% | CTAs apontam para `#`, sem form/fluxo real |
| Roteamento Multi-Tenant (Proxy) | ✅ 100% | Corrigido e com middleware ativo |
| Segurança (cookies HMAC, isolamento) | ✅ 100% | Fases 1 e 2 da auditoria concluídas |
| Cardápio / Checkout do cliente final | ✅ 85% | Storebranding hardcoded (Costa & Souza) |
| Painel Admin do Lojista | 🟡 70% | Auth ainda é senha global por env var |
| KDS / Motoboy | 🟡 80% | Funcional, branding hardcoded |
| **Onboarding do Lojista (Signup)** | ❌ 0% | Não existe. Bloqueador crítico de vendas |
| **Auth por Lojista (per-tenant)** | ❌ 0% | Senha global no .env — não escala |
| **Billing SaaS (cobrança R$ 97/mês)** | ❌ 0% | Não existe. Bloqueador crítico de receita |
| Schema de Branding (logo, cidade)  | ❌ 0% | Campos ausentes no Prisma |
| Metadata dinâmica por tenant (SEO) | ❌ 0% | Layout da loja com texto hardcoded |

---

## Decisões de Arquitetura (Tome Agora)

### Auth do Lojista
**Recomendação: Implementar manualmente com Prisma + `bcrypt` + cookie assinado (mesmo padrão HMAC já existente em `lib/session.ts`).**

- **Por quê não Clerk?** Clerk cobra por MAU (Monthly Active User). Para um SaaS com centenas de lojistas, o custo sobe rápido. Nosso sistema de cookie HMAC já está robusto.
- **Por quê não NextAuth?** Adiciona complexidade de configuração que não compensa no MVP.
- **Ação:** O modelo `User` no schema já existe com `password`. Basta implementar hash com `bcrypt` e reaproveitar o fluxo de `adminAuth.ts`.

### Billing SaaS
**Recomendação: Stripe (Subscriptions API).**

- **Por quê não Mercado Pago para billing?** MP não tem uma API de assinaturas recorrentes tão madura quanto Stripe para B2B. Stripe é padrão de mercado para SaaS billing.
- **Ação:** Criar `stripeCustomerId` e `stripeSubscriptionId` no model `Store`. Webhook Stripe atualiza `isActive` e `tier`.
- **Alternativa sem Stripe (MVP ultra-rápido):** Cobrar manualmente por Pix/transferência nos primeiros 5 clientes e ativar a loja manualmente pelo banco. Isso elimina 2 semanas de dev para validar o produto.

### Banco de Dados
**Manter Supabase + Prisma. Nenhuma mudança necessária.**

---

## FASE 0 — Infraestrutura e Bugfixes Críticos
> **Prioridade máxima. Bloqueiam tudo abaixo.**

### 0.1 · Variáveis de Ambiente Obrigatórias
- [ ] Adicionar `COOKIE_SECRET` ao `.env.local` e ao painel do Vercel/Railway
  - Gerar com: `openssl rand -base64 64`
  - Sem isso, todo login quebra com `Error: COOKIE_SECRET não configurado`
- [ ] Verificar se `ADMIN_PASSWORD` ainda faz sentido (será substituído na Fase 2)
- [ ] Documentar todas as variáveis em `.env.example`

### 0.2 · Bugfixes Herdados (Regressões da Fase 2)
- [ ] **`app/(store)/[slug]/orders/page.tsx`** — Linha 11: chama `getSessionUser()` sem `storeId`.
  Corrigir para receber `params: { slug }`, resolver o `storeId` pelo slug e passar para `getSessionUser(storeId)`.
- [ ] **`app/(store)/[slug]/pagamento/[id]/page.tsx`** — Linha 24: redirect para `/pedido/${id}` sem o slug.
  Corrigir para `redirect(`/${slug}/pedido/${order.id}`)`.
- [ ] **`app/(store)/[slug]/pedido/[id]/page.tsx`** — Sem validação de tenant. O pedido pode ser acessado por qualquer slug.
  Adicionar verificação `order.storeId === store.id`.

### 0.3 · Schema Prisma — Campos de Branding
- [ ] Adicionar ao model `Store` no `prisma/schema.prisma`:
  ```prisma
  logoUrl      String?
  coverImageUrl String?
  phone        String?
  city         String?
  tagline      String?
  ```
- [ ] Rodar `npx prisma migrate dev --name add_store_branding`

### 0.4 · Páginas de Erro
- [ ] Criar `app/not-found.tsx` (página 404 global)
- [ ] Criar `app/error.tsx` (boundary de erro global)

---

## FASE 1 — Conclusão da Vitrine B2B (Marketing)
> **Duração estimada: 1–2 dias**
> A landing page está quase pronta. Faltam o destino dos CTAs e o formulário de lead.

### 1.1 · Formulário de Interesse / Waitlist
- [ ] Criar `app/(marketing)/cadastro/page.tsx`
  - Formulário: Nome do lojista, Nome do restaurante, Telefone/WhatsApp, Cidade
  - Ou: redirecionar para um Typeform/Tally externo (mais rápido para MVP)
- [ ] Atualizar todos os hrefs `#cta` e `#` do `app/(marketing)/page.tsx` para apontar para `/cadastro`

### 1.2 · SEO e Meta da Marketing
- [ ] Adicionar `og:image` (imagem de preview social) ao `app/(marketing)/layout.tsx`
- [ ] Criar `app/(marketing)/sitemap.ts` com `MetadataRoute.Sitemap`
- [ ] Verificar que `robots.txt` não bloqueia crawlers (`app/robots.ts`)

---

## FASE 2 — Onboarding & Auth do Lojista
> **Duração estimada: 3–5 dias. Bloqueador de receita.**
> Esta fase transforma um lead em um tenant ativo.

### 2.1 · API de Criação de Tenant
- [ ] Criar `app/api/tenant/route.ts` (POST)
  - Recebe: `nome`, `slug`, `email`, `password`, `phone`
  - Valida que `slug` é único (alphanumérico, sem espaços)
  - Cria `Store` + `User` (ADMIN role) com senha hasheada (`bcrypt`)
  - Retorna o tenant criado
  - **Importante:** Marcar `store.isActive = false` até pagamento ser confirmado (ou ativar manualmente no MVP inicial)

### 2.2 · Tela de Cadastro do Lojista
- [ ] Criar `app/(marketing)/cadastro/page.tsx` (Client Component)
  - Campos: Nome completo, E-mail, Senha, Nome do restaurante, Slug desejado (com preview: `slug.saiudelivery.com.br`)
  - Validação de slug disponível em tempo real: `GET /api/tenant/check-slug?slug=xxx`
  - Ao submeter: chama `POST /api/tenant`, redireciona para o painel da loja criada
- [ ] Criar `app/api/tenant/check-slug/route.ts` (GET)
  - Verifica disponibilidade do slug no banco

### 2.3 · Auth do Lojista (Por Tenant)
- [ ] Instalar `bcryptjs` + `@types/bcryptjs`
- [ ] Criar `app/actions/storeAuth.ts`
  - `loginLojista(email, password, slug)` → verifica `User` no tenant, valida bcrypt, seta cookie `lojista_token` assinado com `signPayload(userId|storeId)`
  - `getLojistaSession()` → verifica e decodifica o cookie
  - `logoutLojista()`
- [ ] Atualizar `app/(store)/[slug]/admin/login/page.tsx`
  - Remover campo de senha única do `.env` (ADMIN_PASSWORD)
  - Usar o novo `loginLojista(email, password, slug)`
- [ ] Atualizar `proxy.ts` para verificar `lojista_token` em vez de (ou além de) `admin_token`
  - `admin_token` pode ser reservado para SUPER_ADMIN da plataforma
- [ ] Criar `app/(store)/[slug]/admin/logout/route.ts` ou action de logout

### 2.4 · E-mail de Boas-Vindas (Opcional no MVP)
- [ ] Integrar Resend ou Nodemailer para enviar e-mail de confirmação após cadastro
- [ ] Criar template: "Sua loja está no ar em `slug.saiudelivery.com.br`"

---

## FASE 3 — Painel Administrativo do Lojista
> **Duração estimada: 2–3 dias. Maior parte já existe.**
> O painel está funcional. Faltam: auth correta, branding dinâmico e categoria management.

### 3.1 · Branding Dinâmico da Loja
- [ ] Criar `app/(store)/[slug]/admin/configuracoes/page.tsx`
  - Campos: Nome da loja, Logo URL, Imagem de capa, Cidade, Tagline, Telefone
  - Server Action: `saveStoreSettings(data, storeId)`
- [ ] Atualizar `app/(store)/[slug]/page.tsx` para usar os campos dinâmicos de branding
  - Substituir logo hardcoded `logochurrascaria.svg` pela `store.logoUrl`
  - Substituir "Costa e Souza", "Luziânia · GO", "A Pioneira" pelos campos do banco
- [ ] Atualizar `app/(store)/[slug]/layout.tsx`
  - Implementar `generateMetadata({ params })` com nome e descrição dinâmicos do tenant

### 3.2 · Gestão de Categorias
- [ ] Criar Server Action `saveCategory(name, storeId)` e `deleteCategory(id, storeId)` em `app/actions/admin.ts`
- [ ] Adicionar seção "Categorias" ao `AdminClient.tsx`

### 3.3 · Gestão de Zonas de Entrega
- [ ] Criar Server Action `saveDeliveryZone(data, storeId)` e `deleteDeliveryZone(id, storeId)`
- [ ] Adicionar seção "Zonas de Entrega" ao `AdminClient.tsx`

### 3.4 · KDS — Desvincular Branding Hardcoded
- [ ] Atualizar `app/(store)/[slug]/admin/kds/page.tsx`
  - Converter de Client Component puro para Server Component com wrapper
  - Receber `params.slug`, resolver `store.name` do banco, passar ao componente
  - Substituir "COSTA E SOUZA KDS" pelo `store.name` dinâmico
  - Substituir links hardcoded `/admin` e `/admin/kds` por `/${slug}/admin` e `/${slug}/admin/kds`

### 3.5 · Configuração de Pagamento (MP por Tenant)
- [ ] Adicionar campos no painel admin: `mpAccessToken`, `mpPublicKey`
- [ ] Server Action `savePaymentConfig(data, storeId)` em `app/actions/admin.ts`
- [ ] Guia de integração inline: "Como gerar seu token no Mercado Pago"

---

## FASE 4 — A Loja do Cliente Final
> **Duração estimada: 1–2 dias. Maior parte já existe.**
> O cardápio, checkout e pagamento estão prontos. Faltam bugfixes e polish.

### 4.1 · Bugfixes da Fase 0 (Já listados, críticos aqui)
- [ ] Corrigir redirect do pagamento para incluir slug no path
- [ ] Corrigir `orders/page.tsx` para passar `storeId` ao `getSessionUser`
- [ ] Corrigir validação de tenant em `pedido/[id]/page.tsx`

### 4.2 · Página de Pedido Confirmado (Post-Checkout)
- [ ] Revisar `app/(store)/[slug]/pedido/[id]/page.tsx` e `OrderTracker.tsx`
  - Garantir que o tracker de status (polling ou SSE) está funcional
  - Verificar que a rota de status `GET /api/orders/[id]/status` retorna 200 após login do cliente

### 4.3 · Histórico de Pedidos do Cliente
- [ ] Corrigir `app/(store)/[slug]/orders/page.tsx` (bug listado na Fase 0)
- [ ] Adicionar link "Meus Pedidos" no menu da loja

### 4.4 · SEO Dinâmico por Tenant
- [ ] Implementar `generateMetadata` em `app/(store)/[slug]/page.tsx`
  ```ts
  export async function generateMetadata({ params }) {
    const store = await prisma.store.findFirst(...)
    return { title: store.name, description: store.tagline }
  }
  ```

### 4.5 · PWA por Tenant
- [ ] Gerar `manifest.json` dinâmico via `app/(store)/[slug]/manifest.ts`
  - Nome, cor e ícone dinâmicos por tenant
  - Atualmente apontando para `/manifest.json` fixo que não existe

---

## FASE 5 — Billing SaaS (Receita Recorrente)
> **Duração estimada: 3–5 dias. Pode ser adiada para os primeiros 5 clientes.**

### Opção A — Manual (Recomendado para os primeiros clientes)
- [ ] Cobrar R$ 97 via Pix/transferência manual
- [ ] Ativar a loja manualmente: `UPDATE Store SET isActive = true WHERE slug = 'x'`
- [ ] Criar script/página de super-admin para gerenciar ativações

### Opção B — Stripe (Para escala)
- [ ] Instalar `stripe`
- [ ] Adicionar ao model `Store`:
  ```prisma
  stripeCustomerId     String? @unique
  stripeSubscriptionId String? @unique
  subscriptionStatus   String? // 'active' | 'past_due' | 'canceled'
  ```
- [ ] Criar `app/api/billing/checkout/route.ts` — inicia sessão de checkout no Stripe
- [ ] Criar `app/api/webhooks/stripe/route.ts` — atualiza `isActive` e `tier` via evento
- [ ] Adicionar verificação de `store.isActive` no proxy (bloquear acesso se inadimplente)
- [ ] Criar `app/(store)/[slug]/admin/billing/page.tsx` — portal de gerenciamento de assinatura

---

## Ordem de Execução Recomendada para o 1º Cliente

```
Fase 0 (bugs) → Fase 2 (onboarding) → Fase 3.1 (branding dinâmico) 
→ Fase 4.1 (bugfixes) → Fase 1 (CTA landing page) → Fase 5 Opção A (billing manual)
```

Com esse caminho, você consegue um lojista real abrindo a loja dele, pedindo pelo site, vendo o KDS funcionar e pagando R$ 97 via Pix — **sem Stripe, sem Clerk, sem over-engineering.**

---

## Checklist Pré-Lançamento (Go-Live Gate)

- [ ] `COOKIE_SECRET` configurado no ambiente de produção
- [ ] `DATABASE_URL` e `DIRECT_URL` (Supabase) configurados
- [ ] `NEXT_PUBLIC_APP_URL` apontando para o domínio real
- [ ] Domínio `saiudelivery.com.br` com wildcard DNS (`*.saiudelivery.com.br → Vercel`)
- [ ] Primeiro lojista criado manualmente via seed ou painel super-admin
- [ ] Teste E2E: Cliente abre loja → adiciona produto → faz pedido → KDS exibe → motoboy aceita
- [ ] Teste de pagamento: PIX gerado → webhook recebido → pedido vai para PREPARING

---

## Débito Técnico Conhecido (Pós-MVP)

| Item | Impacto | Quando Atacar |
|---|---|---|
| Índices no Prisma (storeId, createdAt) | Performance sob carga | Antes de 50 tenants |
| `tracker.ts` sem isolamento de tenant | Segurança | Próxima sprint |
| Upsells hardcoded no `checkout.ts` | Produto | Após 1º cliente |
| DeliveryZone sem matching geográfico | Produto | Após 3 clientes |
| Assinatura de webhook Mercado Pago | Segurança | Antes do lançamento público |
| Rate limiting nas rotas de API | Infraestrutura | Antes de 10 tenants |
| Testes automatizados (zero cobertura) | Qualidade | Após MVP validado |
