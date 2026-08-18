import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import './AuthModal.css'

export type AuthMode = 'login' | 'signup'
export type AuthIntent = 'create' | 'hub' | 'settings' | 'account'

type AuthModalProps = {
  open: boolean
  mode: AuthMode
  intent?: AuthIntent
  onModeChange: (mode: AuthMode) => void
  onClose: () => void
  onSubmit: (email: string) => void
}

function intentCopy(intent: AuthIntent | undefined, mode: AuthMode): string {
  if (mode === 'login') return 'Welcome back. Pick up your hub, custom games, and settings.'
  if (intent === 'create') return 'Create a free account to build and save custom games.'
  if (intent === 'hub') return 'Sign up to pin variants to My hub.'
  if (intent === 'settings') return 'Sign in to keep appearance and play preferences with your account.'
  return 'Sign up to save a personal hub, create custom games, and keep your settings.'
}

export function AuthModal({ open, mode, intent, onModeChange, onClose, onSubmit }: AuthModalProps) {
  const titleId = useId()
  const emailId = useId()
  const passwordId = useId()
  const emailRef = useRef<HTMLInputElement>(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setEmail('')
    setPassword('')
    setError(null)
    const t = window.setTimeout(() => emailRef.current?.focus(), 0)
    return () => window.clearTimeout(t)
  }, [open, mode])

  if (!open) return null

  const isSignup = mode === 'signup'
  const title = isSignup ? 'Create your account' : 'Log in'

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const trimmed = email.trim()
    if (!trimmed.includes('@') || trimmed.length < 3) {
      setError('Enter a valid email address.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    onSubmit(trimmed)
  }

  return (
    <div className="auth-modal-root" role="presentation">
      <button type="button" className="auth-modal-backdrop" aria-label="Close" onClick={onClose} />
      <div className="auth-modal-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId}>
        <h2 id={titleId} className="auth-modal-title">
          {title}
        </h2>
        <p className="auth-modal-lead">{intentCopy(intent, mode)}</p>
        <form className="auth-modal-form" onSubmit={handleSubmit}>
          <label className="auth-modal-label" htmlFor={emailId}>
            Email
          </label>
          <input
            ref={emailRef}
            id={emailId}
            className="auth-modal-input"
            type="email"
            name="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <label className="auth-modal-label" htmlFor={passwordId}>
            Password
          </label>
          <input
            id={passwordId}
            className="auth-modal-input"
            type="password"
            name="password"
            autoComplete={isSignup ? 'new-password' : 'current-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={6}
            required
          />
          {error != null && <p className="auth-modal-err">{error}</p>}
          <p className="auth-modal-hint">Accounts stay on this device for now.</p>
          <div className="auth-modal-actions">
            <button type="button" className="auth-modal-btn auth-modal-btn--ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="auth-modal-btn auth-modal-btn--primary">
              {isSignup ? 'Sign up' : 'Log in'}
            </button>
          </div>
        </form>
        <p className="auth-modal-switch">
          {isSignup ? (
            <>
              Already have an account?{' '}
              <button type="button" className="auth-modal-text-btn" onClick={() => onModeChange('login')}>
                Log in
              </button>
            </>
          ) : (
            <>
              New here?{' '}
              <button type="button" className="auth-modal-text-btn" onClick={() => onModeChange('signup')}>
                Sign up
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  )
}
