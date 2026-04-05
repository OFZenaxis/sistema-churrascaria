# ROADMAP — O Futuro do Saiu Delivery

> Este documento é baseado no estado real do código. Features listadas como "Em Progresso" foram identificadas por rotas existentes, stubs ou lógica parcial. "Planejado" são evoluções lógicas do produto. Consulte `PROJECT_MAP.md` para o estado atual.

**Última atualização:** 2026-04-04

---

## Estado Atual (MVP Funcional)

O sistema já entrega um loop completo de operação:

```
Lojista configura loja → Cliente faz pedido → Pagamento processado (MP)
→ Cozinha vê no KDS → Motoboy entrega rastreando GPS → Cliente acompanha
```

**Módulos prontos:** Vitrine, Cardápio, Carrinho, Checkout, KDS, GPS Tracker, Dashboard Financeiro, Personalização de Tema, Entregas com Mapa.

---

## FASE 1 — Correções Críticas de Segurança

> **Prazo:** Antes de qualquer novo feature. Estas correções devem ir para produção primeiro.

### 1.1 — Validar assinatura do webhook Mercado Pago (BUG-002)

**Impacto:** Segurança financeira crítica.
**Esforço:** 0.5 dia

Usar `MP_WEBHOOK_SECRET` (já no `.env.example`) para validar HMAC-SHA256 do header `x-signature` conforme documentação oficial do Mercado Pago. Implementar em `app/api/webhooks/mercadopago/route.ts`.

### 1.2 — Autenticar `getOrderLocation` (BUG-001)

**Impacto:** Privacidade de dados de localização.
**Esforço:** 0.5 dia

Adicionar validação de cookie de sessão (cliente ou admin) antes de retornar dados de GPS em `app/actions/tracker.ts`.

### 1.3 — Rate Limiting em endpoints públicos (BUG-016)

**Impacto:** Proteção contra abuso e bots.
**Esforço:** 1 dia

Implementar `@upstash/ratelimit` com Redis para:
- `loginWithPhone`: 10 req/min por IP
- `registerNewStore`: 5 req/hora por IP
- `check-slug`: 30 req/min por IP

---

## FASE 2 — Qualidade e Estabilidade

> **Prazo:** Próximas 2 semanas após Fase 1.

### 2.1 — Parar polling do CustomerTracker ao entregar (BUG-004)

Cancelar `clearInterval` quando status `=== 'DELIVERED'` ou `'CANCELED'`.

### 2.2 — Indicador de falha no KDS (BUG-008)

Adicionar banner de erro com timestamp da última sincronização bem-sucedida. Implementar retry automático com backoff exponencial.

### 2.3 — Flag `isEstimated` no frete (BUG-009)

Quando Mapbox Directions falha, retornar `isEstimated: true` e exibir aviso no checkout: `"Frete estimado — valor exato calculado no processamento"`.

### 2.4 — Migrar imagens para `next/image` (BUG-014)

Substituir `<img>` nativo por `<Image>` do Next.js em `ProductCard.tsx` e `ProductModal.tsx`. Ganhos: lazy loading, WebP automático, prevenção de CLS.

### 2.5 — Eliminar `any` do TypeScript (BUG-010)

Definir tipos explícitos:
- `type RawKdsOrder` para o KDS
- `type MercadoPagoWebhookBody` para o webhook
- Importar `OrderStatus` enum do Prisma em `admin.ts`

### 2.6 — Extrair `lib/validation.ts` (BUG-012)

Centralizar `SLUG_REGEX` + `RESERVED_SLUGS` + `sanitizePhone()` + `buildAddressString()`.

### 2.7 — Paginação nas queries do KDS e API de pedidos (BUG-013)

Adicionar `take: 100` no KDS. Implementar paginação cursor-based na rota `GET /api/admin/orders`.

---

## FASE 3 — Expansão de Features Core

> **Prazo:** Próximo mês.

### 3.1 — Notificações por WhatsApp (Alta prioridade)

**Descrição:** Disparar mensagens WhatsApp automáticas nos eventos chave do pedido.
**Casos de uso:**
- `PREPARING`: "🍽️ Seu pedido foi aceito! Estimativa: X minutos."
- `DISPATCHED`: "🛵 Pedido saiu para entrega! Acompanhe: [link tracker]"
- `DELIVERED`: "✅ Pedido entregue! Obrigado por pedir na {nome da loja}."

**Stack sugerida:** [Z-API](https://z-api.io) ou [Twilio WhatsApp API](https://www.twilio.com/whatsapp) + queue de eventos (ex: `BullMQ` + Redis para retries).

**Schema necessário:** Campo `mpWebhookUrl` em `Store` + `notificationPhone` em `Order`.

**Multi-tenant:** Cada loja configura sua própria chave Z-API no painel admin.

---

### 3.2 — PWA (Progressive Web App)

**Descrição:** Transformar a vitrine do cliente em instalável (Add to Home Screen). Essencial para engajamento mobile.

**Implementação:**
- `app/(store)/[slug]/manifest.ts` — gera manifest.json dinâmico por tenant (nome, ícone, `brandColor` como `theme_color`)
- Service Worker via `next-pwa` para cache offline do cardápio
- Botão "Instalar App" na vitrine com `beforeinstallprompt`
- Push notifications (via Web Push API) para status de pedido

**Impacto:** Redução de dependência de app nativo; melhor retenção de clientes.

---

### 3.3 — Impressão Térmica (Comanda na Cozinha)

**Descrição:** Imprimir comanda física automaticamente quando novo pedido chega (status `PENDING`).

**Implementação:**
- Protocolo **ESC/POS** (suportado pela maioria das impressoras térmicas)
- Biblioteca: `escpos` ou `node-escpos`
- Trigger: webhook interno ou polling no KDS
- Config no painel admin: IP da impressora na rede local ou Bluetooth

**Impacto direto:** Elimina necessidade de olhar para a tela KDS; operação mais fluida.

---

### 3.4 — Gestão de Pedidos em Tempo Real (Sem Polling)

**Descrição:** Substituir o polling de 8 segundos do KDS e 4 segundos do tracker por conexão em tempo real.

**Opções (em ordem de preferência):**

| Solução | Vantagem | Desvantagem |
|---------|---------|------------|
| **Supabase Realtime** | Já temos Supabase; zero infra extra | Latência ~100ms |
| **Server-Sent Events (SSE)** | Nativo do browser; sem lib externa | Unidirecional |
| **WebSockets (Pusher/Ably)** | Bidirecional, baixa latência | Custo adicional |

**Impacto:** KDS recebe novo pedido instantaneamente; tracker atualiza GPS sem delay perceptível.

---

### 3.5 — Avaliações e Fidelidade

**Descrição:** Sistema de avaliação pós-entrega + programa de pontos.

**Módulo de Avaliação:**
- Após status `DELIVERED`, enviar link de avaliação (WhatsApp ou SMS)
- Formulário simples: estrelas (1-5) + comentário opcional
- Painel admin: média de avaliações, últimos comentários

**Módulo de Fidelidade:**
- Pontos por pedido (`field: loyaltyPoints` em `Customer`)
- Resgatar como desconto no próximo pedido
- Configurável por lojista: X pontos por R$ gasto

**Schema:**
```prisma
model Review {
  id         String   @id @default(uuid())
  orderId    String   @unique
  storeId    String
  rating     Int      // 1-5
  comment    String?
  createdAt  DateTime @default(now())
}
```

---

### 3.6 — Split de Pagamento (Plataforma + Lojista)

**Descrição:** Cobrar automaticamente a taxa de plataforma no momento do pagamento, sem depender de fatura manual.

**Implementação com Mercado Pago Marketplace:**
- `marketplace_fee` no payload de criação do pagamento
- Valor: % do pedido configurável por tier (`BASIC: 3%`, `PRO: 2%`, `ENTERPRISE: 1%`)
- Lojista recebe o valor líquido diretamente na sua conta MP
- Dashboard de receita da plataforma consolidado por tier

**Impacto:** Monetização recorrente automatizada; elimina inadimplência.

---

## FASE 4 — Escala e Operações

> **Prazo:** 60-90 dias.

### 4.1 — Testes Automatizados

**Cobertura mínima prioritária:**

```
Vitest (unitários + integração):
├── submitOrder() — happy path + endereço inválido + loja fechada
├── loginLojista() — credenciais corretas + erradas + tenant errado
├── saveDeliverySettings() — geocodificação OK + falha + (0,0)
└── Webhook MP — pagamento aprovado + storeId cross-tenant (ataque)

Playwright (e2e):
├── Fluxo de compra completo (PIX)
└── Login lojista + toggle loja aberta/fechada
```

---

### 4.2 — Monitoramento e Observabilidade

| Ferramenta | Uso |
|-----------|-----|
| **Sentry** (`@sentry/nextjs`) | Error tracking em produção; alertas por e-mail |
| **Pino** | Logger estruturado JSON no servidor (substitui console.error) |
| **Uptime Robot** | Ping a cada 5min; alerta no WhatsApp se cair |
| **Supabase Dashboard** | Queries lentas, uso de storage |

**Variáveis a adicionar ao `.env`:**
- `SENTRY_DSN` (opcional)
- `LOG_LEVEL` (debug | info | warn | error)

---

### 4.3 — Onboarding Guiado para Novos Lojistas

**Descrição:** Após o cadastro, lojista vê um stepper de configuração inicial no painel admin.

**Etapas:**
1. ✅ Dados básicos (nome, logo, telefone)
2. 📍 Endereço da loja e raio de entrega
3. 💳 Credenciais Mercado Pago
4. 🍔 Primeiro produto cadastrado
5. 🎨 Escolha de tema

**Implementação:** Campo `onboardingStep: Int` em `Store`. Componente `OnboardingWizard.tsx` exibido no dashboard enquanto `onboardingStep < 5`.

---

### 4.4 — Suporte a Múltiplos Entregadores por Loja

**Descrição:** Atualmente, o modelo de `Delivery` tem 1 entregador por pedido sem autenticação robusta. Escalar para frota gerenciada.

**Mudanças necessárias:**
- `Driver` como model dedicado (vinculado a `Store`)
- Autenticação própria para motoboys (PIN ou senha simples)
- Dashboard de entregadores: corridas disponíveis, em andamento, histórico
- Lojista acompanha localização de todos os entregadores em um mapa único

---

### 4.5 — App Mobile Nativo (React Native)

**Descrição:** Companion app para entregadores (tracking mais preciso via GPS nativo) e para clientes VIP (notificações push nativas).

**Escopo inicial:** App de entregador apenas.
- Background location tracking (React Native `react-native-background-geolocation`)
- Interface simplificada: aceitar corrida → navegar → finalizar
- Autenticação reutilizada (mesmos cookies HTTP)

---

## FASE 5 — B2B Enterprise

> **Prazo:** 6+ meses.

### 5.1 — Multi-loja por Conta (Redes)

Lojista com múltiplas unidades gerencia tudo em um único painel com seletor de loja. Schema: `User` com múltiplos `storeId` via tabela `UserStoreAccess`.

### 5.2 — API Pública para Integrações (Parceiros)

Endpoints REST autenticados via API Key (`X-Api-Key` header) para que parceiros (iFood, sistemas POS) possam:
- Publicar/atualizar cardápio
- Receber pedidos em tempo real
- Atualizar status

### 5.3 — Módulo de Relatórios Avançados

- Exportar pedidos do período como CSV/Excel
- Relatório de ticket médio por dia da semana/hora
- Comparação mês a mês
- Produto mais vendido por período + por categoria

### 5.4 — Suporte a Retirada no Local (Take Away)

Novo `fulfillmentType: 'DELIVERY' | 'PICKUP'` em `Order`. Checkout sem endereço, sem cálculo de frete. KDS distingue visualmente pedidos de retirada.

---

## Backlog Aberto (Sem Data)

| Feature | Descrição | Complexidade |
|---------|-----------|-------------|
| Cardápio com horários | Produto disponível apenas em certos horários | Média |
| Variações de produto | Tamanho P/M/G com preços distintos | Alta |
| Cupons de desconto | Código → % ou R$ de desconto no pedido | Média |
| Agendamento de pedidos | Pedir agora para entregar às 19h | Alta |
| Chat Lojista-Cliente | Mensagens dentro do pedido | Alta |
| Cardápio multilíngue | Inglês/Espanhol para turistas | Baixa |
| Modo "Só Retirada" | Desabilitar entrega mantendo retirada | Baixa |

---

## Decisões de Arquitetura Futuras

| Decisão | Contexto | Recomendação |
|---------|---------|-------------|
| Polling vs Realtime | KDS e Tracker usam polling hoje | Migrar para Supabase Realtime quando volume > 100 pedidos/dia/tenant |
| Monolito vs Microserviços | Atualmente monolito Next.js | Manter monolito até 1000 lojas ativas; extrair apenas pagamentos e notificações |
| Vercel vs VPS | VPS atual com PM2 | Avaliar Vercel para zero-config de edge, CDN e auto-scaling |
| Banco por tenant vs compartilhado | Compartilhado com `storeId` hoje | Row-level security (RLS) no Supabase como camada adicional de isolamento |
