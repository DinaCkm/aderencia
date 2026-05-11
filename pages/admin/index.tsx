import Link from 'next/link';

export default function AdminDashboard() {
  return (
    <main className="container">
      <h1>Administrador</h1>
      <p>Painel de gestão de participantes, catálogos, importação e avaliação.</p>
      <nav className="card-grid">
        <Link className="card" href="/admin/participants">
          Gestão de participantes
        </Link>
        <Link className="card" href="/admin/import-participants">
          Importar colaboradores
        </Link>
        <Link className="card" href="/admin/import-performance">
          Importar performance
        </Link>
        <Link className="card" href="/admin/import-disc">
          Importar DISC
        </Link>
        <Link className="card" href="/admin/catalogs">
          Gestão de catálogos
        </Link>
        <Link className="card" href="/admin/exceptions">
          Exceções pendentes
        </Link>
        <Link className="card" href="/admin/ninebox">
          Nine Box por área
        </Link>
      </nav>
    </main>
  );
}
