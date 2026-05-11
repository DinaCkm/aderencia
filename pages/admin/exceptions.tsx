import { useEffect, useState } from 'react';
import type { ParticipantProfile } from '../../lib/types';

export default function AdminExceptions() {
  const [pending, setPending] = useState<ParticipantProfile[]>([]);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/admin/exceptions')
      .then((res) => res.json())
      .then((data) => setPending(data.pending || []));
  }, []);

  const updateStatus = async (id: string, action: 'approve' | 'reject') => {
    const response = await fetch('/api/admin/exceptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action })
    });
    if (response.ok) {
      setPending((current) => current.filter((item) => item.id !== id));
      setMessage(`Exceção ${action === 'approve' ? 'aprovada' : 'rejeitada'} para ${id}.`);
    }
  };

  return (
    <main className="container">
      <h1>Exceções pendentes</h1>
      <p>Valide itens fora do catálogo antes do processamento das avaliações.</p>
      {message && <p className="success">{message}</p>}
      <div className="card-grid">
        {pending.length === 0 ? (
          <p>Nenhuma exceção pendente.</p>
        ) : (
          pending.map((participant) => (
            <article key={participant.id} className="card">
              <h2>{participant.name}</h2>
              <p>E-mail: {participant.email}</p>
              <p>Justificativa: {participant.exceptionJustification || 'Sem justificativa'}</p>
              <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => updateStatus(participant.id, 'approve')}>
                  Aprovar
                </button>
                <button type="button" onClick={() => updateStatus(participant.id, 'reject')}>
                  Rejeitar
                </button>
              </div>
            </article>
          ))
        )}
      </div>
    </main>
  );
}
