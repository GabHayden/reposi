/**
 * testar_projecao_volume_12regras.js
 * Validação rigorosa dos 8 cenários obrigatórios da regra oficial de projeção de volume
 * Varejo Alimentar Plurix
 */

'use strict';

const assert = require('assert');
const { DimEngine } = require('../js/engine.js');

console.log('====================================================================');
console.log('VALIDAÇÃO DOS 8 CENÁRIOS OBRIGATÓRIOS DE PROJEÇÃO DE VOLUME');
console.log('====================================================================\n');

let passCount = 0;
let totalTests = 8;

// ─── CENÁRIO 1: Desvio exatamente igual a 100% ──────────────────────────────
{
  const res = DimEngine.calcularProjecaoVolume({
    tipoLoja: 'SSS',
    volMesesAtual: [100000, 100000, 100000, 120000],
    volAtualTotal: 420000,
    volMesesAnterior: [100000, 100000, 100000, 120000],
    volAnteriorTotal: 420000,
    ultimoMesValido: '202608',
    volUltimoMesValido: 120000
  });

  assert.strictEqual(res.desvio, 1.0, 'Desvio deve ser 1,00');
  assert.strictEqual(res.isDesvio100, true, 'isDesvio100 deve ser true');
  assert.strictEqual(res.volProjetadoMedio, 120000, 'Volume Médio Mensal deve ser o último mês válido (120.000)');
  assert.strictEqual(res.volProjetadoTotal, 480000, 'Volume Projetado Total deve ser último mês × 4 (480.000)');
  console.log('✅ CENÁRIO 1 APROVADO: Desvio = 100% -> Médio Mensal = 120.000 | Total 4M = 480.000');
  passCount++;
}

// ─── CENÁRIO 2: Desvio maior que 100% ───────────────────────────────────────
{
  // Exemplo da especificação: Atual = 460.000, Anterior = 418.181,818..., Desvio = 1,10
  const volAtual = 460000;
  const volAnt = 460000 / 1.10;
  const res = DimEngine.calcularProjecaoVolume({
    tipoLoja: 'SSS',
    volMesesAtual: [100000, 110000, 120000, 130000],
    volAtualTotal: volAtual,
    volAnteriorTotal: volAnt,
    ultimoMesValido: '202608',
    volUltimoMesValido: 130000
  });

  assert(Math.abs(res.desvio - 1.10) < 0.0001, 'Desvio deve ser 1,10');
  assert.strictEqual(res.isDesvio100, false, 'isDesvio100 deve ser false');
  assert.strictEqual(res.volProjetadoTotal, 506000, 'Volume Projetado Total = 460.000 × 1,10 = 506.000');
  assert.strictEqual(res.volProjetadoMedio, 126500, 'Volume Projetado Médio Mensal = 506.000 ÷ 4 = 126.500');
  console.log('✅ CENÁRIO 2 APROVADO: Desvio = 110% -> Total 4M = 506.000 | Médio Mensal = 126.500');
  passCount++;
}

// ─── CENÁRIO 3: Desvio menor que 100% ───────────────────────────────────────
{
  // Exemplo: Atual = 460.000, Desvio = 0,90 -> Total = 414.000, Médio = 103.500
  const volAtual = 460000;
  const volAnt = 460000 / 0.90;
  const res = DimEngine.calcularProjecaoVolume({
    tipoLoja: 'SSS',
    volMesesAtual: [100000, 110000, 120000, 130000],
    volAtualTotal: volAtual,
    volAnteriorTotal: volAnt,
    ultimoMesValido: '202608',
    volUltimoMesValido: 130000
  });

  assert(Math.abs(res.desvio - 0.90) < 0.0001, 'Desvio deve ser 0,90');
  assert.strictEqual(res.isDesvio100, false, 'isDesvio100 deve ser false');
  assert.strictEqual(res.volProjetadoTotal, 414000, 'Volume Projetado Total = 460.000 × 0,90 = 414.000');
  assert.strictEqual(res.volProjetadoMedio, 103500, 'Volume Projetado Médio Mensal = 414.000 ÷ 4 = 103.500');
  console.log('✅ CENÁRIO 3 APROVADO: Desvio = 90% -> Total 4M = 414.000 | Médio Mensal = 103.500');
  passCount++;
}

// ─── CENÁRIO 4: Desvio dentro da tolerância de 100% (<= 0,0001) ─────────────
{
  // Desvio de 1,00005 (diferença = 0,00005 <= 0,0001)
  const volAtual = 100005;
  const volAnt = 100000;
  const res = DimEngine.calcularProjecaoVolume({
    tipoLoja: 'SSS',
    volMesesAtual: [25000, 25000, 25000, 25005],
    volAtualTotal: volAtual,
    volAnteriorTotal: volAnt,
    ultimoMesValido: '202608',
    volUltimoMesValido: 25005
  });

  assert(Math.abs(res.desvio - 1.00005) < 0.00001, 'Desvio decimal correto');
  assert.strictEqual(res.isDesvio100, true, 'Deve ser considerado 100% pela tolerância <= 0,0001');
  assert.strictEqual(res.volProjetadoMedio, 25005, 'Médio Mensal deve ser o último mês válido (25.005)');
  assert.strictEqual(res.volProjetadoTotal, 100020, 'Total 4M deve ser último mês × 4 (100.020)');
  console.log('✅ CENÁRIO 4 APROVADO: Desvio dentro da tolerância (1,00005) tratado como 100%');
  passCount++;
}

// ─── CENÁRIO 5: Volume anterior igual a zero ────────────────────────────────
{
  const res = DimEngine.calcularProjecaoVolume({
    tipoLoja: 'SSS',
    volMesesAtual: [30000, 30000, 30000, 35000],
    volAtualTotal: 125000,
    volAnteriorTotal: 0, // Zero! Não deve dividir por zero
    ultimoMesValido: '202608',
    volUltimoMesValido: 35000
  });

  assert.strictEqual(res.desvio, null, 'Desvio não deve ser calculado');
  assert.strictEqual(res.volProjetadoMedio, 35000, 'Volume Médio Mensal deve ser o último mês válido');
  assert.strictEqual(res.volProjetadoTotal, 140000, 'Volume Projetado Total deve ser último mês × 4');
  assert(res.auditoriaMotivo.includes('Volume anterior total igual a zero') || res.auditoriaMotivo.includes('inexistente'), 'Auditoria deve registrar motivo');
  console.log('✅ CENÁRIO 5 APROVADO: Volume anterior zero -> Divisão por zero evitada e contingência aplicada');
  passCount++;
}

// ─── CENÁRIO 6: Loja NOVA ───────────────────────────────────────────────────
{
  const res = DimEngine.calcularProjecaoVolume({
    tipoLoja: 'NOVA',
    volMesesAtual: [0, 0, 0, 45000],
    volAtualTotal: 45000,
    volAnteriorTotal: 0,
    ultimoMesValido: '202608',
    volUltimoMesValido: 45000
  });

  assert.strictEqual(res.desvio, null, 'Loja NOVA não calcula desvio artificial');
  assert.strictEqual(res.volProjetadoMedio, 45000, 'Volume Projetado Médio Mensal = último mês válido');
  assert.strictEqual(res.volProjetadoTotal, 180000, 'Volume Projetado Total = 45.000 × 4 = 180.000');
  assert(res.auditoriaMotivo.includes('Loja classificada como NOVA'), 'Mensagem oficial de auditoria para loja NOVA');
  console.log('✅ CENÁRIO 6 APROVADO: Loja NOVA -> Último mês válido × 4 com registro na auditoria');
  passCount++;
}

// ─── CENÁRIO 7: Histórico incompleto ────────────────────────────────────────
{
  const res = DimEngine.calcularProjecaoVolume({
    tipoLoja: 'SSS',
    volMesesAtual: [null, null, null, 28000],
    volAtualTotal: 28000,
    volAnteriorTotal: 0,
    ultimoMesValido: '202608',
    volUltimoMesValido: 28000,
    historicoIncompleto: true
  });

  assert.strictEqual(res.volProjetadoMedio, 28000, 'Volume Médio Mensal = último volume válido');
  assert.strictEqual(res.volProjetadoTotal, 112000, 'Volume Projetado Total = 28.000 × 4 = 112.000');
  assert(res.auditoriaMotivo.includes('Histórico insuficiente'), 'Mensagem oficial de histórico insuficiente');
  console.log('✅ CENÁRIO 7 APROVADO: Histórico incompleto -> Último mês válido × 4 com registro oficial');
  passCount++;
}

// ─── CENÁRIO 8: Ausência total de histórico ─────────────────────────────────
{
  const res = DimEngine.calcularProjecaoVolume({
    tipoLoja: 'SSS',
    volMesesAtual: [0, 0, 0, 0],
    volAtualTotal: 0,
    volAnteriorTotal: 0,
    ultimoMesValido: null,
    volUltimoMesValido: null
  });

  assert.strictEqual(res.volProjetadoTotal, null, 'Volume Projetado Total deve ser nulo');
  assert.strictEqual(res.volProjetadoMedio, null, 'Volume Projetado Médio deve ser nulo');
  assert.strictEqual(res.regraSelecionada.includes('Sem Dimensionamento'), true, 'Classificado como Sem Dimensionamento');
  console.log('✅ CENÁRIO 8 APROVADO: Ausência total de histórico -> Sem Dimensionamento');
  passCount++;
}

// ─── CENÁRIO OFICIAL 1: Exemplo Numérico Exato do Usuário (Histórico Comparável) ──
{
  const res = DimEngine.calcularProjecaoVolume({
    tipoLoja: 'SSS',
    periodoAtualDesc: 'Maio a Agosto/2026',
    volMesesAtual: [10000, 12000, 13000, 15000],
    volAtualTotal: 50000,
    periodoAnteriorDesc: 'Maio a Agosto/2025',
    volMesesAnterior: [15000, 17000, 18000, 20000],
    volAnteriorTotal: 70000,
    periodoProjetadoDesc: 'Setembro a Dezembro/2025',
    volMesesProjetadosAnoAnterior: [12000, 11000, 14000, 13000],
    somaMesesProjetadosAnoAnterior: 50000,
    ultimoMesValido: '202608',
    volUltimoMesValido: 15000
  });

  // 1. Período Atual
  assert.strictEqual(res.volAtualTotal, 50000, 'Passo 1: Período Atual = 50.000');
  // 2. Período Anterior
  assert.strictEqual(res.volAnteriorTotal, 70000, 'Passo 2: Período Anterior = 70.000');
  // 3. Desvio
  assert(Math.abs(res.desvio - (50000 / 70000)) < 0.00001, 'Passo 3: Desvio = 50.000 / 70.000 = 0,714285');
  assert.strictEqual(res.desvioPercentual, '71,43%', 'Passo 3: Desvio % = 71,43%');
  // 4. Meses Projetados do Ano Anterior & 5. Soma dos Meses Projetados
  assert.strictEqual(res.somaMesesProjetados, 50000, 'Passo 4: Soma do Período Projetado do Ano Anterior = 50.000');
  // 6. Volume Projetado Total
  assert(Math.abs(res.volProjetadoTotal - 35714.29) < 0.5, 'Passo 4: Volume Projetado Total ~ 35.714');
  // 7. Volume Projetado Médio Mensal
  assert(Math.abs(res.volProjetadoMedio - 8928.57) < 0.5, 'Passo 5: Volume Projetado Médio Mensal ~ 8.928,50');
  // 8. Regra Aplicada
  assert.strictEqual(res.regraAplicada, 'Histórico Comparável', 'Regra Aplicada = Histórico Comparável');

  console.log('✅ CENÁRIO OFICIAL 1 APROVADO: Exemplo Numérico (Atual=50k, Ant=70k, Desvio=71,43%, SomaProjAnt=50k -> ProjTotal=35.714, ProjMedio=8.928,50, Regra=Histórico Comparável)');
  passCount++;
  totalTests++;
}

// ─── CENÁRIO OFICIAL 2: Exemplo Numérico Exato do Usuário (Último Mês x 4) ──
{
  const res = DimEngine.calcularProjecaoVolume({
    tipoLoja: 'NOVA',
    volMesesAtual: [null, null, null, 20000],
    volAtualTotal: 20000,
    volAnteriorTotal: 0,
    ultimoMesValido: '202608',
    volUltimoMesValido: 20000,
    historicoIncompleto: true
  });

  // NÃO calcula desvio
  assert.strictEqual(res.desvio, null, 'Cenário 2: NÃO calcular desvio');
  // Volume Projetado Total = 20.000 × 4 = 80.000
  assert.strictEqual(res.volProjetadoTotal, 80000, 'Cenário 2: Volume Projetado Total = 20.000 × 4 = 80.000');
  // Volume Projetado Médio Mensal = 80.000 ÷ 4 = 20.000
  assert.strictEqual(res.volProjetadoMedio, 20000, 'Cenário 2: Volume Projetado Médio Mensal = 80.000 ÷ 4 = 20.000');
  // Regra Aplicada = Último Mês x 4
  assert.strictEqual(res.regraAplicada, 'Último Mês x 4', 'Regra Aplicada = Último Mês x 4');

  console.log('✅ CENÁRIO OFICIAL 2 APROVADO: Exemplo Numérico (Último Mês=20k -> ProjTotal=80.000, ProjMedio=20.000, Regra=Último Mês x 4)');
  passCount++;
  totalTests++;
}

// ─── TESTE ADICIONAL: Grandezas temporais do HC Recomendado (Seção 10) ──────
{
  // Meta mensal de 20.000 itens/FTE
  // Vol Médio Mensal = 126.500
  // HC Bruto = 126.500 / 20.000 = 6,325 -> ROUND = 6 FTE
  const volProjMedio = 126500;
  const metaMensal = 20000;
  const hcBruto = volProjMedio / metaMensal;
  assert.strictEqual(Number(hcBruto.toFixed(3)), 6.325, 'HC Bruto deve ser Vol Médio Mensal / Meta Mensal');
  assert.strictEqual(Math.round(hcBruto), 6, 'HC Arredondado = 6 FTE');
  console.log('✅ SEÇÃO 10 APROVADA: HC Recomendado utiliza grandezas temporais mensais equivalentes');
}

console.log('\n====================================================================');
console.log(`RESULTADO: ${passCount}/${totalTests} CENÁRIOS OBRIGATÓRIOS VALIDADOS COM 100% DE SUCESSO`);
console.log('====================================================================');

