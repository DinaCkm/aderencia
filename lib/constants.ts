import type { CatalogItem, AreaCode } from './types';

export const OFFICIAL_AREAS: AreaCode[] = [
  'GAB',
  'UAUD',
  'URI',
  'UGE',
  'UMC',
  'AJUR',
  'UGP',
  'UAS',
  'UGOC',
  'UTIC',
  'URC',
  'UAC',
  'UNIDADES_REGIONAIS'
];

export const NINE_BOX_QUADRANTS = [
  { x: 'low', y: 'low', label: 'Baixa Aderência' },
  { x: 'mid', y: 'low', label: 'Especialista Técnico sem Perfil de Liderança' },
  { x: 'high', y: 'low', label: 'Risco de Liderança' },
  { x: 'low', y: 'mid', label: 'Desenvolvimento Direcionado' },
  { x: 'mid', y: 'mid', label: 'Potencial de Médio Prazo' },
  { x: 'high', y: 'mid', label: 'Destaque Técnico, lapidar liderança' },
  { x: 'low', y: 'high', label: 'Potencial de Curto Prazo (gap técnico)' },
  { x: 'mid', y: 'high', label: 'Pronto em Desenvolvimento' },
  { x: 'high', y: 'high', label: 'Alta Prontidão' }
];

export const CATALOG_ITEMS: CatalogItem[] = [
  // ============================================================
  // PÓS/MBA TRANSVERSAIS PRIORITÁRIOS (valem para qualquer área)
  // ============================================================
  { id: 'pos-lideranca', label: 'Liderança', group: 'postMBA', classification: 'transversal' },
  { id: 'pos-gestao-pessoas', label: 'Gestão de Pessoas', group: 'postMBA', classification: 'transversal' },
  { id: 'pos-gestao-projetos', label: 'Gestão de Projetos', group: 'postMBA', classification: 'transversal' },
  { id: 'pos-inovacao', label: 'Inovação', group: 'postMBA', classification: 'transversal' },
  { id: 'pos-tecnologia', label: 'Tecnologia', group: 'postMBA', classification: 'transversal' },
  { id: 'pos-estrategia-organizacional', label: 'Estratégia Organizacional', group: 'postMBA', classification: 'transversal' },

  // ============================================================
  // PÓS/MBA ESPECÍFICOS POR ÁREA
  // ============================================================
  // GAB
  { id: 'pos-governanca-corporativa', label: 'Governança Corporativa', group: 'postMBA', classification: 'area-specific', area: 'GAB' },
  { id: 'pos-gestao-publica-institucional', label: 'Gestão Pública ou Gestão Institucional', group: 'postMBA', classification: 'area-specific', area: 'GAB' },
  { id: 'pos-administracao-publica', label: 'Administração Pública', group: 'postMBA', classification: 'area-specific', area: 'GAB' },
  { id: 'pos-gestao-processos-organizacionais', label: 'Gestão de Processos Organizacionais', group: 'postMBA', classification: 'area-specific', area: 'GAB' },
  { id: 'pos-compliance-integridade', label: 'Compliance e Integridade', group: 'postMBA', classification: 'area-specific', area: 'GAB' },

  // UAUD
  { id: 'pos-auditoria-interna', label: 'Auditoria Interna', group: 'postMBA', classification: 'area-specific', area: 'UAUD' },
  { id: 'pos-controladoria', label: 'Controladoria', group: 'postMBA', classification: 'area-specific', area: 'UAUD' },
  { id: 'pos-grc', label: 'Governança, Riscos e Compliance (GRC)', group: 'postMBA', classification: 'area-specific', area: 'UAUD' },
  { id: 'pos-gestao-riscos-corporativos', label: 'Gestão de Riscos Corporativos', group: 'postMBA', classification: 'area-specific', area: 'UAUD' },
  { id: 'pos-financas-corporativas', label: 'Finanças Corporativas', group: 'postMBA', classification: 'area-specific', area: 'UAUD' },

  // URI
  { id: 'pos-relacoes-institucionais-governamentais', label: 'Relações Institucionais e Governamentais', group: 'postMBA', classification: 'area-specific', area: 'URI' },
  { id: 'pos-gestao-estrategica', label: 'Gestão Estratégica', group: 'postMBA', classification: 'area-specific', area: 'URI' },
  { id: 'pos-politicas-publicas', label: 'Políticas Públicas', group: 'postMBA', classification: 'area-specific', area: 'URI' },
  { id: 'pos-desenvolvimento-territorial', label: 'Desenvolvimento Territorial', group: 'postMBA', classification: 'area-specific', area: 'URI' },
  { id: 'pos-captacao-recursos-parcerias', label: 'Captação de Recursos e Parcerias', group: 'postMBA', classification: 'area-specific', area: 'URI' },

  // UGE
  { id: 'pos-planejamento-estrategico', label: 'Planejamento Estratégico', group: 'postMBA', classification: 'area-specific', area: 'UGE' },
  { id: 'pos-gestao-riscos-compliance', label: 'Gestão de Riscos e Compliance', group: 'postMBA', classification: 'area-specific', area: 'UGE' },
  { id: 'pos-inteligencia-estrategica-bi', label: 'Inteligência Estratégica e BI', group: 'postMBA', classification: 'area-specific', area: 'UGE' },
  { id: 'pos-gestao-inovacao', label: 'Gestão da Inovação', group: 'postMBA', classification: 'area-specific', area: 'UGE' },
  { id: 'pos-esg-sustentabilidade', label: 'ESG e Sustentabilidade', group: 'postMBA', classification: 'area-specific', area: 'UGE' },

  // UMC
  { id: 'pos-marketing-estrategico', label: 'Marketing Estratégico', group: 'postMBA', classification: 'area-specific', area: 'UMC' },
  { id: 'pos-comunicacao-corporativa', label: 'Comunicação Corporativa', group: 'postMBA', classification: 'area-specific', area: 'UMC' },
  { id: 'pos-branding-gestao-marca', label: 'Branding e Gestão de Marca', group: 'postMBA', classification: 'area-specific', area: 'UMC' },
  { id: 'pos-marketing-digital', label: 'Marketing Digital', group: 'postMBA', classification: 'area-specific', area: 'UMC' },
  { id: 'pos-comunicacao-publica-institucional', label: 'Comunicação Pública e Institucional', group: 'postMBA', classification: 'area-specific', area: 'UMC' },

  // AJUR
  { id: 'pos-direito-administrativo', label: 'Direito Administrativo', group: 'postMBA', classification: 'area-specific', area: 'AJUR' },
  { id: 'pos-direito-empresarial', label: 'Direito Empresarial', group: 'postMBA', classification: 'area-specific', area: 'AJUR' },
  { id: 'pos-direito-publico', label: 'Direito Público', group: 'postMBA', classification: 'area-specific', area: 'AJUR' },
  { id: 'pos-compliance-integridade-ajur', label: 'Compliance e Integridade', group: 'postMBA', classification: 'area-specific', area: 'AJUR' },
  { id: 'pos-gestao-riscos-juridicos', label: 'Gestão de Riscos Jurídicos', group: 'postMBA', classification: 'area-specific', area: 'AJUR' },

  // UGP
  { id: 'pos-lideranca-desenvolvimento-humano', label: 'Liderança e Desenvolvimento Humano', group: 'postMBA', classification: 'area-specific', area: 'UGP' },
  { id: 'pos-psicologia-organizacional', label: 'Psicologia Organizacional', group: 'postMBA', classification: 'area-specific', area: 'UGP' },
  { id: 'pos-gestao-mudancas', label: 'Gestão de Mudanças', group: 'postMBA', classification: 'area-specific', area: 'UGP' },
  { id: 'pos-comportamento-desempenho', label: 'Comportamento e Desempenho Organizacional', group: 'postMBA', classification: 'area-specific', area: 'UGP' },
  { id: 'pos-rh-estrategico-analitico', label: 'RH Estratégico / Analítico', group: 'postMBA', classification: 'area-specific', area: 'UGP' },

  // UAS
  { id: 'pos-gestao-operacoes', label: 'Gestão de Operações', group: 'postMBA', classification: 'area-specific', area: 'UAS' },
  { id: 'pos-logistica-cadeia-suprimentos', label: 'Logística e Cadeia de Suprimentos', group: 'postMBA', classification: 'area-specific', area: 'UAS' },
  { id: 'pos-administracao-servicos', label: 'Administração de Serviços', group: 'postMBA', classification: 'area-specific', area: 'UAS' },
  { id: 'pos-gestao-patrimonial', label: 'Gestão Patrimonial', group: 'postMBA', classification: 'area-specific', area: 'UAS' },

  // UGOC
  { id: 'pos-financas-corporativas-ugoc', label: 'Finanças Corporativas', group: 'postMBA', classification: 'area-specific', area: 'UGOC' },
  { id: 'pos-controladoria-ugoc', label: 'Controladoria', group: 'postMBA', classification: 'area-specific', area: 'UGOC' },
  { id: 'pos-orcamento-publico', label: 'Orçamento Público', group: 'postMBA', classification: 'area-specific', area: 'UGOC' },
  { id: 'pos-contabilidade-gerencial', label: 'Contabilidade Gerencial', group: 'postMBA', classification: 'area-specific', area: 'UGOC' },

  // UTIC
  { id: 'pos-gestao-ti', label: 'Gestão de TI', group: 'postMBA', classification: 'area-specific', area: 'UTIC' },
  { id: 'pos-transformacao-digital', label: 'Transformação Digital', group: 'postMBA', classification: 'area-specific', area: 'UTIC' },
  { id: 'pos-governanca-ti', label: 'Governança de TI', group: 'postMBA', classification: 'area-specific', area: 'UTIC' },
  { id: 'pos-seguranca-informacao', label: 'Segurança da Informação', group: 'postMBA', classification: 'area-specific', area: 'UTIC' },
  { id: 'pos-lgpd', label: 'LGPD e Proteção de Dados', group: 'postMBA', classification: 'area-specific', area: 'UTIC' },

  // URC
  { id: 'pos-relacionamento-clientes', label: 'Relacionamento com Clientes', group: 'postMBA', classification: 'area-specific', area: 'URC' },
  { id: 'pos-experiencia-cliente', label: 'Experiência do Cliente (CX)', group: 'postMBA', classification: 'area-specific', area: 'URC' },
  { id: 'pos-gestao-servicos', label: 'Gestão de Serviços', group: 'postMBA', classification: 'area-specific', area: 'URC' },

  // UAC
  { id: 'pos-desenvolvimento-territorial-uac', label: 'Desenvolvimento Territorial', group: 'postMBA', classification: 'area-specific', area: 'UAC' },
  { id: 'pos-competitividade-inovacao', label: 'Competitividade e Inovação', group: 'postMBA', classification: 'area-specific', area: 'UAC' },
  { id: 'pos-gestao-projetos-estrategicos', label: 'Gestão de Projetos Estratégicos', group: 'postMBA', classification: 'area-specific', area: 'UAC' },
  { id: 'pos-politicas-publicas-pequenos-negocios', label: 'Políticas Públicas para Pequenos Negócios', group: 'postMBA', classification: 'area-specific', area: 'UAC' },

  // UNIDADES_REGIONAIS
  { id: 'pos-gestao-estrategica-regional', label: 'Gestão Estratégica', group: 'postMBA', classification: 'area-specific', area: 'UNIDADES_REGIONAIS' },
  { id: 'pos-gestao-projetos-regional', label: 'Gestão de Projetos', group: 'postMBA', classification: 'area-specific', area: 'UNIDADES_REGIONAIS' },
  { id: 'pos-desenvolvimento-regional', label: 'Desenvolvimento Regional', group: 'postMBA', classification: 'area-specific', area: 'UNIDADES_REGIONAIS' },
  { id: 'pos-gestao-pequenos-negocios', label: 'Gestão de Pequenos Negócios', group: 'postMBA', classification: 'area-specific', area: 'UNIDADES_REGIONAIS' },

  // ============================================================
  // CURSOS TRANSVERSAIS (valem para qualquer área)
  // ============================================================
  { id: 'curso-lideranca-estrategica', label: 'Liderança Estratégica', group: 'course', classification: 'transversal' },
  { id: 'curso-gestao-pessoas-trans', label: 'Gestão de Pessoas', group: 'course', classification: 'transversal' },
  { id: 'curso-comunicacao-executiva', label: 'Comunicação Executiva', group: 'course', classification: 'transversal' },
  { id: 'curso-gestao-projetos-trans', label: 'Gestão de Projetos', group: 'course', classification: 'transversal' },
  { id: 'curso-inovacao-trans', label: 'Inovação e Criatividade', group: 'course', classification: 'transversal' },
  { id: 'curso-pensamento-estrategico', label: 'Pensamento Estratégico', group: 'course', classification: 'transversal' },

  // ============================================================
  // CURSOS ESPECÍFICOS POR ÁREA
  // ============================================================
  { id: 'curso-governanca-institucional', label: 'Governança Institucional', group: 'course', classification: 'area-specific', area: 'GAB' },
  { id: 'curso-gestao-colegiada', label: 'Gestão Colegiada', group: 'course', classification: 'area-specific', area: 'GAB' },

  { id: 'curso-cia-ccsa', label: 'Certificações em Auditoria (CIA, CCSA ou equivalentes)', group: 'course', classification: 'area-specific', area: 'UAUD' },
  { id: 'curso-analise-dados-auditoria', label: 'Análise de Dados para Auditoria', group: 'course', classification: 'area-specific', area: 'UAUD' },
  { id: 'curso-etica-organizacional', label: 'Ética Organizacional', group: 'course', classification: 'area-specific', area: 'UAUD' },

  { id: 'curso-negociacao-avancada', label: 'Negociação Avançada', group: 'course', classification: 'area-specific', area: 'URI' },
  { id: 'curso-analise-cenarios', label: 'Análise de Cenários', group: 'course', classification: 'area-specific', area: 'URI' },

  { id: 'curso-okr-bsc', label: 'Gestão de Indicadores (OKR/BSC)', group: 'course', classification: 'area-specific', area: 'UGE' },
  { id: 'curso-esg', label: 'ESG', group: 'course', classification: 'area-specific', area: 'UGE' },

  { id: 'curso-gestao-crises', label: 'Gestão de Crises', group: 'course', classification: 'area-specific', area: 'UMC' },

  { id: 'curso-rh-estrategico', label: 'RH Estratégico / Analítico', group: 'course', classification: 'area-specific', area: 'UGP' },
  { id: 'curso-gestao-mudancas', label: 'Gestão de Mudanças', group: 'course', classification: 'area-specific', area: 'UGP' },

  { id: 'curso-logistica-suprimentos', label: 'Logística e Cadeia de Suprimentos', group: 'course', classification: 'area-specific', area: 'UAS' },
  { id: 'curso-gestao-patrimonial', label: 'Gestão Patrimonial', group: 'course', classification: 'area-specific', area: 'UAS' },

  { id: 'curso-controladoria', label: 'Controladoria', group: 'course', classification: 'area-specific', area: 'UGOC' },
  { id: 'curso-orcamento-publico', label: 'Orçamento Público', group: 'course', classification: 'area-specific', area: 'UGOC' },

  { id: 'curso-governanca-ti', label: 'Governança de TI', group: 'course', classification: 'area-specific', area: 'UTIC' },
  { id: 'curso-seguranca-informacao', label: 'Segurança da Informação', group: 'course', classification: 'area-specific', area: 'UTIC' },

  { id: 'curso-cx', label: 'Experiência do Cliente (CX)', group: 'course', classification: 'area-specific', area: 'URC' },
  { id: 'curso-relacionamento-clientes', label: 'Gestão de Relacionamento com Clientes', group: 'course', classification: 'area-specific', area: 'URC' },

  { id: 'curso-desenvolvimento-territorial', label: 'Desenvolvimento Territorial', group: 'course', classification: 'area-specific', area: 'UAC' },
  { id: 'curso-competitividade-inovacao', label: 'Competitividade e Inovação', group: 'course', classification: 'area-specific', area: 'UAC' },

  { id: 'curso-gestao-pequenos-negocios', label: 'Gestão de Pequenos Negócios', group: 'course', classification: 'area-specific', area: 'UNIDADES_REGIONAIS' },
  { id: 'curso-desenvolvimento-regional', label: 'Desenvolvimento Regional', group: 'course', classification: 'area-specific', area: 'UNIDADES_REGIONAIS' },

  // ============================================================
  // PROJETOS ESTRATÉGICOS POR ÁREA (seed para homologação)
  // ============================================================
  { id: 'proj-governanca-institucional', label: 'Projeto de Governança Institucional', group: 'project', classification: 'area-specific', area: 'GAB' },
  { id: 'proj-agenda-colegiada', label: 'Projeto de Gestão da Agenda Colegiada', group: 'project', classification: 'area-specific', area: 'GAB' },

  { id: 'proj-auditoria-riscos', label: 'Projeto de Auditoria Baseada em Riscos', group: 'project', classification: 'area-specific', area: 'UAUD' },
  { id: 'proj-controles-internos', label: 'Projeto de Fortalecimento de Controles Internos', group: 'project', classification: 'area-specific', area: 'UAUD' },

  { id: 'proj-parcerias-estrategicas', label: 'Projeto de Parcerias Estratégicas', group: 'project', classification: 'area-specific', area: 'URI' },
  { id: 'proj-politicas-publicas', label: 'Projeto de Políticas Públicas', group: 'project', classification: 'area-specific', area: 'URI' },

  { id: 'proj-planejamento-estrategico', label: 'Projeto de Planejamento Estratégico', group: 'project', classification: 'area-specific', area: 'UGE' },
  { id: 'proj-indicadores-bi', label: 'Projeto de Indicadores e BI', group: 'project', classification: 'area-specific', area: 'UGE' },

  { id: 'proj-gestao-marca', label: 'Projeto de Gestão da Marca', group: 'project', classification: 'area-specific', area: 'UMC' },
  { id: 'proj-comunicacao-institucional', label: 'Projeto de Comunicação Institucional', group: 'project', classification: 'area-specific', area: 'UMC' },

  { id: 'proj-seguranca-juridica', label: 'Projeto de Segurança Jurídica Institucional', group: 'project', classification: 'area-specific', area: 'AJUR' },
  { id: 'proj-compliance-juridico', label: 'Projeto de Compliance Jurídico', group: 'project', classification: 'area-specific', area: 'AJUR' },

  { id: 'proj-desenvolvimento-liderancas', label: 'Projeto de Desenvolvimento de Lideranças', group: 'project', classification: 'area-specific', area: 'UGP' },
  { id: 'proj-sucessao', label: 'Projeto de Sucessão', group: 'project', classification: 'area-specific', area: 'UGP' },

  { id: 'proj-logistica-suprimentos', label: 'Projeto de Logística e Suprimentos', group: 'project', classification: 'area-specific', area: 'UAS' },
  { id: 'proj-patrimonio-infraestrutura', label: 'Projeto de Patrimônio e Infraestrutura', group: 'project', classification: 'area-specific', area: 'UAS' },

  { id: 'proj-planejamento-orcamentario', label: 'Projeto de Planejamento Orçamentário', group: 'project', classification: 'area-specific', area: 'UGOC' },
  { id: 'proj-controladoria-financeira', label: 'Projeto de Controladoria Financeira', group: 'project', classification: 'area-specific', area: 'UGOC' },

  { id: 'proj-transformacao-digital', label: 'Projeto de Transformação Digital', group: 'project', classification: 'area-specific', area: 'UTIC' },
  { id: 'proj-seguranca-informacao', label: 'Projeto de Segurança da Informação', group: 'project', classification: 'area-specific', area: 'UTIC' },

  { id: 'proj-experiencia-cliente', label: 'Projeto de Experiência do Cliente', group: 'project', classification: 'area-specific', area: 'URC' },
  { id: 'proj-jornada-cliente', label: 'Projeto de Jornada do Cliente', group: 'project', classification: 'area-specific', area: 'URC' },

  { id: 'proj-desenvolvimento-territorial', label: 'Projeto de Desenvolvimento Territorial', group: 'project', classification: 'area-specific', area: 'UAC' },
  { id: 'proj-competitividade-negocios', label: 'Projeto de Competitividade dos Pequenos Negócios', group: 'project', classification: 'area-specific', area: 'UAC' },

  { id: 'proj-execucao-estrategica-regional', label: 'Projeto de Execução Estratégica Regional', group: 'project', classification: 'area-specific', area: 'UNIDADES_REGIONAIS' },
  { id: 'proj-articulacao-regional', label: 'Projeto de Articulação Regional', group: 'project', classification: 'area-specific', area: 'UNIDADES_REGIONAIS' },

  // ============================================================
  // UNIDADES (áreas da organização)
  // ============================================================
  { id: 'unit-gab', label: 'GAB — Gabinete do CDE', group: 'unit', classification: 'transversal' },
  { id: 'unit-uaud', label: 'UAUD — Unidade de Auditoria Interna', group: 'unit', classification: 'transversal' },
  { id: 'unit-uri', label: 'URI — Unidade de Relacionamento Institucional', group: 'unit', classification: 'transversal' },
  { id: 'unit-uge', label: 'UGE — Unidade de Gestão Estratégica e Integridade', group: 'unit', classification: 'transversal' },
  { id: 'unit-umc', label: 'UMC — Unidade de Marketing e Comunicação', group: 'unit', classification: 'transversal' },
  { id: 'unit-ajur', label: 'AJUR — Assessoria Jurídica', group: 'unit', classification: 'transversal' },
  { id: 'unit-ugp', label: 'UGP — Unidade de Gestão de Pessoas', group: 'unit', classification: 'transversal' },
  { id: 'unit-uas', label: 'UAS — Unidade de Administração e Suprimentos', group: 'unit', classification: 'transversal' },
  { id: 'unit-ugoc', label: 'UGOC — Unidade de Gestão Orçamentária, Contabilidade e Finanças', group: 'unit', classification: 'transversal' },
  { id: 'unit-utic', label: 'UTIC — Unidade de Tecnologia da Informação', group: 'unit', classification: 'transversal' },
  { id: 'unit-urc', label: 'URC — Unidade de Relacionamento com o Cliente', group: 'unit', classification: 'transversal' },
  { id: 'unit-uac', label: 'UAC — Unidade de Articulação e Competitividade', group: 'unit', classification: 'transversal' },
  { id: 'unit-regionais', label: 'Unidades Regionais', group: 'unit', classification: 'transversal' },

  // ============================================================
  // CARGOS
  // ============================================================
  { id: 'role-analista', label: 'Analista', group: 'role', classification: 'transversal' },
  { id: 'role-coordenador', label: 'Coordenador', group: 'role', classification: 'transversal' },
  { id: 'role-gerente', label: 'Gerente', group: 'role', classification: 'transversal' },
  { id: 'role-diretor', label: 'Diretor', group: 'role', classification: 'transversal' },
  { id: 'role-assistente', label: 'Assistente', group: 'role', classification: 'transversal' },
  { id: 'role-assessor', label: 'Assessor', group: 'role', classification: 'transversal' },
  { id: 'role-tecnico', label: 'Técnico', group: 'role', classification: 'transversal' },
  { id: 'role-consultor', label: 'Consultor', group: 'role', classification: 'transversal' },

  // ============================================================
  // GRADUAÇÕES
  // ============================================================
  { id: 'grad-administracao', label: 'Administração', group: 'graduation', classification: 'transversal' },
  { id: 'grad-economia', label: 'Economia', group: 'graduation', classification: 'transversal' },
  { id: 'grad-contabilidade', label: 'Contabilidade', group: 'graduation', classification: 'transversal' },
  { id: 'grad-direito', label: 'Direito', group: 'graduation', classification: 'transversal' },
  { id: 'grad-engenharia', label: 'Engenharia', group: 'graduation', classification: 'transversal' },
  { id: 'grad-ti', label: 'Tecnologia da Informação', group: 'graduation', classification: 'transversal' },
  { id: 'grad-comunicacao', label: 'Comunicação / Jornalismo / Publicidade', group: 'graduation', classification: 'transversal' },
  { id: 'grad-psicologia', label: 'Psicologia', group: 'graduation', classification: 'transversal' },
  { id: 'grad-gestao-publica', label: 'Gestão Pública', group: 'graduation', classification: 'transversal' },
  { id: 'grad-ciencias-sociais', label: 'Ciências Sociais / Políticas', group: 'graduation', classification: 'transversal' },
  { id: 'grad-marketing', label: 'Marketing', group: 'graduation', classification: 'transversal' },
  { id: 'grad-relacoes-internacionais', label: 'Relações Internacionais', group: 'graduation', classification: 'transversal' },

  // ============================================================
  // NOMES DOS COLABORADORES (49 participantes do SEBRAE TO)
  // ============================================================
  { id: 'name-admary-monteiro-barbosa', label: 'Admary Monteiro Barbosa', group: 'name', classification: 'transversal' },
  { id: 'name-aldeni-batista-torres', label: 'Aldeni Batista Torres', group: 'name', classification: 'transversal' },
  { id: 'name-alencar-hubner-borelli', label: 'Alencar Hubner Borelli', group: 'name', classification: 'transversal' },
  { id: 'name-alorran-de-freitas-barbosa', label: 'Alorran de Freitas Barbosa', group: 'name', classification: 'transversal' },
  { id: 'name-amaggeldo-barbosa', label: 'Amaggeldo Barbosa', group: 'name', classification: 'transversal' },
  { id: 'name-ana-cassia-de-oliveira-costa', label: 'Ana Cássia de Oliveira Costa', group: 'name', classification: 'transversal' },
  { id: 'name-ana-paula-alves-santos', label: 'Ana Paula Alves Santos', group: 'name', classification: 'transversal' },
  { id: 'name-andre-silva-gomes', label: 'Andre Silva Gomes', group: 'name', classification: 'transversal' },
  { id: 'name-andreia-rodrigues-facundes', label: 'Andreia Rodrigues Facundes', group: 'name', classification: 'transversal' },
  { id: 'name-antonio-louca-curcino', label: 'Antonio Louça Curcino', group: 'name', classification: 'transversal' },
  { id: 'name-antonio-luis-ferreira-dos-anjos-filho', label: 'Antonio Luis Ferreira dos Anjos Filho', group: 'name', classification: 'transversal' },
  { id: 'name-bruno-de-jesus-rodrigues', label: 'Bruno de Jesus Rodrigues', group: 'name', classification: 'transversal' },
  { id: 'name-bruno-henrique-vila-verde', label: 'Bruno Henrique Vila Verde', group: 'name', classification: 'transversal' },
  { id: 'name-bruno-martins-vieira', label: 'Bruno Martins Vieira', group: 'name', classification: 'transversal' },
  { id: 'name-cesar-augusto-de-sa-moreira', label: 'Cesar Augusto De Sa Moreira', group: 'name', classification: 'transversal' },
  { id: 'name-denise-da-silva-nunes', label: 'Denise da Silva Nunes', group: 'name', classification: 'transversal' },
  { id: 'name-edvaldo-pereira-lima-junior', label: 'Edvaldo Pereira Lima Junior', group: 'name', classification: 'transversal' },
  { id: 'name-eligeneth-resplandes-pimentel-gomes', label: 'Eligeneth Resplandes Pimentel Gomes', group: 'name', classification: 'transversal' },
  { id: 'name-eliwania-dos-santos-silva', label: 'Eliwania Dos Santos Silva', group: 'name', classification: 'transversal' },
  { id: 'name-emerson-montenegro-lima', label: 'Emerson Montenegro Lima', group: 'name', classification: 'transversal' },
  { id: 'name-francisco-de-assis-dias-ramos', label: 'Francisco de Assis Dias Ramos', group: 'name', classification: 'transversal' },
  { id: 'name-gilzane-pereira-amaral', label: 'Gilzane Pereira Amaral', group: 'name', classification: 'transversal' },
  { id: 'name-hide-senna-de-sousa-soares', label: 'Hide Senna De Sousa Soares', group: 'name', classification: 'transversal' },
  { id: 'name-jacirley-pereira-do-nascimento', label: 'Jacirley Pereira Do Nascimento', group: 'name', classification: 'transversal' },
  { id: 'name-jackeline-de-souza-lima', label: 'Jackeline de Souza Lima', group: 'name', classification: 'transversal' },
  { id: 'name-joseane-rodrigues-leite', label: 'Joseane Rodrigues Leite', group: 'name', classification: 'transversal' },
  { id: 'name-juliana-masson-prediger', label: 'Juliana Masson Prediger', group: 'name', classification: 'transversal' },
  { id: 'name-layala-cardoso-da-silva-istofel', label: 'Layala Cardoso Da Silva Istofel', group: 'name', classification: 'transversal' },
  { id: 'name-leonardo-campelo-leite-guedes', label: 'Leonardo Campelo Leite Guedes', group: 'name', classification: 'transversal' },
  { id: 'name-luciana-carvalho-de-aguiar', label: 'Luciana Carvalho de Aguiar', group: 'name', classification: 'transversal' },
  { id: 'name-marcus-vinicius-vieira-queiroz', label: 'Marcus Vinicius Vieira Queiroz', group: 'name', classification: 'transversal' },
  { id: 'name-millena-pereira-lima-rodrigues', label: 'Millena Pereira Lima Rodrigues', group: 'name', classification: 'transversal' },
  { id: 'name-mirelle-soares-milhomens', label: 'Mirelle Soares Milhomens', group: 'name', classification: 'transversal' },
  { id: 'name-nemias-gomes', label: 'Nemias Gomes', group: 'name', classification: 'transversal' },
  { id: 'name-odilo-junior-oliveira-carvalho', label: 'Odilo Junior Oliveira Carvalho', group: 'name', classification: 'transversal' },
  { id: 'name-paula-dos-reis-coelho-alencar-sousa', label: 'Paula Dos Reis Coelho Alencar Sousa', group: 'name', classification: 'transversal' },
  { id: 'name-pedro-emilio-rodrigues-alves-de-araujo', label: 'Pedro Emilio Rodrigues Alves de Araujo', group: 'name', classification: 'transversal' },
  { id: 'name-pedro-junior-da-rocha-silva', label: 'Pedro Junior Da Rocha Silva', group: 'name', classification: 'transversal' },
  { id: 'name-renata-moura-alves-simas', label: 'Renata Moura Alves Simas', group: 'name', classification: 'transversal' },
  { id: 'name-thais-neres-vieira', label: 'Thais Neres Vieira', group: 'name', classification: 'transversal' },
  { id: 'name-thiago-dias-da-silva', label: 'Thiago Dias Da Silva', group: 'name', classification: 'transversal' },
  { id: 'name-thiago-milhomem-soares', label: 'Thiago Milhomem Soares', group: 'name', classification: 'transversal' },
  { id: 'name-valci-pereira-da-silva-junior', label: 'Valci Pereira Da Silva Junior', group: 'name', classification: 'transversal' },
  { id: 'name-vera-lucia-teodoro-braga', label: 'Vera Lucia Teodoro Braga', group: 'name', classification: 'transversal' },
  { id: 'name-vivian-nascimento-reis', label: 'Vivian Nascimento Reis', group: 'name', classification: 'transversal' },
  { id: 'name-walbenia-lemos-da-silva-torres', label: 'Walbenia Lemos da Silva Torres', group: 'name', classification: 'transversal' },
  { id: 'name-wandemberg-pereira-rodrigues', label: 'Wandemberg Pereira Rodrigues', group: 'name', classification: 'transversal' },
  { id: 'name-wanessa-sobreira-dos-santos-martins', label: 'Wanessa Sobreira dos Santos Martins', group: 'name', classification: 'transversal' },
  { id: 'name-wesley-cardoso-batista', label: 'Wesley Cardoso Batista', group: 'name', classification: 'transversal' },

  // ============================================================
  // MATRÍCULAS DOS COLABORADORES
  // ============================================================
  { id: 'matricula-667257', label: '667257', group: 'matricula', classification: 'transversal' },
  { id: 'matricula-667258', label: '667258', group: 'matricula', classification: 'transversal' },
  { id: 'matricula-667261', label: '667261', group: 'matricula', classification: 'transversal' },
  { id: 'matricula-667262', label: '667262', group: 'matricula', classification: 'transversal' },
  { id: 'matricula-667263', label: '667263', group: 'matricula', classification: 'transversal' },
  { id: 'matricula-667264', label: '667264', group: 'matricula', classification: 'transversal' },
  { id: 'matricula-667265', label: '667265', group: 'matricula', classification: 'transversal' },
  { id: 'matricula-667266', label: '667266', group: 'matricula', classification: 'transversal' },
  { id: 'matricula-667267', label: '667267', group: 'matricula', classification: 'transversal' },
  { id: 'matricula-667268', label: '667268', group: 'matricula', classification: 'transversal' },
  { id: 'matricula-667269', label: '667269', group: 'matricula', classification: 'transversal' },
  { id: 'matricula-667270', label: '667270', group: 'matricula', classification: 'transversal' },
  { id: 'matricula-667271', label: '667271', group: 'matricula', classification: 'transversal' },
  { id: 'matricula-667272', label: '667272', group: 'matricula', classification: 'transversal' },
  { id: 'matricula-667273', label: '667273', group: 'matricula', classification: 'transversal' },
  { id: 'matricula-667274', label: '667274', group: 'matricula', classification: 'transversal' },
  { id: 'matricula-667275', label: '667275', group: 'matricula', classification: 'transversal' },
  { id: 'matricula-667276', label: '667276', group: 'matricula', classification: 'transversal' },
  { id: 'matricula-667277', label: '667277', group: 'matricula', classification: 'transversal' },
  { id: 'matricula-667278', label: '667278', group: 'matricula', classification: 'transversal' },
  { id: 'matricula-667279', label: '667279', group: 'matricula', classification: 'transversal' },
  { id: 'matricula-667280', label: '667280', group: 'matricula', classification: 'transversal' },
  { id: 'matricula-667281', label: '667281', group: 'matricula', classification: 'transversal' },
  { id: 'matricula-667282', label: '667282', group: 'matricula', classification: 'transversal' },
  { id: 'matricula-667283', label: '667283', group: 'matricula', classification: 'transversal' },
  { id: 'matricula-667284', label: '667284', group: 'matricula', classification: 'transversal' },
  { id: 'matricula-667285', label: '667285', group: 'matricula', classification: 'transversal' },
  { id: 'matricula-667286', label: '667286', group: 'matricula', classification: 'transversal' },
  { id: 'matricula-667287', label: '667287', group: 'matricula', classification: 'transversal' },
  { id: 'matricula-667288', label: '667288', group: 'matricula', classification: 'transversal' },
  { id: 'matricula-667289', label: '667289', group: 'matricula', classification: 'transversal' },
  { id: 'matricula-667290', label: '667290', group: 'matricula', classification: 'transversal' },
  { id: 'matricula-667291', label: '667291', group: 'matricula', classification: 'transversal' },
  { id: 'matricula-667292', label: '667292', group: 'matricula', classification: 'transversal' },
  { id: 'matricula-667293', label: '667293', group: 'matricula', classification: 'transversal' },
  { id: 'matricula-676284', label: '676284', group: 'matricula', classification: 'transversal' },
  { id: 'matricula-667295', label: '667295', group: 'matricula', classification: 'transversal' },
  { id: 'matricula-676292', label: '676292', group: 'matricula', classification: 'transversal' },
  { id: 'matricula-667297', label: '667297', group: 'matricula', classification: 'transversal' },
  { id: 'matricula-667298', label: '667298', group: 'matricula', classification: 'transversal' },
  { id: 'matricula-667300', label: '667300', group: 'matricula', classification: 'transversal' },
  { id: 'matricula-667303', label: '667303', group: 'matricula', classification: 'transversal' },
  { id: 'matricula-676282', label: '676282', group: 'matricula', classification: 'transversal' },
  { id: 'matricula-667304', label: '667304', group: 'matricula', classification: 'transversal' },
  { id: 'matricula-667306', label: '667306', group: 'matricula', classification: 'transversal' },
  { id: 'matricula-696501', label: '696501', group: 'matricula', classification: 'transversal' },
  { id: 'matricula-696497', label: '696497', group: 'matricula', classification: 'transversal' },
  { id: 'matricula-702806', label: '702806', group: 'matricula', classification: 'transversal' },
  { id: 'matricula-676290', label: '676290', group: 'matricula', classification: 'transversal' },
  { id: 'matricula-676286', label: '676286', group: 'matricula', classification: 'transversal' },
];

export const ADMIN_USER = {
  email: 'admin@sebraeto.com.br',
  password: 'admin@sebrae2026'
};
