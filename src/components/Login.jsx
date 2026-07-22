import { useState } from 'react'
import { dbLogin, dbGetTenant, dbGetUserInfo } from '../lib/supabase'
import { useApp } from '../lib/AppContext'

export default function Login() {
  const { setUser, setTenantId, setUserRoles } = useApp()
  const [email, setEmail] = useState('superadmin@stackhard.com')
  const [password, setPassword] = useState('StackHard2026!')
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
      } else if (userInfo && (userInfo.role === 'owner' || userInfo.role === 'super_admin')) {
        setUserRoles([userInfo.role])
      }
      
      setUser(data.user)
      const tenant = await dbGetTenant()
      if (tenant) setTenantId(tenant.id)
    } catch (e) {
      setError(e.message || 'Error al iniciar sesión')
      setLoading(false)
    }
  }

  return (
    <div className="login-screen">
      <div className="login-box">
        <div className="login-logo">
          <span className="logo-icon">🍽️</span>
          <h1>StackHard POS</h1>
          <p>Sistema de Gestión Gastronómica</p>
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
