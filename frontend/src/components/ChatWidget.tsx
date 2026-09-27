import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Send, X } from 'lucide-react'
import Bulldog from './Bulldog'
import { fetchChatHistory, sendChat, formatPrice, type Product } from '../api'
import { useChatResults } from '../ChatResultsContext'
import { useAuth } from '../AuthContext'

interface Message {
  role: 'user' | 'assistant'
  content: string
  products?: Product[]
}

const WELCOME: Message = {
  role: 'assistant',
  content:
    "Woof! I'm Handsome Dan, your Campus Customs guide. Ask me about hoodies, sizes, prices, or what's in stock.",
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([WELCOME])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const listRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const location = useLocation()
  const { setResults } = useChatResults()
  const { user } = useAuth()
  const [historyLoadedFor, setHistoryLoadedFor] = useState<number | null>(null)

  // Current product page (if the customer is on /products/:id), so the agent can
  // resolve vague questions ("what sizes?") to the product being viewed.
  const productMatch = location.pathname.match(/^\/products\/(.+)$/)
  const currentProductId = productMatch ? decodeURIComponent(productMatch[1]) : null

  // Reload a logged-in customer's saved conversation when they return.
  useEffect(() => {
    if (user && historyLoadedFor !== user.id) {
      fetchChatHistory(user.id)
        .then((stored) => {
          const restored: Message[] = stored.map((m) => ({
            role: m.role,
            content: m.content,
            products: m.products,
          }))
          setMessages(restored.length > 0 ? [WELCOME, ...restored] : [WELCOME])
          setHistoryLoadedFor(user.id)
        })
        .catch(() => setHistoryLoadedFor(user.id))
    }
    if (!user && historyLoadedFor !== null) {
      // Logged out: reset to a fresh guest conversation.
      setMessages([WELCOME])
      setHistoryLoadedFor(null)
    }
  }, [user, historyLoadedFor])

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight })
  }, [messages, open, busy])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const text = input.trim()
    if (!text || busy) return
    setInput('')

    const history = messages
      .filter((m) => m !== WELCOME)
      .map((m) => ({ role: m.role, content: m.content }))
    const next = [...messages, { role: 'user' as const, content: text }]
    setMessages(next)
    setBusy(true)
    try {
      const reply = await sendChat(text, history, {
        userId: user?.id ?? null,
        productId: currentProductId,
      })
      // Chat bubble shows only the top matches (reply.products, up to 4).
      setMessages((m) => [...m, { role: 'assistant', content: reply.message, products: reply.products }])
      // The Products page shows ALL matches (reply.all_products), so every
      // hoodie/tee/etc. is listed — not just the 4 shown in chat.
      const pageProducts = reply.all_products.length ? reply.all_products : reply.products
      if (pageProducts.length > 0) {
        setResults(pageProducts, text)
        navigate('/products')
      }
    } catch (err) {
      setMessages((m) => [
        ...m,
        {
          role: 'assistant',
          content: err instanceof Error ? err.message : "Sorry, I couldn't reach the kennel just now.",
        },
      ])
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="chat">
      {open && (
        <section className="chat-panel" role="dialog" aria-label="Chat with Handsome Dan">
          <header className="chat-header">
            <Bulldog size={40} />
            <div>
              <p className="chat-title">Handsome Dan</p>
              <p className="chat-subtitle">Campus Customs assistant</p>
            </div>
            <button className="chat-close" onClick={() => setOpen(false)} aria-label="Close chat">
              <X size={20} />
            </button>
          </header>
          <div className="chat-messages" ref={listRef} aria-live="polite">
            {messages.map((m, i) => (
              <div key={i} className={`chat-row ${m.role}`}>
                <p className={`chat-bubble ${m.role}`}>{m.content}</p>
                {m.products && m.products.length > 0 && (
                  <div className="chat-cards">
                    {m.products.map((p) => (
                      <Link
                        key={p.product_id}
                        to={`/products/${p.product_id}`}
                        className="chat-card"
                        onClick={() => setOpen(false)}
                      >
                        <img src={p.image_url} alt={p.name} loading="lazy" />
                        <span className="chat-card-name">{p.name}</span>
                        <span className="chat-card-price">{formatPrice(p.price)}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {busy && <p className="chat-bubble assistant typing">Handsome Dan is sniffing around…</p>}
          </div>
          <form className="chat-form" onSubmit={handleSubmit}>
            <label htmlFor="chat-input" className="sr-only">Message</label>
            <input
              id="chat-input"
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about a product…"
              autoComplete="off"
              disabled={busy}
            />
            <button type="submit" aria-label="Send message" disabled={!input.trim() || busy}>
              <Send size={18} />
            </button>
          </form>
        </section>
      )}
      <button
        className="chat-launcher"
        onClick={() => setOpen(!open)}
        aria-label={open ? 'Close chat' : 'Chat with Handsome Dan'}
        aria-expanded={open}
      >
        <Bulldog size={52} />
      </button>
    </div>
  )
}
