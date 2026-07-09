'use client'

import { useActionState } from 'react'
import { loginUser } from '@/infrastructure/supabase/auth/actions'
import { Mail, Lock, LogIn, Loader2, AlertCircle } from 'lucide-react'

const initialState = { error: '' }

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(loginUser, initialState)

  return (
    <form action={formAction} className="space-y-5">
      {/* Email */}
      <div className="form-group">
        <label htmlFor="email" className="form-label">
          Correo electrónico
        </label>
        <div className="relative">
          <Mail
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
            style={{ color: 'var(--text-muted)' }}
          />
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            placeholder="tu@email.com"
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Password */}
      <div className="form-group">
        <label htmlFor="password" className="form-label">
          Contraseña
        </label>
        <div className="relative">
          <Lock
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 pointer-events-none"
            style={{ color: 'var(--text-muted)' }}
          />
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            className="input-field pl-10"
          />
        </div>
      </div>

      {/* Error */}
      {state?.error && (
        <div className="alert alert-error animate-slide-up">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>{state.error}</span>
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={pending}
        className="btn btn-primary btn-lg w-full mt-6"
        style={{ fontSize: '0.9375rem' }}
      >
        {pending ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin-custom" />
            Iniciando sesión...
          </>
        ) : (
          <>
            <LogIn className="h-5 w-5" />
            Iniciar Sesión
          </>
        )}
      </button>
    </form>
  )
}
