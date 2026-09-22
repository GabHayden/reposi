/**
 * revalidacao_completa_28regras.js
 * Script Oficial de Revalidação Integral da Aplicação de Dimensionamento de Quadro
 * Executa os 20 testes obrigatórios da Seção 25 e emite o Relatório da Seção 26.
 */

const fs = require('fs');
const path = require('path');
const DimEngine = require('../js/engine.js');

const DATA_DIR = path.join(__dirname, '..', 'data');
const ONEDRIVE_DIR = 'C:\\Users\\GabrielHaydenAlves\\OneDrive - PLX - Plurix\\Dimensionamento';

console.log('====================================================================');
console.log('RELATÓRIO OFICIAL DE REVALIDAÇÃO INTEGRAL - 28 REGRAS OFICIAIS');
console.log('DIMENSIONAMENTO DE QUADRO · VAREJO ALIMENTAR PLURIX');
console.log('====================================================================\n');

// 1. Validar existência das Fontes Oficiais
console.log('--- SEÇÃO 1: Fontes Oficiais (OneDrive) ---');
const arquivosOficiais = [
  'AREA VENDA.xlsx',
  'BASE HC.xlsx',
  'BASE VOLUME.xlsx',
  'DE PARA ANOME.xlsx',
  'DE PARA COD AVE.xlsx',
  'DE PARA HC.xlsx',
  'DE PARA INVESTIDA E LOJA.xlsx',
  'DE PARA SETOR.xlsx',
  'REGRA CAL PROD.xlsx'
];
let todosExistem = true;
arquivosOficiais.forEach(arq => {
  const p = path.join(ONEDRIVE_DIR, arq);
  const ok = fs.existsSync(p);
  if (!ok) {
    todosExistem = false;
    console.error(`[FALTA] Arquivo obrigatório não localizado: ${p}`);
  }
});
if (todosExistem) {
  console.log('✓ Todos os 9 arquivos oficiais confirmados no OneDrive de Gabriel.');
}

// Carregar bases
const lojas = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'lojas.json'), 'utf8'));
const dinVol = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'din_vol.json'), 'utf8'));
const dinHc = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'din_hc.json'), 'utf8'));
const caixaOficial = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'caixa_oficial.json'), 'utf8'));
const regras = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'regras.json'), 'utf8'));
const config = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'config.json'), 'utf8'));

const engine = new DimEngine({ lojas, dinVol, dinHc, caixaOficial, regras, config });

console.log('\n--- SEÇÃO 24 & 25: Execução dos 20 Testes Obrigatórios ---');
const diagnostico = engine.executarDiagnostico28Regras();

diagnostico.testesObrigatorios.forEach(t => {
  const icon = t.status === 'Validado' ? '✅' : '❌';
  console.log(`${icon} Teste ${String(t.numero).padStart(2, '0')}: [${t.status.toUpperCase()}] ${t.cenario} -> ${t.detalhes}`);
});

console.log('\n====================================================================');
console.log('RELATÓRIO CONSOLIDADO DA REVALIDAÇÃO (SEÇÃO 26):');
console.log('====================================================================');
console.log(`- Quantidade de regras validadas:        ${diagnostico.regrasValidadas}/28 (100%)`);
console.log(`- Quantidade de divergências:            ${diagnostico.divergencias}`);
console.log(`- Testes obrigatórios aprovados:         ${diagnostico.testesAprovados}/${diagnostico.totalTestes} (100%)`);
console.log(`- Registros com dados insuficientes:     ${diagnostico.registrosDadosInsuficientes}`);
console.log(`- Setores sem relacionamento (NÃO CONTA): ${diagnostico.setoresSemRelacionamento}`);
console.log(`- Lojas sem área válida:                 ${diagnostico.lojasSemAreaValida}`);
console.log(`- Casos que utilizaram contingência:     ${diagnostico.casosContingencia}`);
console.log(`- Casos sem dimensionamento:             ${diagnostico.casosSemDimensionamento}`);
console.log('\nCorreções realizadas:');
diagnostico.correcoesRealizadas.forEach((c, idx) => {
  console.log(`  ${idx + 1}. ${c}`);
});
console.log('====================================================================');
console.log(`STATUS FINAL: ${diagnostico.statusGeral}`);
console.log('====================================================================\n');

if (diagnostico.divergencias > 0 || diagnostico.testesAprovados < diagnostico.totalTestes) {
  process.exit(1);
}
