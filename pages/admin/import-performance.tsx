import { ChangeEvent, FormEvent, useState } from 'react';

const TEMPLATE = `participantId,area,score100,date\n` +
  `jdoe,UGE,87,2026-05-01`;

export default function AdminImportPerformance() {
  const [csv, setCsv] = useState('');
  const [message, setMessage] = useState('');

  const downloadTemplate = () => {
    const blob = new Blob([TEMPLATE], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'import-performance-template.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setCsv(text);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const response = await fetch('/api/admin/import-performance', {
      method: 'POST',
      headers: { 'Content-Type': 'text/csv' },
      body: csv
    });
    const result = await response.json();
    setMessage(result.message || 'Importação concluída.');
  };

  return (
    <main className="container">
      <h1>Importar performance</h1>
      <p>Formato CSV: participantId,area,score100,date (YYYY-MM-DD)</p>
      <button type="button" onClick={downloadTemplate}>Baixar modelo de planilha de performance</button>
      <form onSubmit={handleSubmit} className="form-card">
        <label>
          Arquivo CSV
          <input type="file" accept=".csv" onChange={handleFileChange} />
        </label>
        <label>
          Conteúdo CSV
          <textarea value={csv} onChange={(e) => setCsv(e.target.value)} rows={10} />
        </label>
        <button type="submit">Importar</button>
        {message && <p className="success">{message}</p>}
      </form>
    </main>
  );
}
