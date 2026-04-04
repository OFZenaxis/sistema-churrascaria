# INFRA — Infraestrutura, DevOps e Integrações

> **Regra de Ouro:** Toda nova variável de ambiente, serviço externo ou integração adicionada ao sistema DEVE ser documentada aqui com a data.

**Última atualização:** 2026-04-04

---

## Variáveis de Ambiente

Copie `.env.example` e preencha antes de rodar o projeto. **Nunca comite valores reais.**

### Banco de Dados (Prisma + PostgreSQL)

```env
DATABASE_URL="postgresql://user:password@host:5432/dbname?schema=public"
# URL principal — usada pelo Prisma em runtime

DIRECT_URL="postgresql://user:password@host:5432/dbname?schema=public"
# URL direta (sem pooler) — usada pelo prisma migrate e seed.
# Em produção com Supabase, DATABASE_URL usa o pgBouncer (pooled)
# e DIRECT_URL aponta direto para o banco (necessário para migrations).
```

### Segurança

```env
COOKIE_SECRET="uma-string-aleatoria-longa-minimo-32-chars"
# Segredo HMAC-SHA256 para assinar cookies de sessão.
# OBRIGATÓRIO: o servidor recusa iniciar sem esta variável (boot guard em lib/session.ts).
# Gere com: openssl rand -base64 32
```

### Supabase Storage (Upload de Imagens)

```env
NEXT_PUBLIC_SUPABASE_URL="https://xxxxxxxxxxxx.supabase.co"
# URL pública do projeto Supabase (usada no client-side upload)

NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
# Chave anônima pública (RLS do bucket deve ser configurado corretamente)

SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
# Chave de serviço (privilégio total — apenas server-side, nunca expor ao client)
```

### Mapbox (Mapas e Geocodificação)

```env
NEXT_PUBLIC_MAPBOX_TOKEN="pk.eyJ1IjoiLi4uIiwiYSI6Ii4uLiJ9.xxxxx"
# Token público do Mapbox (usado em MapboxGL no browser e geocodificação server-side)
# Criar em: https://account.mapbox.com/
# Escopos necessários: styles:read, tiles:read, geocoding, directions
```

### Plataforma

```env
NEXT_PUBLIC_APP_URL="https://saiudelivery.com.br"
# URL base pública da plataforma (usada para montar links absolutos)
# Em desenvolvimento: http://localhost:3000
```

---

## Banco de Dados

**Provider:** PostgreSQL (compatível com Supabase, Neon, Railway, Render)

**ORM:** Prisma 5.22 com `prisma-client-js`

### Configuração especial de produção (Supabase)

O schema usa `directUrl` separado de `url` para suportar o pgBouncer do Supabase:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")    // pooled (pgBouncer) — para queries em runtime
  directUrl = env("DIRECT_URL")      // direto — para migrations e seed
}
```

### Comandos essenciais

```bash
# Gerar cliente Prisma após mudar o schema
npx prisma generate

# Criar e aplicar migration
npx prisma migrate dev --name nome-da-migration

# Aplicar migrations em produção (sem interatividade)
npx prisma migrate deploy

# Popular banco com dados iniciais
npx prisma db seed

# Inspecionar banco visualmente
npx prisma studio
```

---

## Supabase Storage

**Uso:** Upload de logos, banners e imagens de produtos dos tenants.

**Bucket recomendado:** `store-assets` (público, com RLS permissiva para leitura, restritiva para escrita)

**Fluxo de upload (`lib/upload.ts`):**
1. Client cria `FormData` com o arquivo
2. Chama server action que usa `SUPABASE_SERVICE_ROLE_KEY` para bypass de RLS
3. Arquivo salvo em `/{storeId}/{filename}` dentro do bucket
4. URL pública retornada e salva no banco (`Store.logoUrl`, `Store.coverImageUrl`, `Product.imageUrl`)

**Aviso de segurança (W-07 no BUG_TRACKER):** Validação atual confia apenas na extensão do arquivo. Implementar verificação de MIME type.

---

## Mercado Pago

**Integração:** Cada tenant configura suas próprias credenciais. Zero credenciais compartilhadas entre lojas.

### Credenciais por tenant

Armazenadas em `StorePaymentConfig` (1:1 com `Store`):

```
mpAccessToken    — token de acesso privado (server-side only, nunca exposto ao client)
mpPublicKey      — chave pública (passada ao Bricks client-side)
pixDiscountPercent — desconto opcional para pagamento via PIX
```

### Fluxo PIX

```
1. Cliente seleciona PIX no checkout
2. submitOrder() → cria Order no banco com paymentMethod='PIX'
3. Redirect → /[slug]/pagamento/[id]?method=PIX
4. PaymentPixClient → POST /api/payments { orderId, payment_method_id: 'pix' }
5. API busca mpAccessToken da loja, chama MP API → retorna { qr_code, qr_code_base64 }
6. QR code exibido ao cliente
7. Polling: GET /api/orders/[id]/status a cada 4s
8. MP dispara webhook: POST /api/webhooks/mercadopago
9. Webhook valida evento, consulta MP API, atualiza Order.paymentStatus='approved'
10. Próximo poll detecta aprovação → redirect /[slug]/pedido/[id]
```

### Fluxo Cartão Online

```
1. submitOrder() → cria Order com paymentMethod='CARD_ONLINE'
2. Redirect → /[slug]/pagamento/[id]?method=CARD_ONLINE
3. PaymentClient (MP Bricks) inicializado com mpPublicKey
4. Cliente preenche dados do cartão no iframe do MP
5. onSubmit → POST /api/payments com token do cartão + orderId
6. API processa pagamento, retorna status
7. Se approved/in_process → resolve Brick → redirect /[slug]/pedido/[id]
```

### Fluxo Presencial (CASH / CARD_MACHINE)

```
submitOrder() → cria Order → redirect direto /[slug]/pedido/[id]
Sem etapa de pagamento online.
```

### Webhook — `/api/webhooks/mercadopago`

Recebe notificações do tipo `payment`. Fluxo:
1. Parse do body JSON
2. Valida `body.type === 'payment'`
3. Busca `paymentId` em `body.data.id`
4. Consulta MP API: `GET /v1/payments/{paymentId}`
5. Extrai `external_reference` (= `orderId`)
6. Busca `Order` + `Store` (para pegar `mpAccessToken`)
7. Se `payment.status === 'approved'`:
   - `Order.paymentStatus = 'approved'`
   - `Order.status = 'PREPARING'`
8. Retorna 200

**Ponto crítico:** Ver **C-03** no `BUG_TRACKER.md` — body inválido descartado silenciosamente.

---

## Mapbox

**Uso:** Geocodificação de endereços, cálculo de distância para frete, mapa do motoboy, visualização de zonas de entrega.

**Token:** `NEXT_PUBLIC_MAPBOX_TOKEN` (único token, usado tanto server-side quanto client-side)

**Serviços utilizados:**
- **Geocoding API** — converte `storeAddress` e endereço do cliente em coordenadas lat/lng
- **Directions API** — rota do motoboy ao cliente (atualizada a cada 30s)
- **MapboxGL JS** — renderização do mapa no browser (motoboy + admin de entregas)

**Cálculo de frete (`estimateDeliveryFee`):**
```
distanceKm = haversine(storeLat/Lng, customerLat/Lng)
fee = baseDeliveryFee + (distanceKm * deliveryFeePerKm)
outOfRange = distanceKm > maxDeliveryRadius
```

---

## ViaCEP

**Uso:** Lookup automático de endereço a partir do CEP no `PhoneLogin.tsx`.

**Endpoint:** `GET https://viacep.com.br/ws/{cep}/json/`

**Dados retornados usados:** `logradouro` (rua), `bairro`, `localidade` (cidade), `uf` (estado).

Nenhuma chave de API necessária — serviço público gratuito.

---

## Deploy (Vercel — inferido)

### Build script

```json
"build": "prisma generate && prisma migrate deploy && next build"
```

Garante que o Prisma Client é gerado e as migrations aplicadas antes do build do Next.js.

### Configurações recomendadas no Vercel

- **Framework Preset:** Next.js
- **Build Command:** `npm run build`
- **Environment Variables:** Todas as listadas acima
- **Regions:** `gru1` (São Paulo) para menor latência com usuários brasileiros e Supabase BR
- **`force-dynamic`:** Páginas do dashboard admin e cardápio público usam `export const dynamic = 'force-dynamic'` — não são cacheadas pelo Vercel Edge

### `next.config.ts`

Verificar se `images.domains` ou `images.remotePatterns` inclui o domínio do Supabase para que `next/image` funcione com as URLs de upload.

---

## Segurança — Checklist de Produção

- [ ] `COOKIE_SECRET` definido e com pelo menos 32 caracteres aleatórios
- [ ] `SUPABASE_SERVICE_ROLE_KEY` **nunca** exposto em variáveis `NEXT_PUBLIC_`
- [ ] `mpAccessToken` de cada tenant armazenado apenas no banco, nunca no client
- [ ] RLS do bucket Supabase: leitura pública, escrita apenas via service role
- [ ] Webhook do Mercado Pago: validar `X-Signature` do MP (pendente — ver C-03 no BUG_TRACKER)
- [ ] HTTPS obrigatório em produção (Vercel faz isso automaticamente)
- [ ] Cookies com `secure: true` e `sameSite: 'strict'` em produção (já implementado)
