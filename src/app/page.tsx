import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, UtensilsCrossed, MonitorSmartphone, TrendingUp, ShieldCheck } from 'lucide-react'

export const metadata = {
  title: 'StackHard | Sistema para Restaurantes y Cafeterías',
  description: 'El sistema todo en uno más avanzado para gestionar tu restaurante.',
}

export default function LandingPage() {
  const features = [
    {
      title: 'POS Inteligente',
      desc: 'Punto de venta súper rápido optimizado para pantallas táctiles, ideal para meseros y cajeros.',
      icon: MonitorSmartphone,
    },
    {
      title: 'Pantalla de Cocina (KDS)',
      desc: 'Sincronización en tiempo real con la cocina. Alarmas visuales para pedidos demorados.',
      icon: UtensilsCrossed,
    },
    {
      title: 'Reportes y Finanzas',
      desc: 'Controla el flujo de caja, cierres de turno y obtén analíticas de tus platos más vendidos.',
      icon: TrendingUp,
    },
    {
      title: 'Múltiples Roles',
      desc: 'Asigna roles a tu equipo (Mesero, Cajero, Cocina, Delivery, Admin) con permisos exactos.',
      icon: ShieldCheck,
    },
  ]

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-base)' }}>
      {/* Navigation */}
      <nav className="h-20 flex items-center justify-between px-6 md:px-12 w-full max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="StackHard" width={140} height={46} className="object-contain" />
        </div>
        <div>
          <Link href="/login" className="btn btn-primary" style={{ padding: '0.6rem 1.5rem', borderRadius: '50px' }}>
            Iniciar Sesión
          </Link>
        </div>
      </nav>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative px-6 pt-24 pb-32 md:pt-32 md:pb-48 text-center max-w-5xl mx-auto">
          <div className="absolute inset-0 pointer-events-none flex justify-center -z-10">
             <div className="w-[600px] h-[600px] rounded-full blur-[120px] opacity-20" style={{ background: 'var(--brand-orange)' }} />
          </div>

          <span 
            className="inline-block px-4 py-1.5 mb-6 text-sm font-bold tracking-widest rounded-full"
            style={{ background: 'var(--bg-elevated)', color: 'var(--brand-orange)', border: '1px solid var(--border-subtle)' }}
          >
            NUEVA PLATAFORMA 2026
          </span>

          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-8" style={{ color: 'var(--text-primary)', lineHeight: 1.1 }}>
            La evolución digital de tu <br className="hidden md:block"/>
            <span className="gradient-text">restaurante o cafetería</span>
          </h1>

          <p className="text-lg md:text-xl mb-12 max-w-2xl mx-auto" style={{ color: 'var(--text-secondary)' }}>
            StackHard es el sistema todo en uno diseñado para simplificar tus operaciones. Desde la toma de pedidos hasta la entrega final y el cierre de caja.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/login" className="btn btn-primary btn-lg rounded-full px-8 h-14 text-base w-full sm:w-auto">
              Probar Sistema <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </div>
        </section>

        {/* Features Preview */}
        <section className="px-6 py-24" style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border-subtle)' }}>
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                Todo lo que necesitas para operar
              </h2>
              <p style={{ color: 'var(--text-secondary)' }}>
                Módulos integrados de forma nativa para que no tengas que usar múltiples herramientas.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, i) => (
                <div key={i} className="card hover:-translate-y-2 transition-transform duration-300">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6" style={{ background: 'var(--brand-orange-glow)', color: 'var(--brand-orange)' }}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
                    {feature.title}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center" style={{ borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-base)' }}>
        <div className="flex justify-center mb-4">
           <Image src="/logo.png" alt="StackHard" width={100} height={32} className="object-contain opacity-50 grayscale hover:grayscale-0 hover:opacity-100 transition-all" />
        </div>
        <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>
          © {new Date().getFullYear()} StackHard. Todos los derechos reservados.
        </p>
      </footer>
    </div>
  )
}
