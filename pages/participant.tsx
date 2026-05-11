import { FormEvent, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { OFFICIAL_AREAS, CATALOG_ITEMS } from '../lib/constants';
import type { CatalogItem, ParticipantProfile } from '../lib/types';

const initialProfile: ParticipantProfile = {
  id: '',
  name: '',
  email: '',
  matricula: '',
  unit: '',
  currentRole: '',
  selectedAreas: [],
  graduation: '',
  postMBAs: [],
  certifications: [],
  experienceMonths: 0,
  positionsHeld: [],
  selectedCourses: [],
  selectedProjects: [],
  exceptionRequested: false,
  exceptionJustification: '',
  attachments: [],
  exceptionStatus: 'pending'
};

const getOptions = (group: CatalogItem['group']) => CATALOG_ITEMS.filter((item) => item.group === group);

export default function ParticipantForm() {
  const router = useRouter();
  const [profile, setProfile] = useState<ParticipantProfile>(initialProfile);
  const [submitted, setSubmitted] = useState(false);
  const [status, setStatus] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const role = sessionStorage.getItem('aderenciaRole');
    const email = sessionStorage.getItem('aderenciaEmail');
    if (role !== 'participant' || !email) {
      router.push('/login');
      return;
    }
    setProfile((current) => ({ ...current, email, id: email }));
  }, [router]);

  const areaOptions = OFFICIAL_AREAS;
  const postOptions = getOptions('postMBA');
  const courseOptions = getOptions('course');
  const projectOptions = getOptions('project');
  const certificationOptions = getOptions('certification');
  const unitOptions = getOptions('unit');
  const roleOptions = getOptions('role');
  const graduationOptions = getOptions('graduation');
  const nameOptions = getOptions('name');
  const matriculaOptions = getOptions('matricula');

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const response = await fetch('/api/participant/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile)
    });
    if (response.ok) {
      setSubmitted(true);
      setStatus('Formulário enviado com sucesso. Aguarde processamento administrativo.');
    } else {
      setStatus('Falha ao enviar. Verifique os dados e tente novamente.');
    }
  };

  const selectedAreaCount = profile.selectedAreas.length;
  const areaError = selectedAreaCount === 0 || selectedAreaCount > 3;

  const selectedCourses = useMemo(() => new Set(profile.selectedCourses), [profile.selectedCourses]);
  const selectedProjects = useMemo(() => new Set(profile.selectedProjects), [profile.selectedProjects]);
  const selectedPost = useMemo(() => new Set(profile.postMBAs), [profile.postMBAs]);
  const selectedCertifications = useMemo(() => new Set(profile.certifications), [profile.certifications]);

  return (
    <main className="container">
      <h1>Participante</h1>
      <form onSubmit={handleSubmit} className="form-card">
        <section>
          <h2>Dados básicos</h2>
          <label>
            Nome
            <select value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} required>
              <option value="">Selecione</option>
              {nameOptions.map((item) => (
                <option key={item.id} value={item.label}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Matrícula
            <select value={profile.matricula} onChange={(e) => setProfile({ ...profile, matricula: e.target.value })} required>
              <option value="">Selecione</option>
              {matriculaOptions.map((item) => (
                <option key={item.id} value={item.label}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Unidade atual
            <select value={profile.unit} onChange={(e) => setProfile({ ...profile, unit: e.target.value })} required>
              <option value="">Selecione</option>
              {unitOptions.map((item) => (
                <option key={item.id} value={item.label}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Cargo atual
            <select value={profile.currentRole} onChange={(e) => setProfile({ ...profile, currentRole: e.target.value })} required>
              <option value="">Selecione</option>
              {roleOptions.map((item) => (
                <option key={item.id} value={item.label}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </section>

        <section>
          <h2>Áreas de interesse</h2>
          <p>Escolha até 3 áreas. Cada área gera uma avaliação própria.</p>
          <div className="checkbox-grid">
            {areaOptions.map((area) => (
              <label key={area} className="checkbox-card">
                <input
                  type="checkbox"
                  checked={profile.selectedAreas.includes(area)}
                  onChange={(e) => {
                    const next = e.target.checked
                      ? [...profile.selectedAreas, area].slice(0, 3)
                      : profile.selectedAreas.filter((value) => value !== area);
                    setProfile({ ...profile, selectedAreas: next });
                  }}
                />
                {area}
              </label>
            ))}
          </div>
          {areaError && <p className="error">Selecione entre 1 e 3 áreas de interesse.</p>}
        </section>

        <section>
          <h2>Formação</h2>
          <label>
            Graduação (registro)
            <select value={profile.graduation} onChange={(e) => setProfile({ ...profile, graduation: e.target.value })} required>
              <option value="">Selecione</option>
              {graduationOptions.map((item) => (
                <option key={item.id} value={item.label}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Pós/MBA
            <select
              multiple
              value={profile.postMBAs}
              onChange={(e) => setProfile({ ...profile, postMBAs: Array.from(e.target.selectedOptions, (opt) => opt.value) })}
            >
              {postOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Certificações
            <select
              multiple
              value={profile.certifications}
              onChange={(e) => setProfile({ ...profile, certifications: Array.from(e.target.selectedOptions, (opt) => opt.value) })}
            >
              {certificationOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </section>

        <section>
          <h2>Experiência</h2>
          <label>
            Tempo em função gerencial/interina (meses)
            <input
              type="number"
              min="0"
              value={profile.experienceMonths}
              onChange={(e) => setProfile({ ...profile, experienceMonths: Number(e.target.value) })}
              required
            />
          </label>
          <label>
            Cargos exercidos
            <textarea
              value={profile.positionsHeld.join('\n')}
              onChange={(e) => setProfile({ ...profile, positionsHeld: e.target.value.split('\n').filter(Boolean) })}
              rows={4}
            />
          </label>
        </section>

        <section>
          <h2>Cursos e projetos</h2>
          <label>
            Cursos
            <select
              multiple
              value={profile.selectedCourses}
              onChange={(e) => setProfile({ ...profile, selectedCourses: Array.from(e.target.selectedOptions, (opt) => opt.value) })}
            >
              {courseOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Projetos
            <select
              multiple
              value={profile.selectedProjects}
              onChange={(e) => setProfile({ ...profile, selectedProjects: Array.from(e.target.selectedOptions, (opt) => opt.value) })}
            >
              {projectOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
        </section>

        <section>
          <h2>Solicitação de exceção</h2>
          <label className="checkbox-card">
            <input
              type="checkbox"
              checked={profile.exceptionRequested}
              onChange={(e) => setProfile({ ...profile, exceptionRequested: e.target.checked })}
            />
            Solicito exceção para itens fora do catálogo
          </label>
          <label>
            Justificativa
            <textarea
              value={profile.exceptionJustification}
              onChange={(e) => setProfile({ ...profile, exceptionJustification: e.target.value })}
              rows={4}
            />
          </label>
        </section>

        <section>
          <h2>Upload de comprovantes</h2>
          <p>Sem processamento de arquivos reais nesta versão MVP. Adicione nomes de comprovantes.</p>
          <label>
            Anexos (digite nomes separados por vírgula)
            <input
              value={profile.attachments.join(', ')}
              onChange={(e) => setProfile({ ...profile, attachments: e.target.value.split(',').map((item) => item.trim()).filter(Boolean) })}
            />
          </label>
        </section>

        <button type="submit" disabled={areaError || submitted}>Enviar formulário</button>
        {status && <p className="success">{status}</p>}
      </form>
    </main>
  );
}
