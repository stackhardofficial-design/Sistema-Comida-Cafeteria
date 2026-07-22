import { useState } from 'react'
import { dbLogin, dbGetTenant, dbGetUserInfo } from '../lib/supabase'
import { useApp } from '../lib/AppContext'

import { Database } from 'lucide-react'

export default function Login() {
  const { setUser, setTenantId, setUserRoles, setCurrentModule } = useApp()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleLogin(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { data, error: err } = await dbLogin(email, password)
      if (err) throw err
      
      const userInfo = await dbGetUserInfo(data.user.id)
      if (userInfo && userInfo.roles && userInfo.roles.length > 0) {
        setUserRoles(userInfo.roles)
      } else if (userInfo && (userInfo.role === 'owner' || userInfo.role === 'super_admin' || userInfo.role === 'admin')) {
        setUserRoles([userInfo.role])
      }
      
      setUser(data.user)
      const tenant = await dbGetTenant(userInfo?.tenant_id)
      if (tenant) setTenantId(tenant.id)

      if (data.user.email === 'superadmin@stackhard.com') {
        setCurrentModule('superadmin')
      }
    } catch (e) {
      setError(e.message || 'Error al iniciar sesión')
      setLoading(false)
    }
  }

  return (
    <div className="login-screen" style={{ background: 'var(--bg)' }}>
      <div className="login-box" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-lg)' }}>
        <div className="login-logo" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '32px' }}>
          <img src={!document.body.classList.contains('light-mode') ? "/logo-dark.jpg" : "/logo-light.jpg"} alt="StackHard" style={{ width: '80px', height: '80px', borderRadius: '16px', objectFit: 'cover', marginBottom: '16px' }} />
          <h1 style={{ fontSize: '32px', fontWeight: '900', letterSpacing: '-1px', margin: '0 0 8px 0' }}>
            <span style={{ color: 'var(--text-secondary)' }}>Stack</span><span style={{ color: 'var(--accent)' }}>Hard</span>
          </h1>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'center', margin: 0 }}>
            INGENIERÍA DE SISTEMAS &<br/>ARQUITECTURA DE SOFTWARE
          </p>
        </div>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label>Usuario</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="email@ejemplo.com" required />
          </div>
          <div className="form-group">
            <label>Contraseña</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
          </div>
          {error && <div className="login-error">{error}</div>}
          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? 'Iniciando...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  )
}
