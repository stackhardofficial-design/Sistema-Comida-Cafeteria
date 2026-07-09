import { Metadata } from 'next'
import Image from 'next/image'
import LoginForm from './login-form'

export const metadata: Metadata = {
  title: 'Iniciar Sesión',
  description: 'Accede al sistema de gestión de tu restaurante.',
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex" style={{ background: 'var(--bg-base)' }}>
      {/* Left: Decorative Panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-5/12 p-12 relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, #0f1117 0%, #1a1420 50%, #0f1117 100%)',
          borderRight: '1px solid var(--border-subtle)',
        }}
      >
        {/* Background decoration */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(229,107,37,0.15) 0%, transparent 60%)',
          }}
        />
        <div
          className="absolute bottom-0 left-0 right-0 h-64 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 80% 80% at 50% 120%, rgba(229,107,37,0.1) 0%, transparent 70%)',
          }}
        />

        {/* Logo */}
        <div className="relative z-10">
          <Image src="/logo.png" alt="Logo" width={160} height={52} className="object-contain" priority />
        </div>

        {/* Headline */}
        <div className="relative z-10 space-y-6">
          <div className="space-y-3">
            <h1 className="text-4xl font-black tracking-tight" style={{ color: 'var(--text-primary)', lineHeight: 1.1 }}>
              Gestiona tu{' '}
              <span className="gradient-text">restaurante</span>
              <br />
              en tiempo real
            </h1>
            <p className="text-base" style={{ color: 'var(--text-secondary)' }}>
              Sistema completo para dueños, meseros, cocina y delivery. Todo en un solo lugar.
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2">
            {[
              '⚡ Pedidos en Tiempo Real',
              '🍳 KDS para Cocina',
              '🛵 Módulo Delivery',
              '📊 Reportes y Caja',
            ].map((f) => (
              <span
                key={f}
                className="text-xs font-medium px-3 py-1.5 rounded-full"
                style={{
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-secondary)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <p className="relative z-10 text-xs" style={{ color: 'var(--text-muted)' }}>
          Desarrollado por{' '}
          <span style={{ color: 'var(--brand-orange)' }} className="font-medium">
            StackHard
          </span>
        </p>
      </div>

      {/* Right: Login Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12">
        {/* Mobile logo */}
        <div className="lg:hidden mb-10">
          <Image src="/logo.png" alt="Logo" width={140} height={46} className="object-contain" />
        </div>

        <div
          className="w-full max-w-md space-y-8 animate-slide-up"
        >
          {/* Header */}
          <div className="text-center lg:text-left">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
              Bienvenido de vuelta
            </h2>
            <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
              Ingresa con tus credenciales para acceder al sistema
            </p>
          </div>

          {/* Form Card */}
          <div
            className="p-8 rounded-2xl"
            style={{
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-subtle)',
              boxShadow: 'var(--shadow-md)',
            }}
          >
            <LoginForm />
          </div>

          <p className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
            ¿Problemas para ingresar? Contacta a tu administrador.
          </p>
        </div>
      </div>
    </div>
  )
}
