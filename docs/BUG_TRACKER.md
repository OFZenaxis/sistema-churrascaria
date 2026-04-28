# BUG TRACKER — Saiu Delivery SaaS

> **Documento Oficial de Engenharia — Leitura obrigatória para todo o time.**
> Última atualização: 2026-04-27 (Auditoria AbacatePay — 9 novos itens identificados e resolvidos)

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

---

## AUDITORIA 3 — ABACATEPAY — 2026-04-27 (9 itens)

> Auditoria focada no módulo de monetização AbacatePay (webhook, server actions, página de assinatura, rota de checkout).
> Todos os 9 itens encontrados foram resolvidos na mesma sessão.

---

### BUG-067 — HMAC key hardcoded no fonte do webhook

- **Arquivo:** `app/api/webhooks/abacatepay/route.ts` — constante `ABACATEPAY_PUBLIC_KEY`
- **Status:** RESOLVIDO
- **Correção aplicada (2026-04-27):** Constante removida. Chave lida de `process.env.ABACATEPAY_HMAC_KEY` via `getHmacKey()`. Boot guard `if (!process.env.ABACATEPAY_HMAC_KEY) throw` adicionado. Sem a variável, o servidor recusa inicialização.
- **Descrição:** Chave HMAC de 189 chars usada para verificar assinaturas de webhook estava hardcoded no código-fonte. Qualquer pessoa com acesso ao repositório podia ler a chave. Impossível rotacionar sem redeploy.
- **Impacto:** 🔴 CRÍTICO — chave comprometida invalida toda a camada HMAC do webhook.

---

### BUG-068 — `cancelSubscription` sem autenticação — IDOR via Client Component

- **Arquivo:** `app/actions/abacatepay.ts` — função `cancelSubscription`
- **Status:** RESOLVIDO
- **Correção aplicada (2026-04-27):** `requireAdminSession(storeId)` adicionado como primeira instrução. Retorna `{ success: false, error: 'Não autorizado' }` sem tocar no banco se sessão ausente ou de outro tenant.
- **Descrição:** Server Action chamada diretamente de `CancelSubscriptionButton` (Client Component) aceitava `storeId` do cliente sem verificar sessão. Lojista A podia cancelar a assinatura de Lojista B passando o UUID da loja B.
- **Impacto:** 🔴 CRÍTICO — IDOR de autorização em operação financeira destrutiva.

---

### BUG-069 — `console.log` de debug vazando `storeId` no webhook em produção

- **Arquivo:** `app/api/webhooks/abacatepay/route.ts` — linhas 61, 78, 86
- **Status:** RESOLVIDO
- **Correção aplicada (2026-04-27):** Três `console.log` removidos. `console.error` substituído por `logger.error`. `console.warn` substituído por `logger.warn`.
- **Descrição:** Três chamadas de debug em produção incluindo `console.log('Store ID extraído: ', storeId)`, expondo dados internos em logs.
- **Impacto:** 🟠 ALTO — violação de CLAUDE.md Lei 10 e potencial exposição de dados em logs.

---

### BUG-070 — Evento `subscription.renewed` não tratado no webhook

- **Arquivo:** `app/api/webhooks/abacatepay/route.ts`
- **Status:** RESOLVIDO
- **Correção aplicada (2026-04-27):** Handler adicionado para `subscription.renewed` → `subscriptionStatus: 'ACTIVE'` + atualiza `abacatepaySubscriptionId`. Separado de `checkout.completed` que só atualiza o status (sem sobrescrever o subscriptionId).
- **Descrição:** AbacatePay envia `subscription.renewed` a cada renovação bem-sucedida. Evento ignorado: se a loja estivesse com status incorreto, a renovação não a reativava.
- **Impacto:** 🟠 ALTO — loja potencialmente bloqueada mesmo após pagamento recorrente.

---

### BUG-071 — `abacatepaySubscriptionId` sobrescrito incorretamente em `checkout.completed`

- **Arquivo:** `app/api/webhooks/abacatepay/route.ts` — lógica de update
- **Status:** RESOLVIDO
- **Correção aplicada (2026-04-27):** `subscription.completed` e `subscription.renewed` atualizam o `abacatepaySubscriptionId` com `data.subscription.id`. `checkout.completed` só atualiza `subscriptionStatus: 'ACTIVE'` — não sobrescreve o ID (que pertence à assinatura, não ao checkout).
- **Descrição:** Para o evento `checkout.completed`, o código salvava `data.checkout.id` como `abacatepaySubscriptionId`. Checkout ID ≠ Subscription ID. O endpoint de cancelamento espera o ID de assinatura — operação de cancelamento quebraria silenciosamente.
- **Impacto:** 🟠 ALTO — cancelamento de assinatura via painel falharia para lojas ativadas via `checkout.completed`.

---

### BUG-072 — Condição duplicada no fallback de `getSubscriptionData`

- **Arquivo:** `app/actions/abacatepay.ts:44`
- **Status:** RESOLVIDO
- **Correção aplicada (2026-04-27):** Condição `s.id === subId || s.id === subId` (ambas idênticas) simplificada para `s.id === subId`. Estratégia invertida: usa diretamente `subscriptions/list` e filtra pelo ID, evitando tentativa dupla desnecessária.
- **Descrição:** Bug lógico — o `||` nunca avaliava uma condição diferente. Uma das branches era inútil, mascando a ausência de um critério de busca alternativo real.
- **Impacto:** 🟠 ALTO — fallback de busca de assinatura completamente ineficaz.

---

### BUG-073 — `console.error` em vez de `logger.error` nas actions e rota de checkout

- **Arquivo:** `app/actions/abacatepay.ts` (3 ocorrências) + `app/api/pagamentos/checkout/route.ts` (3 ocorrências)
- **Status:** RESOLVIDO
- **Correção aplicada (2026-04-27):** Todos substituídos por `logger.error('módulo', 'mensagem', err)`. Erros críticos agora capturados pelo Sentry quando `SENTRY_DSN` estiver configurado.
- **Descrição:** Violação do padrão `lib/logger.ts` estabelecido no projeto. Erros de pagamento sem rastreamento no Sentry.
- **Impacto:** 🟡 MÉDIO — falhas silenciosas em produção sem alerta.

---

### BUG-074 — `any` types em código de pagamento (`abacatepay.ts`, `checkout/route.ts`, `page.tsx`)

- **Arquivo:** múltiplos
- **Status:** RESOLVIDO
- **Correção aplicada (2026-04-27):** Tipos `AbacateSubData`, `AbacateCheckout` e `AbacateCheckoutPayload` criados e exportados de `abacatepay.ts`. `invoice: any` no map da tabela eliminado. `payload: any` no checkout substituído por interface tipada. `body` tipado como `{ storeId?: string }`.
- **Descrição:** Múltiplos `any` em código que processa dados financeiros. Viola CLAUDE.md Lei 7.
- **Impacto:** 🟡 MÉDIO — sem type-safety em operações de pagamento.

---

### BUG-075 — WhatsApp de suporte hardcoded na página de assinatura

- **Arquivo:** `app/(store)/[slug]/admin/(dashboard)/assinatura/page.tsx:152`
- **Status:** RESOLVIDO
- **Correção aplicada (2026-04-27):** Link usa `process.env.NEXT_PUBLIC_SUPPORT_PHONE` com fallback para o número anterior. Ao definir a variável, nenhum redeploy de código é necessário para trocar o número de suporte.
- **Descrição:** `wa.me/5561995783461` hardcoded. Padrão idêntico ao BUG-047 (já resolvido). Número pessoal exposto no código-fonte.
- **Impacto:** 🟡 MÉDIO — suporte vai para número errado se o contato mudar.

---

## AUDITORIA 2 — 2026-04-27 (46 novos itens)

> Última atualização de status: 2026-04-27 (Sessão 2 — 11 bugs adicionais resolvidos)
> Nota geral: **5.6/10** | Segurança: **3/10** | Banco: **5/10** | Arquitetura: **6/10** | Performance: **5/10**
> A fundação de multi-tenancy, HMAC e separação Server/Client é sólida. O problema central está na camada de autorização: Server Actions e routes que aceitam `storeId` como parâmetro sem verificar sessão tornam operações críticas acessíveis sem autenticação.

---

## 🔴 CRÍTICOS (Auditoria 2)

### BUG-021 — `mpAccessToken` exposto no browser

- **Arquivo:** `app/(store)/[slug]/pagamento/[id]/pagamentos/page.tsx` + `PaymentConfigClient.tsx` linha 43
- **Status:** RESOLVIDO
- **Correção aplicada (2026-04-27):** `pagamentos/page.tsx` passa apenas `hasAccessToken: boolean` ao Client Component — o token real nunca sai do servidor. `PaymentConfigClient` exibe status "Token configurado" quando `hasAccessToken` é true; campo começa vazio para forçar redigitação ao trocar. `savePaymentConfig` aceita `mpAccessToken` como opcional e só atualiza o campo se um novo valor for fornecido.
- **Descrição:** O Access Token privado do Mercado Pago do lojista é passado como prop React para um Client Component e serializado no HTML enviado ao navegador. Qualquer usuário com DevTools aberto na página de pagamentos vê o token completo.
- **Impacto:** Com esse token qualquer pessoa pode criar cobranças reais, emitir estornos, consultar relatórios financeiros e exfiltrar dados de clientes diretamente pela API do Mercado Pago — sem passar pelo sistema.
- **Correção:** Nunca retornar `mpAccessToken` do banco para o client. A página de configuração deve exibir apenas um booleano (token configurado: sim/não) e os últimos 4 chars mascarados. O token real só deve ser usado em Server Actions.

---

### BUG-022 — `kitchen.ts` sem autenticação

- **Arquivo:** `app/actions/kitchen.ts` — arquivo inteiro
- **Status:** RESOLVIDO
- **Correção aplicada (2026-04-27):** `advanceOrderStatus` agora chama `requireAdminSession(storeId)` no início. Sem sessão válida retorna `{ error: 'Não autorizado' }`. `storeId` lido da sessão (não do parâmetro) na query Prisma. `console.error` migrado para `logger.error`.
- **Descrição:** `advanceOrderStatus` aceita `storeId` como parâmetro sem nenhuma verificação de sessão. O único guard é `if (!storeId) throw` — trivialmente contornado passando qualquer UUID válido.
- **Impacto:** Qualquer pessoa com Postman pode avançar pedidos para `DELIVERED` sem entregar, manipular o KDS de qualquer cozinha da plataforma.
- **Correção:** Adicionar `getLojistaSession()` ou `requireAdminSession()` no início da função. Se não houver sessão válida retornar `{ error: 'Não autorizado' }` imediatamente.

---

### BUG-023 — `driver.ts` sem autenticação

- **Arquivo:** `app/actions/driver.ts` linhas 7 e 24
- **Status:** RESOLVIDO
- **Correção aplicada (2026-04-27):** `acceptRide` e `finishRide` chamam `requireAdminSession(storeId)` no início. Sem sessão retornam `{ error: 'Não autorizado' }`. `storeId` lido da sessão na query. `console.error` → `logger.error`.
- **Descrição:** `acceptRide` e `finishRide` aceitam `storeId + orderId` como parâmetros sem nenhuma verificação de sessão. Guard `if (!storeId) throw` não autentica nada.
- **Impacto:** Qualquer pessoa pode assumir corridas de motoboys legítimos, marcar entregas como concluídas sem entregar, interferir nas operações de campo de qualquer loja.
- **Correção:** Adicionar verificação de sessão de motoboy ou lojista no início de cada função.

---

### BUG-024 — `tracker.ts` sem autenticação

- **Arquivo:** `app/actions/tracker.ts` — arquivo inteiro
- **Status:** RESOLVIDO
- **Correção aplicada (2026-04-27):** `updateMotoboyLocation` chama `getLojistaSession(storeId)` no início. Sem sessão retorna `{ error: 'Não autorizado' }`. `storeId` lido da sessão na query. `console.error` → `logger.error`.
- **Descrição:** `updateMotoboyLocation` recebe `storeId + coordenadas GPS` sem nenhuma autenticação do motoboy.
- **Impacto:** Qualquer pessoa pode injetar posições GPS falsas no mapa em tempo real para qualquer motoboy de qualquer loja. Dados de rastreamento completamente não confiáveis.
- **Correção:** Criar sistema de token de sessão para motoboys ou verificar cookie de sessão antes de atualizar localização.

---

### BUG-025 — `toggleStoreStatus` sem autenticação

- **Arquivo:** `app/actions/admin.ts` linha ~70
- **Status:** RESOLVIDO
- **Correção aplicada (2026-04-27):** `requireAdminSession(storeId)` adicionado no início da função.
- **Descrição:** A action não chama `requireAdminSession`. O `storeId` vem do parâmetro (passado pelo frontend). A proteção `where: { id: storeId }` não verifica se o chamador é dono da loja.
- **Impacto:** Qualquer lojista autenticado em sua própria conta pode abrir ou fechar a loja de qualquer outro tenant passando um UUID arbitrário.
- **Correção:** Adicionar `requireAdminSession(storeId)` no início e ler `storeId` da sessão, não do parâmetro recebido.

---

### BUG-026 — `api/admin/orders` sem autenticação de sessão

- **Arquivo:** `app/api/admin/orders/route.ts` — arquivo inteiro
- **Status:** RESOLVIDO
- **Correção aplicada (2026-04-27):** GET e PUT verificam `getLojistaSession(store.id)` após resolver o tenant. Retornam HTTP 401 se sessão ausente.
- **Descrição:** `GET` e `PUT` validam tenant apenas pelo header `x-store-domain`. Em chamadas diretas à API (curl, Postman) esse header pode ser definido arbitrariamente.
- **Impacto:** Qualquer pessoa que conheça a URL pode listar todos os pedidos do dia (com nome, telefone e endereço de clientes) e atualizar status de pedidos para `CANCELED` ou `DELIVERED`.
- **Correção:** Adicionar `getLojistaSession()` no início dos dois handlers, igual ao padrão já correto em `api/orders/[id]/status/route.ts`.

---

### BUG-027 — `api/admin/store-status` sem autenticação

- **Arquivo:** `app/api/admin/store-status/route.ts` — arquivo inteiro
- **Status:** RESOLVIDO
- **Correção aplicada (2026-04-27):** POST verifica `getLojistaSession(store.id)` após resolver o tenant. Retorna HTTP 401 se sessão ausente.
- **Descrição:** `POST` para toggle de `isOpen` aceita apenas o header `x-store-domain` como "autenticação". O domínio da loja é público e visível na URL.
- **Impacto:** Qualquer pessoa pode abrir ou fechar qualquer loja da plataforma com um simples curl passando o domínio da loja no header.
- **Correção:** Verificar cookie `lojista_token_{storeId}` antes de executar qualquer operação.

---

### BUG-028 — Campo `lat/lng` inexistente no schema — bug de runtime

- **Arquivo:** `app/(store)/[slug]/motoboy/page.tsx` linhas 19, 72-73
- **Status:** RESOLVIDO
- **Correção aplicada (2026-04-27):** `select` corrigido para `{ storeLat: true, storeLng: true }`. Props `storeLat={store.storeLat}` e `storeLng={store.storeLng}` corretas. Mapa do motoboy e cálculo de distância funcionando.
- **Descrição:** O código faz `select: { lat: true, lng: true }` mas o schema Prisma define `storeLat` e `storeLng`. TypeScript não avisa — erro silencioso que retorna `undefined` em runtime.
- **Impacto:** O mapa do motoboy nunca mostra a localização da loja. A funcionalidade de distância real está quebrada para todos os usuários em produção agora.
- **Correção:** Corrigir o `select` para `{ storeLat: true, storeLng: true }` e ajustar as props passadas para `MotoboyClient` nos mesmos locais.

---

## 🟠 ALTOS (Auditoria 2)

### BUG-029 — `toggleProductActive` sem `requireAdminSession`

- **Arquivo:** `app/actions/admin.ts` linha ~10
- **Status:** RESOLVIDO
- **Correção aplicada (2026-04-27):** `requireAdminSession(storeId)` adicionado no início da função.
- **Descrição:** `toggleProductActive` aceita `storeId` do cliente sem verificar sessão. A query `where: { id, storeId }` mitiga mutação cruzada mas o padrão está errado.
- **Impacto:** Qualquer pessoa pode tentar ativar/desativar produtos de qualquer loja. A proteção é frágil e depende de adivinhar o `productId`.
- **Correção:** Adicionar `requireAdminSession(storeId)` no início e ler `storeId` da sessão.

---

### BUG-030 — `toggleDeliveryZoneActive` sem `requireAdminSession`

- **Arquivo:** `app/actions/admin.ts` linha ~308
- **Status:** RESOLVIDO
- **Correção aplicada (2026-04-27):** `requireAdminSession(storeId)` adicionado no início da função.
- **Descrição:** Mesmo padrão de BUG-029: aceita `storeId` do parâmetro sem verificar sessão.
- **Impacto:** Qualquer pessoa pode tentar ativar/desativar zonas de entrega de qualquer loja.
- **Correção:** Adicionar `requireAdminSession(storeId)` e ler `storeId` da sessão.

---

### BUG-031 — `estimateDeliveryFee` sem validar ownership do `addressId`

- **Arquivo:** `app/actions/checkout.ts` linhas 24-27
- **Status:** RESOLVIDO
- **Correção aplicada (2026-04-27):** `estimateDeliveryFee` agora chama `getSessionUser(storeId)` antes da query. Sem sessão válida, retorna fee 0 com `isEstimated: true`. A query do endereço inclui `customerId: user.id` no `where` — endereço de outro cliente retorna `null` e aborta o cálculo.
- **Descrição:** `prisma.address.findFirst({ where: { id: addressId } })` não filtra por `customerId`. Qualquer cliente autenticado pode usar `addressId` de outro cliente.
- **Impacto:** IDOR: Cliente A pode calcular frete usando o endereço de Cliente B, revelando que esse endereço existe e a qual zona de entrega pertence.
- **Correção:** Adicionar `customerId: session.customerId` ao `where` da query.

---

### BUG-032 — HMAC de sessão sem timestamp de expiração no payload

- **Arquivo:** `lib/session.ts` + `adminAuth.ts:51` + `auth.ts:32`
- **Status:** ABERTO
- **Descrição:** O HMAC de sessão não carrega timestamp de expiração no payload — apenas o `maxAge` do browser protege. Token extraído do cookie continua válido para sempre no servidor.
- **Impacto:** Token roubado (XSS, dispositivo compartilhado) é válido indefinidamente. Sem capacidade de revogação ou invalidação forçada.
- **Correção:** Adicionar campo `exp: Date.now() + TTL` no payload antes de assinar. Na verificação, checar se `exp > Date.now()` e rejeitar tokens expirados.

---

### BUG-033 — `loginWithPhone` sem rate limiting

- **Arquivo:** `app/actions/auth.ts` linha ~15
- **Status:** RESOLVIDO
- **Correção aplicada (2026-04-27):** `rateLimit('phone_login:${ip}', 5, 15 * 60_000)` adicionado no início de `loginWithPhone`. IP extraído via `x-forwarded-for` / `x-real-ip` de `next/headers`. Excedido o limite, retorna `{ success: false, error: 'Muitas tentativas...' }`.
- **Descrição:** A action `loginWithPhone` não tem nenhum rate limiting por IP ou por número de telefone.
- **Impacto:** Brute-force ilimitado em números de telefone. Atacante pode enumerar clientes cadastrados.
- **Correção:** Aplicar o rate limiter existente em `lib/ratelimit.ts` — 5 tentativas por 15min por IP, igual ao padrão já correto em `loginLojista`.

---

### BUG-034 — `api/payments` sem rate limiting e sem autenticação de customer

- **Arquivo:** `app/api/payments/route.ts` — arquivo inteiro
- **Status:** ABERTO
- **Descrição:** Endpoint de criação de cobrança PIX não tem rate limiting e não verifica se o `orderId` pertence ao cliente autenticado.
- **Impacto:** Qualquer pessoa com um `orderId` válido pode tentar criar cobranças no token do Mercado Pago do lojista. DoS financeiro possível.
- **Correção:** Adicionar rate limiting por IP e verificar que `order.customerId === session.customerId` antes de criar cobrança.

---

### BUG-035 — `prisma.store.findMany` sem `take` no painel QG

- **Arquivo:** `app/qg-admin/(protected)/lojas/page.tsx` linha ~10
- **Status:** RESOLVIDO
- **Correção aplicada (2026-04-27):** `take: 200` adicionado à query. Safety net adequado para a fase atual da plataforma. Paginação completa pode ser implementada quando o volume exigir.
- **Descrição:** `findMany` sem cláusula `take` retorna todas as lojas da plataforma de uma vez.
- **Impacto:** Em escala, carrega todas as lojas na memória do servidor por request.
- **Correção:** Adicionar `take` e `skip` para paginação. Criar componente de paginação na UI.

---

### BUG-036 — `prisma.partialLead.findMany` sem `take` no painel QG

- **Arquivo:** `app/qg-admin/(protected)/leads/page.tsx` linha ~10
- **Status:** RESOLVIDO
- **Correção aplicada (2026-04-27):** `take: 500` adicionado à query. Safety net para fase atual. Paginação completa quando volume exigir.
- **Descrição:** `findMany` sem `take` retorna todos os leads da plataforma de uma vez.
- **Impacto:** Pode retornar milhares de registros em memória por request.
- **Correção:** Adicionar `take` e `skip` para paginação.

---

### BUG-037 — Índices faltantes no `schema.prisma`

- **Arquivo:** `prisma/schema.prisma` — modelos `Order` e `Product`
- **Status:** RESOLVIDO
- **Correção aplicada (2026-04-27):** `@@index([storeId])`, `@@index([status])`, `@@index([createdAt])` adicionados ao modelo `Order`. `@@index([storeId])` adicionado a `Product` e `Customer`. `prisma db push` aplicado com sucesso.
- **Descrição:** Ausência de `@@index` em: `Order(storeId)`, `Order(status)`, `Order(createdAt)`, `Product(storeId)`, `Customer(storeId)`. Único índice existente é `ProductOption.productId`.
- **Impacto:** Queries de listagem de pedidos no KDS, admin e dashboard farão full table scan conforme a tabela `Order` cresce. Performance degradará linearmente com volume.
- **Correção:** Adicionar `@@index([storeId])`, `@@index([status])`, `@@index([createdAt])` no modelo `Order` e `@@index([storeId])` no modelo `Product`. Rodar `prisma migrate`.

---

### BUG-038 — `api/leads/partial` sem rate limiting

- **Arquivo:** `app/api/leads/partial/route.ts` — arquivo inteiro
- **Status:** RESOLVIDO
- **Correção aplicada (2026-04-27):** `rateLimit('leads_partial:${ip}', 10, 5 * 60_000)` adicionado no início do handler POST. Retorna HTTP 429 ao exceder o limite.
- **Descrição:** Endpoint público de criação de lead parcial sem nenhum rate limiting.
- **Impacto:** Bot pode criar leads infinitos e poluir o banco de dados de leads.
- **Correção:** Aplicar rate limiter por IP: 10 tentativas por 5 minutos.

---

## 🟡 MÉDIOS (Auditoria 2)

### BUG-039 — Cookie QG admin com `secure: false` hardcoded

- **Arquivo:** `app/actions/qg-auth.ts` linha 36
- **Status:** RESOLVIDO
- **Correção aplicada (2026-04-27):** `secure: false` → `secure: process.env.NODE_ENV === 'production'`.
- **Descrição:** Cookie JWT do super-admin tem `secure: false` hardcoded em vez de derivar do `NODE_ENV`.
- **Impacto:** Cookie do super-admin transmitido em HTTP sem proteção. Credencial de super-admin exposta em rede não criptografada.
- **Correção:** Substituir por `secure: process.env.NODE_ENV === "production"`.

---

### BUG-040 — Rotas `/qg-admin/*` sem proteção no proxy

- **Arquivo:** `proxy.ts` — ausência
- **Status:** RESOLVIDO
- **Correção aplicada (2026-04-27):** `proxy.ts` verifica presença do cookie `qg_access_token` para qualquer pathname que começa com `/qg-admin` e não seja `/qg-admin/login`. Sem cookie, redireciona para `/qg-admin/login`. Defense-in-depth além da proteção no layout Server Component.
- **Descrição:** O proxy não intercepta rotas `/qg-admin/*`. A proteção depende apenas do layout Server Component.
- **Impacto:** Uma falha de bypass no Next.js ou bug de render exporia o painel inteiro sem nenhuma camada de defesa na borda.
- **Correção:** Adicionar verificação de cookie QG no `proxy.ts` para rotas `/qg-admin/*`, redirecionando para login se ausente.

---

### BUG-041 — `PartialLead` sem campo `storeId`

- **Arquivo:** `prisma/schema.prisma` linha ~292
- **Status:** RESOLVIDO
- **Correção aplicada (2026-04-27):** Campo `storeId String?` (nullable para compatibilidade com leads existentes) adicionado ao modelo `PartialLead` com `@@index([storeId])`. `prisma db push` aplicado.
- **Descrição:** O modelo `PartialLead` não tem campo `storeId`. Lead não pertence a nenhuma loja.
- **Impacto:** Viola o princípio de multi-tenancy: não é possível filtrar leads por loja nem garantir isolamento de dados entre tenants.
- **Correção:** Adicionar campo `storeId String` ao modelo `PartialLead` e adicionar `@@index([storeId])`. Atualizar endpoint de criação para receber e salvar o `storeId`.

---

### BUG-042 — `getSessionUser` carrega todos os endereços sem `take`

- **Arquivo:** `app/actions/auth.ts` linha ~69
- **Status:** RESOLVIDO
- **Correção aplicada (2026-04-27):** `take: 10` adicionado ao `include` de `addresses` em `getSessionUser`. Ordenação mantida: `isDefault: 'desc'` + `createdAt: 'desc'`.
- **Descrição:** `getSessionUser` faz `include` de `addresses` sem limite. Chamado em cada request autenticado de customer.
- **Impacto:** Cliente com muitos endereços dispara query não limitada a cada request.
- **Correção:** Adicionar `take: 10` no `include` de `addresses`.

---

### BUG-043 — IDOR parcial em `orders/status` — sem verificar ownership do pedido

- **Arquivo:** `app/api/orders/[id]/status/route.ts` linhas 36-37
- **Status:** RESOLVIDO
- **Correção aplicada (2026-04-27):** Order select inclui `customerId`. No path de cliente, extrai `phone` do payload da sessão, busca o customer por `{storeId, phone}` e compara `customer.id === order.customerId`. Se não bater, retorna 401. Pedidos sem `customerId` (null) também retornam 401 para o path de cliente.
- **Descrição:** O cookie de cliente verifica apenas se `cookieStoreId === order.storeId`, não verifica se o cliente é dono do pedido.
- **Impacto:** Cliente A pode consultar status e `paymentStatus` de pedidos de Cliente B dentro da mesma loja se descobrir o `orderId`.
- **Correção:** Adicionar verificação de `customerId` no `where`: `{ id, storeId, customerId: session.customerId }`.

---

### BUG-044 — `CardapioClient` usa `@headlessui/react` — proibido pelo CLAUDE.md

- **Arquivo:** `app/(store)/[slug]/admin/(dashboard)/cardapio/CardapioClient.tsx` — imports
- **Status:** ABERTO
- **Descrição:** Importa `@headlessui/react` listado como proibido nas regras do projeto (CLAUDE.md Lei 10).
- **Impacto:** Cria dependência não gerenciada. Viola regra de não instalar UI libs externas.
- **Correção:** Substituir os componentes headlessui por implementações próprias com Tailwind e estado React nativo.

---

### BUG-045 — Página de cadastro inteira como `"use client"`

- **Arquivo:** `app/(marketing)/cadastro/page.tsx` linha 1
- **Status:** ABERTO
- **Descrição:** Toda a página de cadastro é marcada como `"use client"` sem necessidade. Além disso, valida senha mínima de 6 chars enquanto a API exige 8.
- **Impacto:** Viola o padrão Server Component do projeto. Inconsistência de validação pode causar UX confusa.
- **Correção:** Extrair apenas os componentes interativos para Client Components. Unificar validação de senha: mínimo 8 chars em todos os pontos.

---

### BUG-046 — Inconsistência de validação de senha — 6 vs 8 chars

- **Arquivo:** `app/actions/tenant.ts` + `app/(marketing)/cadastro/page.tsx`
- **Status:** ABERTO
- **Descrição:** Server Action aceita senha de 6 chars. API `/api/tenant` exige 8. Página de cadastro valida 6.
- **Impacto:** Usuário pode criar conta com senha de 7 chars pela action e ser rejeitado pela API, ou vice-versa. Comportamento inconsistente.
- **Correção:** Centralizar a regra em `lib/validation.ts` e importar em todos os pontos. Definir mínimo de 8 chars.

---

### BUG-047 — URL do WhatsApp hardcoded com número pessoal

- **Arquivo:** `app/(store)/[slug]/pagamento/[id]/PaymentPixClient.tsx` linha 145
- **Status:** RESOLVIDO
- **Correção aplicada (2026-04-27):** `page.tsx` seleciona `store.phone` e passa como `storePhone` ao `PaymentPixClient`. Link do WhatsApp usa `storePhone.replace(/\D/g, '')`. Botão só é renderizado se `storePhone` estiver configurado na loja.
- **Descrição:** URL `wa.me/5561995783461` com número pessoal fixo no código. Não tem vínculo com o lojista correto.
- **Impacto:** Suporte de pagamento vai para número errado. Quando o número mudar, todos os clientes de todas as lojas são afetados.
- **Correção:** Buscar o telefone de suporte do `Store` e usar o número do próprio lojista ou um número central configurável via variável de ambiente.

---

### BUG-048 — `prisma.product.findMany` sem `take` na vitrine

- **Arquivo:** `app/(store)/[slug]/page.tsx` linha ~30
- **Status:** ABERTO
- **Descrição:** `findMany` sem `take` retorna todos os produtos da loja. Também `prisma.store.findFirst` sem `select` traz todas as colunas.
- **Impacto:** Loja com centenas de produtos retorna tudo em cada carregamento da vitrine. Desperdício de memória e latência.
- **Correção:** Adicionar `take` com paginação ou carregar por categoria. Adicionar `select` com apenas os campos necessários no `findFirst` do store.

---

### BUG-049 — Dashboard admin: cálculo de gráfico em memória sobre lista não paginada

- **Arquivo:** `app/(store)/[slug]/admin/(dashboard)/page.tsx`
- **Status:** ABERTO
- **Descrição:** Construção de dados para gráfico de receita feita com `orders.reduce` sobre lista não paginada de pedidos.
- **Impacto:** Em lojas com alto volume pode processar centenas de pedidos em memória por request de dashboard.
- **Correção:** Usar `GROUP BY` com agregação no Prisma (`$queryRaw` ou `groupBy`) em vez de buscar todos os pedidos e reduzir em memória.

---

### BUG-050 — `app/dev/page.tsx` acessível via runtime check — sem proteção na borda

- **Arquivo:** `app/dev/page.tsx` linha 27
- **Status:** RESOLVIDO
- **Correção aplicada (2026-04-27):** `proxy.ts` agora retorna HTTP 404 para qualquer rota `/dev*` quando `NODE_ENV === 'production'`. Defense-in-depth: a request nunca chega ao servidor Next.js mesmo que o `notFound()` interno falhe.
- **Descrição:** Rota existe no bundle de produção e é bloqueada apenas via `if (NODE_ENV !== development) notFound()`. Expõe `BUG_TRACKER`, `ROADMAP` e `PROJECT_MAP` se a guarda falhar.
- **Impacto:** Se `NODE_ENV` não estiver configurado corretamente no deploy, toda a documentação interna (incluindo bugs conhecidos e arquitetura) fica acessível publicamente.
- **Correção:** Adicionar bloqueio da rota `/dev/*` no `proxy.ts` para garantir que nunca chega ao servidor em produção independente de variáveis de ambiente.

---

### BUG-051 — `JWT_SECRET` e `SUPER_ADMIN_PIN` ausentes do `.env.example`

- **Arquivo:** `.env.example` — arquivo inteiro
- **Status:** RESOLVIDO
- **Correção aplicada (2026-04-27):** `JWT_SECRET` e `SUPER_ADMIN_PIN` adicionados com comentários explicativos e instruções de geração segura.
- **Descrição:** Essas variáveis críticas não estão documentadas no `.env.example`.
- **Impacto:** Novo desenvolvedor ou novo deploy sobe sem essas variáveis e o QG falha silenciosamente ou usa defaults inseguros.
- **Correção:** Adicionar `JWT_SECRET=TROCAR_PARA_STRING_ALEATORIA_LONGA` e `SUPER_ADMIN_PIN=TROCAR_PARA_PIN_SEGURO` ao `.env.example` com comentários explicativos.

---

### BUG-052 — `CustomerTracker`: `onDelivered` sem `useCallback` no pai

- **Arquivo:** `components/CustomerTracker.tsx` linha 73
- **Status:** ABERTO
- **Descrição:** `onDelivered` está no array de dependências do `useEffect`. Se o componente pai não memoizar o callback com `useCallback`, o intervalo de polling é recriado a cada render.
- **Impacto:** Polling pode disparar múltiplos intervals simultâneos causando requisições duplicadas e comportamento inesperado no tracker.
- **Correção:** Documentar que o componente pai deve memoizar `onDelivered` com `useCallback`, ou mover a verificação para dentro do `CustomerTracker`.

---

## 🟢 BAIXOS (Auditoria 2)

### BUG-053 — Senha em plaintext no seed

- **Arquivo:** `prisma/seed.ts`
- **Status:** ABERTO
- **Descrição:** Seed cria usuário com senha hardcoded em plaintext (`senha_criptografada_futura`).
- **Impacto:** Seed cria usuário inseguro se rodado em qualquer ambiente, inclusive produção.
- **Correção:** Usar `bcrypt.hash()` no seed para criar senha hasheada.

---

### BUG-054 — `@ts-ignore` sem comentário explicativo

- **Arquivo:** `app/(store)/[slug]/pedido/[id]/page.tsx` linha 36
- **Status:** ABERTO
- **Descrição:** Uso de `@ts-ignore` sem documentação do motivo. Viola CLAUDE.md.
- **Correção:** Substituir por `@ts-expect-error` com comentário explicando por que o erro é esperado, ou corrigir o tipo.

---

### BUG-055 — Parâmetros tipados como `any` em `RevenueChart`

- **Arquivo:** `components/admin/RevenueChart.tsx` — `CustomTooltip`
- **Status:** ABERTO
- **Descrição:** Parâmetros do `CustomTooltip` tipados como `any`.
- **Correção:** Importar e usar os tipos corretos do Recharts: `TooltipProps`.

---

### BUG-056 — Múltiplos `any` em `PaymentClient`

- **Arquivo:** `app/(store)/[slug]/pagamento/[id]/PaymentClient.tsx` — múltiplas linhas
- **Status:** ABERTO
- **Descrição:** Múltiplos usos de `any` e `err: any` no componente de pagamento.
- **Impacto:** Em código de pagamento, tipos incorretos são especialmente arriscados.
- **Correção:** Tipar erros com `unknown` e fazer narrowing: `if (err instanceof Error)`. Tipar as respostas da API.

---

### BUG-057 — `Date.now()` para gerar path de upload

- **Arquivo:** `lib/upload.ts` — path
- **Status:** RESOLVIDO
- **Correção aplicada (2026-04-27):** `Date.now()` substituído por `crypto.randomUUID()`. UUID garante unicidade mesmo em uploads simultâneos. `crypto` é global no browser (Web Crypto API).
- **Descrição:** Usa `Date.now()` para gerar nome de arquivo de upload em vez de UUID.
- **Impacto:** Colisão possível em uploads simultâneos com o mesmo timestamp. Viola CLAUDE.md.
- **Correção:** Substituir por `crypto.randomUUID()`.

---

### BUG-058 — Tag `<img>` sem `next/image` em `AdminLayoutWrapper`

- **Arquivo:** `app/(store)/[slug]/admin/(dashboard)/AdminLayoutWrapper.tsx` linha 32
- **Status:** ABERTO
- **Descrição:** Usa tag `img` nativa com `eslint-disable` em vez de `next/image`.
- **Correção:** Substituir por componente `Image` do `next/image` com `width` e `height` definidos.

---

### BUG-059 — Tag `<img>` sem `next/image` em `PaymentPixClient`

- **Arquivo:** `app/(store)/[slug]/pagamento/[id]/PaymentPixClient.tsx` linha 168
- **Status:** ABERTO
- **Descrição:** QR Code renderizado com tag `img` nativa.
- **Correção:** Substituir por `next/image`. Para QR Code dinâmico, usar `unoptimized={true}` se necessário.

---

### BUG-060 — `console.log` de debug em `OrdersClient`

- **Arquivo:** `app/(store)/[slug]/orders/OrdersClient.tsx` linhas 188 e 376
- **Status:** RESOLVIDO
- **Correção aplicada (2026-04-27):** Dois `console.log` removidos — shortcut (linha 188) e reorder (linha 376). Substituídos por `onClick={() => {}}` placeholder até implementação real.
- **Descrição:** Dois `onClick` com `console.log` de debug (shortcut e reorder) esquecidos em produção. Viola CLAUDE.md Lei 10.
- **Correção:** Remover os dois `console.log` das linhas 188 e 376.

---

### BUG-061 — `console.error` em `kitchen.ts` e `driver.ts`

- **Arquivo:** `app/actions/kitchen.ts:24` + `app/actions/driver.ts:19,35`
- **Status:** RESOLVIDO
- **Correção aplicada (2026-04-27):** `console.error` substituído por `logger.error` em `kitchen.ts` e `driver.ts`. `tracker.ts` também migrado na mesma sessão.
- **Descrição:** `console.error` em catch blocks em vez de usar o logger centralizado.
- **Correção:** Substituir por `logger.error()` de `lib/logger.ts`.

---

### BUG-062 — `SERVICE_ROLE_KEY` com fallback silencioso para anon key

- **Arquivo:** `lib/supabase.ts` — fallback
- **Status:** RESOLVIDO
- **Correção aplicada (2026-04-27):** Fallback removido. Se `SUPABASE_SERVICE_ROLE_KEY` não estiver definida, lança `[FATAL] SUPABASE_SERVICE_ROLE_KEY não definida` na inicialização do módulo. Fail-fast previne operações com permissões insuficientes.
- **Descrição:** `SUPABASE_SERVICE_ROLE_KEY` tem fallback silencioso para anon key se a variável não estiver definida.
- **Impacto:** Operações que exigem service role (bypass de RLS) falham silenciosamente usando permissões insuficientes.
- **Correção:** Remover o fallback. Se `SERVICE_ROLE_KEY` não estiver definida, lançar erro na inicialização como já feito em `lib/session.ts` com `COOKIE_SECRET`.

---

### BUG-063 — Supabase project ref hardcoded em `next.config.ts`

- **Arquivo:** `next.config.ts` — `remotePatterns`
- **Status:** RESOLVIDO
- **Correção aplicada (2026-04-27):** `getSupabaseHostname()` deriva o hostname de `NEXT_PUBLIC_SUPABASE_URL` via `new URL(...).hostname`. Fallback para o valor anterior caso a variável esteja ausente. Ao trocar de projeto Supabase, basta atualizar a env var.
- **Descrição:** Project ref do Supabase hardcoded em `remotePatterns` para otimização de imagens.
- **Impacto:** Ao trocar de projeto Supabase, imagens param de carregar sem aviso de erro claro.
- **Correção:** Usar variável de ambiente: derivar hostname de `process.env.NEXT_PUBLIC_SUPABASE_URL`.

---

### BUG-064 — Rate limiter in-memory ineficaz em deploy multi-instância

- **Arquivo:** `lib/ratelimit.ts` — arquivo inteiro
- **Status:** ABERTO
- **Descrição:** O rate limiter usa `Map` em memória. Vercel serverless functions são stateless — cada instância tem seu próprio `Map`.
- **Impacto:** Em produção no Vercel, o rate limiting é efetivamente inoperante: cada instância conta separadamente.
- **Correção:** Migrar para rate limiter baseado em Redis/Upstash. O Upstash tem plano gratuito e client oficial para Next.js.

---

### BUG-065 — Emojis hardcoded no `CheckoutModal`

- **Arquivo:** `components/menu/CheckoutModal.tsx` linhas 142 e 187
- **Status:** ABERTO
- **Descrição:** Emojis hardcoded no JSX (pratos e presentes). Inconsistente com o padrão do projeto.
- **Correção:** Substituir por componentes de ícone SVG consistentes com o restante da UI (Lucide React).

---

### BUG-066 — Mapbox token público sem restrição de domínio

- **Arquivo:** `.env.example` linha 61
- **Status:** ABERTO
- **Descrição:** `NEXT_PUBLIC_MAPBOX_TOKEN` exposto sem restrição de domínio ou referer configurada no dashboard do Mapbox.
- **Impacto:** Token pode ser usado por qualquer pessoa para consumir a cota do Mapbox sem passar pelo domínio.
- **Correção:** No dashboard do Mapbox, adicionar restrição de URL para aceitar apenas requests do domínio de produção.

---

## 🔴 CRÍTICOS (Auditoria 1 — 2026-04-04)

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

## 🟠 ALTOS (Auditoria 1 — 2026-04-04)

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

## 🟡 MÉDIOS / DÍVIDA TÉCNICA (Auditoria 1 — 2026-04-04)

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

## 🟢 MELHORIAS BAIXA PRIORIDADE (Auditoria 1 — 2026-04-04)

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
