import { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { OFFICIAL_AREAS } from '../../lib/constants';
import type { CatalogItem } from '../../lib/types';

const groups = ['postMBA', 'course', 'project', 'certification', 'unit', 'role', 'graduation', 'name', 'matricula'] as const;
const classifications = ['transversal', 'area-specific', 'non-related'] as const;

export default function AdminCatalogs() {
  const [catalogs, setCatalogs] = useState<CatalogItem[]>([]);
  const [item, setItem] = useState({ id: '', label: '', group: 'course', classification: 'transversal', area: '' });
  const [csv, setCsv] = useState('');
  const [message, setMessage] = useState('');
  const [importMessage, setImportMessage] = useState('');

  useEffect(() => {
    fetch('/api/admin/catalogs')
      .then((res) => res.json())
      .then((data) => setCatalogs(data.catalogs || []));
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const response = await fetch('/api/admin/catalogs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item)
    });
    const data = await response.json();
    if (response.ok) {
      setCatalogs(data.catalogs);
      setMessage('Item adicionado com sucesso.');
      setItem({ id: '', label: '', group: 'course', classification: 'transversal', area: '' });
    }
  };

  const downloadTemplate = () => {
    const template = `id,label,group,classification,area\n` +
      `mba-strategic,MBA Estratégia Corporativa,postMBA,transversal,\n` +
      `curso-lideranca,Curso de Liderança Estratégica,course,transversal,\n` +
      `projeto-transformacao,Projeto de Transformação Digital,project,transversal,\n` +
      `certificacao-pmp,Certificação PMP,certification,transversal,\n`;
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'import-catalogs-template.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handleCatalogFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setCsv(text);
  };

  const fetchCatalogs = async () => {
    const response = await fetch('/api/admin/catalogs');
    const data = await response.json();
    setCatalogs(data.catalogs || []);
  };

  const handleImportCatalogs = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const response = await fetch('/api/admin/import-catalogs', {
      method: 'POST',
      headers: { 'Content-Type': 'text/csv' },
      body: csv
    });
    const data = await response.json();
    if (response.ok) {
      setImportMessage(data.message || 'Importação concluída.');
      fetchCatalogs();
    }
  };

  return (
    <main className="container">
      <h1>Gestão de catálogos</h1>
      <p>Cadastre cursos, projetos e pós/MBA dentro das listas fechadas do sistema.</p>
      <form onSubmit={handleSubmit} className="form-card">
        <label>
          ID único
          <input value={item.id} onChange={(e) => setItem({ ...item, id: e.target.value })} required />
        </label>
        <label>
          Rótulo
          <input value={item.label} onChange={(e) => setItem({ ...item, label: e.target.value })} required />
        </label>
        <label>
          Grupo
          <select value={item.group} onChange={(e) => setItem({ ...item, group: e.target.value })}>
            {groups.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
        </label>
        <label>
          Classificação
          <select value={item.classification} onChange={(e) => setItem({ ...item, classification: e.target.value })}>
            {classifications.map((classification) => (
              <option key={classification} value={classification}>
                {classification}
              </option>
            ))}
          </select>
        </label>
        <label>
          Área (apenas para itens específicos)
          <select value={item.area} onChange={(e) => setItem({ ...item, area: e.target.value })}>
            <option value="">Nenhuma</option>
            {OFFICIAL_AREAS.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        </label>
        <button type="submit">Adicionar item</button>
        {message && <p className="success">{message}</p>}
      </form>
      <section className="form-card">
        <h2>Importar catálogo</h2>
        <button type="button" onClick={downloadTemplate}>Baixar modelo de planilha de catálogo</button>
        <form onSubmit={handleImportCatalogs} className="form-card">
          <label>
            Arquivo CSV
            <input type="file" accept=".csv" onChange={handleCatalogFileChange} />
          </label>
          <label>
            Conteúdo CSV
            <textarea value={csv} onChange={(e) => setCsv(e.target.value)} rows={8} />
          </label>
          <button type="submit">Importar catálogo</button>
          {importMessage && <p className="success">{importMessage}</p>}
        </form>
      </section>
      <section className="form-card">
        <h2>Catálogo atual</h2>
        <ul>
          {catalogs.map((item) => (
            <li key={item.id}>
              {item.label} — {item.group} — {item.classification} {item.area ? `— ${item.area}` : ''}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
