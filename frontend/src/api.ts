export interface StockLevel {
  size: string
  quantity: number
}

export interface Product {
  product_id: string
  name: string
  garment_type: string
  description: string
  colors: string[]
  search_tags: string[]
  image_url: string
  price: number
  inventory?: StockLevel[]
  category?: string
  available_sizes?: string[]
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(res.status === 404 ? 'not-found' : `Request failed (${res.status})`)
  return res.json() as Promise<T>
}

export interface PublicUser {
  id: number
  first_name: string
  last_name: string
  email: string
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(data?.detail || `Request failed (${res.status})`)
  return data as T
}

export const signup = (body: {
  first_name: string
  last_name: string
  email: string
  password: string
}) => postJson<PublicUser>('/api/auth/signup', body)

export const login = (body: { email: string; password: string }) =>
  postJson<PublicUser>('/api/auth/login', body)

export interface ChatMessageIn {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatResponse {
  message: string
  products: Product[]
  all_products: Product[]
}

export interface StoredChatMessage {
  role: 'user' | 'assistant'
  content: string
  products: Product[]
  created_at: string
}

export interface ChatOptions {
  userId?: number | null
  productId?: string | null
}

export const sendChat = (message: string, history: ChatMessageIn[], opts: ChatOptions = {}) =>
  postJson<ChatResponse>('/api/chat', {
    message,
    history,
    user_id: opts.userId ?? null,
    page: opts.productId ? { product_id: opts.productId } : null,
  })

export const fetchChatHistory = (userId: number) =>
  getJson<StoredChatMessage[]>(`/api/chat/history?user_id=${userId}`)

export const fetchProducts = () => getJson<Product[]>('/api/products')
export const fetchProduct = (id: string) =>
  getJson<Product>(`/api/products/${encodeURIComponent(id)}`)

export const formatPrice = (price: number) =>
  price.toLocaleString('en-US', { style: 'currency', currency: 'USD' })

/** First sentence of the description, capped for product cards. */
export function shortDescription(text: string, max = 110): string {
  const first = text.split(/(?<=\.)\s/)[0]
  return first.length <= max ? first : first.slice(0, max).replace(/\s+\S*$/, '') + '…'
}
