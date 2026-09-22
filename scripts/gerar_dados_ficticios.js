/**
 * scripts/gerar_dados_ficticios.js
 * Gera a base clonada 100% fictícia para demonstração pública / Vercel / GitHub
 * SEM ALTERAR NENHUM ARQUIVO DA PASTA data/ ORIGINAL.
 * 
 * Salva a saída na pasta: data_ficticio/
 */

const fs = require('fs');
const path = require('path');

const DIR_ORIGINAL = path.join(__dirname, '..', 'data');
const DIR_FICTICIO = path.join(__dirname, '..', 'data_ficticio');

if (!fs.existsSync(DIR_FICTICIO)) {
  fs.mkdirSync(DIR_FICTICIO, { recursive: true });
}

console.log('=== GERANDO CLONE COM DADOS FICTÍCIOS PARA VERCEL / GITHUB ===');
console.log(`Lendo dados originais de: ${DIR_ORIGINAL}`);
console.log(`Salvando dados fictícios em: ${DIR_FICTICIO}`);

// 1. Ler as bases originais (apenas leitura, intocadas)
const lojasOrig = JSON.parse(fs.readFileSync(path.join(DIR_ORIGINAL, 'lojas.json'), 'utf8'));
const caixaOrig = JSON.parse(fs.readFileSync(path.join(DIR_ORIGINAL, 'caixa_oficial.json'), 'utf8'));
const dinVolOrig = JSON.parse(fs.readFileSync(path.join(DIR_ORIGINAL, 'din_vol.json'), 'utf8'));
const dinHcOrig = JSON.parse(fs.readFileSync(path.join(DIR_ORIGINAL, 'din_hc.json'), 'utf8'));
const hcCargosOrig = JSON.parse(fs.readFileSync(path.join(DIR_ORIGINAL, 'hc_cargos_fte.json'), 'utf8'));
const configOrig = JSON.parse(fs.readFileSync(path.join(DIR_ORIGINAL, 'config.json'), 'utf8'));
const regrasOrig = JSON.parse(fs.readFileSync(path.join(DIR_ORIGINAL, 'regras.json'), 'utf8'));
const setoresConfigOrig = JSON.parse(fs.readFileSync(path.join(DIR_ORIGINAL, 'setores_config.json'), 'utf8'));
const setoresResumoOrig = JSON.parse(fs.readFileSync(path.join(DIR_ORIGINAL, 'setores_resumo.json'), 'utf8'));

// 2. Mapeamento de Investidas e Bandeiras Fictícias
const MAPA_INVESTIDA = {
  'AMG': { id: 'ALF', nome: 'REDE ALFA', bandeiraPadrao: 'ALFA SUPER' },
  'AVE': { id: 'BET', nome: 'REDE BETA', bandeiraPadrao: 'BETA VAREJO' },
  'BOA': { id: 'GAM', nome: 'REDE GAMA', bandeiraPadrao: 'GAMA MARKET' },
  'PRN': { id: 'DEL', nome: 'REDE DELTA', bandeiraPadrao: 'DELTA HIPER' }
};

const MAPA_BANDEIRA = {
  'AMG': 'ALFA SUPER',
  'AMIGAO': 'ALFA HIPER',
  'AVENIDA': 'BETA VAREJO',
  'BOA': 'GAMA MARKET',
  'DOM OLIVIO': 'GAMA GOURMET',
  'PARANA': 'DELTA SUPER',
  'PARANA ATACADO': 'DELTA ATACADO',
  'PRN': 'DELTA HIPER'
};

// Nomes de bairros e regiões fictícias elegantes de varejo
const BAIRROS_FICTICIOS = [
  'CENTRO', 'JARDINS', 'BOULEVARD', 'PAULISTA', 'SHOPPING SUL', 'NORTE PLAZA',
  'BARRA', 'PRAIA DO SOL', 'ALPHAVILLE', 'MOEMA', 'PINHEIROS', 'MORUMBI',
  'CAMPINAS SHOPPING', 'RIBEIRAO PLAZA', 'ESTACAO', 'MONTE VERDE', 'IPIRANGA',
  'VILA NOVA', 'BELA VISTA', 'BOSQUE', 'LAGO DOS PATOS', 'PORTAL', 'PARQUE DAS FLORES',
  'SANTA TEREZA', 'SANTA CLARA', 'VILA VELHA', 'JARDIM DAS ACACIAS', 'PLANALTO',
  'GRANJA VIANA', 'TAMBORE', 'COLINA', 'MIRANTE', 'BEIRA RIO', 'ENSEADA',
  'AEROPORTO', 'AVENIDA CENTRAL', 'IMPERIAL', 'RETIRO', 'HORTO', 'PONTILHAO',
  'ALVORADA', 'PROGRESSO', 'CASTELO', 'VISTA LINDA', 'ESTRELA', 'VILA MARIANA',
  'SUMARE', 'PERDIZES', 'PACAEMBU', 'HIGIENOPOLIS', 'SAUDE', 'TATUAPE',
  'SANTANA', 'CASA VERDE', 'LAPA', 'BUTANTA', 'CONSOLACAO', 'LIBERDADE',
  'SANTO AMARO', 'INTERLAGOS', 'CAMPO LIMPO', 'SAO CRISTOVAO', 'TIJUCA', 'BOTAFOGO',
  'COPACABANA', 'LEBLON', 'FLAMENGO', 'GLORIA', 'CATETE', 'LARANJEIRAS'
];

// 3. Mapear cada loja real para uma loja fictícia consistente
const mapaLojas = {};
const lojasListFicticias = [];

lojasOrig.forEach((l, idx) => {
  const invFicticia = MAPA_INVESTIDA[l.investida] ? MAPA_INVESTIDA[l.investida].id : 'DEMO';
  const bandFicticia = MAPA_BANDEIRA[l.bandeira] || `${invFicticia} VAREJO`;
  const numLoja = idx + 1;
  const numLojaStr = String(numLoja).padStart(3, '0');
  const nomeBairro = BAIRROS_FICTICIOS[idx % BAIRROS_FICTICIOS.length];
  const lojaNomeFicticio = `${numLojaStr}-${nomeBairro}`;
  const chaveFicticia = `${invFicticia}${lojaNomeFicticio}`;

  // Fator pseudo-aleatório controlado (0.90 a 1.10) para anonimizar os números
  // sem quebrar a coerência matemática de produtividade
  const seed = (idx * 17 + 23) % 100;
  const fatorRuido = 0.92 + (seed / 100) * 0.16; // entre 0.92 e 1.08

  mapaLojas[l.lojaNome] = {
    lojaNomeFicticio,
    chaveFicticia,
    invFicticia,
    bandFicticia,
    numLoja,
    fatorRuido,
    originalLojaNome: l.lojaNome,
    originalChave: l.chave
  };
});

// 4. Clonar e anonimizar lojas.json
const lojasFicticias = lojasOrig.map(l => {
  const m = mapaLojas[l.lojaNome] || {
    lojaNomeFicticio: l.lojaNome,
    chaveFicticia: l.chave,
    invFicticia: l.investida,
    bandFicticia: l.bandeira,
    numLoja: l.numeroLoja || 1,
    fatorRuido: 1
  };

  const f = m.fatorRuido;
  const volAnteriorF = l.volAnterior ? Math.round(l.volAnterior * f * 100) / 100 : null;
  const volProjetadoF = l.volProjetado ? Math.round(l.volProjetado * f * 100) / 100 : null;
  const hcAnteriorF = l.hcAnterior ? Math.round(l.hcAnterior * f * 10) / 10 : null;
  const hcTotalLojaF = l.hcTotalLoja ? Math.round(l.hcTotalLoja * f * 10) / 10 : null;
  const areaVendaF = l.areaVenda ? Math.round(l.areaVenda * (0.95 + (f - 0.92) * 0.5)) : null;
  const vendaPorM2F = (volAnteriorF && areaVendaF) ? Math.round((volAnteriorF / areaVendaF) * 100) / 100 : null;

  // Setores da loja
  const setoresF = (l.setores || []).map(s => {
    const volAtualS = s.volAtual ? Math.round(s.volAtual * f * 100) / 100 : null;
    const volProjetadoS = s.volProjetado ? Math.round(s.volProjetado * f * 100) / 100 : null;
    const hcAtualS = s.hcAtual ? Math.round(s.hcAtual * f * 10) / 10 : null;
    const hcTotalHorasS = s.hcTotalHoras ? Math.round(s.hcTotalHoras * f * 100) / 100 : null;
    const produtividadeS = (volAtualS && hcAtualS && hcAtualS > 0) ? Math.round(volAtualS / hcAtualS) : null;

    const volumeMensalS = {};
    if (s.volumeMensal) {
      for (const [k, v] of Object.entries(s.volumeMensal)) {
        volumeMensalS[k] = v ? Math.round(v * f * 100) / 100 : null;
      }
    }

    const hcMensalS = {};
    if (s.hcMensal) {
      for (const [k, v] of Object.entries(s.hcMensal)) {
        hcMensalS[k] = v ? Math.round(v * f * 10) / 10 : null;
      }
    }

    return {
      ...s,
      volAtual: volAtualS,
      volProjetado: volProjetadoS,
      hcAtual: hcAtualS,
      hcTotalHoras: hcTotalHorasS,
      produtividade: produtividadeS,
      volumeMensal: volumeMensalS,
      hcMensal: hcMensalS
    };
  });

  const clusterBandeiraF = l.clusterBandeira
    ? l.clusterBandeira.replace(/^[A-Z0-9\s]+-/, `${m.bandFicticia}-`).replace(l.lojaNome, m.lojaNomeFicticio)
    : `${m.bandFicticia}-${l.cluster || 'A'}`;

  return {
    chave: m.chaveFicticia,
    investida: m.invFicticia,
    lojaNome: m.lojaNomeFicticio,
    codigoLoja: m.numLoja,
    numeroLoja: m.numLoja,
    bandeira: m.bandFicticia,
    coligada: m.invFicticia,
    areaVenda: areaVendaF,
    classificacao: l.classificacao || 'SSS',
    volAnterior: volAnteriorF,
    volProjetado: volProjetadoF,
    hcAnterior: hcAnteriorF,
    vendaPorM2: vendaPorM2F,
    cluster: l.cluster,
    clusterBandeira: clusterBandeiraF,
    metaProdutividade: null,
    hcTotalLoja: hcTotalLojaF,
    setores: setoresF
  };
});

// 5. Clonar e anonimizar caixa_oficial.json
const caixaFicticio = caixaOrig.map(c => {
  const m = mapaLojas[c.lojaNome] || {
    lojaNomeFicticio: c.lojaNome,
    chaveFicticia: c.chave,
    invFicticia: c.investida,
    bandFicticia: c.bandeira,
    fatorRuido: 1
  };
  const f = m.fatorRuido;
  const volAnteriorF = c.volAnterior ? Math.round(c.volAnterior * f * 100) / 100 : null;
  const volProjetadoF = c.volProjetado ? Math.round(c.volProjetado * f * 100) / 100 : null;
  const hcAnteriorF = c.hcAnterior ? Math.round(c.hcAnterior * f * 10) / 10 : null;
  const prodF = (volAnteriorF && hcAnteriorF && hcAnteriorF > 0) ? Math.round((volAnteriorF / hcAnteriorF) * 100) / 100 : null;
  const areaVendaF = c.areaVenda ? Math.round(c.areaVenda * (0.95 + (f - 0.92) * 0.5)) : null;
  const vendaPorM2F = (volAnteriorF && areaVendaF) ? Math.round((volAnteriorF / areaVendaF) * 100) / 100 : null;

  const clusterBandeiraF = c.clusterBandeira
    ? c.clusterBandeira.replace(/^[A-Z0-9\s]+-/, `${m.bandFicticia}-`).replace(c.lojaNome, m.lojaNomeFicticio)
    : `${m.bandFicticia}-${c.cluster || 'A'}`;

  return {
    ...c,
    chave: m.chaveFicticia,
    investida: m.invFicticia,
    lojaNome: m.lojaNomeFicticio,
    bandeira: m.bandFicticia,
    areaVenda: areaVendaF,
    volAnterior: volAnteriorF,
    volProjetado: volProjetadoF,
    hcAnterior: hcAnteriorF,
    produtividade: prodF,
    vendaPorM2: vendaPorM2F,
    clusterBandeira: clusterBandeiraF
  };
});

// 6. Clonar e anonimizar din_vol.json
const dinVolFicticio = dinVolOrig.map(v => {
  const m = mapaLojas[v.lojaNome] || {
    lojaNomeFicticio: v.lojaNome,
    chaveFicticia: v.chave,
    invFicticia: v.coligada,
    fatorRuido: 1
  };
  const f = m.fatorRuido;
  const periodoAtualF = v.periodoAtual ? Math.round(v.periodoAtual * f * 100) / 100 : null;
  const periodoAnteriorF = v.periodoAnterior ? Math.round(v.periodoAnterior * f * 100) / 100 : null;
  const projecaoM4F = v.projecaoM4 ? Math.round(v.projecaoM4 * f * 100) / 100 : null;
  const volMedioAtualF = periodoAtualF ? Math.round((periodoAtualF / 4) * 100) / 100 : null;

  const volumeMensalF = {};
  if (v.volumeMensal) {
    for (const [k, val] of Object.entries(v.volumeMensal)) {
      volumeMensalF[k] = val ? Math.round(val * f * 100) / 100 : null;
    }
  }

  return {
    chave: m.chaveFicticia,
    lojaNome: m.lojaNomeFicticio,
    coligada: m.invFicticia,
    setorConsiderado: v.setorConsiderado,
    isTotalLoja: v.isTotalLoja,
    classificacao: v.classificacao,
    periodoAtual: periodoAtualF,
    periodoAnterior: periodoAnteriorF,
    projecaoM4: projecaoM4F,
    volumeMensal: volumeMensalF,
    volMedioAtual: volMedioAtualF
  };
});

// 7. Clonar e anonimizar din_hc.json
const dinHcFicticio = dinHcOrig.map(h => {
  const m = mapaLojas[h.lojaNome] || {
    lojaNomeFicticio: h.lojaNome,
    chaveFicticia: h.chave,
    invFicticia: h.investida,
    fatorRuido: 1
  };
  const f = m.fatorRuido;
  const hcPeriodoF = h.hcPeriodo ? Math.round(h.hcPeriodo * f * 10) / 10 : null;
  const totalHorasF = h.totalHoras ? Math.round(h.totalHoras * f * 100) / 100 : null;
  const fteRealF = h.fteReal ? Math.round(h.fteReal * f * 10) / 10 : null;

  const hcMensalF = {};
  if (h.hcMensal) {
    for (const [k, val] of Object.entries(h.hcMensal)) {
      hcMensalF[k] = val ? Math.round(val * f * 10) / 10 : null;
    }
  }

  const horasMensalF = {};
  if (h.horasMensal) {
    for (const [k, val] of Object.entries(h.horasMensal)) {
      horasMensalF[k] = val ? Math.round(val * f * 100) / 100 : null;
    }
  }

  return {
    chave: m.chaveFicticia,
    investida: m.invFicticia,
    lojaNome: m.lojaNomeFicticio,
    setorConsiderado: h.setorConsiderado,
    isTotalLoja: h.isTotalLoja,
    hcPeriodo: hcPeriodoF,
    totalHoras: totalHorasF,
    fteReal: fteRealF,
    hcMensal: hcMensalF,
    horasMensal: horasMensalF
  };
});

// 8. Clonar e anonimizar hc_cargos_fte.json
const hcCargosFicticio = hcCargosOrig.map(c => {
  const m = mapaLojas[c.lojaNome] || {
    lojaNomeFicticio: c.lojaNome,
    invFicticia: c.investida,
    fatorRuido: 1
  };
  const f = m.fatorRuido;
  const horasTotal4MF = c.horasTotal4M ? Math.round(c.horasTotal4M * f * 100) / 100 : null;
  const horasMediaMensalF = horasTotal4MF ? Math.round((horasTotal4MF / 4) * 100) / 100 : null;
  const fteIndividualF = horasMediaMensalF ? Math.round((horasMediaMensalF / 220) * 100) / 100 : null;
  const colaboradoresCountF = fteIndividualF ? Math.max(1, Math.round(fteIndividualF * 1.15)) : 1;

  return {
    investida: m.invFicticia,
    lojaNome: m.lojaNomeFicticio,
    setorConsiderado: c.setorConsiderado,
    cargo: c.cargo,
    horasTotal4M: horasTotal4MF,
    horasMediaMensal: horasMediaMensalF,
    cargaPadraoMensal: 220,
    fteIndividual: fteIndividualF,
    colaboradoresCount: colaboradoresCountF,
    formulaDemonstracao: `${horasMediaMensalF} horas / 220 = ${fteIndividualF} FTE`
  };
});

// 9. Clonar e anonimizar config.json
const investidasFicticias = Array.from(new Set(lojasFicticias.map(l => l.investida))).sort();
const bandeirasFicticias = Array.from(new Set(lojasFicticias.map(l => l.bandeira))).sort();
const clustersFicticios = Array.from(new Set(lojasFicticias.map(l => l.clusterBandeira))).sort();
const totalHcRedeF = Math.round(lojasFicticias.reduce((acc, l) => acc + (l.hcTotalLoja || 0), 0) * 10) / 10;

const configFicticio = {
  ...configOrig,
  version: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  totalLojas: lojasFicticias.length,
  totalHcRede: totalHcRedeF,
  investidas: investidasFicticias,
  bandeiras: bandeirasFicticias,
  clusters: clustersFicticios,
  isMockData: true,
  ambiente: 'DEMO / VERCEL / GITHUB'
};

// 10. Salvar todos os 9 arquivos em data_ficticio/
fs.writeFileSync(path.join(DIR_FICTICIO, 'lojas.json'), JSON.stringify(lojasFicticias, null, 2), 'utf8');
fs.writeFileSync(path.join(DIR_FICTICIO, 'caixa_oficial.json'), JSON.stringify(caixaFicticio, null, 2), 'utf8');
fs.writeFileSync(path.join(DIR_FICTICIO, 'din_vol.json'), JSON.stringify(dinVolFicticio, null, 2), 'utf8');
fs.writeFileSync(path.join(DIR_FICTICIO, 'din_hc.json'), JSON.stringify(dinHcFicticio, null, 2), 'utf8');
fs.writeFileSync(path.join(DIR_FICTICIO, 'hc_cargos_fte.json'), JSON.stringify(hcCargosFicticio, null, 2), 'utf8');
fs.writeFileSync(path.join(DIR_FICTICIO, 'config.json'), JSON.stringify(configFicticio, null, 2), 'utf8');
fs.writeFileSync(path.join(DIR_FICTICIO, 'regras.json'), JSON.stringify(regrasOrig, null, 2), 'utf8');
fs.writeFileSync(path.join(DIR_FICTICIO, 'setores_config.json'), JSON.stringify(setoresConfigOrig, null, 2), 'utf8');
fs.writeFileSync(path.join(DIR_FICTICIO, 'setores_resumo.json'), JSON.stringify(setoresResumoOrig, null, 2), 'utf8');

console.log('\n✅ 9 ARQUIVOS FICTÍCIOS GERADOS COM SUCESSO EM data_ficticio/:');
console.log(`- lojas.json: ${lojasFicticias.length} lojas fictícias (ex: ${lojasFicticias[0].lojaNome})`);
console.log(`- caixa_oficial.json: ${caixaFicticio.length} registros`);
console.log(`- din_vol.json: ${dinVolFicticio.length} registros`);
console.log(`- din_hc.json: ${dinHcFicticio.length} registros`);
console.log(`- hc_cargos_fte.json: ${hcCargosFicticio.length} registros de cargos`);
console.log(`- config.json: ${investidasFicticias.length} investidas (ALF, BET, GAM, DEL) e ${bandeirasFicticias.length} bandeiras`);
console.log(`- regras.json, setores_config.json, setores_resumo.json preservados`);
console.log('🔒 ATENÇÃO: NENHUM arquivo em data/ original foi alterado!');
