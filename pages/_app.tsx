import type { AppProps } from 'next/app';
import '../styles/globals.css';

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Component {...pageProps} />
      {/* Botão flutuante Fale Conosco — CKM Talents */}
      <a
        href="https://ckmtalents.com.br/fale-conosco/"
        target="_blank"
        rel="noopener noreferrer"
        title="Fale Conosco — CKM Talents"
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: 'linear-gradient(135deg, #1a3a6e 0%, #0891b2 100%)',
          color: 'white',
          textDecoration: 'none',
          fontWeight: 700,
          fontSize: '0.82rem',
          padding: '11px 18px',
          borderRadius: '50px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.22)',
          whiteSpace: 'nowrap',
        }}
      >
        💬 Fale Conosco
      </a>
    </>
  );
}
