# CHECKUP_SISTEMA.md
### Auditoria de Código — Saiu Delivery SaaS
**Data:** 2026-04-02 | **Auditor:** CTO (Claude Code) | **Arquivos lidos:** 45+

---

## RESUMO EXECUTIVO

| Categoria | Crítico 🔴 | Alto 🟠 | Médio 🟡 | Baixo 🟢 |
|---|---|---|---|---|
| TypeScript `any` | 0 | 8 | 6 | — |
| Bugs de routing | 0 (corrigido) | — | — | — |
| Mocks residuais | 1 | 4 | 3 | — |
| Erros silenciosos | 0 (corrigido) | 2 | 2 | — |
| Segurança | 0 | 1 | 1 | — |
| Duplicação | — | 2 | 3 | — |

**Micro-correções já aplicadas nesta sessão:** 4 bugs corrigidos silenciosamente (detalhados na seção 6).

---

## 1. DÍVIDA TÉCNICA — TypeScript `any`

### 1.1 Altos — Risco de Lógica

| Arquivo | Linha | Contexto | Recomendação |
|---|---|---|---|
| `app/(store)/[slug]/pagamento/[id]/PaymentClient.tsx` | 29–31, 41 | `pix: 'all' as any`, `creditCard: 'all' as any`, `customization as any` | SDK do MP não exporta tipos adequados — criar `MpCustomization` local e usar `unknown` + cast pontual |
| `app/(store)/[slug]/pagamento/[id]/PaymentClient.tsx` | 43, 66 | `onSubmit = async (param: any)`, `onError = async (error: any)` | Usar tipos do `@mercadopago/sdk-react` se disponíveis; caso não, `unknown` com type-guard |
| `app/actions/admin.ts` | 389, 396 | `!VALID_KDS_STATUSES.includes(newStatus as any)`, `status: newStatus as any` | Derivar tipo do enum Prisma: `import { OrderStatus } from '@prisma/client'` e usar diretamente |
| `app/(store)/[slug]/pedido/[id]/OrderTracker.tsx` | 7 | `{ order: any }` como prop | Criar interface `TrackerOrder { id: string; status: OrderStatus; paymentStatus: string \| null }` |
| `app/(store)/[slug]/admin/(dashboard)/kds/page.tsx` | 33, 43 | `mapOrder(raw: any)`, `(item: any)` em loop | Criar `RawApiOrder` espelhando o retorno do Prisma `include`; remover `any` completamente |

### 1.2 Médios — Casting Pontual

| Arquivo | Linha | Contexto |
|---|---|---|
| `app/(store)/[slug]/motoboy/MotoboyClient.tsx` | 154 | `as any` em GeoJSON do Mapbox |
| `app/(store)/[slug]/orders/page.tsx` | 44 | `as any` em orders |
| `app/(store)/[slug]/motoboy/page.tsx` | 77–78 | `as any` (2×) em arrays de rides |
| `app/actions/checkout.ts` | 111 | `(a: any) => a.isDefault` — usar tipo do Prisma include |
| `components/MenuComponent.tsx` | 172–177 | `// @ts-ignore: Relation tipagem pendente` + 3 `as any` — mover tipo para `CustomerWithAddresses` |

### 1.3 `@ts-ignore` Explícitos

| Arquivo | Linha | Motivo real |
|---|---|---|
| `app/(store)/[slug]/pedido/[id]/page.tsx` | 36 | `<OrderTracker order={order}>` com `order: any` no componente filho — resolver tipando `OrderTracker` |
| `components/CustomerTracker.tsx` | 40–51 | 3× `@ts-ignore` em `res.data.driverLat/Lng` — tipar retorno de `getOrderLocation()` |

---

## 2. MOCKS E DADOS RESIDUAIS

### 2.1 Crítico — Dashboard com dados falsos em produção

**`app/(store)/[slug]/admin/(dashboard)/page.tsx`** — linhas 75–113

As três seções de "análise" do dashboard são totalmente fabricadas:
```
"João Souza" · "Maria Ferreira" · "Carlos Silva"   ← nomes falsos
"R$ 1.250,00" (carnes) · "R$ 800,00" (bebidas)     ← valores inventados
"R$ 1.800,00" (PIX 65%)                             ← breakdown fictício
```
Os `MetricCard` de topo (Vendas, Ticket Médio, Pedidos) já buscam dados reais. As seções abaixo não. A tabela "Últimos Pedidos" mostra registros hardcoded.

**Ação:** Substituir `CategoryRow`, `PaymentRow` e `OrderRow` por queries Prisma reais agrupadas.

### 2.2 Altos — Dados fixos no produto

| Arquivo | Linha | Dado hardcoded | Impacto |
|---|---|---|---|
| `components/ProductModal.tsx` | 19–31 | `REMOVAL_OPTIONS`, `MIX_PREFERENCES`, `UPSELLS` arrays fixos | Cada loja tem seus próprios acompanhamentos; isso deveria vir do banco por storeId |
| `app/actions/checkout.ts` | 13–17 | `SERVER_UPSELLS` object fixo (`u1: Carne Assada Extra R$10`) | Lojista não pode configurar upsells — valor sempre será da churrascaria original |
| `components/CustomerTracker.tsx` | 20–22 | `longitude: -47.95, latitude: -16.04` (Brasília/Luziânia) | Mapa inicia em coordenada errada se loja não tiver GPS configurado |
| `app/(store)/[slug]/pagamento/[id]/PaymentClient.tsx` | 24 | `email: "cliente@churras.com"` como payer hardcoded no MP Brick | Pode causar rejeição em produção se o MP validar identidade do pagador |

### 2.3 Médios — Seeds e configuração

| Arquivo | Linha | Dado |
|---|---|---|
| `prisma/seed.ts` | 48–49 | `'APP_USR-token-ficticio-por-enquanto'` como MP access token |
| `prisma/seed.ts` | 64 | `password: 'senha_criptografada_futura'` — senha nunca hashada em seed |
| `app/api/tenant/route.ts` | 107 | `// isActive: false ← descomente quando billing estiver ativo` — billing never shipped |

---

## 3. FRAGILIDADES DE UX E LÓGICA

### 3.1 O que acontece se o Mapbox cair no checkout?

**Arquivos:** `app/actions/checkout.ts` (linhas 68–79, 224–244), `lib/mapbox.ts`

`getDrivingDistance()` pode retornar `null` se a API cair. O código trata esse caso com fallback para `baseDeliveryFee`. **Isso é correto.** Porém, o cliente não recebe nenhuma mensagem explicando que o frete foi estimado com valor base. No modal de checkout, a linha "Entrega" exibirá um valor sem indicar que é aproximado.

**Ação:** Retornar `{ fee, approximate: true }` de `estimateDeliveryFee` quando `distanceKm === null`, e exibir `"R$ X,XX (estimado)"` no UI.

### 3.2 O que acontece se o lojista fechar o navegador no cadastro?

**Arquivo:** `app/(marketing)/cadastro/page.tsx`

O stepper usa apenas estado React — ao fechar a aba no Passo 2 ou 3, todos os dados preenchidos são perdidos. Nenhum `localStorage` ou `sessionStorage` persiste o progresso.

**Ação:** `useEffect` que grava `formData` em `sessionStorage` a cada mudança; restaurar no mount se existir.

### 3.3 Polling sem indicação de falha

**`OrderTracker.tsx`** — Corrigido nesta sessão (catch vazio → `console.error`), mas o cliente continua sem feedback visual se o servidor retornar erro. A tela "congela" no último status conhecido sem avisar.

**Ação:** Adicionar estado `isStale: boolean` que exibe um badge "Atualizando..." ou "Sem conexão" após N falhas consecutivas.

### 3.4 KDS: polling sem retry

**`app/(store)/[slug]/admin/(dashboard)/kds/page.tsx`** — `loadOrders()` falha silenciosamente; `isLoading` fica `false` após a primeira carga e não há indicador se o polling subsequente falhar.

**Ação:** Adicionar `fetchError` state; exibir banner de warning no header do KDS se o último fetch falhou.

### 3.5 GPS tracking sem parada automática

**`components/CustomerTracker.tsx`** — O `setInterval` de 4s roda infinitamente enquanto o componente estiver montado. Se o pedido chegar ao status `DELIVERED`, o GPS continua enviando localização desnecessariamente.

**Ação:** No `useEffect`, verificar o status do pedido e chamar `clearInterval` quando `status === 'DELIVERED' || status === 'CANCELED'`.

---

## 4. OTIMIZAÇÃO DE CÓDIGO

### 4.1 Duplicação de lógica — Centralizar em `lib/`

| Padrão duplicado | Onde | Solução |
|---|---|---|
| `SLUG_REGEX` + `RESERVED_SLUGS` | `api/tenant/route.ts`, `api/tenant/check-slug/route.ts`, `actions/tenant.ts` | Criar `lib/validation.ts` com exports `SLUG_REGEX`, `RESERVED_SLUGS`, `isValidSlug()` |
| `.replace(/\D/g, '')` (sanitização de telefone) | `actions/auth.ts:11`, `actions/tenant.ts:16` | `lib/phone.ts` → `export function sanitizePhone(v: string)` |
| Construção de `fullAddress` para geocodificação | `actions/auth.ts:122`, `actions/checkout.ts:196` | Mover para `lib/mapbox.ts` → `buildAddressString(addr)` |

### 4.2 Componentes gigantes

| Arquivo | Linhas | Proposta de divisão |
|---|---|---|
| `components/MenuComponent.tsx` | **549** | `<CategoryNav>`, `<ProductGrid>`, `<CartModal>`, `<CheckoutModal>` — cada um em arquivo próprio em `components/menu/` |
| `components/PhoneLogin.tsx` | **435** | `<PhoneStep>`, `<AddressStep>`, `<DoneStep>` — extrair steps como componentes internos |
| `app/(store)/[slug]/admin/(dashboard)/page.tsx` | **212** | `<SalesChart>`, `<PaymentBreakdown>`, `<RecentOrdersTable>` — extrair para `admin/dashboard/` |

### 4.3 `STATUS_ADVANCE` no KDS com tipo errado

**`kds/page.tsx` linha 141:**
```ts
// ❌ Atual — retorna string genérica
const STATUS_ADVANCE: Record<KdsOrder['status'], string> = { ... }

// ✅ Correto — retorna o union type do status
const STATUS_ADVANCE: Record<KdsOrder['status'], KdsOrder['status'] | 'DISPATCHED'> = { ... }
```

### 4.4 `import React` desnecessário

Em componentes `"use client"` com Next.js 13+, o import explícito de React não é necessário para JSX. Arquivos que importam `React` apenas para JSX (não para hooks ou tipos):
- `components/CustomerTracker.tsx` linha 1
- `components/ProductModal.tsx` linha 1
- `app/(store)/[slug]/pedido/[id]/OrderTracker.tsx` linha 2
- `app/(store)/[slug]/pagamento/[id]/PaymentClient.tsx` linha 2

---

## 5. SEGURANÇA — PONTOS RESIDUAIS

### 5.1 Cookie `session_token` (global) no route de status — CORRIGIDO

`app/api/orders/[id]/status/route.ts` usava `cookieStore.get('session_token')` e `cookieStore.get('admin_token')` — nomes globais da arquitetura antiga. **Corrigido nesta sessão** para `lojista_token_${order.storeId}` e `session_token_${order.storeId}`.

### 5.2 `NEXT_PUBLIC_APP_URL || req.headers.get("origin")`

**`app/api/payments/route.ts` linha 66:**
```ts
const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.headers.get("origin")
```
O `origin` header pode ser forjado por um cliente malicioso. Em produção, `NEXT_PUBLIC_APP_URL` deve estar sempre definido. Adicionar validação:
```ts
const baseUrl = process.env.NEXT_PUBLIC_APP_URL
if (!baseUrl) throw new Error('[payments] NEXT_PUBLIC_APP_URL não definido')
```

### 5.3 Upsells validados apenas contra lista hardcoded

**`app/actions/checkout.ts` linhas 162–168:** `SERVER_UPSELLS` é um objeto hardcoded. Qualquer `upsellId` não reconhecido é simplesmente ignorado (sem preço adicional). Isso é seguro mas impede extensibilidade real. Quando upsells virarem entidade do banco, a validação precisará ser refatorada.

---

## 6. MICRO-CORREÇÕES APLICADAS NESTA SESSÃO

Estas correções foram aplicadas silenciosamente durante a auditoria:

| # | Arquivo | Correção |
|---|---|---|
| 1 | `PaymentClient.tsx` | `console.log(error)` → `console.error('[PaymentClient] erro no brick MP:', error)` |
| 2 | `OrderTracker.tsx` | Catch vazio `{}` → `console.error('[OrderTracker] falha no polling...')` |
| 3 | `api/orders/[id]/status/route.ts` | Cookie names `admin_token`/`session_token` → `lojista_token_${storeId}`/`session_token_${storeId}` (alinhamento com refatoração de isolamento) |
| 4 | `PaymentClient.tsx` + `pagamento/[id]/page.tsx` | `router.push('/pedido/${orderId}')` → `router.push('/${slug}/pedido/${orderId}')` — bug de routing multi-tenant; prop `slug` adicionada ao componente |

---

## 7. PRÓXIMAS AÇÕES RECOMENDADAS (Backlog de Qualidade)

### 🔴 Imediato (antes de qualquer novo lojista)
- [ ] **Dashboard: substituir mock data por dados reais** — `CategoryRow`, `PaymentRow`, `OrderRow`
- [ ] **`prisma/seed.ts`: hashar a senha** com `bcryptjs` em vez de string literal
- [ ] **`PaymentClient.tsx`: substituir `payer.email` hardcoded** pelo e-mail real do lojista/cliente

### 🟠 Sprint de Qualidade
- [ ] **`lib/validation.ts`**: centralizar `SLUG_REGEX`, `RESERVED_SLUGS`, `isValidSlug()`
- [ ] **`lib/phone.ts`**: `sanitizePhone()` compartilhado
- [ ] **`lib/mapbox.ts`**: `buildAddressString()` para evitar duplicação
- [ ] **Tipar `OrderTracker`**: interface `TrackerOrder` em vez de `any`
- [ ] **Tipar `mapOrder` no KDS**: interface `RawApiOrder` espelhando o Prisma include
- [ ] **`ProductModal.tsx`**: mover `REMOVAL_OPTIONS`, `MIX_PREFERENCES`, `UPSELLS` para o banco (tabela `ProductOption`)

### 🟡 Backlog de UX
- [ ] **Cadastro**: persistir `formData` em `sessionStorage` para sobreviver a fechamento de aba
- [ ] **Checkout**: retornar `approximate: true` quando Mapbox cair e exibir `"estimado"` no UI
- [ ] **KDS**: adicionar `fetchError` state e banner visual de falha no polling
- [ ] **OrderTracker**: `isStale` badge após N falhas de polling consecutivas
- [ ] **CustomerTracker**: parar GPS quando status `DELIVERED`/`CANCELED`
- [ ] **`NEXT_PUBLIC_APP_URL`**: remover fallback para `origin` header em `api/payments/route.ts`

---

## 8. O QUE ESTÁ BEM

Antes de fechar, o que merece ser preservado e não tocado:

- **Isolamento multi-tenant** — `where: { id, storeId }` em 20+ queries; padrão consistente
- **Isolamento de cookies por tenant** — `lojista_token_${storeId}` e `session_token_${storeId}` implementados
- **HMAC em sessões** — `signPayload/verifyPayload` com `timingSafeEqual` — correto
- **Boot guard do `COOKIE_SECRET`** — falha ruidosa na inicialização se ausente — correto
- **`tenantWhere()`** — helper centralizado, usado em todos os lugares certos
- **Transação atômica no registro** — `prisma.$transaction` em `registerNewStore` — correto
- **Polling com cancellation flag** — `let cancelled = false` + `return () => { cancelled = true }` em `MenuComponent` — correto
- **Validação server-side de preços** — `submitOrder` recalcula tudo no servidor, nunca confia no cliente — correto
- **`ElapsedTimer` sem hydration mismatch** — `isMounted` guard com SSR fallback `00:00` — correto
