const XLSX = require('xlsx');
const path = require('path');

// Cabeçalho do novo modelo
const headers = [
  'Email',
  'Nome',
  'Área (Código)',
  'Correlação (%)',
  'Dominância - Pessoa (D)',
  'Influência - Pessoa (I)',
  'Estabilidade - Pessoa (S)',
  'Conformidade - Pessoa (C)',
  'Dominância - Cargo (D)',
  'Influência - Cargo (I)',
  'Estabilidade - Cargo (S)',
  'Conformidade - Cargo (C)',
  'Pontos Positivos (separados por ;)',
  'Pontos de Desenvolvimento (separados por ;)',
];

// Exemplos de linhas
const examples = [
  [
    'admary.monteiro@to.sebrae.com.br',
    'Admary Monteiro Barbosa',
    'REGIONAIS',
    '72',
    '75', '60', '45', '30',
    '80', '55', '40', '35',
    'Liderança;Comunicação',
    'Gestão de conflitos;Planejamento',
  ],
  [
    'emerson.lima@to.sebrae.com.br',
    'Emerson Montenegro Lima',
    'UGP',
    '85',
    '80', '70', '50', '25',
    '75', '65', '45', '30',
    'Foco em resultados;Inovação',
    'Delegação;Escuta ativa',
  ],
];

const wb = XLSX.utils.book_new();

// Aba principal com dados
const wsData = XLSX.utils.aoa_to_sheet([headers, ...examples]);

// Larguras das colunas
wsData['!cols'] = [
  { wch: 38 }, // Email
  { wch: 35 }, // Nome
  { wch: 16 }, // Área
  { wch: 16 }, // Correlação
  { wch: 22 }, // D pessoa
  { wch: 22 }, // I pessoa
  { wch: 22 }, // S pessoa
  { wch: 22 }, // C pessoa
  { wch: 22 }, // D cargo
  { wch: 22 }, // I cargo
  { wch: 22 }, // S cargo
  { wch: 22 }, // C cargo
  { wch: 35 }, // Positivos
  { wch: 35 }, // Desenvolvimento
];

XLSX.utils.book_append_sheet(wb, wsData, 'Dados DISC');

// Aba de instruções
const instrucoes = [
  ['INSTRUÇÕES DE PREENCHIMENTO'],
  [''],
  ['Coluna', 'Descrição', 'Obrigatório?'],
  ['Email', 'E-mail corporativo do candidato (ex: joao.silva@to.sebrae.com.br)', 'SIM — identificador principal'],
  ['Nome', 'Nome completo do candidato (usado como fallback se e-mail não for encontrado)', 'Recomendado'],
  ['Área (Código)', 'Código da área de interesse. Valores válidos abaixo:', 'SIM'],
  ['Correlação (%)', 'Percentual de correlação DISC (0 a 100)', 'SIM'],
  ['Dominância - Pessoa (D)', 'Pontuação D da pessoa (0-100)', 'Opcional'],
  ['Influência - Pessoa (I)', 'Pontuação I da pessoa (0-100)', 'Opcional'],
  ['Estabilidade - Pessoa (S)', 'Pontuação S da pessoa (0-100)', 'Opcional'],
  ['Conformidade - Pessoa (C)', 'Pontuação C da pessoa (0-100)', 'Opcional'],
  ['Dominância - Cargo (D)', 'Pontuação D do cargo ideal (0-100)', 'Opcional'],
  ['Influência - Cargo (I)', 'Pontuação I do cargo ideal (0-100)', 'Opcional'],
  ['Estabilidade - Cargo (S)', 'Pontuação S do cargo ideal (0-100)', 'Opcional'],
  ['Conformidade - Cargo (C)', 'Pontuação C do cargo ideal (0-100)', 'Opcional'],
  ['Pontos Positivos', 'Características positivas separadas por ponto e vírgula (;)', 'Opcional'],
  ['Pontos de Desenvolvimento', 'Pontos de melhoria separados por ponto e vírgula (;)', 'Opcional'],
  [''],
  ['CÓDIGOS DE ÁREA VÁLIDOS:'],
  ['UAC', 'Unidade de Acesso a Crédito'],
  ['UAF', 'Unidade de Administração e Finanças'],
  ['UAUD', 'Unidade de Auditoria'],
  ['UGE', 'Unidade de Gestão Estratégica'],
  ['UGOC', 'Unidade de Governança e Controle'],
  ['UGP', 'Unidade de Gestão de Pessoas'],
  ['UMC', 'Unidade de Marketing e Comunicação'],
  ['URC', 'Unidade de Relacionamento com Clientes'],
  ['URI', 'Unidade de Relacionamento Institucional'],
  ['UTIC', 'Unidade de TIC'],
  ['REGIONAIS', 'Gerências Regionais (geral)'],
  ['RBP', 'Regional Bico do Papagaio'],
  ['RME', 'Regional Médio Norte'],
  ['RMN', 'Regional Miracema do Norte'],
  ['RNO', 'Regional Norte'],
  ['RPJ', 'Regional Porto Nacional / Jalapão'],
  ['RSG', 'Regional Sul Grande'],
  ['RSU', 'Regional Sul'],
  ['RVA', 'Regional Vale do Araguaia'],
  [''],
  ['IMPORTANTE: O sistema busca o participante primeiro pelo e-mail, depois pelo nome.'],
  ['Use sempre o e-mail corporativo cadastrado no sistema para garantir a importação correta.'],
];

const wsInstr = XLSX.utils.aoa_to_sheet(instrucoes);
wsInstr['!cols'] = [{ wch: 30 }, { wch: 55 }, { wch: 30 }];
XLSX.utils.book_append_sheet(wb, wsInstr, 'Instruções');

const outPath = path.join(__dirname, '../public/modelo-disc-aderencia.xlsx');
XLSX.writeFile(wb, outPath);
console.log('Modelo gerado em:', outPath);
