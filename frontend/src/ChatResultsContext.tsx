import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'
import type { Product } from './api'

interface ChatResults {
  /** Products the agent matched to the customer's latest chat question. */
  results: Product[]
  /** Label describing what the customer asked (for the results banner). */
  query: string
  setResults: (products: Product[], query: string) => void
  clear: () => void
}

const ChatResultsCtx = createContext<ChatResults | null>(null)

export function ChatResultsProvider({ children }: { children: ReactNode }) {
  const [results, setResultsState] = useState<Product[]>([])
  const [query, setQuery] = useState('')

  const value = useMemo<ChatResults>(
    () => ({
      results,
      query,
      setResults: (products, q) => {
        setResultsState(products)
        setQuery(q)
      },
      clear: () => {
        setResultsState([])
        setQuery('')
      },
    }),
    [results, query],
  )

  return <ChatResultsCtx.Provider value={value}>{children}</ChatResultsCtx.Provider>
}

export function useChatResults(): ChatResults {
  const ctx = useContext(ChatResultsCtx)
  if (!ctx) throw new Error('useChatResults must be used within ChatResultsProvider')
  return ctx
}
