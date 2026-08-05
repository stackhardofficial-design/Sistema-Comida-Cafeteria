import { useState, useEffect } from 'react'
import { dbLogout } from '../../lib/supabase'
import { useApp } from '../../lib/AppContext'
import { Sun, Moon, LogOut, ArrowLeft, Printer } from 'lucide-react'

export default function ConfiguracionModule() {
  const { setCurrentModule, isDark, toggleTheme } = useApp()
  const [loading, setLoading] = useState(false)
  const [activePreview, setActivePreview] = useState('cocina')
  const [kitchenHtml, setKitchenHtml] = useState('')
  const [chargeHtml, setChargeHtml] = useState('')
  const [printerWidth, setPrinterWidth] = useState(localStorage.getItem('printer_width') || '58mm')
  const [printerEnabled, setPrinterEnabled] = useState(localStorage.getItem('printer_enabled') === 'true')
  const [printerShowTip, setPrinterShowTip] = useState(localStorage.getItem('printer_show_tip') !== 'false')
  const [printerTipPercent, setPrinterTipPercent] = useState(localStorage.getItem('printer_tip_percent') || '10')

  useEffect(() => {
    import('../../lib/printer.js').then(({ getKitchenTicketHtml, getChargeTicketHtml }) => {
      const dummyOrder = { orderId: 1234, type: 'mesa', tableName: 'Mesa 4' }
      const dummyItems = [
        { qty: 2, product: { name: 'Hamburguesa Doble', price: 8500 }, notes: 'Sin cebolla' },
        { qty: 1, product: { name: 'Papas Fritas Grandes', price: 3000 } }
      ]
      const dummyTotals = { subtotal: 20000, discountAmount: 2000, grandTotal: 18000 }
      
      setKitchenHtml(getKitchenTicketHtml(dummyOrder, dummyItems))
      setChargeHtml(getChargeTicketHtml(dummyOrder, dummyItems, dummyTotals, []))
    })
  }, [printerWidth, printerEnabled, printerShowTip, printerTipPercent])

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

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, overflow: 'hidden', marginBottom: 24 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
          <h3 style={{ margin: 0, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>🖨️</span> Configuración de Impresora Local
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-secondary)' }}>
            Ajustes exclusivos para esta computadora/navegador.
          </p>
        </div>
        
        <div style={{ padding: '20px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          <div style={{ flex: '1 1 250px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', marginBottom: 16 }}>
              <input 
                type="checkbox" 
                checked={printerEnabled}
                onChange={(e) => {
                  const checked = e.target.checked
                  localStorage.setItem('printer_enabled', checked ? 'true' : 'false')
                  setPrinterEnabled(checked)
                  window.dispatchEvent(new Event('storage'))
                }}
                style={{ width: 18, height: 18 }}
              />
              <div>
                <div style={{ fontWeight: 600 }}>Habilitar impresión automática en esta PC</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Si está activo, esta PC imprimirá tickets de cocina y cobro que lleguen por red.</div>
              </div>
            </label>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>Tamaño de papel</div>
              <select 
                value={printerWidth}
                onChange={(e) => {
                  const w = e.target.value
                  localStorage.setItem('printer_width', w)
                  setPrinterWidth(w)
                  window.dispatchEvent(new Event('storage'))
                }}
                style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text-primary)', outline: 'none', width: '100%' }}
              >
                <option value="58mm">58mm (Impresoras chicas)</option>
                <option value="80mm">80mm (Impresoras estándar)</option>
              </select>
            </div>

            <div style={{ background: 'var(--bg)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: 20 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', marginBottom: printerShowTip ? 12 : 0 }}>
                <input 
                  type="checkbox" 
                  checked={printerShowTip}
                  onChange={(e) => {
                    const checked = e.target.checked
                    localStorage.setItem('printer_show_tip', checked ? 'true' : 'false')
                    setPrinterShowTip(checked)
                    window.dispatchEvent(new Event('storage'))
                  }}
                  style={{ width: 16, height: 16 }}
                />
                <span style={{ fontWeight: 600, fontSize: 14 }}>Mostrar propina sugerida en ticket</span>
              </label>

              {printerShowTip && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Porcentaje:</span>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={printerTipPercent}
                    onChange={(e) => {
                      const val = e.target.value
                      localStorage.setItem('printer_tip_percent', val)
                      setPrinterTipPercent(val)
                      window.dispatchEvent(new Event('storage'))
                    }}
                    style={{ width: '60px', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)', textAlign: 'center' }}
                  />
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>%</span>
                </div>
              )}
            </div>

            <button
              onClick={async () => {
                const { printTestTicket } = await import('../../lib/printer.js')
                printTestTicket()
              }}
              style={{ padding: '10px 16px', width: '100%', background: 'var(--accent)', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            >
              <Printer size={16} /> Imprimir Ticket de Prueba
            </button>
          </div>

          {/* PREVIEW PANEL */}
          <div style={{ flex: '1 1 250px', background: 'var(--bg)', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12 }}>MODELOS DE TICKET</div>
            
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <button 
                onClick={() => setActivePreview('cocina')}
                style={{ padding: '4px 12px', borderRadius: 16, border: 'none', background: activePreview === 'cocina' ? 'var(--accent)' : 'var(--surface)', color: activePreview === 'cocina' ? 'white' : 'var(--text-secondary)', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}
              >
                Cocina
              </button>
              <button 
                onClick={() => setActivePreview('cobro')}
                style={{ padding: '4px 12px', borderRadius: 16, border: 'none', background: activePreview === 'cobro' ? 'var(--accent)' : 'var(--surface)', color: activePreview === 'cobro' ? 'white' : 'var(--text-secondary)', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}
              >
                Cobro (Mesas/Mostrador)
              </button>
            </div>

            <div style={{ background: 'white', padding: '10px', borderRadius: '4px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
              <iframe 
                srcDoc={activePreview === 'cocina' ? kitchenHtml : chargeHtml} 
                style={{ 
                  width: printerWidth === '58mm' ? '220px' : '300px', 
                  height: '400px', 
                  border: 'none', 
                  background: 'white',
                  pointerEvents: 'none'
                }} 
              />
            </div>
          </div>
        </div>
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
