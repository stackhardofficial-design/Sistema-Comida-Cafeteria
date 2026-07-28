import { useState } from 'react'
import { dbLogout } from '../../lib/supabase'
import { useApp } from '../../lib/AppContext'
import { Sun, Moon, LogOut, ArrowLeft } from 'lucide-react'

export default function ConfiguracionModule() {
  const { setCurrentModule, isDark, toggleTheme } = useApp()
  const [loading, setLoading] = useState(false)

  async function handleLogout() {
    setLoading(true)
    try {
      await dbLogout()
    } catch (e) {
      console.warn('Logout warning:', e.message)
    }
    window.location.href = '/'
  }

  return (
    <div style={{ padding: 24, maxWidth: 600, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button
          onClick={() => setCurrentModule('mesas')}
          style={{
            background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-primary)',
            padding: '8px 12px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6
          }}
        >
          <ArrowLeft size={18} /> Volver
        </button>
        <h2 style={{ margin: 0, fontSize: 22 }}>Configuración</h2>
      </div>

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden' }}>
        <button
          onClick={toggleTheme}
          style={{
            width: '100%', padding: '16px 20px', background: 'transparent', border: 'none',
            color: 'var(--text-primary)', fontSize: 16, cursor: 'pointer', display: 'flex',
            alignItems: 'center', gap: 12, borderBottom: '1px solid var(--border)'
          }}
        >
          <span style={{
            width: 36, height: 36, borderRadius: '50%', background: 'var(--surface-2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)'
          }}>
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </span>
          <span style={{ fontWeight: 600 }}>Cambiar Tema</span>
          <span style={{ marginLeft: 'auto', color: 'var(--text-secondary)', fontSize: 13 }}>
            {isDark ? 'Oscuro' : 'Claro'}
          </span>
        </button>

        <button
          onClick={handleLogout}
          disabled={loading}
          style={{
            width: '100%', padding: '16px 20px', background: 'transparent', border: 'none',
            color: '#ef4444', fontSize: 16, cursor: 'pointer', display: 'flex',
            alignItems: 'center', gap: 12
          }}
        >
          <span style={{
            width: 36, height: 36, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444'
          }}>
            <LogOut size={18} />
          </span>
          <span style={{ fontWeight: 600 }}>{loading ? 'Cerrando...' : 'Cerrar Sesión'}</span>
        </button>
      </div>
    </div>
  )
}
