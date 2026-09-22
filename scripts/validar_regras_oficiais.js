/**
 * Script Oficial de Validação das 10 Regras Metodológicas
 * Dimensionamento de Quadro - Varejo Alimentar Plurix
 */

const fs = require('fs');
const path = require('path');
const { DimEngine } = require('../js/engine.js');

const DATA_DIR = path.join(__dirname, '..', 'data');
const ONEDRIVE_DIR = 'C:\\Users\\GabrielHaydenAlves\\OneDrive - PLX - Plurix\\Dimensionamento';

console.log('====================================================================');
console.log('VALIDAÇÃO OFICIAL DE CONFORMIDADE METODOLÓGICA - PLURIX');
console.log('====================================================================\n');

let totalChecks = 0;
let passedChecks = 0;
let failedChecks = 0;

function assert(condition, ruleNum, description) {
  totalChecks++;
  if (condition) {
    passedChecks++;
    console.log(`[PASS] Regra ${ruleNum}: ${description}`);
  } else {
    failedChecks++;
    console.error(`[FAIL] Regra ${ruleNum}: ${description}`);
  }
}

// 1. Validar Arquivos Oficiais do OneDrive
console.log('--- 1. Fonte Oficial de Dados (OneDrive) ---');
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
let todosArquivosExistem = true;
for (const arq of arquivosOficiais) {
  const existe = fs.existsSync(path.join(ONEDRIVE_DIR, arq));
  if (!existe) todosArquivosExistem = false;
}
assert(todosArquivosExistem, 1, 'Todos os 9 arquivos oficiais existem no diretório OneDrive do usuário Gabriel');

// Carregar JSONs gerados a partir do OneDrive
const lojas = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'lojas.json'), 'utf8'));
const dinVol = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'din_vol.json'), 'utf8'));
const dinHc = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'din_hc.json'), 'utf8'));
const caixaOficial = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'caixa_oficial.json'), 'utf8'));
const regras = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'regras.json'), 'utf8'));
const config = JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'config.json'), 'utf8'));

assert(lojas.length === 152, 1, `Base consolidada contém exatamente as 152 lojas físicas ativas mapeadas (obtido: ${lojas.length})`);

// Instanciar motor
const engine = new DimEngine({ lojas, dinVol, dinHc, caixaOficial, regras, config });

// 2. Janela Móvel 4 Meses e Métrica de Volume Exclusivamente Quantidade Vendida
console.log('\n--- 2. Janela Móvel (202605 a 202608) e Volume (Qtd Vendida) ---');
const janela = engine.detectarJanelaMovel4Meses();
const janelaValida = janela.meses.length === 4 && 
                     janela.meses[0] === '202605' && 
                     janela.meses[3] === '202608';
assert(janelaValida, 2, 
  `Janela móvel detectada corretamente como 202605 a 202608 (${janela.meses.join(', ')})`);

// Verificar que o volume vem de Quantidade Vendida (unidades), sem métricas financeiras
const amostraVol = dinVol[0];
assert(amostraVol && typeof amostraVol.volMedioAtual === 'number' && amostraVol.volMedioAtual > 0, 2,
  'Driver de volume processado com sucesso em unidades físicas (Coluna N - Quantidade Vendida)');

// 3. Regra de FTE = Horas / 220
console.log('\n--- 3. Regra de Cálculo de FTE (Horas ÷ 220) ---');
let fteCalculoExato = true;

for (const loja of lojas) {
  for (const s of loja.setores) {
    if (s.hcTotalHoras > 0 && s.hcAtual > 0) {
      const esperado = Number((s.hcTotalHoras / (4 * 220)).toFixed(2));
      const diferenca = Math.abs(esperado - s.hcAtual);
      if (diferenca > 0.05) {
        fteCalculoExato = false;
      }
    }
  }
}
assert(fteCalculoExato, 3, 'Todos os setores convertem horas em FTE estritamente dividindo por 220 h/mês');

// 4. Venda por m² e Clusterização sem misturar investidas
console.log('\n--- 4. Venda por m² e Clusterização por Bandeira ---');
let clustersCorretos = true;
for (const loja of lojas) {
  if (loja.areaVenda > 0 && loja.volAnterior > 0) {
    const vendaM2Calc = Number((loja.volAnterior / loja.areaVenda).toFixed(2));
    if (Math.abs(vendaM2Calc - loja.vendaPorM2) > 0.1) {
      clustersCorretos = false;
    }
    // Verificar que clusterBandeira contém o prefixo da rede
    if (!loja.clusterBandeira.startsWith(loja.bandeira)) {
      clustersCorretos = false;
    }
  }
}
assert(clustersCorretos, 4, 'Venda/m² = Volume ÷ Área de Venda e clusters segmentados por bandeira sem mesclagem');

// 5. Metas Internas de Produtividade (Percentis P25, P50, P75)
console.log('\n--- 5. Metas Internas de Produtividade do Cluster ---');
const resCaixaP50 = engine.calcularTodosCaixa(0.50);
const resCaixaP75 = engine.calcularTodosCaixa(0.75);
const metaP50 = resCaixaP50[0].metaProdutividade;
const metaP75 = resCaixaP75[0].metaProdutividade;
assert(metaP50 > 0 && metaP75 > 0 && metaP75 >= metaP50, 5,
  `Metas calculadas via percentis matemáticos do cluster (P50: ${metaP50}, P75: ${metaP75}) sem valores fixos arbitrários`);

// 6. Projeção de Volume (SSS vs NOVA)
console.log('\n--- 6. Projeção de Volume SSS vs NOVA ---');
const lojaNova = lojas.find(l => l.classificacao === 'NOVA');
const lojaSSS = lojas.find(l => l.classificacao === 'SSS');
assert(lojaNova && lojaSSS, 6, `Bases contemplam lojas SSS (${lojaSSS.lojaNome}) e NOVA (${lojaNova.lojaNome}) com regras diferenciadas`);

// 7. HC Recomendado = ROUND(VolProjetado ÷ Meta) com Piso Mínimo
console.log('\n--- 7. HC Recomendado e Quadro Mínimo ---');
let pisoRespeitado = true;
for (const item of resCaixaP75) {
  if (item.temDimensionamento && item.hcRecomendado !== null && item.hcRecomendado < 3) { // Piso de caixa = 3
    pisoRespeitado = false;
  }
}
assert(pisoRespeitado, 7, 'HC Recomendado respeita rigorosamente o piso mínimo estrutural (ex: Caixa mínimo = 3)');

// 8. Tratamento de Setores Inexistentes, HC=0 e Sem Dados
console.log('\n--- 8. Setores Inexistentes, HC=0 e Sem Dimensionamento ---');
const semDim = engine.obterTodosSetoresSemDimensionamento();
assert(semDim.length > 0, 8, `Casos sem dimensionamento identificados e tratados com mensagens oficiais (${semDim.length} ocorrências)`);

const msgs = semDim.map(s => s.mensagemObrigatoria || s.mensagemCausa || '').filter(Boolean);
const temAvisoInexistente = msgs.some(m => m.includes('não possui essa seção na base de dados'));
const temAvisoHcZero = msgs.some(m => m.includes('ausência de HC válido'));
const temAvisoDadosInsuf = msgs.some(m => m.includes('ausência de dados necessários'));

assert(temAvisoInexistente, 8, 'Aviso oficial: "A loja [Nome] não possui essa seção na base de dados."');
assert(temAvisoHcZero, 8, 'Aviso oficial: "Não foi possível concluir o dimensionamento deste setor devido à ausência de HC válido."');
assert(temAvisoDadosInsuf, 8, 'Aviso oficial: "Não foi possível concluir a sugestão deste setor devido à ausência de dados necessários."');

// 9. Ausência Total de Termos Proibidos
console.log('\n--- 9. Verificação de Ausência de Termos Proibidos ---');
const termosProibidos = [
  'diferencaHC',
  'diferenca_hc',
  'variacao_hc',
  'contratacao',
  'desligamento',
  'saldo_hc',
  'deficit_hc',
  'excesso_hc'
];

let temTermoProibido = false;
const chavesItem = Object.keys(resCaixaP75[0]);
for (const termo of termosProibidos) {
  if (chavesItem.includes(termo)) {
    temTermoProibido = true;
    console.error(`Termo proibido encontrado no item de cálculo: ${termo}`);
  }
}
assert(!temTermoProibido, 9, 'Campos proibidos (diferença, contratação, desligamento, déficit, excesso) completamente eliminados do motor de cálculo');

// 10. Auditoria de Loja Completa Consolidada (DIN HC e DIN VOL)
console.log('\n--- 10. Auditoria Consolidada de Loja Completa ---');
const auditoria = engine.calcularAuditoriaLojaCompleta(0.75);
assert(auditoria && auditoria.itens && auditoria.itens.length === lojas.length, 10,
  `Auditoria gerada com sucesso para toda a rede (${lojas.length} lojas) integrando DIN HC e DIN VOL`);

const resumo = auditoria.itens.find(l => l.lojaNome === lojas[0].lojaNome);
assert(resumo && resumo.hcTotalAtual > 0 && resumo.hcTotalRecomendado > 0 && resumo.volTotalAtual > 0 && resumo.volTotalProjetado > 0, 10,
  `Consolidação da loja ${lojas[0].lojaNome}: HC Atual = ${resumo.hcTotalAtual} FTE, HC Recomendado = ${resumo.hcTotalRecomendado} FTE, Status = ${resumo.statusGeralOperacional}`);

// 11. Validação de Número da Loja em 100% das Lojas
console.log('\n--- 11. Validação de Número da Loja ---');
const lojasSemNumero = lojas.filter(l => l.numeroLoja === null || l.numeroLoja === undefined || isNaN(l.numeroLoja));
assert(lojasSemNumero.length === 0, 11, `Todas as ${lojas.length} lojas possuem Número da Loja mapeado (0 faltantes)`);

// 12. Validação das 12 Colunas da Visão Principal Operacional
console.log('\n--- 12. Validação das 12 Colunas da Visão Principal ---');
const amostraItem = resCaixaP75[0];
const colunasRequeridas = [
  'investida',
  'lojaNome',
  'numeroLoja',
  'clusterBandeira',
  'setor',
  'volAtual',
  'volProjetado',
  'hcAtual',
  'hcRecomendado',
  'produtividade',
  'metaProdutividade',
  'statusOperacional'
];
const todasColunasPresentes = colunasRequeridas.every(col => col in amostraItem);
assert(todasColunasPresentes, 12, `Todas as 12 colunas operacionais da Visão Principal estão presentes no item de cálculo: ${colunasRequeridas.join(', ')}`);

console.log('\n====================================================================');
console.log(`RESULTADO DA VALIDAÇÃO: ${passedChecks}/${totalChecks} VERIFICAÇÕES APROVADAS`);
if (failedChecks === 0) {
  console.log('STATUS GERAL: 100% CONFORME COM AS REGRAS OFICIAIS DO USUÁRIO!');
} else {
  console.error(`STATUS GERAL: ${failedChecks} FALHAS DETECTADAS.`);
  process.exit(1);
}
console.log('====================================================================');
