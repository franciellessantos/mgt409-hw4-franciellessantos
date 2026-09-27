import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { LogIn, UserPlus } from 'lucide-react'
import { login, signup } from '../api'
import { useAuth } from '../AuthContext'

type Mode = 'login' | 'signup'

/** Combined Log In / Create Account page with a single toggle. */
export default function Auth() {
  const navigate = useNavigate()
  const location = useLocation()
  const { login: saveAuth } = useAuth()
  const [mode, setMode] = useState<Mode>(location.pathname === '/signup' ? 'signup' : 'login')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  function switchMode(next: Mode) {
    setMode(next)
    setError('')
    setNotice('')
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    setNotice('')
    const form = new FormData(e.currentTarget)
    setBusy(true)
    try {
      if (mode === 'login') {
        const user = await login({
          email: String(form.get('email')),
          password: String(form.get('password')),
        })
        saveAuth(user)
        setNotice(`Welcome back, ${user.first_name || user.email}! Redirecting…`)
        setTimeout(() => navigate('/'), 900)
      } else {
        const user = await signup({
          first_name: String(form.get('first_name')),
          last_name: String(form.get('last_name')),
          email: String(form.get('email')),
          password: String(form.get('password')),
        })
        saveAuth(user)
        setNotice(`Welcome to the pack, ${user.first_name}! Redirecting…`)
        setTimeout(() => navigate('/'), 1000)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="auth auth-hero">
      <div className="auth-card">
        <div className="auth-tabs" role="tablist" aria-label="Log in or create account">
          <button
            role="tab"
            aria-selected={mode === 'login'}
            className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
            onClick={() => switchMode('login')}
          >
            <LogIn size={18} aria-hidden="true" /> Log In
          </button>
          <button
            role="tab"
            aria-selected={mode === 'signup'}
            className={`auth-tab ${mode === 'signup' ? 'active' : ''}`}
            onClick={() => switchMode('signup')}
          >
            <UserPlus size={18} aria-hidden="true" /> Create Account
          </button>
        </div>

        {mode === 'login' ? (
          <>
            <h1>Welcome Back</h1>
            <p className="muted">Log in to chat with Handsome Dan and pick up where you left off.</p>
          </>
        ) : (
          <>
            <h1>Join the Pack</h1>
            <p className="muted">Create your Campus Customs account. Students, parents, and fans welcome.</p>
          </>
        )}

        <form onSubmit={handleSubmit}>
          {mode === 'signup' && (
            <div className="form-row">
              <label>
                First name
                <input name="first_name" autoComplete="given-name" required />
              </label>
              <label>
                Last name
                <input name="last_name" autoComplete="family-name" required />
              </label>
            </div>
          )}
          <label>
            Email
            <input type="email" name="email" autoComplete="email" required />
          </label>
          <label>
            Password
            <input
              type="password"
              name="password"
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              minLength={mode === 'signup' ? 8 : undefined}
              required
            />
            {mode === 'signup' && <span className="field-hint">At least 8 characters.</span>}
          </label>
          <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
            {busy
              ? mode === 'login' ? 'Logging in…' : 'Creating account…'
              : mode === 'login' ? 'Log In' : 'Create Account'}
          </button>
          {error && <p className="error" role="alert">{error}</p>}
          {notice && <p className="notice" role="status">{notice}</p>}
        </form>

        {mode === 'login' ? (
          <p className="muted">
            New here?{' '}
            <button className="link-inline" onClick={() => switchMode('signup')}>Create an account</button>
          </p>
        ) : (
          <p className="muted">
            Already a member?{' '}
            <button className="link-inline" onClick={() => switchMode('login')}>Log in</button>
          </p>
        )}
      </div>
    </section>
  )
}
