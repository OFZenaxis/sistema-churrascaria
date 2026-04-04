# ROADMAP — O Futuro do Sistema

> Este documento é baseado no estado real do código. Features listadas como "Em Progresso" foram identificadas por rotas existentes mas incompletas, stubs ou lógica parcial. "Planejado" são evoluções lógicas do produto. Consulte `PROJECT_MAP.md` para o estado atual.

**Última atualização:** 2026-04-04

---

## Em Progresso (código parcialmente implementado)

### 🔧 Distância do Motoboy — Dados Reais

**Situação:** `app/(store)/[slug]/motoboy/page.tsx` calcula a distância com `Math.random() * 5 + 1` km. A infraestrutura de GPS já está montada (watchPosition, updateMotoboyLocation, coordenadas no banco), mas a distância exibida ao motoboy não é real.

**O que falta:** Usar `storeLat/Lng` da loja e coordenadas do cliente para calcular distância via Haversine ou Mapbox Directions e exibir no card da corrida.

---

### 🔧 Redirect Sem Slug no PIX

**Situação:** `PaymentPixClient.tsx` — quando o pagamento é aprovado, o redirect é feito para `/pedido/{orderId}` sem o `slug` do tenant. Em ambientes multi-tenant, isso quebra o roteamento.

**O que falta:** Passar o `slug` como prop e usar `/[slug]/pedido/[id]` no redirect.

---

### 🔧 Validação de Senha Inconsistente no Onboarding

**Situação:** `app/api/tenant/route.ts` exige mínimo 8 caracteres. `app/actions/tenant.ts` aceita 6. O formulário `/cadastro` usa 6.

**O que falta:** Alinhar as três camadas para o mesmo mínimo (recomendado: 8 caracteres).

---

## Débito Técnico Crítico (do BUG_TRACKER.md)

> Todos os itens abaixo estão registrados no `docs/BUG_TRACKER.md` com detalhes de arquivo e linha.

- **C-01:** Fallback cross-tenant no `/api/admin/orders` quando header `Host` ausente
- **C-02:** `@ts-ignore` cobrindo contrato de tipo quebrado em `getSessionUser`
- **C-03:** Webhook Mercado Pago descartando body inválido silenciosamente (perda de receita)
- **C-04:** Payload de pagamento tipado como `any` na integração MP
- **C-05:** `Math.random()` como ID de item de carrinho (risco de colisão)

---

## Planejado — B2C (Experiência do Cliente)

### ⭐ Gamificação / Programa de Fidelidade

- Pontos por pedido, níveis (Bronze/Prata/Ouro), recompensas configuráveis por lojista
- Schema: `LoyaltyPoints`, `LoyaltyReward`, `CustomerLevel`
- Feature flag `features.gamification` já existe no model `Store.features (Json)`

### ⭐ Cupons e Descontos

- CRUD de cupons pelo lojista (% ou valor fixo, validade, limite de uso)
- Aplicação no checkout com validação server-side
- Atalho "Cupons" já existe no Hub "Minha Conta" (link placeholder)
- Schema: `Coupon`, `CouponRedemption`

### ⭐ Múltiplos Endereços com Seletor no Checkout

- Já existe estrutura de `Address` com `isDefault` e `AddressPicker`
- Falta: UI para adicionar/editar/remover endereços no Hub "Minha Conta"
- Atalho "Endereços" já existe no Hub (link placeholder)

### ⭐ Avaliações de Pedido

- Cliente avalia (estrelas + comentário) após DELIVERED
- Dashboard admin exibe média e comentários recentes
- Schema: `OrderReview` (orderId, rating, comment, createdAt)

### ⭐ Notificações Push (PWA)

- `manifest.json` já existe (referenciado no layout)
- Falta: Service Worker, push subscription, envio de notificação quando status muda

---

## Planejado — B2B (Painel do Lojista)

### ⭐ Gestão de Pedidos em Tempo Real no Admin

- Tela dedicada com lista de pedidos ativos (PENDING/PREPARING/READY_FOR_PICKUP)
- Lojista avança status sem precisar abrir o KDS
- Filtros por status, hora, valor
- Complementa o KDS que já existe

### ⭐ Relatório Exportável (CSV/PDF)

- Exportar pedidos do período filtrado do Dashboard
- Campos: ID, cliente, itens, valor, método de pagamento, status, data/hora

### ⭐ Gestão de Motoboys

- CRUD de motoboys por tenant (nome, telefone, status ativo/inativo)
- Atribuição manual de pedido a motoboy específico
- Histórico de entregas por motoboy

### ⭐ Configurações de Horário de Funcionamento

- Definir horários por dia da semana
- Toggle automático de `isOpen` baseado no horário
- Mensagem customizada de "loja fechada"

### ⭐ Dashboard de Métricas — Comparativo de Períodos

- "vs período anterior" calculado em tempo real (não apenas label fixo)
- Substituir indicadores de crescimento hardcoded (`+12% vs semana passada`) por dados reais
- Requer query de dois períodos em paralelo

### ⭐ Gestão de Combos / Montagem Personalizada

- `Product.maxSides` e `OrderItem.comboSides` já existem no schema
- Falta: UI de configuração no admin (definir quais produtos são acompanhamentos de quais pratos)
- E UI no cardápio (seletor de acompanhamentos no `ProductModal`)

---

## Planejado — Plataforma SaaS (Multi-tenant)

### ⭐ Planos e Billing (SubscriptionTier)

- `Store.tier (BASIC/PRO/ENTERPRISE)` já existe no schema
- `Store.features (Json)` com feature flags já existe
- Falta: integração com gateway de assinatura (Stripe ou MP Assinaturas), bloqueio de features por tier, tela de upgrade

### ⭐ Super Admin (Gestão de Tenants)

- Role `SUPER_ADMIN` existe no schema (`User.role`)
- Falta: rota `/super-admin` com listagem de lojas, métricas agregadas da plataforma, gerenciamento de planos

### ⭐ Domínio Customizado Automatizado

- Campo `Store.customDomain` já existe e `tenantWhere` já suporta
- Falta: UI no admin para o lojista informar o domínio e guia de configuração DNS
- Falta: verificação automática de CNAME apontando para a plataforma

### ⭐ Onboarding Guiado

- Após cadastro, wizard que orienta o lojista: criar categoria → criar produto → configurar pagamento → personalizar loja → abrir loja
- Progress tracker persistido no banco

---

## Melhorias de Infraestrutura

### ⭐ Substituir Polling por Server-Sent Events (SSE)

- KDS e rastreador de pedido usam polling (`setInterval`)
- SSE reduziria carga no banco e melhoraria latência de atualização
- `/api/admin/orders/route.ts` já tem comentário sugerindo SSE-ready

### ⭐ Fila de Webhook (Resiliência)

- Webhook do MP processa síncrono — se o banco estiver lento, o MP pode retentar e criar duplicatas
- Implementar idempotência: verificar se `paymentId` já foi processado antes de atualizar
- Resolver C-03 do BUG_TRACKER como pré-requisito

### ⭐ Rate Limiting nas APIs Públicas

- `/api/tenant` (criação de tenant) sem rate limit atual — suscetível a spam
- `/api/tenant/check-slug` sem rate limit — suscetível a enumeração de slugs
- Implementar via Vercel Edge Middleware ou `upstash/ratelimit`

### ⭐ Testes Automatizados

- Zero cobertura de testes atualmente
- Prioridade: testes de integração nas server actions críticas (`submitOrder`, `registerNewStore`, webhook)
- Framework sugerido: Vitest + Prisma mocks ou banco de teste dedicado
