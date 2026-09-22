/**
 * Roteamento do admin sensível ao ambiente (shim DEV-only).
 *
 * Em PRODUÇÃO cada loja roda em seu próprio subdomínio
 * (ex: loja.saiudelivery.com.br) e o `proxy.ts` reescreve internamente
 * "/admin/..." → "/{slug}/admin/...". Por isso todos os links e redirects do
 * admin são relativos à raiz ("/admin", "/admin/login", ...).
 *
 * Em LOCALHOST não há subdomínio para resolver o tenant: o slug vem do caminho
 * (localhost:3000/{slug}/admin). Os caminhos relativos à raiz ("/admin") perdem
 * o slug e o usuário cai de volta no login.
 *
 * Este helper injeta o prefixo "/{slug}" SOMENTE fora de produção. Em produção
 * o retorno é byte-a-byte idêntico ao caminho original — comportamento intacto.
 */
export function adminPath(slug: string, path: string = '/admin'): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  if (process.env.NODE_ENV === 'production') return normalized
  return `/${slug}${normalized}`
}
