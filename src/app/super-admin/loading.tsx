import { Loader2 } from 'lucide-react'

export default function AdminLoading() {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
      <div className="relative flex items-center justify-center w-16 h-16 mb-4">
        <div className="absolute inset-0 rounded-full border-4 border-t-transparent border-[var(--brand-orange)] animate-spin"></div>
        <Loader2 className="h-6 w-6 text-[var(--brand-orange)] animate-pulse" />
      </div>
      <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">Cargando datos...</h3>
      <p className="text-sm text-[var(--text-muted)] max-w-xs">
        Obteniendo la información más reciente desde el servidor.
      </p>
    </div>
  )
}
