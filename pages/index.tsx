import Link from 'next/link';

export default function Home() {
  return (
    <main className="container">
      <h1>Banco de Sucessores - MVP</h1>
      <p>Bem-vindo ao sistema de avaliação por área com regras oficiais e cálculo automático.</p>
      <nav className="card-grid">
        <Link className="card" href="/login">
          Login
        </Link>
        <Link className="card" href="/participant">
          Participante
        </Link>
        <Link className="card" href="/admin">
          Administrador
        </Link>
      </nav>
    </main>
  );
}
