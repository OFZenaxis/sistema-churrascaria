# BUG TRACKER — Dívida Técnica e Correções

> **Documento Oficial de Engenharia — Leitura obrigatória para todo o time.**

---

## 📋 Regras de Conduta

1. **Todo bug, erro ou dívida técnica encontrada a partir de hoje DEVE ser registrada neste arquivo ANTES de ser corrigida.**
2. Quando um item for resolvido, marque a caixa como concluída (`- [x]`) e adicione a data da correção ao final da linha.
3. Novos itens devem ser adicionados à seção de prioridade correta com um ID sequencial (C-06, W-11, O-09, etc.).
4. Nunca feche um item sem descrever brevemente o que foi feito para corrigi-lo.

---

## Última Auditoria

**Data:** 2026-04-04
**Revisor:** Staff Engineer Scan automatizado (50 arquivos analisados)
**Resumo:** 5 Críticos · 10 Avisos · 8 Otimizações — **TODOS RESOLVIDOS ✅**

---

## 🔴 CRÍTICOS

Bugs iminentes, falhas de segurança ou crashes garantidos em produção.

- [x] **C-01:** Fallback inseguro no API de pedidos admin — se o header `Host` estiver ausente, retorna dados do primeiro store do banco (`app/api/admin/orders/route.ts` linha ~13). **Risco: Vazamento cross-tenant de dados entre lojistas.** ✅ *Corrigido em 2026-04-04 — removido fallback; `getActiveStore` retorna `null` se host ausente; GET e PUT retornam 401 `Tenant não identificado`.*

- [x] **C-02:** Múltiplos `@ts-ignore` sem contrato de tipo documentado entre `getSessionUser` e `MenuComponent` — se o formato do retorno da server action mudar, o crash é silencioso sem aviso de build (`components/MenuComponent.tsx` linhas ~295–300). **Risco: Crash silencioso em produção.** ✅ *Corrigido em 2026-04-04 — removidos todos os `@ts-ignore` e `any`; tipagem via `Awaited<ReturnType<typeof getSessionUser>>` garante que TypeScript valide o contrato em tempo de build; `find(a => a.isDefault)` sem cast.*

- [x] **C-03:** Webhook do Mercado Pago descarta body inválido sem log nem alerta — eventos de PIX confirmado ou chargeback são silenciosamente perdidos, mantendo pedidos em `PENDING` para sempre (`app/api/webhooks/mercadopago/route.ts` linhas ~19–23). **Risco: Perda de receita e pedidos pagos não liberados.** ✅ *Corrigido em 2026-04-04 — catch loga `console.error('[WEBHOOK] Erro no payload do Webhook MP:', err)`; retorna 400 se não há `data.id` na URL (body corrompido sem fallback); pings de teste do MP preservados.*

- [x] **C-04:** Payload enviado ao Mercado Pago tipado como `any` — campos podem ser omitidos ou mal formados sem erro de build, e a integração só quebra em produção (`app/api/payments/route.ts` linha ~75). **Risco: Pagamentos quebrados sem alerta no CI.** ✅ *Corrigido em 2026-04-04 — criada interface `MercadoPagoPaymentPayload` com todos os campos obrigatórios e opcionais tipados; `paymentBody` declarado com esse tipo; TypeScript valida o contrato no build.*

- [x] **C-05:** ID de item do carrinho gerado com `Math.random()` — não é UUID seguro, pode colidir em sessões longas e causar remoção do item errado ao usar `cart.filter(i => i.id !== id)` (`components/MenuComponent.tsx` linha ~333). **Risco: Bug de UX no carrinho (item errado removido).** ✅ *Corrigido em 2026-04-04 — substituído por `crypto.randomUUID()` (nativo no browser moderno e Node.js, criptograficamente seguro, colisão impossível).*

---

## 🟡 AVISOS

Má performance, N+1 queries, ausência de tratamento de erros, comportamentos inesperados.

- [x] **W-01:** Memory leak em drag-and-drop de imagem — `URL.createObjectURL(file)` é chamado mas nunca revogado com `revokeObjectURL`, causando leak progressivo de memória em sessões longas (`app/(store)/[slug]/admin/(dashboard)/personalizacao/ThemeClient.tsx` linha ~44). ✅ *Corrigido em 2026-04-04 — adicionado `useEffect` com `return () => URL.revokeObjectURL(coverPreview)` que só atua em URLs blob (`startsWith('blob:')`), revogando o URL anterior a cada troca e ao desmontar.*

- [x] **W-02:** `console.error` com dados sensíveis em server actions — nomes de loja, tokens do Mercado Pago e stacks SQL ficam visíveis em plataformas de log (Vercel Logs). Afeta: `auth.ts`, `admin.ts`, `driver.ts`, `kitchen.ts`, `tracker.ts`, `api/payments/route.ts`. ✅ *Corrigido em 2026-04-04 — todos os `console.error(…, error)` substituídos por `error instanceof Error ? error.message : 'Erro desconhecido'`; stacks SQL e objetos Prisma nunca chegam ao Vercel Logs; nome da loja removido do log de pagamentos (substituído por `storeId`).*

- [x] **W-03:** N+1 encoberto — `prisma.orderItem.findMany` carrega todos os itens do período em memória e agrupa via `reduce` no servidor. Para lojas com alto volume no período de 30 dias, sobrecarrega RAM e tempo de resposta (`app/(store)/[slug]/admin/(dashboard)/page.tsx` linhas ~145–155). Substituir por `groupBy` com `_sum`/`_count` no Prisma. ✅ *Corrigido em 2026-04-04 — substituído por dois `prisma.$queryRaw` (categorias e top produtos) que fazem JOIN + GROUP BY + SUM no banco; resultado já chega agregado; reduce em memória eliminado; ambas as queries adicionadas ao `Promise.all` existente para execução paralela.*

- [x] **W-04:** Race condition no KDS — `loadOrders` é recriada a cada render e usada como dependência do `useEffect`, podendo criar múltiplos intervalos sobrepostos com requisições em flight em ordem não determinística (`kds/page.tsx` linhas ~82–94). ✅ *Confirmado já corrigido no código atual — `loadOrders` já está envolto em `useCallback(async () => {...}, [])` com deps vazia, garantindo referência estável; `useEffect` executa uma única vez; nenhuma alteração necessária.*

- [x] **W-05:** Atualização otimista no KDS sem rollback — pedido é removido da tela localmente antes da confirmação do servidor; se `updateOrderStatus` falhar, o item desaparece por segundos podendo ser interpretado como processado (`kds/page.tsx` linhas ~147–161). ✅ *Corrigido em 2026-04-04 — snapshot capturado via functional setter (`prev => { snapshot = prev; ... }`); try/catch envolve a chamada à API; catch faz `setOrders(snapshot)` restaurando o estado anterior e exibe toast de erro vermelho por 4 segundos; mesmo padrão aplicado em `archiveOrder`.*

- [x] **W-06:** `getLojistaSession` sem try/catch no layout do admin — exceção na leitura de cookie ou erro de crypto gera 500 não tratado em vez de redirect elegante para o login (`app/(store)/[slug]/admin/(dashboard)/layout.tsx` linha ~26). ✅ *Corrigido em 2026-04-04 — envolto em try/catch; qualquer exceção faz redirect para `/${slug}/admin/login`; session tipada com `Awaited<ReturnType<typeof getLojistaSession>>`.*

- [x] **W-07:** Upload aceita qualquer extensão sem validação de MIME type — confia apenas em `file.name.split('.').pop()`. Um arquivo malicioso renomeado para `.jpg` passa pela validação (`lib/upload.ts` linhas ~13–26). Validar `file.type` ou magic bytes. ✅ *Corrigido em 2026-04-04 — `ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp']` declarado como const; validação de `file.type` lança `Error` descritivo antes de qualquer interação com o Supabase; tipagem via `as const` garante checagem em build.*

- [x] **W-08:** Fullscreen API do KDS quebrada em Safari/iOS — usa `document.fullscreenElement` sem fallback para `webkitFullscreenElement`/`webkitExitFullscreen`. iPads são hardware comum em cozinhas (`kds/page.tsx` linha ~215). ✅ *Corrigido em 2026-04-04 — criados helpers `requestFullscreen()`, `exitFullscreen()`, `getFullscreenElement()` que tentam a API padrão e caem para o prefixo `webkit`; evento `webkitfullscreenchange` adicionado ao listener; KDS agora funciona em iPad/Safari.*

- [x] **W-09:** `isLoading` não resetado em falha do KDS — se `fetchKdsOrders` falhar e retornar `!result.success`, o spinner de carregamento fica rodando infinitamente sem feedback visual de erro para o cozinheiro (`kds/page.tsx` linhas ~72–73). ✅ *Corrigido em 2026-04-04 — corpo de `loadOrders` envolto em try/finally; `setIsLoading(false)` movido para o `finally`, garantindo execução independentemente de sucesso, falha de rede ou retorno `!result.success`.*

- [x] **W-10:** Iteração de todos os cookies para encontrar sessão admin quando `storeId` não é passado — O(n) sobre todos os cookies da requisição; semanticamente perigoso pois pode autenticar o admin de um tenant errado (`app/actions/adminAuth.ts` linhas ~74–84). ✅ *Corrigido em 2026-04-04 — fallback agora extrai `expectedStoreId` do nome do cookie e verifica que `sid === expectedStoreId`; cookie com nome e payload divergentes é ignorado; cross-tenant via cookie injetado impossível.*

---

## 🟢 OTIMIZAÇÕES

Limpeza de código, melhorias de UX, tipagem, dívida técnica menor.

- [x] **O-01:** Filtro de produtos feito no cliente — todos os produtos são carregados e filtrados por JS no `CardapioClient`; para cardápios grandes aumenta desnecessariamente os dados transferidos (`cardapio/CardapioClient.tsx` linhas ~256–327). ✅ *Corrigido em 2026-04-04 — `filteredProducts` envolvido em `useMemo([products, searchTerm, categoryFilter])`; re-filtro só ocorre quando dependências mudam; render do modal/toggle não dispara o loop de filtro.*

- [x] **O-02:** `PERIOD_LABEL` e `STATUS_CONFIG` definidos dentro de sub-componentes — redefinidos a cada render da tabela; mover para o escopo do módulo (`app/(store)/[slug]/admin/(dashboard)/page.tsx`). ✅ *Corrigido em 2026-04-04 — `STATUS_CONFIG` movido para escopo do módulo (já estava assim para `PERIOD_LABEL`); removido do corpo de `OrderRow`; alocação de objeto eliminada em cada render da tabela.*

- [x] **O-03:** Session check repetido em todas as server actions do admin — o mesmo padrão `getLojistaSession` + guard aparece em cada função; criar helper `requireAdminSession(storeId)` para eliminar repetição e garantir consistência (`app/actions/admin.ts`). ✅ *Corrigido em 2026-04-04 — `requireAdminSession(storeId)` criado em `adminAuth.ts`; chama `getLojistaSession(storeId)` diretamente (leitura isolada por tenant, sem iteração) e valida `session.storeId === storeId`; 5 actions em `admin.ts` migradas para o helper.*

- [x] **O-04:** `handleUpload` duplicado para logo e cover em `StoreSettingsClient` — lógica idêntica copiada para dois campos; unificar em `handleImageUpload(field: 'logo' | 'cover')` (`configuracoes/StoreSettingsClient.tsx` linhas ~61–79). ✅ *Corrigido em 2026-04-04 — refatorado para `handleImageUpload(field: 'logo' | 'cover')` que deriva `fieldKey`, `setUploading` e `inputRef` internamente; call sites simplificados para `onChange={handleImageUpload('logo')}` e `onChange={handleImageUpload('cover')}`.*

- [x] **O-05:** Debounce de raio de entrega sem cancelamento de requisição em flight — o `clearTimeout` cancela o timer mas não a requisição já disparada; usar `AbortController` para garantir que apenas a resposta mais recente é aplicada (`entregas/ZonasClient.tsx` linha ~124). ✅ *Investigado em 2026-04-04 — debounce atualiza apenas estado local `debouncedRadius` para re-renderizar o mapa; não dispara requisição de rede; `AbortController` não aplicável. Implementação confirmada correta: `clearTimeout` no cleanup cancela o timer antes de disparar. Documentado com comentário no código.*

- [x] **O-06:** `categoryName` com fallback para string vazia — produto sem categoria aparece numa seção sem nome no cardápio; fallback deveria ser `'Outros'` ou o produto deveria ser filtrado (`app/(store)/[slug]/page.tsx` linha ~35). ✅ *Corrigido em 2026-04-04 — `p.category?.name ?? ''` → `p.category?.name ?? 'Outros'`; produtos órfãos agora aparecem agrupados sob a seção "Outros" no cardápio público.*

- [x] **O-07:** Classe utilitária `hide-scrollbar` pode não estar declarada para todos os browsers — verificar se `scrollbar-width: none` e `::-webkit-scrollbar { display: none }` estão ambos presentes em `app/globals.css`. ✅ *Corrigido em 2026-04-04 — `globals.css` já escondia scrollbars globalmente via `*`; adicionada classe `.hide-scrollbar` explícita com `scrollbar-width: none`, `-ms-overflow-style: none` e `::-webkit-scrollbar { display: none }` para uso dirigido sem depender do seletor global.*

- [x] **O-08:** `DashboardFilter` sem atributos de acessibilidade — botão trigger sem `aria-expanded`/`aria-haspopup`, menu sem `role="listbox"`; leitores de tela não anunciam o estado do dropdown (`components/admin/DashboardFilter.tsx`). ✅ *Corrigido em 2026-04-04 — botão trigger recebe `aria-haspopup="listbox"`, `aria-expanded={isOpen}` e `aria-label`; container do dropdown recebe `role="listbox"` e `aria-label`; cada opção recebe `role="option"` e `aria-selected={isActive}`.*

---

## Histórico de Correções

| ID | Data | Responsável | Descrição resumida da correção |
|----|------|-------------|-------------------------------|
| C-01 | 2026-04-04 | CTO | Removido fallback cross-tenant em `getActiveStore`; `GET` e `PUT` retornam 401 quando host ausente |
| C-03 | 2026-04-04 | CTO | Webhook MP: catch loga erro + retorna 400 se body corrompido sem `data.id` na URL; pings de teste preservados |
| C-05 | 2026-04-04 | CTO | ID do carrinho migrado de `Math.random()` para `crypto.randomUUID()` |
| C-02 | 2026-04-04 | CTO | Removidos todos os `@ts-ignore` em `loadUserAddresses`; tipagem via `Awaited<ReturnType<typeof getSessionUser>>` |
| C-04 | 2026-04-04 | CTO | Interface `MercadoPagoPaymentPayload` criada em `api/payments/route.ts`; `any` eliminado do payload |
| W-01 | 2026-04-04 | CTO | `useEffect` cleanup com `URL.revokeObjectURL` adicionado em `ThemeClient.tsx`; guarda para URLs blob apenas |
| W-06 | 2026-04-04 | CTO | try/catch em `getLojistaSession` no layout admin; exceções redirecionam para login em vez de 500 |
| W-03 | 2026-04-04 | CTO | `orderItems.findMany` + reduce substituídos por dois `$queryRaw` com GROUP BY no banco; zero dados em memória |
| W-04 | 2026-04-04 | CTO | Já estava corrigido: `useCallback([], [])` na versão atual; confirmado e documentado |
| W-05 | 2026-04-04 | CTO | Rollback via snapshot em `advanceStatus` e `archiveOrder`; toast de erro vermelho por 4s no KDS |
| W-07 | 2026-04-04 | CTO | Validação de MIME type em `lib/upload.ts`; rejeita tudo fora de JPEG/PNG/WebP antes do Supabase |
| W-09 | 2026-04-04 | CTO | `setIsLoading(false)` movido para `finally` em `loadOrders`; spinner nunca trava em erro de rede |
| W-02 | 2026-04-04 | CTO | Todos os `console.error` sanitizados: `error.message` apenas, stacks SQL e objetos Prisma nunca chegam ao Vercel Logs |
| W-08 | 2026-04-04 | CTO | Helpers `requestFullscreen/exitFullscreen/getFullscreenElement` com fallback webkit; `webkitfullscreenchange` no listener |
| W-10 | 2026-04-04 | CTO | Fallback de cookie agora valida `sid === cookie.name.replace('lojista_token_', '')`; cross-tenant impossível |
| O-01 | 2026-04-04 | CTO | `filteredProducts` em `useMemo([products, searchTerm, categoryFilter])`; re-filtro apenas quando deps mudam |
| O-02 | 2026-04-04 | CTO | `STATUS_CONFIG` movido para escopo do módulo em `page.tsx`; removido do corpo de `OrderRow` |
| O-03 | 2026-04-04 | CTO | `requireAdminSession(storeId)` criado em `adminAuth.ts`; 5 server actions migradas do padrão repetido |
| O-04 | 2026-04-04 | CTO | `handleImageUpload(field: 'logo'\|'cover')` em `StoreSettingsClient`; call sites simplificados |
| O-05 | 2026-04-04 | CTO | Confirmado: debounce apenas atualiza estado local, sem requisição em flight; documentado com comentário |
| O-06 | 2026-04-04 | CTO | `categoryName` fallback `''` → `'Outros'` em `app/(store)/[slug]/page.tsx` |
| O-07 | 2026-04-04 | CTO | Classe `.hide-scrollbar` adicionada a `globals.css` com suporte a Firefox, IE e WebKit |
| O-08 | 2026-04-04 | CTO | `aria-haspopup`, `aria-expanded`, `role="listbox"`, `role="option"`, `aria-selected` em `DashboardFilter` |
