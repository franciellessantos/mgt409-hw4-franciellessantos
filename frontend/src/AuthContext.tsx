import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { PublicUser } from './api'

interface Auth {
  user: PublicUser | null
  login: (user: PublicUser) => void
  logout: () => void
}

const AuthCtx = createContext<Auth | null>(null)
const STORAGE_KEY = 'campus_customs_user'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<PublicUser | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? (JSON.parse(raw) as PublicUser) : null
    } catch {
      return null
    }
  })

  useEffect(() => {
    if (user) localStorage.setItem(STORAGE_KEY, JSON.stringify(user))
    else localStorage.removeItem(STORAGE_KEY)
  }, [user])

  const value = useMemo<Auth>(
    () => ({ user, login: setUser, logout: () => setUser(null) }),
    [user],
  )

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>
}

export function useAuth(): Auth {
  const ctx = useContext(AuthCtx)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
