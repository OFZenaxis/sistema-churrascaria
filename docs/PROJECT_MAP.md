# PROJECT MAP — Arquitetura e Estado Atual do Sistema

> **Regra de Ouro:** Toda nova feature, alteração arquitetural ou instalação de dependência vital **DEVE** ser documentada aqui com a data. Este documento reflete **apenas o que está construído e funcionando hoje** — não contém wishlist. Para o futuro, consulte `ROADMAP.md`.

**Última atualização:** 2026-04-04

---

## Stack Técnico

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| Framework | Next.js (App Router) | 16.2.1 |
| Linguagem | TypeScript | 5.x |
| Banco de Dados | PostgreSQL via Prisma ORM | 5.22 |
| Estilização | Tailwind CSS | 4.x |
| Animações | Framer Motion | 12.x |
| Ícones | Lucide React | 1.7 |
| Gráficos | Recharts | 3.x |
| Mapas | Mapbox GL + react-map-gl | 3.x / 8.x |
| Geometria Geo | @turf/turf | 7.x |
| Upload de Imagens | Supabase Storage | 2.x |
| Pagamentos | Mercado Pago (SDK + Bricks) | 2.x |
| Autenticação | HMAC-SHA256 — cookies HttpOnly por tenant | — |
| Hash de senha | bcryptjs | 3.x |
| UI headless | @headlessui/react | 2.x |

---

## Modelo de Dados (Prisma Schema — resumo)

```
Store          — tenant central. Campos: slug, customDomain, name, logoUrl,
                 coverImageUrl, brandColor, themeId, tagline, phone, city,
                 isOpen, kitchenPin, storeAddress, storeLat/Lng,
                 baseDeliveryFee, deliveryFeePerKm, maxDeliveryRadius, tier

User           — staff da loja (ADMIN, MANAGER, DRIVER, SUPER_ADMIN)
Customer       — cliente final (unique por storeId+phone)
Address        — endereços do customer (lat/lng, isDefault)
Category       — categorias de produtos por tenant
Product        — produtos (name, price, imageUrl, maxSides, isActive)
Order          — pedido (status, totalAmount, paymentMethod, paymentStatus,
                 customerName, customerPhone, deliveryAddress, changeFor)
OrderItem      — item do pedido (productId, quantity, unitPrice, doneness, comboSides)
Delivery       — entrega atribuída a motoboy (driverName, dispatchedAt, deliveredAt)
DeliveryZone   — zonas de entrega por tenant (name, fee, estimatedTime, isActive)
StorePaymentConfig — credenciais Mercado Pago por tenant (mpAccessToken, mpPublicKey, pixDiscountPercent)
```

**Enums:**
- `OrderStatus`: PENDING → PREPARING → READY_FOR_PICKUP → DISPATCHED → DELIVERED | CANCELED
- `MeatDoneness`: RARE, MEDIUM_RARE, MEDIUM, MEDIUM_WELL, WELL_DONE
- `Role`: SUPER_ADMIN, ADMIN, MANAGER, DRIVER
- `SubscriptionTier`: BASIC, PRO, ENTERPRISE

---

## Multi-tenancy — Como Funciona

Cada loja existe como um **tenant isolado** identificado por `storeId`. O isolamento opera em duas camadas:

### 1. Resolução de Tenant (URL → Store)

```ts
// lib/tenant.ts
export function tenantWhere(slug: string) {
  return slug.includes('.') ? { customDomain: slug } : { slug }
}
```

Se o `[slug]` da URL contém `.` → é um domínio customizado (`minha-loja.com.br`).
Caso contrário → é o slug da plataforma (`saiudelivery.com.br/minha-loja`).

**Todo** `prisma.store.findFirst` do sistema obrigatoriamente passa por `tenantWhere`. Nunca se faz `where: { slug }` direto.

### 2. Cookies de Sessão Isolados por Tenant

Dois tipos de cookie, ambos assinados com HMAC-SHA256:

| Cookie | Usuário | Formato do nome |
|--------|---------|----------------|
| `session_token_{storeId}` | Cliente final | Por tenant |
| `admin_session_{storeId}` | Lojista/Staff | Por tenant |

Um lojista logado na loja A não pode acessar a loja B. Um cliente da loja A não tem sessão na loja B.

### 3. HMAC — `lib/session.ts`

```ts
signPayload(payload)   // payload + "." + HMAC-SHA256(payload, COOKIE_SECRET)
verifyPayload(token)   // verifica com timingSafeEqual — previne timing attacks
```

Boot guard: se `COOKIE_SECRET` não estiver definido, o servidor recusa iniciar com erro `[FATAL]`.

---

## Mapa de Rotas

### `app/(marketing)/` — Plataforma SaaS (B2B Lead)

| Rota | Tipo | O que faz |
|------|------|-----------|
| `/` | Server | Landing page de conversão — pitch do SaaS, mockup de pedido, comparativo com iFood/Rappi |
| `/cadastro` | Client | Formulário multi-step (3 etapas): dados pessoais → dados da loja + validação de slug em tempo real → senha. Submit chama `registerNewStore()` → auto-login → redirect para `/{slug}/admin` |

---

### `app/(store)/[slug]/` — Vitrine Pública B2C

| Rota | Tipo | O que faz |
|------|------|-----------|
| `/[slug]` | Server | Cardápio completo da loja |
| `/[slug]/orders` | Server | Hub "Minha Conta" do cliente |
| `/[slug]/pedido/[id]` | Client | Rastreador de status do pedido em tempo real |
| `/[slug]/pagamento/[id]` | Server+Client | Checkout PIX ou Cartão via Mercado Pago Bricks |
| `/[slug]/motoboy` | Server+Client | App de motoboy (GPS, aceitar/finalizar corridas) |

---

### `app/(store)/[slug]/admin/` — Painel do Lojista B2B

| Rota | Tipo | O que faz |
|------|------|-----------|
| `/[slug]/admin/login` | Client | Autenticação do lojista por senha |
| `/[slug]/admin` | Server | Dashboard de métricas financeiras |
| `/[slug]/admin/cardapio` | Client | CRUD de produtos e categorias |
| `/[slug]/admin/kds` | Client | Kitchen Display System com polling |
| `/[slug]/admin/entregas` | Client | Configuração de zonas e raio de entrega (Mapbox) |
| `/[slug]/admin/personalizacao` | Client | Tema, cores, logo e banner da loja |
| `/[slug]/admin/configuracoes` | Client | Dados da loja (nome, endereço, cidade, tagline) |
| `/[slug]/admin/configuracoes/pagamentos` | Client | Config Mercado Pago (token + public key) |

---

### `app/api/` — Route Handlers REST

| Endpoint | Método | O que faz |
|----------|--------|-----------|
| `/api/tenant` | POST | Cria novo tenant (Store + User admin) em transação atômica |
| `/api/tenant/check-slug` | GET | Valida disponibilidade de slug com regex + reserved list |
| `/api/admin/orders` | GET | Lista pedidos do tenant para o admin (isolado por Host header) |
| `/api/admin/store-status` | PATCH | Toggle `isOpen` da loja |
| `/api/orders/[id]/status` | GET | Polling de status de pedido (cliente + motoboy) |
| `/api/payments` | POST | Cria preferência de pagamento no Mercado Pago |
| `/api/webhooks/mercadopago` | POST | Recebe notificação de pagamento e atualiza `paymentStatus` |

---

### `app/actions/` — Server Actions

| Arquivo | Funções principais |
|---------|-------------------|
| `auth.ts` | `login`, `logout`, `getSessionUser`, `saveAddress` |
| `adminAuth.ts` | `loginLojista`, `logoutLojista`, `getLojistaSession` |
| `admin.ts` | CRUD de produtos, categorias, atualização de pedidos |
| `checkout.ts` | `submitOrder`, `estimateDeliveryFee` |
| `driver.ts` | `acceptRide`, `finishRide` |
| `kitchen.ts` | `advanceOrderStatus`, `cancelOrder` |
| `tracker.ts` | `updateMotoboyLocation` |
| `tenant.ts` | `registerNewStore` (com auto-login) |
| `paymentConfig.ts` | `savePaymentConfig` |

---

## B2C — Vitrine Pública em Detalhe

### `app/(store)/[slug]/page.tsx` — Cardápio

Server Component. Shell de layout `max-w-md mx-auto h-screen flex flex-col overflow-hidden shadow-2xl`. Header hero com foto de capa ou gradiente de `brandColor`. Verifica sessão do cliente (`getSessionUser`) e passa `isLoggedIn` ao `MenuComponent`.

### `components/MenuComponent.tsx` — Motor do Cardápio

Client Component central. Contém toda a lógica interativa:

**ScrollSpy:** `IntersectionObserver` com `rootMargin: '-10% 0px -80% 0px'` detecta qual categoria está visível e destaca o tab. `scrollMarginTop: '108px'` compensa o sticky header.

**Busca:** `searchQuery` como state. Modo de busca ativa exibe lista plana filtrada. Botão `✕` para limpar.

**Motor de Upsell:**
```ts
const cartProductIds = new Set(cart.map(i => i.product.id))
const upsellProducts = activeProducts
  .filter(p => !cartProductIds.has(p.id))
  .sort((a, b) => a.price - b.price)
  .slice(0, 6)
```
Exibido em carrossel horizontal dentro do drawer de checkout. Click: fecha checkout (150ms delay) → abre `ProductModal`.

**BottomNav inteligente:** Tab "Conta" → se `isLoggedIn`, navega para `/orders`; caso contrário, abre `PhoneLogin`. Elimina silent redirect failure.

**Travamento de scroll:** `document.body.style.overflow = 'hidden'` via `useEffect` quando qualquer modal está aberto. Drawer com `overscroll-contain`.

**Cálculo de frete:** `estimateDeliveryFee(addressId, storeId)` via `useEffect` ao abrir checkout ou trocar endereço. Mapbox geocodifica a loja + endereço do cliente, calcula distância em km, aplica `baseDeliveryFee + km * deliveryFeePerKm`, valida `maxDeliveryRadius`.

**Validação de troco:** `changeForError` como computed value — borda vermelha em tempo real, bloqueia submissão.

### Sistema de Temas — `lib/themes.ts`

6 temas predefinidos com tokens: `phoneBg`, `phoneCard`, `phoneText`, `phoneSubText`, `phoneBorderRadius`, `layoutStyle`, `fontFamily`. `brandColor` do tenant sobrescreve o accent de cada tema. Todos os componentes recebem `storeTheme: StoreTheme` como prop — zero cores hardcoded.

| ID | Nome |
|----|------|
| `classic-light` | Fundo branco, texto escuro |
| `tokyo-dark` | Dark mode profundo |
| `napoli-warm` | Tons quentes terrosos |
| `tropical-fresh` | Verde vibrante |
| `brazil-bbq` | Marrom e âmbar |
| `cafe-premium` | Neutros premium |

### SEO Dinâmico — `app/(store)/[slug]/layout.tsx`

`generateMetadata()` busca `{ name, tagline, coverImageUrl, logoUrl }` no banco. Monta `og:title`, `og:description` (`tagline ?? fallback`), `og:image` (`coverImageUrl ?? logoUrl`), `twitter:card: 'summary_large_image'`. WhatsApp e Instagram puxam o card de preview dinamicamente por loja.

### Fluxo de Pagamento

```
Checkout (drawer) → submitOrder() → res.orderId
  ├── PIX / CARD_ONLINE → /[slug]/pagamento/[id]?method=...
  │     ├── PIX → PaymentPixClient: POST /api/payments → QR code
  │     │         polling GET /api/orders/[id]/status a cada 4s
  │     │         webhook /api/webhooks/mercadopago → paymentStatus='approved'
  │     │         → redirect /[slug]/pedido/[id]
  │     └── CARD → PaymentClient (MP Bricks) → POST /api/payments
  │               → redirect /[slug]/pedido/[id]
  └── CARD_MACHINE / CASH → /[slug]/pedido/[id] direto
```

### App do Motoboy — `/[slug]/motoboy/`

Client Component com mapa Mapbox fullscreen (estilo Waze). GPS via `navigator.geolocation.watchPosition()` contínuo. Atualiza posição via `updateMotoboyLocation`. Rota desenhada via Mapbox Directions API a cada 30s. Botões: WhatsApp direto, abrir Waze com coordenadas, confirmar entrega. Estatísticas do dia (corridas + ganhos).

---

## B2B — Painel do Lojista em Detalhe

### Dashboard de Métricas — `/admin/`

Server Component com `force-dynamic`. Filtro temporal via `?period=` lido de `searchParams`. `getDateRange(period)` calcula `startDate/endDate` com `new Date(year, month, day)` puro (horário local, sem libs).

**Queries paralelas via `Promise.all`:**
- KPIs: totalSales, totalOrders, averageTicket (excluindo CANCELED)
- `groupBy paymentMethod` → breakdown por forma de pagamento
- `orderItem.findMany` → base para categorias e top produtos (Curva ABC)
- `order.findMany({ take: 8 })` sem filtro de data → últimos pedidos globais

**`RevenueChart.tsx`** (Client, recharts): `AreaChart` com curva `monotone`, gradiente na `brandColor` do tenant. Agrupamento por hora (today/yesterday) ou por dia (demais). Tooltip customizado.

**`DashboardFilter.tsx`** (Client): Dropdown custom com `useState isOpen`, `useRef + mousedown` para fechar ao clicar fora. `ChevronDown` animado 180°. `router.push('?period=...')` sem reload.

### KDS — `/admin/kds/`

Polling a cada N ms via `setInterval`. Pedidos PENDING e PREPARING em cards. Botão avança status. Suporte a fullscreen para monitores de cozinha. PIN numérico por tenant.

### Entregas — `/admin/entregas/`

Mapbox GL com react-map-gl. Zonas como polígonos GeoJSON via @turf/turf. CRUD de zonas com raio, taxa e tempo estimado. Debounce de 350ms no input de raio.

### Personalização — `/admin/personalizacao/`

Seleção de tema (6 opções), `brandColor` via color picker, upload de logo e banner para Supabase Storage. Preview em tempo real.

---

## Onboarding de Novo Tenant

```
POST /api/tenant (ou server action registerNewStore)
  ├── Validação: slug regex, reserved list, campos obrigatórios
  ├── DB: prisma.$transaction → Store + User (ADMIN) com passwordHash
  ├── Auto-login: assina cookie admin_session_{storeId}
  └── Redirect para /{slug}/admin
```

Slugs reservados: `admin`, `api`, `login`, `logout`, `cadastro`, `pricing`, entre outros.
