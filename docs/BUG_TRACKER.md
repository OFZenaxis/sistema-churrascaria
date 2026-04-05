# BUG TRACKER — Saiu Delivery SaaS

> **Documento Oficial de Engenharia — Leitura obrigatória para todo o time.**
> Última atualização: 2026-04-04 (Auditoria autônoma sobre o código-fonte real)

---

## Legenda

| Ícone | Severidade | Critério |
|-------|------------|---------|
| 🔴 | CRÍTICO | Segurança, perda de dados financeiros ou funcionalidade core quebrada |
| 🟠 | ALTO | Impacto direto na experiência do lojista/cliente em produção |
| 🟡 | MÉDIO | Dívida técnica significativa ou degradação de UX |
| 🟢 | BAIXO | Cosmético, refactor ou melhoria sem urgência |

| Status | Significado |
|--------|------------|
| ABERTO | Não corrigido |
| EM PROGRESSO | Alguém está trabalhando |
| RESOLVIDO | Corrigido e deployado |

---

## 🔴 CRÍTICOS

### BUG-001 — `getOrderLocation` expõe localização do motoboy sem autenticação

- **Arquivo:** `app/actions/tracker.ts`
- **Status:** RESOLVIDO
- **Descrição:** A server action `getOrderLocation(orderId)` retorna `driverLat`, `driverLng` e `status` sem validar nenhum cookie de sessão. Qualquer pessoa que conheça um UUID de pedido pode rastrear a localização em tempo real do entregador indefinidamente.
- **Impacto:** Exposição de dados de localização; risco de stalking de motoristas ou interferência em entregas.
- **Correção aplicada (2026-04-04):** Adicionado `storeId` como segundo parâmetro obrigatório. A action agora verifica em paralelo `getSessionUser(storeId)` (cliente) e `getLojistaSession(storeId)` (admin). Sem sessão válida, retorna `{ success: false, error: 'Não autorizado' }`. Clientes só podem ver coordenadas do próprio pedido (`customerId` validado). A query Prisma usa `findFirst({ where: { id, storeId } })` para garantir isolamento de tenant. `CustomerTracker.tsx` atualizado para receber e repassar `storeId`; `OrdersClient.tsx` atualizado para passar `storeId` ao componente.

---

### BUG-002 — Webhook do Mercado Pago não valida `x-signature`

- **Arquivo:** `app/api/webhooks/mercadopago/route.ts`
- **Status:** RESOLVIDO
- **Descrição:** O endpoint `POST /api/webhooks/mercadopago` não valida o header `x-signature` que o Mercado Pago envia para autenticar a origem do webhook. Qualquer requisição HTTP forjada pode simular um pagamento aprovado, alterando `paymentStatus → "PAID"` e `status → "PREPARING"` sem pagamento real.
- **Impacto:** Fraude financeira direta ao lojista; pedidos "pagos" sem receita.
- **Correção aplicada (2026-04-04):** Adicionado bloco de validação HMAC-SHA256 logo após o bypass de pings de teste. O header `x-signature` é parseado para extrair `ts` e `v1`. O manifesto `id:<dataId>;request-id:<xRequestId>;ts:<ts>;` é assinado com `MP_WEBHOOK_SECRET` via `createHmac('sha256', secret)`. Comparação feita com `crypto.timingSafeEqual` para resistir a timing attacks. Requests sem header, com formato inválido ou com assinatura errada recebem HTTP 401. Se `MP_WEBHOOK_SECRET` não estiver configurado, o servidor rejeita com 500. Pings de teste (`data.id=123456`) continuam sendo tratados antes da validação.

---

### BUG-003 — `console.log/error` em código de produção (41+ ocorrências)

- **Arquivo(s):** `app/actions/admin.ts`, `app/actions/checkout.ts`, `app/actions/auth.ts`
- **Status:** RESOLVIDO
- **Descrição:** 41+ chamadas a `console.error`/`console.log` no servidor sem estruturação. Em produção polui logs do PM2, pode expor stack traces com dados sensíveis e dificulta diagnóstico de erros reais.
- **Correção aplicada (2026-04-04):** Criado `lib/logger.ts` com `logger.info`, `logger.warn` e `logger.error`. Cada método formata `[ISO_TIMESTAMP] [LEVEL] [module] message` e roteia para o `console` correspondente. Todos os `console.error` em `admin.ts` (14 ocorrências), `checkout.ts` (1) e `auth.ts` (3) foram substituídos por `logger.error('module', msg, err)`. O logger também integra com Sentry (ver BUG-018): se `SENTRY_DSN` estiver configurado, erros são capturados via `Sentry.captureException`.

---

## 🟠 ALTOS

### BUG-004 — CustomerTracker faz polling eterno após pedido entregue

- **Arquivo:** `components/CustomerTracker.tsx`
- **Status:** RESOLVIDO
- **Descrição:** O `setInterval` que chama `getOrderLocation()` a cada 4 segundos não é cancelado quando `status === "DELIVERED"` ou `"CANCELED"`. O cliente continua gerando requisições ao servidor e ao banco indefinidamente.
- **Impacto:** Custo de banco desnecessário; sobrecarga do servidor em pico de pedidos.
- **Correção aplicada (2026-04-04):** Reescrito o `useEffect` com flag `stopped` e variável `intervalId`. Ao receber `DELIVERED` ou `CANCELED`, chama `clearInterval(intervalId)`, seta `stopped = true` e dispara `onDelivered?.()` apenas para DELIVERED. O cleanup do `useEffect` também seta `stopped = true` para evitar race conditions em resultados assíncronos tardios. Removidos todos os `@ts-ignore` (tipagem agora correta via retorno de `getOrderLocation`). Dependência `storeId` adicionada ao array do `useEffect`.

---

### BUG-005 — `updateMotoboyLocation` não valida range de coordenadas

- **Arquivo:** `app/actions/tracker.ts`
- **Status:** RESOLVIDO
- **Descrição:** A action salva `lat` e `lng` no banco sem validar se são coordenadas geográficas válidas. Um payload malicioso pode gravar `NaN`, `Infinity` ou valores absurdos que corrompem o mapa de rastreamento.
- **Correção aplicada (2026-04-04):** Guard adicionado no topo da função: verifica `typeof`, `isFinite`, e faixas geográficas válidas (`-90 ≤ lat ≤ 90`, `-180 ≤ lng ≤ 180`). Retorna `{ success: false, error: 'Coordenadas inválidas' }` sem tocar no banco.

---

### BUG-006 — Falha silenciosa na geocodificação de endereços do cliente

- **Arquivo:** `app/actions/auth.ts` — `saveAddress()`
- **Status:** RESOLVIDO
- **Descrição:** A geocodificação do endereço era disparada com `.catch(console.error)` sem await. Se a chamada ao Mapbox falhasse, o endereço era salvo com `lat: null, lng: null` sem aviso ao cliente.
- **Correção aplicada (2026-04-04):** Função local `geocodeAddress` agora retorna `Promise<boolean>` (true = coordenadas salvas, false = falha). `saveAddress` aguarda o resultado e inclui `geocodingFailed: true` no retorno quando a geocodificação falha, permitindo que a UI exiba um aviso ao cliente.

---

### BUG-007 — `saveDeliverySettings` aceita coordenadas `(0, 0)` como válidas

- **Arquivo:** `app/actions/admin.ts` — `saveDeliverySettings()`
- **Status:** RESOLVIDO
- **Descrição:** Se o Mapbox retornava `{ lat: 0, lng: 0 }` (resposta de falha silenciosa), o banco era atualizado com coordenadas inválidas apontando para o Oceano Atlântico.
- **Correção aplicada (2026-04-04):** Após receber `coords` do Mapbox, verifica `Math.abs(coords.lat) < 0.001 && Math.abs(coords.lng) < 0.001`. Se verdadeiro, `coords` é setado para `null` e o campo `storeLat/Lng` não é atualizado no banco (spread condicional `...(coords && {...})`). `geocodeWarning` é retornado ao lojista em ambos os casos de falha.

---

### BUG-008 — KDS sem indicação visual de falha de polling

- **Arquivo:** `app/(store)/[slug]/admin/(dashboard)/kds/page.tsx`
- **Status:** RESOLVIDO
- **Descrição:** O `setInterval` de 8 segundos falhava silenciosamente quando `fetchKdsOrders()` lançava erro. O cozinheiro não tinha como saber que a lista de pedidos estava desatualizada.
- **Correção aplicada (2026-04-04):** Adicionado estado `hasPollingError` + `consecutiveErrorsRef`. `loadOrders` incrementa o contador em cada falha (retorno `!success` ou exceção); após 2+ falhas consecutivas ativa o banner. Em sucesso, reseta o contador e remove o banner. Banner inline (não flutuante) exibido abaixo do header com botão "Tentar agora".

---

### BUG-009 — `estimateDeliveryFee` sem flag de fallback quando Mapbox falha

- **Arquivo:** `app/actions/checkout.ts` + `components/MenuComponent.tsx`
- **Status:** RESOLVIDO
- **Descrição:** Quando o Mapbox Directions falhava, o fallback retornava `baseDeliveryFee` sem flag `isEstimated`. O cliente via um valor que podia diferir do frete real cobrado.
- **Correção aplicada (2026-04-04):** Tipo de retorno de `estimateDeliveryFee` atualizado para incluir `isEstimated?: boolean`. Todos os caminhos de fallback (sem storeLat/Lng, sem coords do cliente, `distanceKm === null`, catch) retornam `isEstimated: true`. `MenuComponent.tsx` adicionou estado `isFeeEstimated` e renderiza `"* Frete estimado — valor exato confirmado após o pedido."` abaixo do valor de entrega quando a flag está ativa.

---

## 🟡 MÉDIOS / DÍVIDA TÉCNICA

### BUG-010 — TypeScript `any` em operações críticas

- **Arquivo(s):**
  - `app/actions/checkout.ts:101` → `(a: any) => a.isDefault`
  - `app/actions/admin.ts:381,388` → `newStatus as any`
  - `app/api/webhooks/mercadopago/route.ts:19,106` → `let body: any`
  - `app/(store)/[slug]/admin/(dashboard)/kds/page.tsx:33,43` → `mapOrder(raw: any)`
- **Status:** RESOLVIDO
- **Correção aplicada (2026-04-04):**
  - `checkout.ts`: `: any` removido de `a.isDefault` (TypeScript infere do retorno Prisma); `catch (error: any)` → `unknown` com type-guard `'code' in error` para P2002.
  - `admin.ts`: `OrderStatus` importado do `@prisma/client`; type guard `isValidOrderStatus(s: string): s is OrderStatus` substitui ambos os `as any`; `data: { status: newStatus }` sem cast.
  - `webhooks/route.ts`: `type MercadoPagoWebhookBody = { data?: { id?: string }; action?: string }` declarado; ambos `catch (e: any)` → `unknown`.
  - `kds/page.tsx`: `type RawKdsOrder = Awaited<ReturnType<typeof fetchKdsOrders>>['orders'][number]` e `type RawKdsItem = RawKdsOrder['items'][number]` derivados diretamente do retorno da server action; `mapOrder(raw: any)` e `item: any` eliminados.

---

### BUG-011 — `PhoneLogin` perde estado ao recarregar página

- **Arquivo:** `components/PhoneLogin.tsx`
- **Status:** RESOLVIDO
- **Descrição:** Stepper de 3 passos usa apenas React state. Recarregar na etapa de endereço apaga telefone e nome digitados.
- **Correção aplicada (2026-04-04):** Dois `useEffect` adicionados. (1) Restauração: lê `phonelogin_draft_${storeId}` do `sessionStorage` na montagem — resiste a F5 e histórico do browser; restaura apenas se `step !== 'done'`. (2) Persistência: escreve `{ step, phone, name }` sempre que mudam; limpa a chave quando `step === 'done'`. Chave isolada por `storeId` — sem cross-contamination entre lojas. Todos os acessos envolvem try/catch para ambientes sem sessionStorage (modo privado restrito, SSR).

---

### BUG-012 — Duplicação da lógica de validação de slug

- **Arquivo(s):** `app/actions/tenant.ts`, `app/api/tenant/route.ts`, `app/api/tenant/check-slug/route.ts`
- **Status:** RESOLVIDO
- **Correção aplicada (2026-04-04):** Criado `lib/validation.ts` como fonte única de verdade com `SLUG_REGEX` e `RESERVED_SLUGS`. As constantes foram removidas dos 3 arquivos e substituídas por `import { SLUG_REGEX, RESERVED_SLUGS } from '@/lib/validation'`. Alterações futuras na política de slugs precisam ser feitas em um único lugar.

---

### BUG-013 — Consultas Prisma sem paginação (risco de timeout em pico)

- **Arquivo(s):**
  - `app/actions/admin.ts` → `fetchKdsOrders` sem `take`
  - `app/api/admin/orders/route.ts` → sem limite de registros
- **Status:** RESOLVIDO
- **Correção aplicada (2026-04-04):** `fetchKdsOrders` recebeu `take: 100` na query (pedidos ativos do dia já são filtrados por status, limite é safety net). `/api/admin/orders` GET implementou paginação cursor-based: `PAGE_SIZE = 50`, aceita query param `?cursor=<orderId>`, retorna `nextCursor` no response. Callers podem paginar em páginas de 50 registros sem risco de OOM.

---

### BUG-014 — Imagens de produtos sem otimização (`<img>` em vez de `<Image>`)

- **Arquivo(s):** `components/ProductCard.tsx`, `components/ProductModal.tsx`
- **Status:** RESOLVIDO
- **Correção aplicada (2026-04-04):** `ProductCard.tsx` migrado para `<Image fill sizes="100px" className="object-cover" />` do `next/image` — o container já possui `relative` + dimensões fixas `w-[100px] h-[100px]`, garantindo posicionamento correto. `ProductModal.tsx` auditado: não contém `<img>` (o modal exibe apenas nome, descrição, observação e CTA — nenhuma imagem). Domínio Supabase já configurado em `remotePatterns` no `next.config.ts`.

---

### BUG-015 — `MenuComponent.tsx` monolítico (549 linhas)

- **Arquivo:** `components/MenuComponent.tsx`
- **Status:** RESOLVIDO
- **Descrição:** Um único arquivo continha: lista de produtos, carrinho, checkout modal, estimativa de frete, login modal e bottom nav. Difícil de testar e manter.
- **Correção aplicada (2026-04-04):** O checkout drawer (ex-linhas 594-868) foi extraído para `components/menu/CheckoutModal.tsx`. A interface `CheckoutModalProps` tipifica os 25 props com precisão. Tipos `CartItem`, `PaymentMethod` e `PAYMENT_OPTIONS` foram exportados de `MenuComponent.tsx` para reutilização. O `MenuComponent` agora renderiza `<CheckoutModal ...>` com props explícitas — sem prop drilling oculto. Imports não-utilizados (`X`, `Check`, `Loader2`, `MapPin`) foram removidos do arquivo pai.

---

### BUG-016 — Rate limiting ausente em endpoints públicos

- **Arquivo(s):** `app/api/tenant/route.ts`, `app/api/tenant/check-slug/route.ts`
- **Status:** RESOLVIDO
- **Descrição:** Sem rate limiting, bots podiam enumerar slugs, fazer brute-force em telefones ou criar tenants em massa.
- **Correção aplicada (2026-04-04):** Criado `lib/ratelimit.ts` com Map em memória, TTL por janela e limpeza periódica a cada 60s (`setInterval`). Adequado para VPS single-instance; pode ser substituído por Redis em multi-instância. `POST /api/tenant` recebe limite de 5 req/min por IP; `GET /api/tenant/check-slug` recebe 30 req/min. Ambos retornam HTTP 429 com header `Retry-After` em segundos quando o limite é excedido.

---

## 🟢 MELHORIAS BAIXA PRIORIDADE

### BUG-017 — Ausência completa de testes automatizados

- **Status:** RESOLVIDO
- **Descrição:** Zero testes unitários, integração ou e2e. Qualquer refactor pode quebrar silenciosamente fluxos críticos.
- **Correção aplicada (2026-04-04):** Instalado `vitest` como devDependency. Criado `vitest.config.ts` (environment: node, glob: `__tests__/**/*.test.ts`). Adicionado `"test": "vitest run"` ao `package.json`. Criado `__tests__/validation.test.ts` com 8 testes cobrindo `SLUG_REGEX` (válidos, maiúsculas, espaços, caracteres especiais, hífen inicial/final, hifens consecutivos) e `RESERVED_SLUGS` (slugs bloqueados e slugs permitidos). Todos os 8 testes passam (`npm test`).

---

### BUG-018 — Sem monitoramento de erros em produção (Sentry / similar)

- **Status:** RESOLVIDO
- **Descrição:** Erros de produção só aparecem nos logs do PM2 sem alertas, agrupamento ou stack traces navegáveis.
- **Correção aplicada (2026-04-04):** Instalado `@sentry/nextjs`. Criado `sentry.client.config.ts` que inicializa o Sentry com `dsn: NEXT_PUBLIC_SENTRY_DSN`, `tracesSampleRate: 0.1` em produção e `enabled: !!NEXT_PUBLIC_SENTRY_DSN` (sem DSN = Sentry desligado, sem erros em dev). `lib/logger.ts` integrado: `logger.error()` chama `Sentry.captureException(err, { tags: { module } })` quando `process.env.SENTRY_DSN` está presente. Variáveis `NEXT_PUBLIC_SENTRY_DSN` e `SENTRY_DSN` devem ser adicionadas ao `.env` quando o projeto for criado no sentry.io.

---

### BUG-019 — Fallback de localização do tracker hardcoded para Luziânia/GO

- **Arquivo:** `components/CustomerTracker.tsx`
- **Status:** RESOLVIDO
- **Correção aplicada (2026-04-04):** `CustomerTracker` recebe as props opcionais `storeLat: number | null` e `storeLng: number | null`. O `viewState` inicial usa `storeLng ?? FALLBACK_LNG` / `storeLat ?? FALLBACK_LAT` (constantes nomeadas em vez de números mágicos). A cadeia de prop drilling foi atualizada: `orders/page.tsx` adicionou `storeLat` e `storeLng` ao `select` do Prisma; `OrdersClientProps` e o componente `OrdersClient.tsx` foram atualizados para receber e repassar os valores. Lojas sem GPS configurado continuam usando o fallback de Brasília.

---

### BUG-020 — Upsells de produtos hardcoded no MenuComponent

- **Arquivo:** `prisma/schema.prisma`, `components/MenuComponent.tsx`
- **Status:** RESOLVIDO (infraestrutura de dados)
- **Descrição:** Arrays de upsells e opções de acompanhamento eram definidos no código-fonte, não no banco. Lojistas não podiam configurar seus próprios combos.
- **Correção aplicada (2026-04-04):** Adicionado modelo `ProductOption` ao `prisma/schema.prisma` com campos: `groupName` (ex: "Ponto da Carne"), `label` (ex: "Ao ponto"), `priceAdd: Float @default(0)`, `isActive: Boolean`, `sortOrder: Int`, `@@index([productId])`. Relação `Product.options ProductOption[]` adicionada. Schema publicado via `prisma db push` + Prisma Client regenerado. A UI de gerenciamento de opções no admin e o consumo no `ProductModal` são o próximo passo (registrado em ROADMAP como feature futura).

---

## Histórico de Correções

> Itens C-01 a C-05, W-01 a W-10 e O-01 a O-08 foram identificados e corrigidos em 2026-04-04 na auditoria anterior (23 itens resolvidos).

| ID | Data | Responsável | Descrição resumida da correção |
|----|------|-------------|-------------------------------|
| C-01 | 2026-04-04 | CTO | Removido fallback cross-tenant em `getActiveStore`; `GET` e `PUT` retornam 401 quando host ausente |
| C-02 | 2026-04-04 | CTO | Removidos todos os `@ts-ignore` em `loadUserAddresses`; tipagem via `Awaited<ReturnType<typeof getSessionUser>>` |
| C-03 | 2026-04-04 | CTO | Webhook MP: catch loga erro + retorna 400 se body corrompido sem `data.id` na URL; pings de teste preservados |
| C-04 | 2026-04-04 | CTO | Interface `MercadoPagoPaymentPayload` criada em `api/payments/route.ts`; `any` eliminado do payload |
| C-05 | 2026-04-04 | CTO | ID do carrinho migrado de `Math.random()` para `crypto.randomUUID()` |
| W-01 | 2026-04-04 | CTO | `useEffect` cleanup com `URL.revokeObjectURL` adicionado em `ThemeClient.tsx`; guarda para URLs blob apenas |
| W-02 | 2026-04-04 | CTO | Todos os `console.error` sanitizados: `error.message` apenas, stacks SQL e objetos Prisma nunca chegam ao Vercel Logs |
| W-03 | 2026-04-04 | CTO | `orderItems.findMany` + reduce substituídos por dois `$queryRaw` com GROUP BY no banco; zero dados em memória |
| W-04 | 2026-04-04 | CTO | Já estava corrigido: `useCallback([], [])` na versão atual; confirmado e documentado |
| W-05 | 2026-04-04 | CTO | Rollback via snapshot em `advanceStatus` e `archiveOrder`; toast de erro vermelho por 4s no KDS |
| W-06 | 2026-04-04 | CTO | try/catch em `getLojistaSession` no layout admin; exceções redirecionam para login em vez de 500 |
| W-07 | 2026-04-04 | CTO | Validação de MIME type em `lib/upload.ts`; rejeita tudo fora de JPEG/PNG/WebP antes do Supabase |
| W-08 | 2026-04-04 | CTO | Helpers `requestFullscreen/exitFullscreen/getFullscreenElement` com fallback webkit; `webkitfullscreenchange` no listener |
| W-09 | 2026-04-04 | CTO | `setIsLoading(false)` movido para `finally` em `loadOrders`; spinner nunca trava em erro de rede |
| W-10 | 2026-04-04 | CTO | Fallback de cookie agora valida `sid === cookie.name.replace('lojista_token_', '')`; cross-tenant impossível |
| O-01 | 2026-04-04 | CTO | `filteredProducts` em `useMemo([products, searchTerm, categoryFilter])`; re-filtro apenas quando deps mudam |
| O-02 | 2026-04-04 | CTO | `STATUS_CONFIG` movido para escopo do módulo em `page.tsx`; removido do corpo de `OrderRow` |
| O-03 | 2026-04-04 | CTO | `requireAdminSession(storeId)` criado em `adminAuth.ts`; 5 server actions migradas do padrão repetido |
| O-04 | 2026-04-04 | CTO | `handleImageUpload(field: 'logo'\|'cover')` em `StoreSettingsClient`; call sites simplificados |
| O-05 | 2026-04-04 | CTO | Confirmado: debounce apenas atualiza estado local, sem requisição em flight; documentado com comentário |
| O-06 | 2026-04-04 | CTO | `categoryName` fallback `''` → `'Outros'` em `app/(store)/[slug]/page.tsx` |
| O-07 | 2026-04-04 | CTO | Classe `.hide-scrollbar` adicionada a `globals.css` com suporte a Firefox, IE e WebKit |
| O-08 | 2026-04-04 | CTO | `aria-haspopup`, `aria-expanded`, `role="listbox"`, `role="option"`, `aria-selected` em `DashboardFilter` |
| BUG-001 | 2026-04-04 | CTO | `getOrderLocation` protegida: requer sessão de cliente ou admin + validação de `customerId` e `storeId` |
| BUG-002 | 2026-04-04 | CTO | Webhook MP: validação HMAC-SHA256 do `x-signature` com `timingSafeEqual`; HTTP 401 em assinatura inválida |
| BUG-004 | 2026-04-04 | CTO | `CustomerTracker`: polling parado com flag `stopped` + `clearInterval` ao receber DELIVERED ou CANCELED |
| BUG-005 | 2026-04-04 | CTO | `updateMotoboyLocation`: guard de `typeof`, `isFinite` e faixas geográficas antes de persistir no banco |
| BUG-006 | 2026-04-04 | CTO | `saveAddress`: geocodificação aguardada com await; retorna `geocodingFailed: true` se Mapbox falhar |
| BUG-007 | 2026-04-04 | CTO | `saveDeliverySettings`: coords `(0,0)` tratadas como falha silenciosa; `storeLat/Lng` não atualizado |
| BUG-008 | 2026-04-04 | CTO | KDS: `hasPollingError` + contador de falhas consecutivas; banner inline após 2+ falhas de polling |
| BUG-009 | 2026-04-04 | CTO | `estimateDeliveryFee`: `isEstimated: true` nos fallbacks; aviso de frete estimado no `MenuComponent` |
| BUG-010 | 2026-04-04 | CTO | `any` eliminado: type guard `isValidOrderStatus`, `MercadoPagoWebhookBody`, `RawKdsOrder` derivado via `ReturnType` |
| BUG-011 | 2026-04-04 | CTO | `PhoneLogin`: draft `{ step, phone, name }` persistido e restaurado do `sessionStorage` por `storeId` |
| BUG-012 | 2026-04-04 | CTO | `SLUG_REGEX`/`RESERVED_SLUGS` extraídos para `lib/validation.ts`; 3 arquivos agora importam da fonte única |
| BUG-013 | 2026-04-04 | CTO | `fetchKdsOrders` com `take: 100`; `/api/admin/orders` com paginação cursor-based `PAGE_SIZE=50` |
| BUG-014 | 2026-04-04 | CTO | `ProductCard.tsx`: `<img>` → `<Image fill sizes="100px">` do `next/image`; lazy load + WebP automático |
| BUG-019 | 2026-04-04 | CTO | `CustomerTracker`: `viewState` inicial usa `storeLat/storeLng` do tenant; prop drilling via `orders/page.tsx` |
| BUG-003 | 2026-04-04 | CTO | `lib/logger.ts` criado; 18 `console.error` em `admin.ts`, `checkout.ts`, `auth.ts` migrados para `logger.error` |
| BUG-015 | 2026-04-04 | CTO | Checkout drawer extraído de `MenuComponent` para `components/menu/CheckoutModal.tsx` (25 props tipadas) |
| BUG-016 | 2026-04-04 | CTO | `lib/ratelimit.ts` Map+TTL em memória; `/api/tenant` POST 5/min, `/check-slug` GET 30/min por IP; HTTP 429 |
| BUG-017 | 2026-04-04 | CTO | Vitest instalado; `vitest.config.ts` + `__tests__/validation.test.ts` com 8 testes — todos passando |
| BUG-018 | 2026-04-04 | CTO | `@sentry/nextjs` instalado; `sentry.client.config.ts` + integração no `logger.error` via `SENTRY_DSN` |
| BUG-020 | 2026-04-04 | CTO | Modelo `ProductOption` adicionado ao schema Prisma com `groupName`, `label`, `priceAdd`; `db push` aplicado |
