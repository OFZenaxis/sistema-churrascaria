export type Theme = {
  id: string
  name: string
  category: string
  emoji: string
  description: string
  tags: string[]
  layoutStyle: 'list' | 'grid' | 'featured'
  fontFamily: 'sans' | 'serif' | 'rounded'
  mockProducts: { name: string; price: string }[]
  phoneBg: string
  phoneCard: string
  phoneText: string
  phoneSubText: string
  phoneAccent: string
  phoneBorderRadius: string
  phoneIsGradient?: boolean
  cardGradient: string
}

export const THEMES: Theme[] = [
  {
    id: 'classic-light',
    name: 'Classic Burger',
    category: 'Fast Food & Hamburguerias',
    emoji: '🍔',
    description: 'Cores quentes, botões grandes e energia urbana',
    tags: ['Moderno', 'Bold', 'Light'],
    layoutStyle: 'featured',
    fontFamily: 'sans',
    mockProducts: [{ name: 'Smash Duplo Bacon', price: 'R$ 38,90' }, { name: 'Fritas Rústicas M', price: 'R$ 15,00' }],
    phoneBg: '#fff8f2',
    phoneCard: '#fff3e8',
    phoneText: '#1a0a00',
    phoneSubText: '#7c5c40',
    phoneAccent: '#f97316',
    phoneBorderRadius: '14px',
    cardGradient: 'from-orange-400 to-red-500',
  },
  {
    id: 'tokyo-dark',
    name: 'Tokyo Sushi',
    category: 'Japonesa & Asiática',
    emoji: '🍣',
    description: 'Dark mode, tipografia elegante e minimalismo japonês',
    tags: ['Dark', 'Elegante', 'Minimalista'],
    layoutStyle: 'grid',
    fontFamily: 'sans',
    mockProducts: [{ name: 'Barca Premium 50 Peças', price: 'R$ 149,90' }, { name: 'Uramaki Filadélfia', price: 'R$ 32,00' }],
    phoneBg: '#080810',
    phoneCard: '#12121e',
    phoneText: '#e8e8f0',
    phoneSubText: '#8080a0',
    phoneAccent: '#00d4ff',
    phoneBorderRadius: '4px',
    cardGradient: 'from-slate-800 to-indigo-950',
  },
  {
    id: 'napoli-warm',
    name: 'Napoli Pizza',
    category: 'Pizzarias & Italianas',
    emoji: '🍕',
    description: 'Terracota, autenticidade artesanal e calor italiano',
    tags: ['Quente', 'Rústico', 'Artesanal'],
    layoutStyle: 'list',
    fontFamily: 'serif',
    mockProducts: [{ name: 'Pizza Margherita Artesanal', price: 'R$ 65,00' }, { name: 'Calzone de Peperoni', price: 'R$ 45,00' }],
    phoneBg: '#fdf6ee',
    phoneCard: '#f2e4d0',
    phoneText: '#2c1810',
    phoneSubText: '#8b5a3a',
    phoneAccent: '#c0392b',
    phoneBorderRadius: '8px',
    cardGradient: 'from-amber-600 to-red-800',
  },
  {
    id: 'tropical-fresh',
    name: 'Tropical Açaí',
    category: 'Açaiterias & Healthy',
    emoji: '🫐',
    description: 'Gradientes vibrantes e energia tropical',
    tags: ['Vibrante', 'Gradiente', 'Dark'],
    layoutStyle: 'featured',
    fontFamily: 'rounded',
    mockProducts: [{ name: 'Copo 500ml Tudo Dentro', price: 'R$ 25,00' }, { name: 'Tigela Fit', price: 'R$ 22,00' }],
    phoneBg: '#120625',
    phoneCard: '#1e0a40',
    phoneText: '#f0e0ff',
    phoneSubText: '#c084fc',
    phoneAccent: '#a855f7',
    phoneBorderRadius: '24px',
    phoneIsGradient: true,
    cardGradient: 'from-purple-600 to-pink-600',
  },
  {
    id: 'brazil-bbq',
    name: 'Churrasco Brasil',
    category: 'Churrascarias',
    emoji: '🥩',
    description: 'Brasa, grelha e o sabor marcante do churrasco',
    tags: ['Dark', 'Intenso', 'Premium'],
    layoutStyle: 'list',
    fontFamily: 'sans',
    mockProducts: [{ name: 'Picanha na Brasa (500g)', price: 'R$ 119,90' }, { name: 'Misto Quente', price: 'R$ 89,90' }],
    phoneBg: '#0c0806',
    phoneCard: '#1a1008',
    phoneText: '#f5deb3',
    phoneSubText: '#a07850',
    phoneAccent: '#e25822',
    phoneBorderRadius: '6px',
    cardGradient: 'from-red-900 to-stone-900',
  },
  {
    id: 'cafe-premium',
    name: 'Café Premium',
    category: 'Cafeterias & Padarias',
    emoji: '☕',
    description: 'Tons de café, tipografia clean e sofisticação',
    tags: ['Clean', 'Sofisticado', 'Light'],
    layoutStyle: 'list',
    fontFamily: 'serif',
    mockProducts: [{ name: 'Cappuccino Italiano', price: 'R$ 14,00' }, { name: 'Croissant Recheado', price: 'R$ 12,50' }],
    phoneBg: '#f9f5f0',
    phoneCard: '#ede5d8',
    phoneText: '#2c1a0e',
    phoneSubText: '#8b6a4a',
    phoneAccent: '#6b4226',
    phoneBorderRadius: '12px',
    cardGradient: 'from-amber-900 to-yellow-800',
  },
]

export const DEFAULT_THEME = THEMES[0]

export function getTheme(themeId: string | null | undefined): Theme {
  return THEMES.find(t => t.id === themeId) ?? DEFAULT_THEME
}
