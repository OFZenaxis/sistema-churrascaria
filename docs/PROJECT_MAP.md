# PROJECT MAP — Arquitetura e Estado Atual do Sistema

> **Regra de Ouro:** Toda nova feature, alteração arquitetural ou instalação de dependência vital **DEVE** ser documentada aqui com a data. Este documento reflete **apenas o que está construído e funcionando hoje** — não contém wishlist. Para o futuro, consulte `ROADMAP.md`.

**Última atualização:** 2026-04-04

---

## 1. Visão Geral do Produto

**Saiu Delivery** é uma plataforma SaaS multi-tenant de delivery para restaurantes brasileiros.

| Dimensão | Detalhe |
|----------|---------|
| Modelo | B2B2C — Lojistas (B) configuram suas lojas para servir clientes finais (C) |
| Multi-tenancy | Subdomínios (`loja.saiudelivery.com.br`) + Custom Domains |
| Isolamento | Cada tenant tem `storeId` próprio; todo dado filtra por `storeId` no Prisma |
| Autenticação | Cookies HMAC-SHA256 isolados por tenant |
| Pagamentos | Mercado Pago por tenant (chaves próprias em `StorePaymentConfig`) |

---

## 2. Arquitetura de Rotas (Next.js App Router)

```
app/
├── (marketing)/                   ← Domínio raiz (saiudelivery.com.br)
│   ├── layout.tsx                 ← Root layout com metadata global
│   ├── page.tsx                   ← Landing page da plataforma
│   └── cadastro/
│       └── page.tsx               ← Registro de novo tenant (stepper 3 etapas)
│
└── (store)/
    └── [slug]/                    ← Tenant identificado pelo slug
        ├── layout.tsx             ← generateMetadata dinâmico (nome, logo, brand)
        ├── page.tsx               ← Vitrine pública (cardápio + carrinho)
        │
        ├── admin/
        │   ├── login/
        │   │   └── page.tsx       ← Login do lojista (light design)
        │   │
        │   └── (dashboard)/       ← Painel admin protegido (session required)
        │       ├── layout.tsx     ← Server: valida sessão, busca store, passa props
        │       ├── loading.tsx    ← Skeleton com animate-pulse
        │       ├── page.tsx       ← Dashboard: KPIs, gráfico, top produtos, pedidos
        │       ├── cardapio/
        │       │   └── page.tsx   ← CRUD de categorias e produtos (toggle ativo/inativo)
        │       ├── configuracoes/
        │       │   ├── page.tsx   ← Config geral: nome, tagline, logo, cover, PIN cozinha
        │       │   └── pagamentos/
        │       │       └── page.tsx ← Credenciais Mercado Pago por tenant
        │       ├── entregas/
        │       │   └── page.tsx   ← Endereço da loja + mapa + raio + tarifação
        │       ├── kds/
        │       │   └── page.tsx   ← Kitchen Display System (tela de cozinha)
        │       └── personalizacao/
        │           └── page.tsx   ← Tema/cores/branding da loja
        │
        ├── motoboy/
        │   └── page.tsx           ← Dashboard do entregador (aceitar/finalizar corridas)
        ├── orders/
        │   └── page.tsx           ← Histórico de pedidos do cliente
        ├── pedido/
        │   └── [id]/
        │       └── page.tsx       ← Rastreamento em tempo real do pedido
        └── pagamento/
            └── [id]/
                └── page.tsx       ← Checkout transparente (Payment Brick MP)
```

---

## 3. Proxy Multi-Tenant (`proxy.ts`)

Arquivo na raiz do projeto. Substitui `middleware.ts` (Next.js 16.2.1+ usa `proxy.ts`).

**Exporta:** `export function proxy(req: NextRequest)` + `export const config`

### Fluxo de Decisão

```
Requisição recebida
├── É arquivo estático (_next/*, favicon)? → Ignorar
├── Host é domínio raiz?
│   ├── saiudelivery.com.br
│   ├── www.saiudelivery.com.br
│   └── localhost:3000/3001
│   → Servir app/(marketing)/ sem rewrite
│
├── Host é subdomínio (*.saiudelivery.com.br)?
│   → Extrair slug do subdomínio
│   → Rewrite: /{slug}{pathname}
│   → Injetar header: x-store-domain = hostname
│   → Se path começa com /admin (e não é /admin/login):
│       → Cookie lojista_token_* ausente? → Redirect /admin/login
│
└── Host é domínio customizado?
    → Usar hostname completo como slug
    → Rewrite: /{hostname}{pathname}
    → Mesma proteção /admin
```

### Header `x-store-domain`

Injetado em todas as requisições de tenant. As API routes (`/api/admin/orders`, `/api/admin/store-status`) leem este header para identificar o tenant sem precisar do slug na URL.

---

## 4. Componentes da Vitrine (B2C)

### `components/MenuComponent.tsx` (Componente principal — 549 linhas)

**Tipo:** Client Component (`"use client"`)

**Props recebidas de `app/(store)/[slug]/page.tsx`:**
- `products: Product[]` — cardápio completo
- `categories: Category[]` — categorias para o carrossel
- `isStoreOpen: boolean`
- `storeId: string`
- `slug: string`
- `storeTheme: StoreTheme` — cores e layout
- `isLoggedIn: boolean`
- `userAddresses: Address[]`
- `logoUrl?: string | null`

**Funcionalidades implementadas:**
- Carrossel de categorias com snap-scroll (mobile)
- Busca de produtos por nome
- Carrinho de compras (array de `CartItem`)
- Modal de checkout com estimativa de frete
- Integração com `submitOrder` e `estimateDeliveryFee`
- Safe area para iPhone (env CSS `safe-area-inset-bottom`)
- Overlay de loja fechada com logo ou ícone da loja

**Estados principais:**
```typescript
cart: CartItem[]
showCart: boolean
showCheckout: boolean
selectedProduct: Product | null
paymentMethod: 'PIX' | 'CARD_ONLINE' | 'CARD_MACHINE' | 'CASH'
selectedAddressId: string | null
changeFor: string
```

**⚠️ Dívida técnica:** Componente monolítico com 549 linhas. Ver BUG-015.

---

### `components/ProductCard.tsx`

Lista de produtos (layout `list`). Exibe imagem, nome, descrição truncada, preço e botão `+`. Touch target mínimo 44px. Usa `StoreTheme` para todas as cores.

### `components/ProductModal.tsx`

Bottom sheet animado (Framer Motion) com detalhes do produto, campo de observação e botão de adicionar ao carrinho.

### `components/PhoneLogin.tsx` (435 linhas)

Stepper de autenticação do cliente:
1. **Passo 1 — Telefone:** Coleta `phone` e `name`
2. **Passo 2 — Endereço:** Formulário com CEP + campos estruturados
3. **Passo 3 — Resumo:** Confirma dados antes de fazer login

Chama `loginWithPhone()` e `saveAddress()`.

---

## 5. Painel Admin

### Layout do Painel

```
AdminLayoutWrapper.tsx (Client)
├── SidebarProvider (Context: isCollapsed, isKitchenMode, kitchenPin)
└── LayoutInner
    ├── [Mobile] Header fixo (logo + hamburger) — md:hidden
    ├── [Mobile] Backdrop escuro ao abrir drawer
    ├── AdminSidebar (drawer no mobile, inline no desktop)
    └── <main> (flex-1 overflow-y-auto)
```

### `AdminSidebar.tsx`

Navegação principal do painel. Props: `slug`, `storeId`, `storeName`, `logoUrl`, `onClose`.

**Itens de navegação:**
- `/admin` — Visão Geral (Dashboard)
- `/admin/cardapio` — Cardápio
- `/admin/kds` — KDS / Cozinha
- `/admin/entregas` — Entregas

**Itens do rodapé:**
- `/admin/personalizacao` — Personalização
- `/admin/configuracoes/pagamentos` — Pagamentos
- `/admin/configuracoes` — Configurações
- Botão: Copiar link da loja (`navigator.clipboard`)
- Botão: Logout (`logoutLojista` + redirect)
- Botão: Recolher/expandir sidebar

**Comportamento mobile:** Slide-in como drawer via translate CSS (`-translate-x-full` → `translate-x-0`).

### `SidebarContext.tsx`

Context compartilhado entre `AdminLayoutWrapper` e `AdminSidebar`.

```typescript
{
  isCollapsed: boolean       // sidebar colapsada no desktop
  setIsCollapsed: (v) => void
  isKitchenMode: boolean     // esconde a sidebar no KDS
  setIsKitchenMode: (v) => void
  kitchenPin: string | null  // PIN lido do banco no boot, imutável
}
```

### `StoreToggle.tsx`

Botão de toggle "Loja Aberta/Fechada" no dashboard. Chama `toggleStoreStatus()`. Design de switch com animação de thumb.

---

## 6. Kitchen Display System (KDS)

**Arquivo:** `app/(store)/[slug]/admin/(dashboard)/kds/page.tsx`

**Funcionalidades:**
- Polling a cada 8 segundos via `fetchKdsOrders()`
- Exibe pedidos em 3 colunas: `PENDING` → `PREPARING` → `READY_FOR_PICKUP`
- Botão "Avançar" muda status via `updateOrderStatus()`
- Fullscreen mode (com suporte webkit para iOS Safari)
- Pin de desbloqueio por tenant (`kitchenPin`)
- `setIsKitchenMode(true)` esconde a sidebar lateral

**⚠️ Dívida técnica:** `mapOrder(raw: any)` sem tipagem (BUG-010).

---

## 7. Aba de Entregas

**Arquivo:** `app/(store)/[slug]/admin/(dashboard)/entregas/ZonasClient.tsx`

**Funcionalidades implementadas:**
- Busca automática de endereço via **ViaCEP** ao preencher CEP
- Preview de endereço montado (`logradouro, numero, bairro, cidade, uf`)
- **Live Geocoding** com debounce de 1500ms via Mapbox (atualiza mapa em tempo real)
- Marcador **arrastável** no mapa (`react-map-gl` Marker com `draggable`)
- Prioridade: ajuste manual > live preview (flag `isManualAdjRef`)
- Badge de status: 4 estados (geocodificando / ajuste manual / confirmado / pendente)
- Mapa de raio de entrega com círculos concêntricos
- Campos responsivos: `grid-cols-1 sm:grid-cols-[1fr_100px]`
- Simulador de frete dinâmico (3 pontos: 33%, 66%, 100% do raio)

**Arquivo:** `app/(store)/[slug]/admin/(dashboard)/entregas/DeliveryMap.tsx`

- `react-map-gl` com `MapRef` para `flyTo()` (sem remount com `key`)
- Marcador arrastável com feedback visual durante drag (`bg-blue-500 scale-110`)
- Anéis de raio via `@turf/turf` calculados por `simulatorSteps`

---

## 8. Server Actions (app/actions/)

| Arquivo | Responsabilidade |
|---------|-----------------|
| `adminAuth.ts` | Login/logout lojista, gerenciamento de sessão admin |
| `auth.ts` | Login/logout cliente, gerenciamento de endereços |
| `checkout.ts` | Estimativa de frete, submissão de pedido |
| `admin.ts` | CRUD de produtos/categorias, configurações de loja, KDS, entregas |
| `kitchen.ts` | Avanço de status (cozinha) |
| `driver.ts` | Aceitar e finalizar corridas (motoboy) |
| `tracker.ts` | Atualizar e ler localização do motoboy |
| `paymentConfig.ts` | Gerenciar credenciais MP do tenant |
| `tenant.ts` | Registro de novo tenant (Store + User em transação) |

**Padrão de autorização em todas as actions admin:**
```typescript
const session = await requireAdminSession(storeId)
if (!session) return { error: 'Não autorizado' }
```

---

## 9. API Routes (app/api/)

| Rota | Método | Responsabilidade | Auth |
|------|--------|-----------------|------|
| `/api/tenant` | POST | Criar novo tenant | Pública |
| `/api/tenant/check-slug` | GET | Verificar disponibilidade de slug | Pública |
| `/api/admin/orders` | GET, PUT | Listar e atualizar status de pedidos | Header `x-store-domain` |
| `/api/admin/store-status` | GET, POST | Consultar/alterar status da loja | Header `x-store-domain` |
| `/api/orders/[id]/status` | GET | Status do pedido para cliente ou admin | Cookie de sessão |
| `/api/payments` | POST | Criar pagamento no Mercado Pago | Implícito via orderId |
| `/api/webhooks/mercadopago` | POST | Receber notificação de pagamento | Query `storeId` |

---

## 10. Utilitários (lib/)

| Arquivo | Função Principal |
|---------|----------------|
| `lib/session.ts` | `signPayload(payload)` + `verifyPayload(token)` — HMAC-SHA256 com `timingSafeEqual` |
| `lib/tenant.ts` | `tenantWhere(slug)` — resolve `{ slug }` ou `{ customDomain }` para queries Prisma |
| `lib/mapbox.ts` | `geocodeAddress(addr)` + `getDrivingDistance(lat,lng,lat,lng)` + `calcDeliveryFee()` |
| `lib/upload.ts` | `uploadImage(file, storeId)` — Upload client-side para Supabase Storage |
| `lib/prisma.ts` | Singleton do PrismaClient (evita conexões duplicadas em hot reload) |

---

## 11. Temas da Vitrine

**Arquivo:** `lib/themes.ts` (inferido)

6 temas pré-configurados que definem `StoreTheme`:

| ID | Nome | Emoji | Layout | Fonte |
|----|------|-------|--------|-------|
| `classic-light` | Hamburgueria Clássica | 🍔 | `featured` | sans |
| `tokyo-dark` | Sushi Dark Mode | 🍣 | `grid` | sans |
| `napoli-warm` | Pizzaria Artesanal | 🍕 | `list` | serif |
| `tropical-fresh` | Açaí & Smoothies | 🫐 | `list` | rounded |
| `brazil-bbq` | Churrascaria Premium | 🥩 | `list` | sans |
| `cafe-premium` | Café Sofisticado | ☕ | `list` | serif |

**`StoreTheme` interface:**
```typescript
{
  brandColor: string      // hex (#10b981)
  phoneBg: string         // background da vitrine
  phoneCard: string       // background dos cards
  phoneText: string       // cor do texto principal
  phoneSubText: string    // cor do texto secundário
  phoneBorderRadius: string // border-radius dos elementos
  layoutStyle: 'list' | 'grid' | 'featured'
  fontFamily: 'sans' | 'serif' | 'rounded'
}
```

---

## 12. Fluxo de Pedido (End-to-End)

```
1. Cliente acessa vitrine (slug.saiudelivery.com.br)
2. Seleciona produtos → adiciona ao carrinho (estado local)
3. Clica "Fazer Pedido" → PhoneLogin se não autenticado
4. Seleciona endereço → estimateDeliveryFee() calcula frete (Mapbox Directions)
5. Escolhe método de pagamento
   ├── PIX/Cartão Online → submitOrder() → redireciona para /pagamento/[id]
   │   → Payment Brick (MP) processa → Webhook MP atualiza Order
   └── Dinheiro/Cartão Máquina → submitOrder() direto
6. Lojista vê pedido no KDS → avança PENDING → PREPARING → READY_FOR_PICKUP
7. Motoboy vê corrida em /motoboy → acceptRide() → status DISPATCHED
8. Motoboy envia GPS → updateMotoboyLocation() → cliente rastreia em tempo real
9. Motoboy entrega → finishRide() → status DELIVERED → polling do cliente para
```

---

## 13. Padrões de Código Obrigatórios

### Multi-tenancy
```typescript
// SEMPRE usar tenantWhere — nunca { slug } direto
import { tenantWhere } from '@/lib/tenant'
prisma.store.findFirst({ where: tenantWhere(slug) })
```

### Cores na Vitrine
```typescript
// NUNCA hardcode de cor em componentes B2C
// SEMPRE usar tokens do storeTheme
<div style={{ background: phoneCard, color: phoneText }}>
```

### Cookies
```typescript
// SEMPRE incluir storeId no nome do cookie
`session_token_${storeId}`    // cliente
`lojista_token_${storeId}`    // admin
```

### Proxy vs Middleware
```typescript
// NUNCA criar middleware.ts
// SEMPRE usar proxy.ts com export function proxy()
```

---

## 14. Funcionalidades em Produção (Checklist)

| Feature | Status | Notas |
|---------|--------|-------|
| Vitrine multi-tenant | ✅ Funcionando | Subdomínios + custom domains |
| Cardápio com categorias | ✅ Funcionando | CRUD completo no admin |
| Carrinho de compras | ✅ Funcionando | Estado local, sem persistência |
| Login por telefone (cliente) | ✅ Funcionando | Sem senha, phone-first |
| Endereços salvos | ✅ Funcionando | Com geocodificação Mapbox |
| Estimativa de frete dinâmico | ✅ Funcionando | Mapbox Directions + fallback |
| Checkout PIX | ✅ Funcionando | Mercado Pago Brick |
| Checkout Cartão Online | ✅ Funcionando | Mercado Pago Brick |
| Checkout Dinheiro/Maquininha | ✅ Funcionando | Sem integração MP |
| KDS (Kitchen Display System) | ✅ Funcionando | Polling 8s, fullscreen, PIN |
| Rastreamento GPS do motoboy | ✅ Funcionando | Polling 4s, mapa em tempo real |
| Painel admin responsivo | ✅ Funcionando | Mobile drawer + desktop sidebar |
| Personalização de tema | ✅ Funcionando | 6 temas + brand color custom |
| Upload de logo/cover | ✅ Funcionando | Supabase Storage |
| Zonas de entrega no mapa | ✅ Funcionando | ViaCEP + Mapbox + marcador arrastável |
| Dashboard financeiro | ✅ Funcionando | KPIs reais + gráfico Recharts |
| Webhook Mercado Pago | ✅ Parcial | Recebe mas não valida x-signature (BUG-002) |
| Rate limiting | ❌ Ausente | BUG-016 |
| Testes automatizados | ❌ Ausente | BUG-017 |
| Monitoramento (Sentry) | ❌ Ausente | BUG-018 |
