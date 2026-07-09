import { Metadata } from 'next'
import Image from 'next/image'
import LoginForm from './login-form'

export const metadata: Metadata = {
  title: 'Iniciar Sesión | Sistema Gastronómico',
  description: 'Inicia sesión en tu cuenta para acceder al sistema.',
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-white py-12 sm:px-6 lg:px-8">
      <div className="relative sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="flex justify-center">
            <Image 
              src="/logo.png" 
              alt="StackHard Logo" 
              width={180} 
              height={180}
              className="object-contain drop-shadow-xl"
              priority
            />
        </div>
        <h2 className="mt-4 text-center text-3xl font-extrabold tracking-tight text-slate-900">
          Sistema Operativo
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">Ingresa con tus credenciales de empleado</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white px-4 py-8 shadow-xl border border-slate-100 sm:rounded-lg sm:px-10">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
