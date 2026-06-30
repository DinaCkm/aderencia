import { CatalogItem } from './types';

// ─────────────────────────────────────────────────────────────────────────────
// CATÁLOGO OFICIAL DE ITENS — gerado automaticamente a partir dos CSVs oficiais
// Fonte: Catalogo_Formacoes_por_Area_Matriz_Operacional.csv
//        Catalogo_Projetos_Estrategicos_por_Area_Matriz_Operacional.csv
// ─────────────────────────────────────────────────────────────────────────────

export const CATALOG_ITEMS: (CatalogItem & { points: number; aliases?: string[] })[] = [
  // ── GRADUAÇÕES ──────────────────────────────────────────────────────────────
  // CDE — Assessoria
  { id: 'grad-gab-administracao', label: 'Administração', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Administração', 'Administração de Empresas'] },
  { id: 'grad-gab-ciencia-da-computacao', label: 'Ciência da Computação', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Ciência da Computação'] },
  { id: 'grad-gab-ciencias-contabeis', label: 'Ciências Contábeis', group: 'graduation', classification: 'area-specific', points: 5, area: 'CDE', aliases: ['Ciências Contábeis', 'Contabilidade'] },
  { id: 'grad-gab-cursos-com-enfase-em-gestao-de-projetos', label: 'Cursos com ênfase em Gestão de Projetos', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Gestão de Projetos', 'Projetos', 'PMO', 'Project Management'] },
  { id: 'grad-gab-cursos-com-enfase-em-inovacao', label: 'Cursos com ênfase em Inovação', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Inovação', 'Gestão da Inovação', 'Transformação e Inovação'] },
  { id: 'grad-gab-cursos-com-enfase-em-lideranca', label: 'Cursos com ênfase em Liderança', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Liderança', 'Desenvolvimento de Lideranças', 'Liderança Estratégica'] },
  { id: 'grad-gab-direito', label: 'Direito', group: 'graduation', classification: 'area-specific', points: 5, area: 'CDE', aliases: ['Direito'] },
  { id: 'grad-gab-engenharia-de-producao', label: 'Engenharia de Produção', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Engenharia de Produção'] },
  { id: 'grad-gab-gestao-de-pessoas', label: 'Gestão de Pessoas', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Gestão de Pessoas', 'Recursos Humanos', 'RH'] },
  { id: 'grad-gab-gestao-publica', label: 'Gestão Pública', group: 'graduation', classification: 'area-specific', points: 5, area: 'CDE', aliases: ['Gestão Pública', 'Administração Pública'] },
  { id: 'grad-gab-psicologia-organizacional', label: 'Psicologia Organizacional', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Psicologia Organizacional', 'Psicologia do Trabalho'] },
  { id: 'grad-gab-secretariado-executivo', label: 'Secretariado Executivo', group: 'graduation', classification: 'area-specific', points: 5, area: 'CDE', aliases: ['Secretariado Executivo'] },
  { id: 'grad-gab-sistemasti', label: 'Sistemas/TI', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Sistemas/TI', 'Sistemas de Informação', 'Tecnologia da Informação', 'TI'] },
  { id: 'grad-gab-tecnologia-da-informacao', label: 'Tecnologia da Informação', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Tecnologia da Informação', 'TI'] },
  // UAUD
  { id: 'grad-uaud-administracao', label: 'Administração', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Administração', 'Administração de Empresas'] },
  { id: 'grad-uaud-ciencia-da-computacao', label: 'Ciência da Computação', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Ciência da Computação'] },
  { id: 'grad-uaud-ciencias-contabeis', label: 'Ciências Contábeis', group: 'graduation', classification: 'area-specific', points: 5, area: 'UAUD', aliases: ['Ciências Contábeis', 'Contabilidade'] },
  { id: 'grad-uaud-cursos-com-enfase-em-gestao-de-projetos', label: 'Cursos com ênfase em Gestão de Projetos', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Gestão de Projetos', 'Projetos', 'PMO', 'Project Management'] },
  { id: 'grad-uaud-cursos-com-enfase-em-inovacao', label: 'Cursos com ênfase em Inovação', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Inovação', 'Gestão da Inovação', 'Transformação e Inovação'] },
  { id: 'grad-uaud-cursos-com-enfase-em-lideranca', label: 'Cursos com ênfase em Liderança', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Liderança', 'Desenvolvimento de Lideranças', 'Liderança Estratégica'] },
  { id: 'grad-uaud-direito', label: 'Direito', group: 'graduation', classification: 'area-specific', points: 5, area: 'UAUD', aliases: ['Direito'] },
  { id: 'grad-uaud-economia', label: 'Economia', group: 'graduation', classification: 'area-specific', points: 5, area: 'UAUD', aliases: ['Economia'] },
  { id: 'grad-uaud-engenharia-de-producao', label: 'Engenharia de Produção', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Engenharia de Produção'] },
  { id: 'grad-uaud-gestao-de-pessoas', label: 'Gestão de Pessoas', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Gestão de Pessoas', 'Recursos Humanos', 'RH'] },
  { id: 'grad-uaud-psicologia-organizacional', label: 'Psicologia Organizacional', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Psicologia Organizacional', 'Psicologia do Trabalho'] },
  { id: 'grad-uaud-sistemasti', label: 'Sistemas/TI', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Sistemas/TI', 'Sistemas de Informação', 'Tecnologia da Informação', 'TI'] },
  { id: 'grad-uaud-tecnologia-da-informacao', label: 'Tecnologia da Informação', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Tecnologia da Informação', 'TI'] },
  // URI
  { id: 'grad-uri-administracao', label: 'Administração', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Administração', 'Administração de Empresas'] },
  { id: 'grad-uri-ciencia-da-computacao', label: 'Ciência da Computação', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Ciência da Computação'] },
  { id: 'grad-uri-ciencias-sociais', label: 'Ciências Sociais', group: 'graduation', classification: 'area-specific', points: 5, area: 'URI', aliases: ['Ciências Sociais'] },
  { id: 'grad-uri-cursos-com-enfase-em-gestao-de-projetos', label: 'Cursos com ênfase em Gestão de Projetos', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Gestão de Projetos', 'Projetos', 'PMO', 'Project Management'] },
  { id: 'grad-uri-cursos-com-enfase-em-inovacao', label: 'Cursos com ênfase em Inovação', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Inovação', 'Gestão da Inovação', 'Transformação e Inovação'] },
  { id: 'grad-uri-cursos-com-enfase-em-lideranca', label: 'Cursos com ênfase em Liderança', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Liderança', 'Desenvolvimento de Lideranças', 'Liderança Estratégica'] },
  { id: 'grad-uri-economia', label: 'Economia', group: 'graduation', classification: 'area-specific', points: 5, area: 'URI', aliases: ['Economia'] },
  { id: 'grad-uri-engenharia-de-producao', label: 'Engenharia de Produção', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Engenharia de Produção'] },
  { id: 'grad-uri-gestao-de-pessoas', label: 'Gestão de Pessoas', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Gestão de Pessoas', 'Recursos Humanos', 'RH'] },
  { id: 'grad-uri-gestao-publica', label: 'Gestão Pública', group: 'graduation', classification: 'area-specific', points: 5, area: 'URI', aliases: ['Gestão Pública', 'Administração Pública'] },
  { id: 'grad-uri-psicologia-organizacional', label: 'Psicologia Organizacional', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Psicologia Organizacional', 'Psicologia do Trabalho'] },
  { id: 'grad-uri-relacoes-internacionais', label: 'Relações Internacionais', group: 'graduation', classification: 'area-specific', points: 5, area: 'URI', aliases: ['Relações Internacionais'] },
  { id: 'grad-uri-sistemasti', label: 'Sistemas/TI', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Sistemas/TI', 'Sistemas de Informação', 'Tecnologia da Informação', 'TI'] },
  { id: 'grad-uri-tecnologia-da-informacao', label: 'Tecnologia da Informação', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Tecnologia da Informação', 'TI'] },
  // UGE
  { id: 'grad-uge-administracao', label: 'Administração', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Administração', 'Administração de Empresas'] },
  { id: 'grad-uge-ciencia-da-computacao', label: 'Ciência da Computação', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Ciência da Computação'] },
  { id: 'grad-uge-ciencias-contabeis', label: 'Ciências Contábeis', group: 'graduation', classification: 'area-specific', points: 5, area: 'UGE', aliases: ['Ciências Contábeis', 'Contabilidade'] },
  { id: 'grad-uge-cursos-com-enfase-em-gestao-de-projetos', label: 'Cursos com ênfase em Gestão de Projetos', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Gestão de Projetos', 'Projetos', 'PMO', 'Project Management'] },
  { id: 'grad-uge-cursos-com-enfase-em-inovacao', label: 'Cursos com ênfase em Inovação', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Inovação', 'Gestão da Inovação', 'Transformação e Inovação'] },
  { id: 'grad-uge-cursos-com-enfase-em-lideranca', label: 'Cursos com ênfase em Liderança', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Liderança', 'Desenvolvimento de Lideranças', 'Liderança Estratégica'] },
  { id: 'grad-uge-economia', label: 'Economia', group: 'graduation', classification: 'area-specific', points: 5, area: 'UGE', aliases: ['Economia'] },
  { id: 'grad-uge-engenharia-de-producao', label: 'Engenharia de Produção', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Engenharia de Produção'] },
  { id: 'grad-uge-estatistica', label: 'Estatística', group: 'graduation', classification: 'area-specific', points: 5, area: 'UGE', aliases: ['Estatística'] },
  { id: 'grad-uge-gestao-de-pessoas', label: 'Gestão de Pessoas', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Gestão de Pessoas', 'Recursos Humanos', 'RH'] },
  { id: 'grad-uge-psicologia-organizacional', label: 'Psicologia Organizacional', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Psicologia Organizacional', 'Psicologia do Trabalho'] },
  { id: 'grad-uge-sistemasti', label: 'Sistemas/TI', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Sistemas/TI', 'Sistemas de Informação', 'Tecnologia da Informação', 'TI'] },
  { id: 'grad-uge-tecnologia-da-informacao', label: 'Tecnologia da Informação', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Tecnologia da Informação', 'TI'] },
  // UMC
  { id: 'grad-umc-administracao', label: 'Administração', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Administração', 'Administração de Empresas'] },
  { id: 'grad-umc-ciencia-da-computacao', label: 'Ciência da Computação', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Ciência da Computação'] },
  { id: 'grad-umc-comunicacao-social', label: 'Comunicação Social', group: 'graduation', classification: 'area-specific', points: 5, area: 'UMC', aliases: ['Comunicação Social'] },
  { id: 'grad-umc-cursos-com-enfase-em-gestao-de-projetos', label: 'Cursos com ênfase em Gestão de Projetos', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Gestão de Projetos', 'Projetos', 'PMO', 'Project Management'] },
  { id: 'grad-umc-cursos-com-enfase-em-inovacao', label: 'Cursos com ênfase em Inovação', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Inovação', 'Gestão da Inovação', 'Transformação e Inovação'] },
  { id: 'grad-umc-cursos-com-enfase-em-lideranca', label: 'Cursos com ênfase em Liderança', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Liderança', 'Desenvolvimento de Lideranças', 'Liderança Estratégica'] },
  { id: 'grad-umc-design', label: 'Design', group: 'graduation', classification: 'area-specific', points: 5, area: 'UMC', aliases: ['Design'] },
  { id: 'grad-umc-engenharia-de-producao', label: 'Engenharia de Produção', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Engenharia de Produção'] },
  { id: 'grad-umc-gestao-de-pessoas', label: 'Gestão de Pessoas', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Gestão de Pessoas', 'Recursos Humanos', 'RH'] },
  { id: 'grad-umc-marketing', label: 'Marketing', group: 'graduation', classification: 'area-specific', points: 5, area: 'UMC', aliases: ['Marketing'] },
  { id: 'grad-umc-psicologia-organizacional', label: 'Psicologia Organizacional', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Psicologia Organizacional', 'Psicologia do Trabalho'] },
  { id: 'grad-umc-sistemasti', label: 'Sistemas/TI', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Sistemas/TI', 'Sistemas de Informação', 'Tecnologia da Informação', 'TI'] },
  { id: 'grad-umc-tecnologia-da-informacao', label: 'Tecnologia da Informação', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Tecnologia da Informação', 'TI'] },
  // CDE — Assessoria (Jurídico)
  { id: 'grad-ajur-administracao', label: 'Administração', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Administração', 'Administração de Empresas'] },
  { id: 'grad-ajur-ciencia-da-computacao', label: 'Ciência da Computação', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Ciência da Computação'] },
  { id: 'grad-ajur-cursos-com-enfase-em-gestao-de-projetos', label: 'Cursos com ênfase em Gestão de Projetos', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Gestão de Projetos', 'Projetos', 'PMO', 'Project Management'] },
  { id: 'grad-ajur-cursos-com-enfase-em-inovacao', label: 'Cursos com ênfase em Inovação', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Inovação', 'Gestão da Inovação', 'Transformação e Inovação'] },
  { id: 'grad-ajur-cursos-com-enfase-em-lideranca', label: 'Cursos com ênfase em Liderança', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Liderança', 'Desenvolvimento de Lideranças', 'Liderança Estratégica'] },
  { id: 'grad-ajur-direito', label: 'Direito', group: 'graduation', classification: 'area-specific', points: 5, area: 'CDE', aliases: ['Direito'] },
  { id: 'grad-ajur-engenharia-de-producao', label: 'Engenharia de Produção', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Engenharia de Produção'] },
  { id: 'grad-ajur-gestao-de-pessoas', label: 'Gestão de Pessoas', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Gestão de Pessoas', 'Recursos Humanos', 'RH'] },
  { id: 'grad-ajur-psicologia-organizacional', label: 'Psicologia Organizacional', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Psicologia Organizacional', 'Psicologia do Trabalho'] },
  { id: 'grad-ajur-sistemasti', label: 'Sistemas/TI', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Sistemas/TI', 'Sistemas de Informação', 'Tecnologia da Informação', 'TI'] },
  { id: 'grad-ajur-tecnologia-da-informacao', label: 'Tecnologia da Informação', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Tecnologia da Informação', 'TI'] },
  // UGP
  { id: 'grad-ugp-administracao', label: 'Administração', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Administração', 'Administração de Empresas'] },
  { id: 'grad-ugp-ciencia-da-computacao', label: 'Ciência da Computação', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Ciência da Computação'] },
  { id: 'grad-ugp-cursos-com-enfase-em-gestao-de-projetos', label: 'Cursos com ênfase em Gestão de Projetos', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Gestão de Projetos', 'Projetos', 'PMO', 'Project Management'] },
  { id: 'grad-ugp-cursos-com-enfase-em-inovacao', label: 'Cursos com ênfase em Inovação', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Inovação', 'Gestão da Inovação', 'Transformação e Inovação'] },
  { id: 'grad-ugp-cursos-com-enfase-em-lideranca', label: 'Cursos com ênfase em Liderança', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Liderança', 'Desenvolvimento de Lideranças', 'Liderança Estratégica'] },
  { id: 'grad-ugp-engenharia-de-producao', label: 'Engenharia de Produção', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Engenharia de Produção'] },
  { id: 'grad-ugp-gestao-de-pessoas', label: 'Gestão de Pessoas', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Gestão de Pessoas', 'Recursos Humanos', 'RH'] },
  { id: 'grad-ugp-pedagogia', label: 'Pedagogia', group: 'graduation', classification: 'area-specific', points: 5, area: 'UGP', aliases: ['Pedagogia', 'Pedagogia Empresarial'] },
  { id: 'grad-ugp-psicologia', label: 'Psicologia', group: 'graduation', classification: 'area-specific', points: 5, area: 'UGP', aliases: ['Psicologia'] },
  { id: 'grad-ugp-psicologia-organizacional', label: 'Psicologia Organizacional', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Psicologia Organizacional', 'Psicologia do Trabalho'] },
  { id: 'grad-ugp-rh', label: 'RH', group: 'graduation', classification: 'area-specific', points: 5, area: 'UGP', aliases: ['RH', 'Recursos Humanos', 'Gestão de Pessoas'] },
  { id: 'grad-ugp-sistemasti', label: 'Sistemas/TI', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Sistemas/TI', 'Sistemas de Informação', 'Tecnologia da Informação', 'TI'] },
  { id: 'grad-ugp-tecnologia-da-informacao', label: 'Tecnologia da Informação', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Tecnologia da Informação', 'TI'] },
  // UAF
  { id: 'grad-uas-administracao', label: 'Administração', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Administração', 'Administração de Empresas'] },
  { id: 'grad-uas-ciencia-da-computacao', label: 'Ciência da Computação', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Ciência da Computação'] },
  { id: 'grad-uas-cursos-com-enfase-em-gestao-de-projetos', label: 'Cursos com ênfase em Gestão de Projetos', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Gestão de Projetos', 'Projetos', 'PMO', 'Project Management'] },
  { id: 'grad-uas-cursos-com-enfase-em-inovacao', label: 'Cursos com ênfase em Inovação', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Inovação', 'Gestão da Inovação', 'Transformação e Inovação'] },
  { id: 'grad-uas-cursos-com-enfase-em-lideranca', label: 'Cursos com ênfase em Liderança', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Liderança', 'Desenvolvimento de Lideranças', 'Liderança Estratégica'] },
  { id: 'grad-uas-engenharia-de-producao', label: 'Engenharia de Produção', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Engenharia de Produção'] },
  { id: 'grad-uas-gestao-de-pessoas', label: 'Gestão de Pessoas', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Gestão de Pessoas', 'Recursos Humanos', 'RH'] },
  { id: 'grad-uas-logistica', label: 'Logística', group: 'graduation', classification: 'area-specific', points: 5, area: 'UAF', aliases: ['Logística'] },
  { id: 'grad-uas-psicologia-organizacional', label: 'Psicologia Organizacional', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Psicologia Organizacional', 'Psicologia do Trabalho'] },
  { id: 'grad-uas-sistemasti', label: 'Sistemas/TI', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Sistemas/TI', 'Sistemas de Informação', 'Tecnologia da Informação', 'TI'] },
  { id: 'grad-uas-tecnologia-da-informacao', label: 'Tecnologia da Informação', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Tecnologia da Informação', 'TI'] },
  // UGOC
  { id: 'grad-ugoc-administracao', label: 'Administração', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Administração', 'Administração de Empresas'] },
  { id: 'grad-ugoc-ciencia-da-computacao', label: 'Ciência da Computação', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Ciência da Computação'] },
  { id: 'grad-ugoc-ciencias-contabeis', label: 'Ciências Contábeis', group: 'graduation', classification: 'area-specific', points: 5, area: 'UGOC', aliases: ['Ciências Contábeis', 'Contabilidade'] },
  { id: 'grad-ugoc-cursos-com-enfase-em-gestao-de-projetos', label: 'Cursos com ênfase em Gestão de Projetos', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Gestão de Projetos', 'Projetos', 'PMO', 'Project Management'] },
  { id: 'grad-ugoc-cursos-com-enfase-em-inovacao', label: 'Cursos com ênfase em Inovação', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Inovação', 'Gestão da Inovação', 'Transformação e Inovação'] },
  { id: 'grad-ugoc-cursos-com-enfase-em-lideranca', label: 'Cursos com ênfase em Liderança', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Liderança', 'Desenvolvimento de Lideranças', 'Liderança Estratégica'] },
  { id: 'grad-ugoc-economia', label: 'Economia', group: 'graduation', classification: 'area-specific', points: 5, area: 'UGOC', aliases: ['Economia'] },
  { id: 'grad-ugoc-engenharia-de-producao', label: 'Engenharia de Produção', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Engenharia de Produção'] },
  { id: 'grad-ugoc-gestao-de-pessoas', label: 'Gestão de Pessoas', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Gestão de Pessoas', 'Recursos Humanos', 'RH'] },
  { id: 'grad-ugoc-psicologia-organizacional', label: 'Psicologia Organizacional', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Psicologia Organizacional', 'Psicologia do Trabalho'] },
  { id: 'grad-ugoc-sistemasti', label: 'Sistemas/TI', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Sistemas/TI', 'Sistemas de Informação', 'Tecnologia da Informação', 'TI'] },
  { id: 'grad-ugoc-tecnologia-da-informacao', label: 'Tecnologia da Informação', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Tecnologia da Informação', 'TI'] },
  // UTIC
  { id: 'grad-utic-administracao', label: 'Administração', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Administração', 'Administração de Empresas'] },
  { id: 'grad-utic-ads', label: 'ADS', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Análise e Desenvolvimento de Sistemas', 'ADS'] },
  { id: 'grad-utic-ciencia-da-computacao', label: 'Ciência da Computação', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Ciência da Computação'] },
  { id: 'grad-utic-cursos-com-enfase-em-gestao-de-projetos', label: 'Cursos com ênfase em Gestão de Projetos', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Gestão de Projetos', 'Projetos', 'PMO', 'Project Management'] },
  { id: 'grad-utic-cursos-com-enfase-em-inovacao', label: 'Cursos com ênfase em Inovação', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Inovação', 'Gestão da Inovação', 'Transformação e Inovação'] },
  { id: 'grad-utic-cursos-com-enfase-em-lideranca', label: 'Cursos com ênfase em Liderança', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Liderança', 'Desenvolvimento de Lideranças', 'Liderança Estratégica'] },
  { id: 'grad-utic-engenharia-da-computacao', label: 'Engenharia da Computação', group: 'graduation', classification: 'area-specific', points: 5, area: 'UTIC', aliases: ['Engenharia da Computação'] },
  { id: 'grad-utic-engenharia-de-producao', label: 'Engenharia de Produção', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Engenharia de Produção'] },
  { id: 'grad-utic-gestao-de-pessoas', label: 'Gestão de Pessoas', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Gestão de Pessoas', 'Recursos Humanos', 'RH'] },
  { id: 'grad-utic-psicologia-organizacional', label: 'Psicologia Organizacional', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Psicologia Organizacional', 'Psicologia do Trabalho'] },
  { id: 'grad-utic-sistemas-de-informacao', label: 'Sistemas de Informação', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Sistemas de Informação', 'Sistemas/TI'] },
  { id: 'grad-utic-sistemasti', label: 'Sistemas/TI', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Sistemas/TI', 'Sistemas de Informação', 'Tecnologia da Informação', 'TI'] },
  { id: 'grad-utic-tecnologia-da-informacao', label: 'Tecnologia da Informação', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Tecnologia da Informação', 'TI'] },
  // URC
  { id: 'grad-urc-administracao', label: 'Administração', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Administração', 'Administração de Empresas'] },
  { id: 'grad-urc-ciencia-da-computacao', label: 'Ciência da Computação', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Ciência da Computação'] },
  { id: 'grad-urc-comunicacao', label: 'Comunicação', group: 'graduation', classification: 'area-specific', points: 5, area: 'URC', aliases: ['Comunicação', 'Comunicação Social'] },
  { id: 'grad-urc-cursos-com-enfase-em-gestao-de-projetos', label: 'Cursos com ênfase em Gestão de Projetos', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Gestão de Projetos', 'Projetos', 'PMO', 'Project Management'] },
  { id: 'grad-urc-cursos-com-enfase-em-inovacao', label: 'Cursos com ênfase em Inovação', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Inovação', 'Gestão da Inovação', 'Transformação e Inovação'] },
  { id: 'grad-urc-cursos-com-enfase-em-lideranca', label: 'Cursos com ênfase em Liderança', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Liderança', 'Desenvolvimento de Lideranças', 'Liderança Estratégica'] },
  { id: 'grad-urc-engenharia-de-producao', label: 'Engenharia de Produção', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Engenharia de Produção'] },
  { id: 'grad-urc-gestao-comercial', label: 'Gestão Comercial', group: 'graduation', classification: 'area-specific', points: 5, area: 'URC', aliases: ['Gestão Comercial'] },
  { id: 'grad-urc-gestao-de-pessoas', label: 'Gestão de Pessoas', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Gestão de Pessoas', 'Recursos Humanos', 'RH'] },
  { id: 'grad-urc-marketing', label: 'Marketing', group: 'graduation', classification: 'area-specific', points: 5, area: 'URC', aliases: ['Marketing'] },
  { id: 'grad-urc-psicologia-organizacional', label: 'Psicologia Organizacional', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Psicologia Organizacional', 'Psicologia do Trabalho'] },
  { id: 'grad-urc-sistemasti', label: 'Sistemas/TI', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Sistemas/TI', 'Sistemas de Informação', 'Tecnologia da Informação', 'TI'] },
  { id: 'grad-urc-tecnologia-da-informacao', label: 'Tecnologia da Informação', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Tecnologia da Informação', 'TI'] },
  // UAC
  { id: 'grad-uac-administracao', label: 'Administração', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Administração', 'Administração de Empresas'] },
  { id: 'grad-uac-ciencia-da-computacao', label: 'Ciência da Computação', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Ciência da Computação'] },
  { id: 'grad-uac-ciencias-sociais', label: 'Ciências Sociais', group: 'graduation', classification: 'area-specific', points: 5, area: 'UAC', aliases: ['Ciências Sociais'] },
  { id: 'grad-uac-cursos-com-enfase-em-gestao-de-projetos', label: 'Cursos com ênfase em Gestão de Projetos', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Gestão de Projetos', 'Projetos', 'PMO', 'Project Management'] },
  { id: 'grad-uac-cursos-com-enfase-em-inovacao', label: 'Cursos com ênfase em Inovação', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Inovação', 'Gestão da Inovação', 'Transformação e Inovação'] },
  { id: 'grad-uac-cursos-com-enfase-em-lideranca', label: 'Cursos com ênfase em Liderança', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Liderança', 'Desenvolvimento de Lideranças', 'Liderança Estratégica'] },
  { id: 'grad-uac-economia', label: 'Economia', group: 'graduation', classification: 'area-specific', points: 5, area: 'UAC', aliases: ['Economia'] },
  { id: 'grad-uac-engenharia-de-producao', label: 'Engenharia de Produção', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Engenharia de Produção'] },
  { id: 'grad-uac-gestao-de-pessoas', label: 'Gestão de Pessoas', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Gestão de Pessoas', 'Recursos Humanos', 'RH'] },
  { id: 'grad-uac-psicologia-organizacional', label: 'Psicologia Organizacional', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Psicologia Organizacional', 'Psicologia do Trabalho'] },
  { id: 'grad-uac-sistemasti', label: 'Sistemas/TI', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Sistemas/TI', 'Sistemas de Informação', 'Tecnologia da Informação', 'TI'] },
  { id: 'grad-uac-tecnologia-da-informacao', label: 'Tecnologia da Informação', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Tecnologia da Informação', 'TI'] },
  // REGIONAIS
  { id: 'grad-regionais-administracao', label: 'Administração', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Administração', 'Administração de Empresas'] },
  { id: 'grad-regionais-ciencia-da-computacao', label: 'Ciência da Computação', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Ciência da Computação'] },
  { id: 'grad-regionais-ciencias-contabeis', label: 'Ciências Contábeis', group: 'graduation', classification: 'area-specific', points: 5, area: 'REGIONAIS', aliases: ['Ciências Contábeis', 'Contabilidade'] },
  { id: 'grad-regionais-cursos-com-enfase-em-gestao-de-projetos', label: 'Cursos com ênfase em Gestão de Projetos', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Gestão de Projetos', 'Projetos', 'PMO', 'Project Management'] },
  { id: 'grad-regionais-cursos-com-enfase-em-inovacao', label: 'Cursos com ênfase em Inovação', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Inovação', 'Gestão da Inovação', 'Transformação e Inovação'] },
  { id: 'grad-regionais-cursos-com-enfase-em-lideranca', label: 'Cursos com ênfase em Liderança', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Liderança', 'Desenvolvimento de Lideranças', 'Liderança Estratégica'] },
  { id: 'grad-regionais-economia', label: 'Economia', group: 'graduation', classification: 'area-specific', points: 5, area: 'REGIONAIS', aliases: ['Economia'] },
  { id: 'grad-regionais-engenharia-de-producao', label: 'Engenharia de Produção', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Engenharia de Produção'] },
  { id: 'grad-regionais-gestao-de-pessoas', label: 'Gestão de Pessoas', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Gestão de Pessoas', 'Recursos Humanos', 'RH'] },
  { id: 'grad-regionais-gestao-publica', label: 'Gestão Pública', group: 'graduation', classification: 'area-specific', points: 5, area: 'REGIONAIS', aliases: ['Gestão Pública', 'Administração Pública'] },
  { id: 'grad-regionais-psicologia-organizacional', label: 'Psicologia Organizacional', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Psicologia Organizacional', 'Psicologia do Trabalho'] },
  { id: 'grad-regionais-sistemasti', label: 'Sistemas/TI', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Sistemas/TI', 'Sistemas de Informação', 'Tecnologia da Informação', 'TI'] },
  { id: 'grad-regionais-tecnologia-da-informacao', label: 'Tecnologia da Informação', group: 'graduation', classification: 'transversal', points: 20, aliases: ['Tecnologia da Informação', 'TI'] },

  // ── PÓS/MBA ──────────────────────────────────────────────────────────────────
  // CDE — Assessoria
  { id: 'pos-gab-administracao-publica', label: 'Administração Pública', group: 'postMBA', classification: 'area-specific', points: 20, area: 'CDE', aliases: ['Administração Pública'] },
  { id: 'pos-gab-compliance-e-integridade', label: 'Compliance e Integridade', group: 'postMBA', classification: 'area-specific', points: 20, area: 'CDE', aliases: ['Compliance', 'Integridade'] },
  { id: 'pos-gab-gestao-de-processos-organizacionais', label: 'Gestão de Processos Organizacionais', group: 'postMBA', classification: 'area-specific', points: 20, area: 'CDE', aliases: ['Gestão de Processos Organizacionais', 'Processos Organizacionais'] },
  { id: 'pos-gab-gestao-publica-ou-gestao-institucional', label: 'Gestão Pública ou Gestão Institucional', group: 'postMBA', classification: 'area-specific', points: 20, area: 'CDE', aliases: ['Gestão Pública', 'Gestão Institucional'] },
  { id: 'pos-gab-governanca-corporativa', label: 'Governança Corporativa', group: 'postMBA', classification: 'area-specific', points: 20, area: 'CDE', aliases: ['Governança Corporativa'] },
  { id: 'pos-gab-mbapos-em-estrategia-organizacional', label: 'MBA/Pós em Estratégia Organizacional', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Estratégia Organizacional', 'Gestão Estratégica', 'Planejamento Estratégico'] },
  { id: 'pos-gab-mbapos-em-gestao-de-pessoas', label: 'MBA/Pós em Gestão de Pessoas', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Gestão de Pessoas', 'People Analytics', 'RH Estratégico'] },
  { id: 'pos-gab-mbapos-em-gestao-de-projetos', label: 'MBA/Pós em Gestão de Projetos', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Gestão de Projetos', 'Projetos', 'PMO', 'Project Management'] },
  { id: 'pos-gab-mbapos-em-inovacao', label: 'MBA/Pós em Inovação', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Inovação', 'Gestão da Inovação', 'Transformação Digital e Inovação'] },
  { id: 'pos-gab-mbapos-em-lideranca', label: 'MBA/Pós em Liderança', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Liderança', 'Desenvolvimento de Lideranças', 'Liderança Estratégica'] },
  { id: 'pos-gab-mbapos-em-tecnologia', label: 'MBA/Pós em Tecnologia', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Tecnologia', 'Gestão de TI', 'Transformação Digital', 'TI'] },
  // UAUD
  { id: 'pos-uaud-auditoria-interna', label: 'Auditoria Interna', group: 'postMBA', classification: 'area-specific', points: 20, area: 'UAUD', aliases: ['Auditoria Interna'] },
  { id: 'pos-uaud-controladoria', label: 'Controladoria', group: 'postMBA', classification: 'area-specific', points: 20, area: 'UAUD', aliases: ['Controladoria'] },
  { id: 'pos-uaud-financas-corporativas', label: 'Finanças Corporativas', group: 'postMBA', classification: 'area-specific', points: 20, area: 'UAUD', aliases: ['Finanças Corporativas'] },
  { id: 'pos-uaud-gestao-de-riscos-corporativos', label: 'Gestão de Riscos Corporativos', group: 'postMBA', classification: 'area-specific', points: 20, area: 'UAUD', aliases: ['Gestão de Riscos Corporativos', 'Riscos Corporativos'] },
  { id: 'pos-uaud-governanca-riscos-e-compliance-grc', label: 'Governança, Riscos e Compliance (GRC)', group: 'postMBA', classification: 'area-specific', points: 20, area: 'UAUD', aliases: ['GRC', 'Governança, Riscos e Compliance', 'Governança Riscos e Compliance'] },
  { id: 'pos-uaud-mbapos-em-estrategia-organizacional', label: 'MBA/Pós em Estratégia Organizacional', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Estratégia Organizacional', 'Gestão Estratégica', 'Planejamento Estratégico'] },
  { id: 'pos-uaud-mbapos-em-gestao-de-pessoas', label: 'MBA/Pós em Gestão de Pessoas', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Gestão de Pessoas', 'People Analytics', 'RH Estratégico'] },
  { id: 'pos-uaud-mbapos-em-gestao-de-projetos', label: 'MBA/Pós em Gestão de Projetos', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Gestão de Projetos', 'Projetos', 'PMO', 'Project Management'] },
  { id: 'pos-uaud-mbapos-em-inovacao', label: 'MBA/Pós em Inovação', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Inovação', 'Gestão da Inovação', 'Transformação Digital e Inovação'] },
  { id: 'pos-uaud-mbapos-em-lideranca', label: 'MBA/Pós em Liderança', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Liderança', 'Desenvolvimento de Lideranças', 'Liderança Estratégica'] },
  { id: 'pos-uaud-mbapos-em-tecnologia', label: 'MBA/Pós em Tecnologia', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Tecnologia', 'Gestão de TI', 'Transformação Digital', 'TI'] },
  // URI
  { id: 'pos-uri-captacao-de-recursos-e-parcerias', label: 'Captação de Recursos e Parcerias', group: 'postMBA', classification: 'area-specific', points: 20, area: 'URI', aliases: ['Captação de Recursos', 'Parcerias'] },
  { id: 'pos-uri-desenvolvimento-territorial', label: 'Desenvolvimento Territorial', group: 'postMBA', classification: 'area-specific', points: 20, area: 'URI', aliases: ['Desenvolvimento Territorial'] },
  { id: 'pos-uri-gestao-estrategica', label: 'Gestão Estratégica', group: 'postMBA', classification: 'area-specific', points: 20, area: 'URI', aliases: ['Gestão Estratégica'] },
  { id: 'pos-uri-mbapos-em-estrategia-organizacional', label: 'MBA/Pós em Estratégia Organizacional', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Estratégia Organizacional', 'Gestão Estratégica', 'Planejamento Estratégico'] },
  { id: 'pos-uri-mbapos-em-gestao-de-pessoas', label: 'MBA/Pós em Gestão de Pessoas', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Gestão de Pessoas', 'People Analytics', 'RH Estratégico'] },
  { id: 'pos-uri-mbapos-em-gestao-de-projetos', label: 'MBA/Pós em Gestão de Projetos', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Gestão de Projetos', 'Projetos', 'PMO', 'Project Management'] },
  { id: 'pos-uri-mbapos-em-inovacao', label: 'MBA/Pós em Inovação', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Inovação', 'Gestão da Inovação', 'Transformação Digital e Inovação'] },
  { id: 'pos-uri-mbapos-em-lideranca', label: 'MBA/Pós em Liderança', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Liderança', 'Desenvolvimento de Lideranças', 'Liderança Estratégica'] },
  { id: 'pos-uri-mbapos-em-tecnologia', label: 'MBA/Pós em Tecnologia', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Tecnologia', 'Gestão de TI', 'Transformação Digital', 'TI'] },
  { id: 'pos-uri-politicas-publicas', label: 'Políticas Públicas', group: 'postMBA', classification: 'area-specific', points: 20, area: 'URI', aliases: ['Políticas Públicas'] },
  { id: 'pos-uri-relacoes-institucionais-e-governamentais', label: 'Relações Institucionais e Governamentais', group: 'postMBA', classification: 'area-specific', points: 20, area: 'URI', aliases: ['Relações Institucionais e Governamentais'] },
  // UGE
  { id: 'pos-uge-esg-e-sustentabilidade', label: 'ESG e Sustentabilidade', group: 'postMBA', classification: 'area-specific', points: 20, area: 'UGE', aliases: ['ESG', 'Sustentabilidade'] },
  { id: 'pos-uge-gestao-da-inovacao', label: 'Gestão da Inovação', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Gestão da Inovação', 'Inovação'] },
  { id: 'pos-uge-gestao-de-riscos-e-compliance', label: 'Gestão de Riscos e Compliance', group: 'postMBA', classification: 'area-specific', points: 20, area: 'UGE', aliases: ['Gestão de Riscos e Compliance', 'Compliance'] },
  { id: 'pos-uge-inteligencia-estrategica-e-bi', label: 'Inteligência Estratégica e BI', group: 'postMBA', classification: 'area-specific', points: 20, area: 'UGE', aliases: ['Inteligência Estratégica', 'Business Intelligence', 'BI'] },
  { id: 'pos-uge-mbapos-em-estrategia-organizacional', label: 'MBA/Pós em Estratégia Organizacional', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Estratégia Organizacional', 'Gestão Estratégica', 'Planejamento Estratégico'] },
  { id: 'pos-uge-mbapos-em-gestao-de-pessoas', label: 'MBA/Pós em Gestão de Pessoas', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Gestão de Pessoas', 'People Analytics', 'RH Estratégico'] },
  { id: 'pos-uge-mbapos-em-gestao-de-projetos', label: 'MBA/Pós em Gestão de Projetos', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Gestão de Projetos', 'Projetos', 'PMO', 'Project Management'] },
  { id: 'pos-uge-mbapos-em-inovacao', label: 'MBA/Pós em Inovação', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Inovação', 'Gestão da Inovação', 'Transformação Digital e Inovação'] },
  { id: 'pos-uge-mbapos-em-lideranca', label: 'MBA/Pós em Liderança', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Liderança', 'Desenvolvimento de Lideranças', 'Liderança Estratégica'] },
  { id: 'pos-uge-mbapos-em-tecnologia', label: 'MBA/Pós em Tecnologia', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Tecnologia', 'Gestão de TI', 'Transformação Digital', 'TI'] },
  { id: 'pos-uge-planejamento-estrategico', label: 'Planejamento Estratégico', group: 'postMBA', classification: 'area-specific', points: 20, area: 'UGE', aliases: ['Planejamento Estratégico'] },
  // UMC
  { id: 'pos-umc-branding-e-gestao-de-marca', label: 'Branding e Gestão de Marca', group: 'postMBA', classification: 'area-specific', points: 20, area: 'UMC', aliases: ['Branding', 'Gestão de Marca'] },
  { id: 'pos-umc-comunicacao-corporativa', label: 'Comunicação Corporativa', group: 'postMBA', classification: 'area-specific', points: 20, area: 'UMC', aliases: ['Comunicação Corporativa'] },
  { id: 'pos-umc-comunicacao-publica-e-institucional', label: 'Comunicação Pública e Institucional', group: 'postMBA', classification: 'area-specific', points: 20, area: 'UMC', aliases: ['Comunicação Pública e Institucional'] },
  { id: 'pos-umc-marketing-digital', label: 'Marketing Digital', group: 'postMBA', classification: 'area-specific', points: 20, area: 'UMC', aliases: ['Marketing Digital'] },
  { id: 'pos-umc-marketing-estrategico', label: 'Marketing Estratégico', group: 'postMBA', classification: 'area-specific', points: 20, area: 'UMC', aliases: ['Marketing Estratégico'] },
  { id: 'pos-umc-mbapos-em-estrategia-organizacional', label: 'MBA/Pós em Estratégia Organizacional', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Estratégia Organizacional', 'Gestão Estratégica', 'Planejamento Estratégico'] },
  { id: 'pos-umc-mbapos-em-gestao-de-pessoas', label: 'MBA/Pós em Gestão de Pessoas', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Gestão de Pessoas', 'People Analytics', 'RH Estratégico'] },
  { id: 'pos-umc-mbapos-em-gestao-de-projetos', label: 'MBA/Pós em Gestão de Projetos', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Gestão de Projetos', 'Projetos', 'PMO', 'Project Management'] },
  { id: 'pos-umc-mbapos-em-inovacao', label: 'MBA/Pós em Inovação', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Inovação', 'Gestão da Inovação', 'Transformação Digital e Inovação'] },
  { id: 'pos-umc-mbapos-em-lideranca', label: 'MBA/Pós em Liderança', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Liderança', 'Desenvolvimento de Lideranças', 'Liderança Estratégica'] },
  { id: 'pos-umc-mbapos-em-tecnologia', label: 'MBA/Pós em Tecnologia', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Tecnologia', 'Gestão de TI', 'Transformação Digital', 'TI'] },
  // CDE — Assessoria (Jurídico)
  { id: 'pos-ajur-compliance-e-integridade', label: 'Compliance e Integridade', group: 'postMBA', classification: 'area-specific', points: 20, area: 'CDE', aliases: ['Compliance', 'Integridade'] },
  { id: 'pos-ajur-direito-administrativo', label: 'Direito Administrativo', group: 'postMBA', classification: 'area-specific', points: 20, area: 'CDE', aliases: ['Direito Administrativo'] },
  { id: 'pos-ajur-direito-empresarial', label: 'Direito Empresarial', group: 'postMBA', classification: 'area-specific', points: 20, area: 'CDE', aliases: ['Direito Empresarial'] },
  { id: 'pos-ajur-direito-publico', label: 'Direito Público', group: 'postMBA', classification: 'area-specific', points: 20, area: 'CDE', aliases: ['Direito Público'] },
  { id: 'pos-ajur-gestao-de-riscos-juridicos', label: 'Gestão de Riscos Jurídicos', group: 'postMBA', classification: 'area-specific', points: 20, area: 'CDE', aliases: ['Gestão de Riscos Jurídicos'] },
  { id: 'pos-ajur-mbapos-em-estrategia-organizacional', label: 'MBA/Pós em Estratégia Organizacional', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Estratégia Organizacional', 'Gestão Estratégica', 'Planejamento Estratégico'] },
  { id: 'pos-ajur-mbapos-em-gestao-de-pessoas', label: 'MBA/Pós em Gestão de Pessoas', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Gestão de Pessoas', 'People Analytics', 'RH Estratégico'] },
  { id: 'pos-ajur-mbapos-em-gestao-de-projetos', label: 'MBA/Pós em Gestão de Projetos', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Gestão de Projetos', 'Projetos', 'PMO', 'Project Management'] },
  { id: 'pos-ajur-mbapos-em-inovacao', label: 'MBA/Pós em Inovação', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Inovação', 'Gestão da Inovação', 'Transformação Digital e Inovação'] },
  { id: 'pos-ajur-mbapos-em-lideranca', label: 'MBA/Pós em Liderança', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Liderança', 'Desenvolvimento de Lideranças', 'Liderança Estratégica'] },
  { id: 'pos-ajur-mbapos-em-tecnologia', label: 'MBA/Pós em Tecnologia', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Tecnologia', 'Gestão de TI', 'Transformação Digital', 'TI'] },
  // UGP
  { id: 'pos-ugp-comportamento-e-desempenho', label: 'Comportamento e Desempenho', group: 'postMBA', classification: 'area-specific', points: 20, area: 'UGP', aliases: ['Comportamento e Desempenho'] },
  { id: 'pos-ugp-gestao-de-mudancas', label: 'Gestão de Mudanças', group: 'postMBA', classification: 'area-specific', points: 20, area: 'UGP', aliases: ['Gestão de Mudanças', 'Change Management'] },
  { id: 'pos-ugp-gestao-de-pessoas', label: 'Gestão de Pessoas', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Gestão de Pessoas', 'People Analytics', 'RH Estratégico'] },
  { id: 'pos-ugp-lideranca-e-desenvolvimento-humano', label: 'Liderança e Desenvolvimento Humano', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Liderança e Desenvolvimento Humano', 'Liderança'] },
  { id: 'pos-ugp-mbapos-em-estrategia-organizacional', label: 'MBA/Pós em Estratégia Organizacional', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Estratégia Organizacional', 'Gestão Estratégica', 'Planejamento Estratégico'] },
  { id: 'pos-ugp-mbapos-em-gestao-de-pessoas', label: 'MBA/Pós em Gestão de Pessoas', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Gestão de Pessoas', 'People Analytics', 'RH Estratégico'] },
  { id: 'pos-ugp-mbapos-em-gestao-de-projetos', label: 'MBA/Pós em Gestão de Projetos', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Gestão de Projetos', 'Projetos', 'PMO', 'Project Management'] },
  { id: 'pos-ugp-mbapos-em-inovacao', label: 'MBA/Pós em Inovação', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Inovação', 'Gestão da Inovação', 'Transformação Digital e Inovação'] },
  { id: 'pos-ugp-mbapos-em-lideranca', label: 'MBA/Pós em Liderança', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Liderança', 'Desenvolvimento de Lideranças', 'Liderança Estratégica'] },
  { id: 'pos-ugp-mbapos-em-tecnologia', label: 'MBA/Pós em Tecnologia', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Tecnologia', 'Gestão de TI', 'Transformação Digital', 'TI'] },
  { id: 'pos-ugp-psicologia-organizacional', label: 'Psicologia Organizacional', group: 'postMBA', classification: 'area-specific', points: 20, area: 'UGP', aliases: ['Psicologia Organizacional'] },
  { id: 'pos-ugp-rh-estrategico-analitico', label: 'RH Estratégico / Analítico', group: 'postMBA', classification: 'area-specific', points: 20, area: 'UGP', aliases: ['RH Estratégico', 'People Analytics', 'RH Analítico'] },
  // UAF
  { id: 'pos-uas-administracao-de-servicos', label: 'Administração de Serviços', group: 'postMBA', classification: 'area-specific', points: 20, area: 'UAF', aliases: ['Administração de Serviços'] },
  { id: 'pos-uas-gestao-de-operacoes', label: 'Gestão de Operações', group: 'postMBA', classification: 'area-specific', points: 20, area: 'UAF', aliases: ['Gestão de Operações'] },
  { id: 'pos-uas-gestao-patrimonial', label: 'Gestão Patrimonial', group: 'postMBA', classification: 'area-specific', points: 20, area: 'UAF', aliases: ['Gestão Patrimonial'] },
  { id: 'pos-uas-logistica-e-cadeia-de-suprimentos', label: 'Logística e Cadeia de Suprimentos', group: 'postMBA', classification: 'area-specific', points: 20, area: 'UAF', aliases: ['Logística e Cadeia de Suprimentos', 'Supply Chain'] },
  { id: 'pos-uaf-financas-corporativas', label: 'Finanças Corporativas', group: 'postMBA', classification: 'area-specific', points: 20, area: 'UAF', aliases: ['Finanças Corporativas', 'Finanças Empresariais'] },
  { id: 'pos-uaf-direito-administrativo', label: 'Direito Administrativo', group: 'postMBA', classification: 'area-specific', points: 20, area: 'UAF', aliases: ['Direito Administrativo'] },
  { id: 'pos-uas-mbapos-em-estrategia-organizacional', label: 'MBA/Pós em Estratégia Organizacional', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Estratégia Organizacional', 'Gestão Estratégica', 'Planejamento Estratégico'] },
  { id: 'pos-uas-mbapos-em-gestao-de-pessoas', label: 'MBA/Pós em Gestão de Pessoas', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Gestão de Pessoas', 'People Analytics', 'RH Estratégico'] },
  { id: 'pos-uas-mbapos-em-gestao-de-projetos', label: 'MBA/Pós em Gestão de Projetos', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Gestão de Projetos', 'Projetos', 'PMO', 'Project Management'] },
  { id: 'pos-uas-mbapos-em-inovacao', label: 'MBA/Pós em Inovação', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Inovação', 'Gestão da Inovação', 'Transformação Digital e Inovação'] },
  { id: 'pos-uas-mbapos-em-lideranca', label: 'MBA/Pós em Liderança', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Liderança', 'Desenvolvimento de Lideranças', 'Liderança Estratégica'] },
  { id: 'pos-uas-mbapos-em-tecnologia', label: 'MBA/Pós em Tecnologia', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Tecnologia', 'Gestão de TI', 'Transformação Digital', 'TI'] },
  // UGOC
  { id: 'pos-ugoc-contabilidade-gerencial', label: 'Contabilidade Gerencial', group: 'postMBA', classification: 'area-specific', points: 20, area: 'UGOC', aliases: ['Contabilidade Gerencial'] },
  { id: 'pos-ugoc-controladoria', label: 'Controladoria', group: 'postMBA', classification: 'area-specific', points: 20, area: 'UGOC', aliases: ['Controladoria'] },
  { id: 'pos-ugoc-financas-corporativas', label: 'Finanças Corporativas', group: 'postMBA', classification: 'area-specific', points: 20, area: 'UGOC', aliases: ['Finanças Corporativas'] },
  { id: 'pos-ugoc-mbapos-em-estrategia-organizacional', label: 'MBA/Pós em Estratégia Organizacional', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Estratégia Organizacional', 'Gestão Estratégica', 'Planejamento Estratégico'] },
  { id: 'pos-ugoc-mbapos-em-gestao-de-pessoas', label: 'MBA/Pós em Gestão de Pessoas', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Gestão de Pessoas', 'People Analytics', 'RH Estratégico'] },
  { id: 'pos-ugoc-mbapos-em-gestao-de-projetos', label: 'MBA/Pós em Gestão de Projetos', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Gestão de Projetos', 'Projetos', 'PMO', 'Project Management'] },
  { id: 'pos-ugoc-mbapos-em-inovacao', label: 'MBA/Pós em Inovação', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Inovação', 'Gestão da Inovação', 'Transformação Digital e Inovação'] },
  { id: 'pos-ugoc-mbapos-em-lideranca', label: 'MBA/Pós em Liderança', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Liderança', 'Desenvolvimento de Lideranças', 'Liderança Estratégica'] },
  { id: 'pos-ugoc-mbapos-em-tecnologia', label: 'MBA/Pós em Tecnologia', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Tecnologia', 'Gestão de TI', 'Transformação Digital', 'TI'] },
  { id: 'pos-ugoc-orcamento-publico', label: 'Orçamento Público', group: 'postMBA', classification: 'area-specific', points: 20, area: 'UGOC', aliases: ['Orçamento Público'] },
  { id: 'pos-ugoc-gestao-publica', label: 'Gestão Pública ou Gestão Institucional', group: 'postMBA', classification: 'area-specific', points: 20, area: 'UGOC', aliases: ['Gestão Pública', 'Gestão Institucional'] },
  { id: 'pos-ugoc-administracao-publica', label: 'Administração Pública', group: 'postMBA', classification: 'area-specific', points: 20, area: 'UGOC', aliases: ['Administração Pública'] },
  { id: 'pos-ugoc-direito-administrativo', label: 'Direito Administrativo', group: 'postMBA', classification: 'area-specific', points: 20, area: 'UGOC', aliases: ['Direito Administrativo'] },
  // UTIC
  { id: 'pos-utic-gestao-de-ti', label: 'Gestão de TI', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Gestão de TI', 'Tecnologia'] },
  { id: 'pos-utic-governanca-de-ti', label: 'Governança de TI', group: 'postMBA', classification: 'area-specific', points: 20, area: 'UTIC', aliases: ['Governança de TI'] },
  { id: 'pos-utic-lgpd', label: 'LGPD', group: 'postMBA', classification: 'area-specific', points: 20, area: 'UTIC', aliases: ['LGPD', 'Proteção de Dados'] },
  { id: 'pos-utic-mbapos-em-estrategia-organizacional', label: 'MBA/Pós em Estratégia Organizacional', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Estratégia Organizacional', 'Gestão Estratégica', 'Planejamento Estratégico'] },
  { id: 'pos-utic-mbapos-em-gestao-de-pessoas', label: 'MBA/Pós em Gestão de Pessoas', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Gestão de Pessoas', 'People Analytics', 'RH Estratégico'] },
  { id: 'pos-utic-mbapos-em-gestao-de-projetos', label: 'MBA/Pós em Gestão de Projetos', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Gestão de Projetos', 'Projetos', 'PMO', 'Project Management'] },
  { id: 'pos-utic-mbapos-em-inovacao', label: 'MBA/Pós em Inovação', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Inovação', 'Gestão da Inovação', 'Transformação Digital e Inovação'] },
  { id: 'pos-utic-mbapos-em-lideranca', label: 'MBA/Pós em Liderança', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Liderança', 'Desenvolvimento de Lideranças', 'Liderança Estratégica'] },
  { id: 'pos-utic-mbapos-em-tecnologia', label: 'MBA/Pós em Tecnologia', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Tecnologia', 'Gestão de TI', 'Transformação Digital', 'TI'] },
  { id: 'pos-utic-seguranca-da-informacao', label: 'Segurança da Informação', group: 'postMBA', classification: 'area-specific', points: 20, area: 'UTIC', aliases: ['Segurança da Informação'] },
  { id: 'pos-utic-transformacao-digital', label: 'Transformação Digital', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Transformação Digital'] },
  // URC
  { id: 'pos-urc-experiencia-do-cliente-cx', label: 'Experiência do Cliente (CX)', group: 'postMBA', classification: 'area-specific', points: 20, area: 'URC', aliases: ['Experiência do Cliente', 'CX'] },
  { id: 'pos-urc-gestao-de-relacionamento-com-clientes', label: 'Gestão de Relacionamento com Clientes', group: 'postMBA', classification: 'area-specific', points: 20, area: 'URC', aliases: ['Gestão de Relacionamento com Clientes', 'CRM'] },
  { id: 'pos-urc-gestao-de-servicos', label: 'Gestão de Serviços', group: 'postMBA', classification: 'area-specific', points: 20, area: 'URC', aliases: ['Gestão de Serviços'] },
  { id: 'pos-urc-mbapos-em-estrategia-organizacional', label: 'MBA/Pós em Estratégia Organizacional', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Estratégia Organizacional', 'Gestão Estratégica', 'Planejamento Estratégico'] },
  { id: 'pos-urc-mbapos-em-gestao-de-pessoas', label: 'MBA/Pós em Gestão de Pessoas', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Gestão de Pessoas', 'People Analytics', 'RH Estratégico'] },
  { id: 'pos-urc-mbapos-em-gestao-de-projetos', label: 'MBA/Pós em Gestão de Projetos', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Gestão de Projetos', 'Projetos', 'PMO', 'Project Management'] },
  { id: 'pos-urc-mbapos-em-inovacao', label: 'MBA/Pós em Inovação', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Inovação', 'Gestão da Inovação', 'Transformação Digital e Inovação'] },
  { id: 'pos-urc-mbapos-em-lideranca', label: 'MBA/Pós em Liderança', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Liderança', 'Desenvolvimento de Lideranças', 'Liderança Estratégica'] },
  { id: 'pos-urc-mbapos-em-tecnologia', label: 'MBA/Pós em Tecnologia', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Tecnologia', 'Gestão de TI', 'Transformação Digital', 'TI'] },
  // UAC
  { id: 'pos-uac-competitividade-e-inovacao', label: 'Competitividade e Inovação', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Competitividade e Inovação', 'Inovação'] },
  { id: 'pos-uac-desenvolvimento-territorial', label: 'Desenvolvimento Territorial', group: 'postMBA', classification: 'area-specific', points: 20, area: 'UAC', aliases: ['Desenvolvimento Territorial'] },
  { id: 'pos-uac-gestao-de-projetos-estrategicos', label: 'Gestão de Projetos Estratégicos', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Gestão de Projetos Estratégicos', 'Gestão de Projetos'] },
  { id: 'pos-uac-mbapos-em-estrategia-organizacional', label: 'MBA/Pós em Estratégia Organizacional', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Estratégia Organizacional', 'Gestão Estratégica', 'Planejamento Estratégico'] },
  { id: 'pos-uac-mbapos-em-gestao-de-pessoas', label: 'MBA/Pós em Gestão de Pessoas', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Gestão de Pessoas', 'People Analytics', 'RH Estratégico'] },
  { id: 'pos-uac-mbapos-em-gestao-de-projetos', label: 'MBA/Pós em Gestão de Projetos', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Gestão de Projetos', 'Projetos', 'PMO', 'Project Management'] },
  { id: 'pos-uac-mbapos-em-inovacao', label: 'MBA/Pós em Inovação', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Inovação', 'Gestão da Inovação', 'Transformação Digital e Inovação'] },
  { id: 'pos-uac-mbapos-em-lideranca', label: 'MBA/Pós em Liderança', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Liderança', 'Desenvolvimento de Lideranças', 'Liderança Estratégica'] },
  { id: 'pos-uac-mbapos-em-tecnologia', label: 'MBA/Pós em Tecnologia', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Tecnologia', 'Gestão de TI', 'Transformação Digital', 'TI'] },
  { id: 'pos-uac-politicas-publicas-para-pequenos-negocios', label: 'Políticas Públicas para Pequenos Negócios', group: 'postMBA', classification: 'area-specific', points: 20, area: 'UAC', aliases: ['Políticas Públicas para Pequenos Negócios'] },
  // REGIONAIS
  { id: 'pos-regionais-desenvolvimento-regional', label: 'Desenvolvimento Regional', group: 'postMBA', classification: 'area-specific', points: 20, area: 'REGIONAIS', aliases: ['Desenvolvimento Regional'] },
  { id: 'pos-regionais-gestao-de-pequenos-negocios', label: 'Gestão de Pequenos Negócios', group: 'postMBA', classification: 'area-specific', points: 20, area: 'REGIONAIS', aliases: ['Gestão de Pequenos Negócios'] },
  { id: 'pos-regionais-gestao-de-projetos', label: 'Gestão de Projetos', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Gestão de Projetos', 'Projetos'] },
  { id: 'pos-regionais-gestao-estrategica', label: 'Gestão Estratégica', group: 'postMBA', classification: 'area-specific', points: 20, area: 'REGIONAIS', aliases: ['Gestão Estratégica'] },
  { id: 'pos-regionais-lideranca-e-gestao-de-equipes', label: 'Liderança e Gestão de Equipes', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Liderança e Gestão de Equipes', 'Liderança'] },
  { id: 'pos-regionais-mbapos-em-estrategia-organizacional', label: 'MBA/Pós em Estratégia Organizacional', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Estratégia Organizacional', 'Gestão Estratégica', 'Planejamento Estratégico'] },
  { id: 'pos-regionais-mbapos-em-gestao-de-pessoas', label: 'MBA/Pós em Gestão de Pessoas', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Gestão de Pessoas', 'People Analytics', 'RH Estratégico'] },
  { id: 'pos-regionais-mbapos-em-gestao-de-projetos', label: 'MBA/Pós em Gestão de Projetos', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Gestão de Projetos', 'Projetos', 'PMO', 'Project Management'] },
  { id: 'pos-regionais-mbapos-em-inovacao', label: 'MBA/Pós em Inovação', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Inovação', 'Gestão da Inovação', 'Transformação Digital e Inovação'] },
  { id: 'pos-regionais-mbapos-em-lideranca', label: 'MBA/Pós em Liderança', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Liderança', 'Desenvolvimento de Lideranças', 'Liderança Estratégica'] },
  { id: 'pos-regionais-mbapos-em-tecnologia', label: 'MBA/Pós em Tecnologia', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Tecnologia', 'Gestão de TI', 'Transformação Digital', 'TI'] },
  // Pós/MBA em Terceiro Setor e Sistema S — transversal para todas as áreas (curso específico do Sistema S)
  { id: 'pos-gab-terceiro-setor-e-sistema-s', label: 'Terceiro Setor e Sistema S', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Terceiro Setor e Sistema S', 'Terceiro Setor', 'Sistema S', 'Gestão do Sistema S', 'Gestão de Organizações do Sistema S', 'Pós em Terceiro Setor', 'Latu Senso em Terceiro Setor e Sistema S', 'Pós Graduação Latu Senso em Terceiro Setor e Sistema S'] },
  { id: 'pos-uaud-terceiro-setor-e-sistema-s', label: 'Terceiro Setor e Sistema S', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Terceiro Setor e Sistema S', 'Terceiro Setor', 'Sistema S', 'Gestão do Sistema S', 'Gestão de Organizações do Sistema S', 'Pós em Terceiro Setor', 'Latu Senso em Terceiro Setor e Sistema S', 'Pós Graduação Latu Senso em Terceiro Setor e Sistema S'] },
  { id: 'pos-uri-terceiro-setor-e-sistema-s', label: 'Terceiro Setor e Sistema S', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Terceiro Setor e Sistema S', 'Terceiro Setor', 'Sistema S', 'Gestão do Sistema S', 'Gestão de Organizações do Sistema S', 'Pós em Terceiro Setor', 'Latu Senso em Terceiro Setor e Sistema S', 'Pós Graduação Latu Senso em Terceiro Setor e Sistema S'] },
  { id: 'pos-uge-terceiro-setor-e-sistema-s', label: 'Terceiro Setor e Sistema S', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Terceiro Setor e Sistema S', 'Terceiro Setor', 'Sistema S', 'Gestão do Sistema S', 'Gestão de Organizações do Sistema S', 'Pós em Terceiro Setor', 'Latu Senso em Terceiro Setor e Sistema S', 'Pós Graduação Latu Senso em Terceiro Setor e Sistema S'] },
  { id: 'pos-umc-terceiro-setor-e-sistema-s', label: 'Terceiro Setor e Sistema S', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Terceiro Setor e Sistema S', 'Terceiro Setor', 'Sistema S', 'Gestão do Sistema S', 'Gestão de Organizações do Sistema S', 'Pós em Terceiro Setor', 'Latu Senso em Terceiro Setor e Sistema S', 'Pós Graduação Latu Senso em Terceiro Setor e Sistema S'] },
  { id: 'pos-uac-terceiro-setor-e-sistema-s', label: 'Terceiro Setor e Sistema S', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Terceiro Setor e Sistema S', 'Terceiro Setor', 'Sistema S', 'Gestão do Sistema S', 'Gestão de Organizações do Sistema S', 'Pós em Terceiro Setor', 'Latu Senso em Terceiro Setor e Sistema S', 'Pós Graduação Latu Senso em Terceiro Setor e Sistema S'] },
  { id: 'pos-uas-terceiro-setor-e-sistema-s', label: 'Terceiro Setor e Sistema S', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Terceiro Setor e Sistema S', 'Terceiro Setor', 'Sistema S', 'Gestão do Sistema S', 'Gestão de Organizações do Sistema S', 'Pós em Terceiro Setor', 'Latu Senso em Terceiro Setor e Sistema S', 'Pós Graduação Latu Senso em Terceiro Setor e Sistema S'] },
  { id: 'pos-ugoc-terceiro-setor-e-sistema-s', label: 'Terceiro Setor e Sistema S', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Terceiro Setor e Sistema S', 'Terceiro Setor', 'Sistema S', 'Gestão do Sistema S', 'Gestão de Organizações do Sistema S', 'Pós em Terceiro Setor', 'Latu Senso em Terceiro Setor e Sistema S', 'Pós Graduação Latu Senso em Terceiro Setor e Sistema S'] },
  { id: 'pos-ugp-terceiro-setor-e-sistema-s', label: 'Terceiro Setor e Sistema S', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Terceiro Setor e Sistema S', 'Terceiro Setor', 'Sistema S', 'Gestão do Sistema S', 'Gestão de Organizações do Sistema S', 'Pós em Terceiro Setor', 'Latu Senso em Terceiro Setor e Sistema S', 'Pós Graduação Latu Senso em Terceiro Setor e Sistema S'] },
  { id: 'pos-utic-terceiro-setor-e-sistema-s', label: 'Terceiro Setor e Sistema S', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Terceiro Setor e Sistema S', 'Terceiro Setor', 'Sistema S', 'Gestão do Sistema S', 'Gestão de Organizações do Sistema S', 'Pós em Terceiro Setor', 'Latu Senso em Terceiro Setor e Sistema S', 'Pós Graduação Latu Senso em Terceiro Setor e Sistema S'] },
  { id: 'pos-urc-terceiro-setor-e-sistema-s', label: 'Terceiro Setor e Sistema S', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Terceiro Setor e Sistema S', 'Terceiro Setor', 'Sistema S', 'Gestão do Sistema S', 'Gestão de Organizações do Sistema S', 'Pós em Terceiro Setor', 'Latu Senso em Terceiro Setor e Sistema S', 'Pós Graduação Latu Senso em Terceiro Setor e Sistema S'] },
  { id: 'pos-ajur-terceiro-setor-e-sistema-s', label: 'Terceiro Setor e Sistema S', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Terceiro Setor e Sistema S', 'Terceiro Setor', 'Sistema S', 'Gestão do Sistema S', 'Gestão de Organizações do Sistema S', 'Pós em Terceiro Setor', 'Latu Senso em Terceiro Setor e Sistema S', 'Pós Graduação Latu Senso em Terceiro Setor e Sistema S'] },
  { id: 'pos-regionais-terceiro-setor-e-sistema-s', label: 'Terceiro Setor e Sistema S', group: 'postMBA', classification: 'transversal', points: 40, aliases: ['Terceiro Setor e Sistema S', 'Terceiro Setor', 'Sistema S', 'Gestão do Sistema S', 'Gestão de Organizações do Sistema S', 'Pós em Terceiro Setor', 'Latu Senso em Terceiro Setor e Sistema S', 'Pós Graduação Latu Senso em Terceiro Setor e Sistema S'] },

  // ── PROJETOS ESTRATÉGICOS ────────────────────────────────────────────────────
  // CDE — Assessoria
  { id: 'proj-gab-gestao-da-agenda-colegiada-e-fluxo-deliberativo', label: 'Gestão da agenda colegiada e fluxo deliberativo', group: 'project', classification: 'area-specific', points: 20, area: 'CDE', aliases: ['agenda colegiada', 'fluxo deliberativo', 'secretaria de colegiados'] },
  { id: 'proj-gab-programa-de-conformidade-regimental-e-governanca-do-cde', label: 'Programa de conformidade regimental e governança do CDE', group: 'project', classification: 'area-specific', points: 20, area: 'CDE', aliases: ['conformidade regimental', 'governança do conselho', 'compliance do CDE'] },
  { id: 'proj-gab-gestao-documental-e-memoria-dos-colegiados', label: 'Gestão documental e memória dos colegiados', group: 'project', classification: 'area-specific', points: 15, area: 'CDE', aliases: ['gestão documental', 'memória institucional', 'acervo colegiado'] },
  { id: 'proj-gab-painel-executivo-de-acompanhamento-das-deliberacoes', label: 'Painel executivo de acompanhamento das deliberações', group: 'project', classification: 'area-specific', points: 15, area: 'CDE', aliases: ['dashboard de deliberações', 'painel executivo do conselho', 'indicadores do CDE'] },
  { id: 'proj-gab-articulacao-estrategica-conselho-diretoria', label: 'Articulação estratégica Conselho-Diretoria', group: 'project', classification: 'area-specific', points: 20, area: 'CDE', aliases: ['interface conselho-diretoria', 'articulação estratégica institucional'] },
  // UAUD
  { id: 'proj-uaud-plano-anual-de-auditoria-baseada-em-riscos', label: 'Plano anual de auditoria baseada em riscos', group: 'project', classification: 'area-specific', points: 20, area: 'UAUD', aliases: ['PAINT', 'auditoria baseada em riscos', 'plano anual de auditoria'] },
  { id: 'proj-uaud-mapeamento-e-melhoria-de-controles-internos', label: 'Mapeamento e melhoria de controles internos', group: 'project', classification: 'area-specific', points: 20, area: 'UAUD', aliases: ['controles internos', 'mapeamento de controles', 'melhoria de controles'] },
  { id: 'proj-uaud-programa-de-integridade-e-conformidade-institucional', label: 'Programa de integridade e conformidade institucional', group: 'project', classification: 'area-specific', points: 20, area: 'UAUD', aliases: ['integridade', 'compliance institucional', 'programa de integridade'] },
  { id: 'proj-uaud-monitoramento-de-recomendacoes-de-auditoria', label: 'Monitoramento de recomendações de auditoria', group: 'project', classification: 'area-specific', points: 15, area: 'UAUD', aliases: ['follow-up de auditoria', 'monitoramento de recomendações', 'plano de ação auditoria'] },
  { id: 'proj-uaud-analytics-e-paineis-de-auditoria', label: 'Analytics e painéis de auditoria', group: 'project', classification: 'area-specific', points: 15, area: 'UAUD', aliases: ['análise de dados para auditoria', 'painel de auditoria', 'analytics de riscos'] },
  { id: 'proj-uaud-programa-de-sucessao-e-desenvolvimento-de-liderancas', label: 'Programa de sucessão e desenvolvimento de lideranças', group: 'project', classification: 'area-specific', points: 15, area: 'UAUD', aliases: ['sucessão', 'lideranças', 'desenvolvimento de líderes'] },
  // URI
  { id: 'proj-uri-programa-de-articulacao-institucional-e-stakeholders', label: 'Programa de articulação institucional e stakeholders', group: 'project', classification: 'area-specific', points: 20, area: 'URI', aliases: ['stakeholders', 'articulação institucional', 'mapeamento institucional'] },
  { id: 'proj-uri-gestao-de-parcerias-estrategicas', label: 'Gestão de parcerias estratégicas', group: 'project', classification: 'area-specific', points: 20, area: 'URI', aliases: ['parcerias estratégicas', 'cooperação institucional', 'convênios'] },
  { id: 'proj-uri-agenda-de-politicas-publicas-e-representacao-institucional', label: 'Agenda de políticas públicas e representação institucional', group: 'project', classification: 'area-specific', points: 20, area: 'URI', aliases: ['políticas públicas', 'representação institucional', 'agenda pública'] },
  { id: 'proj-uri-captacao-de-recursos-e-cooperacao', label: 'Captação de recursos e cooperação', group: 'project', classification: 'area-specific', points: 15, area: 'URI', aliases: ['captação de recursos', 'cooperação', 'fomento institucional'] },
  { id: 'proj-uri-analise-de-cenarios-e-inteligencia-institucional', label: 'Análise de cenários e inteligência institucional', group: 'project', classification: 'area-specific', points: 15, area: 'URI', aliases: ['análise de cenários', 'inteligência institucional', 'monitoramento externo'] },
  { id: 'proj-uri-programa-de-desenvolvimento-territorial', label: 'Programa de desenvolvimento territorial', group: 'project', classification: 'area-specific', points: 15, area: 'URI', aliases: ['desenvolvimento territorial', 'interiorização', 'territorialização'] },
  { id: 'proj-uri-programa-de-sucessao-e-desenvolvimento-de-liderancas', label: 'Programa de sucessão e desenvolvimento de lideranças', group: 'project', classification: 'area-specific', points: 15, area: 'URI', aliases: ['sucessão', 'lideranças', 'desenvolvimento de líderes'] },
  // UGE
  { id: 'proj-uge-desdobramento-do-planejamento-estrategico', label: 'Desdobramento do planejamento estratégico', group: 'project', classification: 'area-specific', points: 20, area: 'UGE', aliases: ['planejamento estratégico', 'desdobramento estratégico', 'mapa estratégico'] },
  { id: 'proj-uge-sistema-de-indicadores-okrbsc', label: 'Sistema de indicadores OKR/BSC', group: 'project', classification: 'area-specific', points: 20, area: 'UGE', aliases: ['OKR', 'BSC', 'indicadores estratégicos', 'painel de indicadores'] },
  { id: 'proj-uge-programa-de-gestao-de-riscos-e-integridade', label: 'Programa de gestão de riscos e integridade', group: 'project', classification: 'area-specific', points: 20, area: 'UGE', aliases: ['gestão de riscos', 'integridade', 'compliance estratégico'] },
  { id: 'proj-uge-projeto-esg-e-sustentabilidade-institucional', label: 'Projeto ESG e sustentabilidade institucional', group: 'project', classification: 'area-specific', points: 15, area: 'UGE', aliases: ['ESG', 'sustentabilidade institucional', 'governança sustentável'] },
  { id: 'proj-uge-inteligencia-estrategica-e-bi-corporativo', label: 'Inteligência estratégica e BI corporativo', group: 'project', classification: 'area-specific', points: 15, area: 'UGE', aliases: ['BI estratégico', 'inteligência estratégica', 'analytics corporativo'] },
  { id: 'proj-uge-programa-de-sucessao-e-desenvolvimento-de-liderancas', label: 'Programa de sucessão e desenvolvimento de lideranças', group: 'project', classification: 'area-specific', points: 15, area: 'UGE', aliases: ['sucessão', 'lideranças', 'desenvolvimento de líderes'] },
  // UMC
  { id: 'proj-umc-gestao-da-marca-institucional', label: 'Gestão da marca institucional', group: 'project', classification: 'area-specific', points: 20, area: 'UMC', aliases: ['branding', 'marca institucional', 'gestão de marca'] },
  { id: 'proj-umc-campanhas-de-comunicacao-e-marketing-estrategico', label: 'Campanhas de comunicação e marketing estratégico', group: 'project', classification: 'area-specific', points: 20, area: 'UMC', aliases: ['campanha institucional', 'marketing estratégico', 'plano de comunicação'] },
  { id: 'proj-umc-marketing-digital-e-presenca-multicanal', label: 'Marketing digital e presença multicanal', group: 'project', classification: 'area-specific', points: 20, area: 'UMC', aliases: ['marketing digital', 'mídias digitais', 'presença multicanal'] },
  { id: 'proj-umc-comunicacao-publica-e-institucional-com-stakeholders', label: 'Comunicação pública e institucional com stakeholders', group: 'project', classification: 'area-specific', points: 15, area: 'UMC', aliases: ['comunicação pública', 'relacionamento com públicos', 'stakeholders'] },
  { id: 'proj-umc-gestao-de-crises-e-reputacao', label: 'Gestão de crises e reputação', group: 'project', classification: 'area-specific', points: 15, area: 'UMC', aliases: ['gestão de crises', 'reputação institucional', 'comunicação de crise'] },
  { id: 'proj-umc-programa-de-sucessao-e-desenvolvimento-de-liderancas', label: 'Programa de sucessão e desenvolvimento de lideranças', group: 'project', classification: 'area-specific', points: 15, area: 'UMC', aliases: ['sucessão', 'lideranças', 'desenvolvimento de líderes'] },
  // CDE — Assessoria (Jurídico)
  { id: 'proj-ajur-programa-de-mitigacao-de-riscos-juridicos', label: 'Programa de mitigação de riscos jurídicos', group: 'project', classification: 'area-specific', points: 20, area: 'CDE', aliases: ['riscos jurídicos', 'mitigação de riscos legais', 'risk legal'] },
  { id: 'proj-ajur-revisao-e-padronizacao-de-instrumentos-juridicos', label: 'Revisão e padronização de instrumentos jurídicos', group: 'project', classification: 'area-specific', points: 20, area: 'CDE', aliases: ['padronização contratual', 'instrumentos jurídicos', 'minutas-padrão'] },
  { id: 'proj-ajur-compliance-juridico-e-integridade-normativa', label: 'Compliance jurídico e integridade normativa', group: 'project', classification: 'area-specific', points: 20, area: 'CDE', aliases: ['compliance jurídico', 'integridade normativa', 'governança jurídica'] },
  { id: 'proj-ajur-suporte-juridico-estrategico-a-projetos-institucionais', label: 'Suporte jurídico estratégico a projetos institucionais', group: 'project', classification: 'area-specific', points: 15, area: 'CDE', aliases: ['parecer jurídico estratégico', 'apoio jurídico a projetos'] },
  { id: 'proj-ajur-gestao-de-contingencias-e-pareceres-prioritarios', label: 'Gestão de contingências e pareceres prioritários', group: 'project', classification: 'area-specific', points: 15, area: 'CDE', aliases: ['contingências jurídicas', 'pareceres prioritários', 'gestão de demandas'] },
  { id: 'proj-cde-programa-de-sucessao-e-desenvolvimento-de-liderancas', label: 'Programa de sucessão e desenvolvimento de lideranças', group: 'project', classification: 'area-specific', points: 15, area: 'CDE', aliases: ['sucessão', 'lideranças', 'desenvolvimento de líderes'] },
  // UGP
  { id: 'proj-ugp-programa-de-sucessao-e-desenvolvimento-de-liderancas', label: 'Programa de sucessão e desenvolvimento de lideranças', group: 'project', classification: 'area-specific', points: 20, area: 'UGP', aliases: ['sucessão', 'lideranças', 'desenvolvimento de líderes', 'banco de sucessores'] },
  { id: 'proj-ugp-projeto-de-cultura-organizacional-e-engajamento', label: 'Projeto de cultura organizacional e engajamento', group: 'project', classification: 'area-specific', points: 20, area: 'UGP', aliases: ['cultura organizacional', 'engajamento', 'clima'] },
  { id: 'proj-ugp-sistema-de-avaliacao-de-desempenho-e-pdi', label: 'Sistema de avaliação de desempenho e PDI', group: 'project', classification: 'area-specific', points: 20, area: 'UGP', aliases: ['avaliação de desempenho', 'PDI', 'desenvolvimento humano'] },
  { id: 'proj-ugp-people-analytics-e-indicadores-de-rh', label: 'People analytics e indicadores de RH', group: 'project', classification: 'area-specific', points: 15, area: 'UGP', aliases: ['people analytics', 'indicadores de RH', 'analytics de pessoas'] },
  { id: 'proj-ugp-gestao-de-mudancas-e-desenvolvimento-humano', label: 'Gestão de mudanças e desenvolvimento humano', group: 'project', classification: 'area-specific', points: 15, area: 'UGP', aliases: ['gestão de mudanças', 'desenvolvimento humano', 'DHO'] },
  // UAF
  { id: 'proj-uas-otimizacao-de-suprimentos-e-cadeia-logistica', label: 'Otimização de suprimentos e cadeia logística', group: 'project', classification: 'area-specific', points: 20, area: 'UAF', aliases: ['suprimentos', 'logística', 'cadeia de suprimentos'] },
  { id: 'proj-uas-gestao-patrimonial-e-inventario-estrategico', label: 'Gestão patrimonial e inventário estratégico', group: 'project', classification: 'area-specific', points: 20, area: 'UAF', aliases: ['gestão patrimonial', 'inventário', 'ativos'] },
  { id: 'proj-uas-projeto-de-infraestrutura-e-facilities', label: 'Projeto de infraestrutura e facilities', group: 'project', classification: 'area-specific', points: 20, area: 'UAF', aliases: ['infraestrutura', 'facilities', 'ambiente físico'] },
  { id: 'proj-uas-eficiencia-administrativa-e-redesenho-de-processos', label: 'Eficiência administrativa e redesenho de processos', group: 'project', classification: 'area-specific', points: 15, area: 'UAF', aliases: ['eficiência administrativa', 'processos administrativos', 'redesenho'] },
  { id: 'proj-uas-gestao-de-contratos-administrativos-e-apoio-operacional', label: 'Gestão de contratos administrativos e apoio operacional', group: 'project', classification: 'area-specific', points: 15, area: 'UAF', aliases: ['contratos administrativos', 'apoio operacional', 'fornecedores'] },
  { id: 'proj-uaf-programa-de-sucessao-e-desenvolvimento-de-liderancas', label: 'Programa de sucessão e desenvolvimento de lideranças', group: 'project', classification: 'area-specific', points: 15, area: 'UAF', aliases: ['sucessão', 'lideranças', 'desenvolvimento de líderes'] },
  // UGOC
  { id: 'proj-ugoc-planejamento-orcamentario-anual-e-plurianual', label: 'Planejamento orçamentário anual e plurianual', group: 'project', classification: 'area-specific', points: 20, area: 'UGOC', aliases: ['planejamento orçamentário', 'PPA orçamentário', 'orçamento anual'] },
  { id: 'proj-ugoc-fechamento-contabil-e-conformidade-financeira', label: 'Fechamento contábil e conformidade financeira', group: 'project', classification: 'area-specific', points: 20, area: 'UGOC', aliases: ['fechamento contábil', 'conformidade financeira', 'balanços'] },
  { id: 'proj-ugoc-controladoria-e-paineis-gerenciais', label: 'Controladoria e painéis gerenciais', group: 'project', classification: 'area-specific', points: 20, area: 'UGOC', aliases: ['controladoria', 'painéis gerenciais', 'reporting financeiro'] },
  { id: 'proj-ugoc-gestao-do-fluxo-financeiro-e-projecoes', label: 'Gestão do fluxo financeiro e projeções', group: 'project', classification: 'area-specific', points: 15, area: 'UGOC', aliases: ['fluxo financeiro', 'projeções financeiras', 'tesouraria'] },
  { id: 'proj-ugoc-projeto-de-eficiencia-orcamentaria-e-custos', label: 'Projeto de eficiência orçamentária e custos', group: 'project', classification: 'area-specific', points: 15, area: 'UGOC', aliases: ['eficiência de custos', 'otimização orçamentária', 'racionalização'] },
  { id: 'proj-ugoc-mapeamento-e-melhoria-de-controles-internos', label: 'Mapeamento e melhoria de controles internos', group: 'project', classification: 'area-specific', points: 15, area: 'UGOC', aliases: ['controles internos', 'mapeamento de controles', 'conformidade interna', 'melhoria de processos de controle'] },
  { id: 'proj-ugoc-programa-de-sucessao-e-desenvolvimento-de-liderancas', label: 'Programa de sucessão e desenvolvimento de lideranças', group: 'project', classification: 'area-specific', points: 15, area: 'UGOC', aliases: ['sucessão', 'lideranças', 'desenvolvimento de líderes'] },
  // UTIC
  { id: 'proj-utic-governanca-de-ti-e-gestao-do-portfolio', label: 'Governança de TI e gestão do portfólio', group: 'project', classification: 'area-specific', points: 20, area: 'UTIC', aliases: ['governança de TI', 'portfólio de TI', 'comitê de TI'] },
  { id: 'proj-utic-transformacao-digital-e-automacao-de-processos', label: 'Transformação digital e automação de processos', group: 'project', classification: 'area-specific', points: 20, area: 'UTIC', aliases: ['transformação digital', 'automação de processos', 'digitalização'] },
  { id: 'proj-utic-seguranca-da-informacao-e-continuidade', label: 'Segurança da informação e continuidade', group: 'project', classification: 'area-specific', points: 20, area: 'UTIC', aliases: ['segurança da informação', 'continuidade', 'cibersegurança'] },
  { id: 'proj-utic-implantacao-e-modernizacao-de-sistemas-corporativos', label: 'Implantação e modernização de sistemas corporativos', group: 'project', classification: 'area-specific', points: 20, area: 'UTIC', aliases: ['sistemas corporativos', 'implantação de sistemas', 'modernização'] },
  { id: 'proj-utic-adequacao-lgpd-e-governanca-de-dados', label: 'Adequação LGPD e governança de dados', group: 'project', classification: 'area-specific', points: 15, area: 'UTIC', aliases: ['LGPD', 'governança de dados', 'privacidade'] },
  { id: 'proj-utic-programa-de-sucessao-e-desenvolvimento-de-liderancas', label: 'Programa de sucessão e desenvolvimento de lideranças', group: 'project', classification: 'area-specific', points: 15, area: 'UTIC', aliases: ['sucessão', 'lideranças', 'desenvolvimento de líderes'] },
  // URC
  { id: 'proj-urc-melhoria-da-experiencia-do-cliente-cx', label: 'Melhoria da experiência do cliente (CX)', group: 'project', classification: 'area-specific', points: 20, area: 'URC', aliases: ['CX', 'experiência do cliente', 'melhoria da experiência'] },
  { id: 'proj-urc-jornada-do-cliente-e-padronizacao-de-atendimento', label: 'Jornada do cliente e padronização de atendimento', group: 'project', classification: 'area-specific', points: 20, area: 'URC', aliases: ['jornada do cliente', 'padronização de atendimento', 'qualidade'] },
  { id: 'proj-urc-crm-e-relacionamento-com-clientes', label: 'CRM e relacionamento com clientes', group: 'project', classification: 'area-specific', points: 20, area: 'URC', aliases: ['CRM', 'relacionamento com clientes', 'base de clientes'] },
  { id: 'proj-urc-monitoramento-de-satisfacao-e-nps', label: 'Monitoramento de satisfação e NPS', group: 'project', classification: 'area-specific', points: 15, area: 'URC', aliases: ['satisfação do cliente', 'NPS', 'pesquisa de satisfação'] },
  { id: 'proj-urc-gestao-de-canais-e-qualidade-do-atendimento', label: 'Gestão de canais e qualidade do atendimento', group: 'project', classification: 'area-specific', points: 15, area: 'URC', aliases: ['canais de atendimento', 'multicanal', 'qualidade de atendimento'] },
  { id: 'proj-urc-programa-de-sucessao-e-desenvolvimento-de-liderancas', label: 'Programa de sucessão e desenvolvimento de lideranças', group: 'project', classification: 'area-specific', points: 15, area: 'URC', aliases: ['sucessão', 'lideranças', 'desenvolvimento de líderes'] },
  // UAC
  { id: 'proj-uac-programa-de-desenvolvimento-territorial', label: 'Programa de desenvolvimento territorial', group: 'project', classification: 'area-specific', points: 20, area: 'UAC', aliases: ['desenvolvimento territorial', 'territórios', 'articulação territorial'] },
  { id: 'proj-uac-competitividade-e-inovacao-para-pequenos-negocios', label: 'Competitividade e inovação para pequenos negócios', group: 'project', classification: 'area-specific', points: 20, area: 'UAC', aliases: ['competitividade', 'inovação', 'pequenos negócios'] },
  { id: 'proj-uac-articulacao-de-projetos-estrategicos-setoriais', label: 'Articulação de projetos estratégicos setoriais', group: 'project', classification: 'area-specific', points: 20, area: 'UAC', aliases: ['projetos estratégicos setoriais', 'articulação setorial', 'cadeias produtivas'] },
  { id: 'proj-uac-politicas-publicas-para-pequenos-negocios', label: 'Políticas públicas para pequenos negócios', group: 'project', classification: 'area-specific', points: 15, area: 'UAC', aliases: ['políticas públicas para pequenos negócios', 'advocacy setorial'] },
  { id: 'proj-uac-redes-de-cooperacao-e-ecossistemas-competitivos', label: 'Redes de cooperação e ecossistemas competitivos', group: 'project', classification: 'area-specific', points: 15, area: 'UAC', aliases: ['redes de cooperação', 'ecossistema competitivo', 'governança territorial'] },
  { id: 'proj-uac-programa-de-sucessao-e-desenvolvimento-de-liderancas', label: 'Programa de sucessão e desenvolvimento de lideranças', group: 'project', classification: 'area-specific', points: 15, area: 'UAC', aliases: ['sucessão', 'lideranças', 'desenvolvimento de líderes'] },
  // REGIONAIS
  { id: 'proj-regionais-execucao-estrategica-regional-do-portfolio', label: 'Execução estratégica regional do portfólio', group: 'project', classification: 'area-specific', points: 20, area: 'REGIONAIS', aliases: ['execução regional', 'portfólio regional', 'desdobramento territorial'] },
  { id: 'proj-regionais-articulacao-regional-e-parcerias-territoriais', label: 'Articulação regional e parcerias territoriais', group: 'project', classification: 'area-specific', points: 20, area: 'REGIONAIS', aliases: ['articulação regional', 'parcerias territoriais', 'stakeholders regionais'] },
  { id: 'proj-regionais-desenvolvimento-regional-e-interiorizacao', label: 'Desenvolvimento regional e interiorização', group: 'project', classification: 'area-specific', points: 20, area: 'REGIONAIS', aliases: ['desenvolvimento regional', 'interiorização', 'ações territoriais'] },
  { id: 'proj-regionais-gestao-de-equipes-e-operacoes-regionais', label: 'Gestão de equipes e operações regionais', group: 'project', classification: 'area-specific', points: 15, area: 'REGIONAIS', aliases: ['equipes regionais', 'operações regionais', 'liderança regional'] },
  { id: 'proj-regionais-monitoramento-de-resultados-e-metas-regionais', label: 'Monitoramento de resultados e metas regionais', group: 'project', classification: 'area-specific', points: 15, area: 'REGIONAIS', aliases: ['metas regionais', 'monitoramento regional', 'painel regional'] },
  { id: 'proj-regionais-campanhas-de-comunicacao-e-marketing-estrategico', label: 'Campanhas de comunicação e marketing estratégico', group: 'project', classification: 'area-specific', points: 15, area: 'REGIONAIS', aliases: ['campanhas regionais', 'divulgação local', 'marketing regional'] },
  { id: 'proj-regionais-marketing-digital-e-presenca-multicanal', label: 'Marketing digital e presença multicanal', group: 'project', classification: 'area-specific', points: 15, area: 'REGIONAIS', aliases: ['redes sociais regionais', 'divulgação digital local', 'presença digital regional'] },
  { id: 'proj-regionais-programa-de-sucessao-e-desenvolvimento-de-liderancas', label: 'Programa de sucessão e desenvolvimento de lideranças', group: 'project', classification: 'area-specific', points: 15, area: 'REGIONAIS', aliases: ['sucessão', 'lideranças', 'desenvolvimento de líderes'] },
];

// ── helpers de consulta ───────────────────────────────────────────────────────

/** Retorna todos os itens de um grupo */
export const byGroup = (group: CatalogItem['group']) =>
  CATALOG_ITEMS.filter((i) => i.group === group);

/** Retorna todos os itens de uma área (inclui transversais) */
export const byArea = (area: string) =>
  CATALOG_ITEMS.filter((i) => !i.area || i.area === area);

/** Dada uma lista de labels e uma área, retorna a pontuação máxima de pós/MBA */
export function bestPostMBAScore(labels: string[], area: string): number {
  const items = CATALOG_ITEMS.filter(
    (i) => i.group === 'postMBA' && labels.includes(i.label) && (!i.area || i.area === area)
  );
  if (items.length === 0) return 20; // não relacionado = 20
  return Math.max(...items.map((i) => i.points));
}

/** Dada uma lista de labels de projetos e uma área, retorna a soma (máx. 20) */
export function projectScore(labels: string[], area: string): number {
  const items = CATALOG_ITEMS.filter(
    (i) => i.group === 'project' && labels.includes(i.label) && i.area === area
  );
  const total = items.reduce((acc, i) => acc + i.points, 0);
  return Math.min(20, total);
}

/** Converte meses de experiência gerencial em pontos (5 pts/ano, máx. 20) */
export function experienceScore(managerialMonths: number, interimMonths: number): number {
  const totalMonths = managerialMonths + interimMonths;
  const years = totalMonths / 12;
  return Math.min(20, Math.floor(years * 5 * 10) / 10);
}

/**
 * Calcula aderência técnica para uma área específica.
 * Escala bruta: 0–80 → convertida para 0–10.
 *
 * Componentes:
 *   - Pós/MBA: melhor título para a área (máx. 40)
 *   - Experiência gerencial/interina: 5 pts/ano (máx. 20)
 *   - Projetos estratégicos da área: soma (máx. 20)
 *
 * Graduação e cursos: registrados mas não entram na nota.
 */
export function calcTechnicalAdherence(
  postMBAs: string[],
  managerialMonths: number,
  interimMonths: number,
  selectedProjects: string[],
  area: string
): { score10: number; breakdown: { postMBA: number; experience: number; projects: number; total80: number } } {
  const postMBA = bestPostMBAScore(postMBAs, area);
  const experience = experienceScore(managerialMonths, interimMonths);
  const projects = projectScore(selectedProjects, area);
  const total80 = postMBA + experience + projects;
  const score10 = Math.round((total80 / 80) * 100) / 10; // 1 casa decimal
  return { score10, breakdown: { postMBA, experience, projects, total80 } };
}

// ─────────────────────────────────────────────────────────────────────────────
// ÁREAS OFICIAIS DO SEBRAE-TO
// ─────────────────────────────────────────────────────────────────────────────

export const OFFICIAL_AREAS: { code: string; label: string }[] = [
  // ── Diretoria e Assessorias ──────────────────────────────────────────────
  { code: 'DIREX',   label: 'Diretoria Superintendente' },
  { code: 'DITEC',   label: 'DITEC — Diretoria Técnica' },
  { code: 'DAF',     label: 'DAF — Diretoria de Administração e Finanças' },
  { code: 'CDE',     label: 'CDE — Assessoria' },
  // ── Unidades ────────────────────────────────────────────────────────────
  { code: 'UAC',     label: 'UAC — Unidade de Articulação e Competitividade' },
  { code: 'UAF',     label: 'UAF — Unidade de Administração e Finanças' },
  { code: 'UAUD',    label: 'UAUD — Unidade de Auditoria Interna' },
  { code: 'UGE',     label: 'UGE — Unidade de Gestão Estratégica e Integridade' },
  { code: 'UGOC',    label: 'UGOC — Unidade de Gestão Orç. Contabilidade e Finanças' },
  { code: 'UGP',     label: 'UGP — Unidade de Gestão de Pessoas' },
  { code: 'UMC',     label: 'UMC — Unidade de Marketing e Comunicação' },
  { code: 'URC',     label: 'URC — Unidade de Relacionamento com o Cliente' },
  { code: 'URI',     label: 'URI — Unidade de Relacionamento Institucional' },
  { code: 'UTIC',    label: 'UTIC — Unidade de Tecnologia da Inform. e Comunicação de Dados' },
  // ── Regionais (agrupadas) ────────────────────────────────────────────────
  { code: 'REGIONAIS', label: 'Unidades Regionais' },
];

// Áreas disponíveis para seleção de interesse (Step 2) — exclui Diretoria e Assessorias
export const INTEREST_AREAS: { code: string; label: string }[] = OFFICIAL_AREAS.filter(
  (a) => !['DIREX', 'DITEC', 'DAF', 'CDE'].includes(a.code)
);

// Lista completa das regionais — usada em contextos que exigem nome individual
export const REGIONAL_AREAS: { code: string; label: string }[] = [
  { code: 'RBP', label: 'RBP — Regional Bico do Papagaio' },
  { code: 'RME', label: 'RME — Regional Metropolitana' },
  { code: 'RMN', label: 'RMN — Regional Médio Norte Colinas' },
  { code: 'RNO', label: 'RNO — Regional Norte' },
  { code: 'RPJ', label: 'RPJ — Regional Portal do Jalapão' },
  { code: 'RSG', label: 'RSG — Regional Serras Gerais' },
  { code: 'RSU', label: 'RSU — Regional Sul' },
  { code: 'RVA', label: 'RVA — Regional Vale do Araguaia' },
];

// ─────────────────────────────────────────────────────────────────────────────
// NINE BOX — quadrantes oficiais
// ─────────────────────────────────────────────────────────────────────────────

export const NINE_BOX_QUADRANTS: {
  x: 'low' | 'mid' | 'high';
  y: 'low' | 'mid' | 'high';
  label: string;
  description?: string;
}[] = [
  { x: 'high', y: 'high', label: 'Alta Prontidão',                                description: 'Alta aderência técnica e comportamental — pronto para assumir.' },
  { x: 'mid',  y: 'high', label: 'Pronto em Desenvolvimento',                      description: 'Forte perfil comportamental, em evolução técnica.' },
  { x: 'low',  y: 'high', label: 'Potencial de Curto Prazo (gap técnico)',          description: 'Excelente perfil comportamental, necessita desenvolver competências técnicas.' },
  { x: 'high', y: 'mid',  label: 'Destaque Técnico, lapidar liderança',             description: 'Alta aderência técnica, perfil comportamental em desenvolvimento.' },
  { x: 'mid',  y: 'mid',  label: 'Potencial de Médio Prazo',                        description: 'Aderência equilibrada, com espaço de crescimento em ambos os eixos.' },
  { x: 'low',  y: 'mid',  label: 'Desenvolvimento Direcionado',                     description: 'Perfil comportamental médio, necessita desenvolvimento técnico prioritário.' },
  { x: 'high', y: 'low',  label: 'Risco de Liderança',                              description: 'Alta aderência técnica, baixo perfil comportamental para liderança.' },
  { x: 'mid',  y: 'low',  label: 'Especialista Técnico sem Perfil de Liderança',    description: 'Aderência técnica razoável, baixo perfil comportamental.' },
  { x: 'low',  y: 'low',  label: 'Baixa Aderência',                                 description: 'Baixa aderência em ambos os eixos — requer plano de desenvolvimento estruturado.' },
];
