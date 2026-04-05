# INFRA — Infraestrutura, DevOps e Integrações

> **Regra de Ouro:** Toda nova variável de ambiente, serviço externo ou integração adicionada ao sistema DEVE ser documentada aqui com a data.

**Última atualização:** 2026-04-04

---

## 1. Stack Técnica

| Camada | Tecnologia | Versão | Observação |
|--------|-----------|--------|-----------|
| Framework | Next.js | 16.2.1 | App Router — `proxy.ts` em vez de `middleware.ts` |
| Runtime | React | 19.2.4 | Server Components por padrão |
| Linguagem | TypeScript | 5.x | Strict mode habilitado |
| ORM | Prisma | 5.22.0 | Client + Migrate + Studio |
| Banco de Dados | PostgreSQL | via Supabase | pgBouncer connection pooler |
| Autenticação | HMAC-SHA256 customizado | — | Cookies assinados nativamente (sem NextAuth/JWT externo) |
| Estilização | Tailwind CSS | 4.x | PostCSS, sem UI library (custom design system) |
| Animações | Framer Motion | 12.38.0 | AnimatePresence + motion |
| Ícones | Lucide React | 1.7.0 | Única biblioteca de ícones permitida |
| Gráficos | Recharts | 3.8.1 | Dashboard financeiro do admin |
| Mapas | Mapbox GL JS + react-map-gl | 3.20.0 / 8.1.0 | Vitrine + Admin |
| Geo cálculos | @turf/turf | 7.3.4 | Cálculo de distâncias e raio de entrega |
| Pagamentos | Mercado Pago SDK | 2.12.0 (server) + 1.0.7 (react) | Por tenant (chaves isoladas) |
| Storage | Supabase Storage | @supabase/supabase-js 2.101.1 | CDN via Supabase / Cloudflare |
| Hashing | bcryptjs | 3.0.3 | Senhas de lojistas (cost factor 12) |

---

## 2. Variáveis de Ambiente

> Arquivo de referência: `.env.example` na raiz do projeto.
> ⚠️ NUNCA comitar o `.env` real. Use `.env.local` para desenvolvimento.

### Obrigatórias (sem estas, o servidor não inicializa)

| Variável | Exemplo/Formato | Uso | Onde é lida |
|----------|----------------|-----|------------|
| `DATABASE_URL` | `postgresql://...@aws-...supabase.co:6543/postgres?pgbouncer=true` | Conexão runtime via Prisma Client (pgBouncer) | `lib/prisma.ts` |
| `DIRECT_URL` | `postgresql://...@aws-...supabase.co:5432/postgres` | Prisma Migrate e Seed (conexão direta, sem pooler) | `prisma/schema.prisma` |
| `COOKIE_SECRET` | Base64 string ≥ 64 bytes | HMAC-SHA256 para assinar/verificar cookies de sessão. Boot guard: falha na inicialização se ausente | `lib/session.ts` |
| `NEXT_PUBLIC_APP_URL` | `https://saiudelivery.com.br` | URLs absolutas para webhooks, redirecionamentos | `app/actions/checkout.ts`, hooks MP |
| `NEXT_PUBLIC_BASE_DOMAIN` | `saiudelivery.com.br` | Roteamento multi-tenant por subdomínio | `proxy.ts`, `AdminSidebar.tsx` |

### Mercado Pago

| Variável | Formato | Uso | Escopo |
|----------|---------|-----|--------|
| `NEXT_PUBLIC_MP_PUBLIC_KEY` | `APP_USR-...` | Payment Brick no frontend (global fallback) | Client |
| `MP_ACCESS_TOKEN` | `APP_USR-...` | SDK Mercado Pago backend (global fallback) | Server |
| `MP_WEBHOOK_SECRET` | String aleatória | Validação HMAC de webhooks ⚠️ NÃO implementado ainda | Server |

> **Multi-tenant:** Cada loja tem suas próprias chaves MP em `StorePaymentConfig` (tabela `store_payment_config`). As variáveis globais acima são fallback para lojas sem configuração própria.

### Supabase

| Variável | Uso | Escopo |
|----------|-----|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase | Client + Server |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anônima (respeita RLS) | Client (upload de imagens pelo usuário) |
| `SUPABASE_SERVICE_ROLE_KEY` | Chave admin (bypassa RLS) | Server actions de upload (`actions/upload.ts`) |

### Mapbox

| Variável | Uso | Escopo |
|----------|-----|--------|
| `NEXT_PUBLIC_MAPBOX_TOKEN` | Geocoding API + Directions API + Renderização de mapas | Client + Server |

> Um único token serve todas as finalidades. Bucket está configurado no painel Mapbox com restrição de domínio recomendada.

---

## 3. Banco de Dados

### Configuração Prisma

```
Provider: postgresql
Pooler (runtime): DATABASE_URL — porta 6543 via pgBouncer (Supabase)
Direto (migrations): DIRECT_URL — porta 5432 (conexão sem pooler)
```

**Por que dois URLs?**
pgBouncer (porta 6543) não suporta comandos DDL como `ALTER TABLE`. O Prisma exige `DIRECT_URL` para rodar `prisma migrate deploy` e `prisma db seed`.

### Modelos Principais

| Model | Tabela | Papel |
|-------|--------|-------|
| `Store` | `store` | Tenant principal. Contém toda config da loja |
| `User` | `user` | Staff (ADMIN, MANAGER, DRIVER, SUPER_ADMIN) |
| `Customer` | `customer` | Cliente final (composite unique: storeId + phone) |
| `Address` | `address` | Endereço de entrega do cliente (com lat/lng) |
| `Category` | `category` | Categoria de produto (pertence a Store) |
| `Product` | `product` | Item do cardápio |
| `Order` | `order` | Pedido (centro do sistema, contém GPS do motoboy) |
| `OrderItem` | `order_item` | Linha de pedido (produto + quantidade + preço snapshot) |
| `StorePaymentConfig` | `store_payment_config` | Chaves MP por tenant (1:1 com Store) |
| `DeliveryZone` | `delivery_zone` | Zonas fixas de entrega (modelo legado) |
| `Delivery` | `delivery` | Registro de entrega (motorista, timestamps) |

### Migrations

Local: `prisma/migrations/`
Última migration aplicada: `20260401162235_add_store_branding`

Rodar migration em produção:
```bash
npx prisma migrate deploy
```

### Seed

```bash
npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts
```

---

## 4. Integrações Externas

### 4.1 Mercado Pago

| Item | Detalhe |
|------|---------|
| SDK React | `@mercadopago/sdk-react@1.0.7` — Payment Brick (frontend) |
| SDK Backend | `mercadopago@2.12.0` — criação de preferências, consulta de pagamento |
| Rota de criação | `POST /api/payments` |
| Webhook | `POST /api/webhooks/mercadopago?storeId=X&type=payment&data.id=Y` |
| Modelo de chaves | Por tenant: `StorePaymentConfig.mpAccessToken` + `mpPublicKey` |
| Fluxo PIX | API cria preferência → retorna `qr_code` + `qr_code_base64` → exibido no frontend |
| Fluxo Cartão | Payment Brick tokeniza cartão no frontend → backend cria pagamento com token |
| ⚠️ Pendente | Validação de `x-signature` no webhook (BUG-002) |

### 4.2 Mapbox

| Item | Detalhe |
|------|---------|
| Geocoding API | `https://api.mapbox.com/geocoding/v5/mapbox.places/{address}.json` — converte endereço em lat/lng |
| Directions API | `https://api.mapbox.com/directions/v5/mapbox/driving/{lng,lat;lng,lat}` — distância de direção real em KM |
| Mapa interativo | `react-map-gl@8.1.0` + `mapbox-gl@3.20.0` — exibição do mapa na vitrine, admin e tracker |
| Token | `NEXT_PUBLIC_MAPBOX_TOKEN` (único para todos os usos) |
| Uso | Admin (mapa de raio de entrega + marcador arrastável), Customer Tracker, Admin Entregas |

### 4.3 ViaCEP

| Item | Detalhe |
|------|---------|
| URL | `https://viacep.com.br/ws/{CEP}/json/` |
| Uso | Auto-preenchimento de endereço no admin (aba Entregas) ao digitar CEP |
| Autenticação | Nenhuma (API pública e gratuita) |
| Tratamento de erro | CEP inválido: campo `erro: true` na resposta |

### 4.4 Supabase Storage

| Item | Detalhe |
|------|---------|
| Bucket | `saiu-media` |
| Client-side | Upload de imagens de produto pelo lojista (usa anon key + RLS) |
| Server-side | Upload de logo/cover da loja via `SUPABASE_SERVICE_ROLE_KEY` (bypassa RLS) |
| CDN | `https://rbnzcxbzrivevteiooad.supabase.co/storage/v1/object/public/saiu-media/...` |
| Tipos aceitos | `image/jpeg`, `image/png`, `image/webp` |
| Tamanho máximo | 5 MB (server-side), sem limite explícito client-side |
| Formato de path | Client: `{storeId}/{timestamp}.{ext}` — Server: `covers/cover-{storeId}-{timestamp}.{ext}` |

---

## 5. Roteamento Multi-Tenant

### Arquitetura

O sistema usa subdomínios por tenant. O `proxy.ts` na raiz intercepta todas as requisições antes do Next.js resolver rotas:

```
saiu delivery.com.br          → app/(marketing)/page.tsx     (landing)
saiudelivery.com.br/cadastro  → app/(marketing)/cadastro/    (registro de loja)
minha-loja.saiudelivery.com.br → app/(store)/[slug]/page.tsx  (vitrine)
customdomain.com.br            → app/(store)/[slug]/page.tsx  (domínio próprio)
```

### proxy.ts — Lógica de Decisão

```
1. É arquivo estático? (_next, .) → Ignorar
2. É domínio raiz (BASE_DOMAIN, www, localhost)? → Servir app/(marketing)
3. É subdomínio (*.BASE_DOMAIN)?
   → Extrair slug → Rewrite para /{slug}/
   → Rota /admin/* sem cookie → Redirect para /admin/login
4. É domínio customizado?
   → Usar hostname como slug (via tenantWhere)
   → Rewrite para /{hostname}/
```

### Cookies de Sessão (isolados por tenant)

| Cookie | Formato | Conteúdo | Validade |
|--------|---------|---------|---------|
| `session_token_{storeId}` | `payload.assinatura` HMAC | `storeId\|phone` | 30 dias |
| `lojista_token_{storeId}` | `payload.assinatura` HMAC | `userId\|storeId\|role` | 7 dias |

---

## 6. Deploy e Ambiente de Produção

### Ambiente Atual (inferido)

| Item | Configuração |
|------|-------------|
| Hospedagem | VPS (inferido por uso de PM2 nos scripts) |
| Process Manager | PM2 |
| Build | `npm run build` → `prisma generate && next build` |
| Start | `npm start` → `next start` |

### Cache de Assets (next.config.ts)

| Tipo | Cache-Control |
|------|-------------|
| `/_next/static/*` | `public, max-age=31536000, immutable` (1 ano) |
| `icons/*` | `public, max-age=86400, stale-while-revalidate=86400` (1 dia) |
| HTML + APIs | `no-store, no-cache, must-revalidate` (sem cache) |

### Empacotamento Especial

`next.config.ts` inclui `transpilePackages: ['mapbox-gl', 'react-map-gl', '@vis.gl/react-mapbox']` para compatibilidade com o bundler do Next.js.

---

## 7. Segurança

### Implementações Corretas

- ✅ **HMAC-SHA256** com `timingSafeEqual` para verificar cookies (previne timing attacks)
- ✅ **bcryptjs cost 12** para hashing de senhas (bom balanço segurança/performance)
- ✅ **httpOnly + secure + sameSite:strict** em todos os cookies
- ✅ **Isolamento multi-tenant**: toda query Prisma filtra por `storeId`
- ✅ **Transações atômicas** para criação de Store + User
- ✅ **SERVICE_ROLE_KEY** usado apenas em server actions (nunca exposto ao client)
- ✅ **Dados sensíveis** (`mpAccessToken`, `password`, `COOKIE_SECRET`) nunca saem do servidor

### Vulnerabilidades Abertas (ver BUG_TRACKER.md)

- ⚠️ **BUG-002**: Webhook MP sem validação de assinatura → risco de fraude
- ⚠️ **BUG-001**: `getOrderLocation` sem autenticação → exposição de GPS
- ⚠️ **BUG-016**: Sem rate limiting em endpoints públicos → brute force possível

---

## 8. Dependências Completas (package.json)

### Produção

```
@headlessui/react@2.2.9        — Componentes acessíveis (dropdowns, dialogs)
@mercadopago/sdk-react@1.0.7   — Payment Brick (frontend MP)
@supabase/supabase-js@2.101.1  — Storage client
@turf/turf@7.3.4               — Cálculos geoespaciais (distância, raio)
bcryptjs@3.0.3                 — Hash de senhas
framer-motion@12.38.0          — Animações (AnimatePresence, motion)
lucide-react@1.7.0             — Ícones (única lib de ícones)
mapbox-gl@3.20.0               — Renderização de mapas interativos
mercadopago@2.12.0             — SDK backend Mercado Pago
next@16.2.1                    — Framework (App Router)
react@19.2.4                   — UI
react-dom@19.2.4               — DOM renderer
react-map-gl@8.1.0             — Wrapper React para Mapbox GL
react-markdown@10.1.0          — Renderização de markdown (ex: descrições)
recharts@3.8.1                 — Gráficos do dashboard
remark-gfm@4.0.1               — GitHub Flavored Markdown para react-markdown
@prisma/client@5.22.0          — ORM client gerado
```

### Desenvolvimento

```
@tailwindcss/postcss@4         — Integração Tailwind + PostCSS
@types/node@20                 — Tipos Node.js
@types/react@19                — Tipos React
@types/react-dom@19            — Tipos React DOM
eslint@9                       — Linter
eslint-config-next             — Regras ESLint do Next.js
prisma@5.22.0                  — CLI do Prisma
tailwindcss@4                  — CSS utility framework
ts-node@10.9.2                 — Execução TypeScript (seed, scripts)
typescript@5                   — Compilador TypeScript
```

---

## 9. Checklist de Setup (Novo Ambiente)

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variáveis de ambiente
cp .env.example .env.local
# Preencher: DATABASE_URL, DIRECT_URL, COOKIE_SECRET, NEXT_PUBLIC_*, etc.

# 3. Rodar migrations
npx prisma migrate deploy

# 4. Gerar Prisma Client
npx prisma generate

# 5. Popular banco (opcional, apenas dev)
npx ts-node --compiler-options '{"module":"CommonJS"}' prisma/seed.ts

# 6. Rodar em desenvolvimento
npm run dev

# 7. Build e produção
npm run build
npm start
```
