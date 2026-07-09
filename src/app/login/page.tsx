import { Metadata } from 'next'
import Image from 'next/image'
import LoginForm from './login-form'

export const metadata: Metadata = {
  title: 'Iniciar Sesión | Sistema Gastronómico',
  description: 'Inicia sesión en tu cuenta para acceder al sistema.',
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 py-12 sm:px-6 lg:px-8 bg-cover bg-center" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1554118811-1e0d58224f24?q=80&w=2047&auto=format&fit=crop')" }}>
      {/* Overlay oscuro para la imagen de fondo */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
      
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
        <h2 className="mt-2 text-center text-3xl font-extrabold tracking-tight text-white drop-shadow-md">
          Sistema Operativo
        </h2>
        <p className="mt-2 text-center text-sm text-gray-200">Ingresa con tus credenciales de empleado</p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white px-4 py-8 shadow sm:rounded-lg sm:px-10">
          <LoginForm />
        </div>
      </div>
    </div>
  )
}
