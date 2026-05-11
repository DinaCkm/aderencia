import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { ParticipantProfile } from '../../lib/types';

export default function AdminParticipants() {
  const [participants, setParticipants] = useState<ParticipantProfile[]>([]);

  useEffect(() => {
    fetch('/api/admin/participants')
      .then((res) => res.json())
      .then((data) => setParticipants(data.participants || []));
  }, []);

  return (
    <main className="container">
      <h1>Gestão de participantes</h1>
      <p>Lista de participantes cadastrados e envio de avaliações por área.</p>
      <div className="card-grid">
        {participants.map((participant) => (
          <article key={participant.id} className="card">
            <h2>{participant.name}</h2>
            <p>{participant.email}</p>
            <p>Áreas: {participant.selectedAreas.join(', ') || 'Nenhuma'}</p>
            <p>Status de exceção: {participant.exceptionStatus}</p>
            <Link href={`/admin/audit/${participant.id}`}>Relatório de auditoria</Link>
          </article>
        ))}
      </div>
    </main>
  );
}
