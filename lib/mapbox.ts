const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ''

/**
 * Converte um endereço textual em coordenadas geográficas via Mapbox Geocoding API.
 * Retorna null se o endereço não for encontrado ou o token não estiver configurado.
 */
export async function geocodeAddress(
  address: string
): Promise<{ lat: number; lng: number } | null> {
  if (!TOKEN) return null

  try {
    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${TOKEN}&limit=1&language=pt`
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return null

    const data = await res.json()
    const feature = data.features?.[0]
    if (!feature) return null

    const [lng, lat] = feature.center
    return { lat, lng }
  } catch {
    return null
  }
}

/**
 * Retorna a distância de direção (driving) entre dois pontos em KM via Mapbox Directions API.
 * Retorna null em caso de falha.
 */
export async function getDrivingDistance(
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
): Promise<number | null> {
  if (!TOKEN) return null

  try {
    const coords = `${originLng},${originLat};${destLng},${destLat}`
    const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}?access_token=${TOKEN}&overview=false`
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return null

    const data = await res.json()
    const route = data.routes?.[0]
    if (!route) return null

    // distance vem em metros — convertemos para KM
    return route.distance / 1000
  } catch {
    return null
  }
}

/**
 * Calcula a taxa de entrega com base na distância e configuração da loja.
 */
export function calcDeliveryFee(
  distanceKm: number,
  baseDeliveryFee: number,
  deliveryFeePerKm: number
): number {
  return baseDeliveryFee + distanceKm * deliveryFeePerKm
}
