import React from 'react';

export default function PaymentScreen() {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      backgroundColor: '#000',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      color: 'white',
      fontFamily: 'Inter, sans-serif',
      zIndex: 9999,
      overflow: 'hidden'
    }}>
      {/* Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          opacity: 0.4,
          zIndex: 0
        }}
      >
        <source src="https://cdn.pixabay.com/video/2021/08/04/83870-584735508_large.mp4" type="video/mp4" />
      </video>

      {/* Content */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        padding: '40px',
        borderRadius: '16px',
        textAlign: 'center',
        maxWidth: '500px',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(10px)',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '12px',
          marginBottom: '24px'
        }}>
          <span style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-1px' }}>
            <span style={{ color: '#9ca3af' }}>Stack</span><span style={{ color: '#e56b25' }}>Hard</span>
          </span>
        </div>
        
        <h1 style={{ fontSize: '24px', marginBottom: '16px', color: '#f3f4f6' }}>
          Acceso Suspendido
        </h1>
        <p style={{ fontSize: '16px', lineHeight: '1.6', color: '#d1d5db', marginBottom: '24px' }}>
          La mensualidad de su sistema se encuentra vencida. Para restablecer el servicio inmediatamente y continuar operando su negocio, por favor póngase en contacto con el administrador.
        </p>
        
        <div style={{
          backgroundColor: 'var(--surface-color, #1f2937)',
          padding: '16px',
          borderRadius: '8px',
          display: 'inline-block',
          border: '1px solid var(--border-color, #374151)'
        }}>
          <p style={{ fontSize: '14px', color: '#9ca3af', marginBottom: '4px' }}>Contacto WhatsApp:</p>
          <a 
            href="https://wa.me/542617737367" 
            target="_blank" 
            rel="noopener noreferrer"
            style={{ fontSize: '22px', fontWeight: 'bold', color: '#22c55e', textDecoration: 'none' }}
          >
            +54 2617737367
          </a>
        </div>
      </div>
    </div>
  );
}
