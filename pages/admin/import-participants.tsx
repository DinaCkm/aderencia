import { ChangeEvent, FormEvent, useState } from 'react';

export default function AdminImportParticipants() {
  const [csv, setCsv] = useState('');
  const [message, setMessage] = useState('');

  const template = `id,name,email,matricula,unit,currentRole,selectedAreas,graduation,postMBAs,certifications,experienceMonths,positionsHeld,selectedCourses,selectedProjects,exceptionRequested,exceptionJustification,attachments,exceptionStatus\n` +
    `jdoe,João Doe,joao@example.com,12345,UGE,Analista,UGE;UAS,Administração,mba-strategic;mba-finance,certificacao-pmp,24,Coordenador;Supervisor,curso-lideranca,projeto-transformacao,true,Justificativa,doc1.pdf;doc2.pdf,pending`;

  function downloadTemplate(filename: string, content: string) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setCsv(text);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const response = await fetch('/api/admin/import-participants', {
      method: 'POST',
      headers: { 'Content-Type': 'text/csv' },
      body: csv
    });
    const result = await response.json();
    setMessage(result.message || 'Importação concluída.');
  };

  return (
    <main className="container">
      <h1>Importar colaboradores</h1>
      <p>Faça o upload de uma planilha CSV com os empregados para alimentar o banco de dados de participantes.</p>
      <p>Separador de listas internas: <strong>;</strong>. Exemplo: <em>UGE;UAS</em>.</p>
      <button type="button" onClick={() => downloadTemplate('import-participants-template.csv', template)}>
        Baixar modelo de planilha de empregados
      </button>
      <form onSubmit={handleSubmit} className="form-card">
        <label>
          Arquivo CSV
          <input type="file" accept=".csv" onChange={handleFileChange} />
        </label>
        <label>
          Conteúdo CSV
          <textarea value={csv} onChange={(e) => setCsv(e.target.value)} rows={12} />
        </label>
        <button type="submit">Importar participantes</button>
        {message && <p className="success">{message}</p>}
      </form>
      <section className="form-card">
        <h2>Formato do arquivo</h2>
        <pre>
          id,name,email,matricula,unit,currentRole,selectedAreas,graduation,postMBAs,certifications,experienceMonths,positionsHeld,selectedCourses,selectedProjects,exceptionRequested,exceptionJustification,attachments,exceptionStatus
        </pre>
      </section>
    </main>
  );
}
