/**
 * Retorna o filtro Prisma correto para encontrar uma Store a partir do slug da URL.
 * O slug pode ser um subpath (ex: "minha-loja") ou um domínio customizado (ex: "loja.com.br").
 */
export function tenantWhere(slug: string): { slug: string } | { customDomain: string } {
  return slug.includes('.') ? { customDomain: slug } : { slug }
}
