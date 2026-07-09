import { Loader2 } from 'lucide-react'

export default function Loading() {
  return (
    <div className="h-screen w-full flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300" style={{ background: 'var(--bg-base)' }}>
      <div className="relative flex items-center justify-center w-20 h-20 mb-6">
        <div className="absolute inset-0 rounded-full border-4 border-t-transparent border-[var(--brand-orange)] animate-spin"></div>
        <Loader2 className="h-8 w-8 text-[var(--brand-orange)] animate-pulse" />
      </div>
      <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2">Iniciando sistema...</h3>
      <p className="text-base text-[var(--text-muted)] max-w-sm">
        Cargando interfaz en tiempo real. Por favor espera un momento.
      </p>
    </div>
  )
}
