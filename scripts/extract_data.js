/**
 * scripts/extract_data.js — Extrator Oficial Base OneDrive
 * 
 * Lê exclusivamente os 9 arquivos oficiais em:
 * C:\Users\GabrielHaydenAlves\OneDrive - PLX - Plurix\Dimensionamento\
 * 
 * 1. AREA VENDA.xlsx
 * 2. BASE HC.xlsx
 * 3. BASE VOLUME.xlsx
 * 4. DE PARA ANOME.xlsx
 * 5. DE PARA COD AVE.xlsx
 * 6. DE PARA HC.xlsx
 * 7. DE PARA INVESTIDA E LOJA.xlsx
 * 8. DE PARA SETOR.xlsx
 * 9. REGRA CAL PROD.xlsx
 */

'use strict';

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

const ONE_DRIVE_DIR = 'C:\\Users\\GabrielHaydenAlves\\OneDrive - PLX - Plurix\\Dimensionamento';
const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

function cleanStr(v) {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s === '' || s === '#N/A' || s === '#REF!' || s === 'null' || s === 'undefined' ? null : s;
}

function cleanNum(v) {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number') return isNaN(v) ? null : v;
  let s = String(v).trim().replace(/\s/g, '');
  if (s.includes(',') && s.includes('.')) {
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      s = s.replace(/,/g, '');
    }
  } else if (s.includes(',')) {
    const partes = s.split(',');
    if (partes.length > 2 || (partes.length === 2 && partes[1].length === 3 && partes[0].length <= 3)) {
      s = s.replace(/,/g, '');
    } else {
      s = s.replace(',', '.');
    }
  }
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

function round2(v) { return v !== null && v !== undefined && !isNaN(v) ? Math.round(v * 100) / 100 : null; }
function round1(v) { return v !== null && v !== undefined && !isNaN(v) ? Math.round(v * 10) / 10 : null; }
function round0(v) { return v !== null && v !== undefined && !isNaN(v) ? Math.round(v) : null; }

function normalizeKey(v) {
  if (!v) return '';
  return String(v).trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

function runExtraction(log = console.log) {
  log('===============================================================');
  log('INICIANDO EXTRAÇÃO OFICIAL - DIRETÓRIO ONEDRIVE / DIMENSIONAMENTO');
  log(`Pasta: ${ONE_DRIVE_DIR}`);
  log('===============================================================');

  // 1. CARREGAR DE PARA ANOMES
  log('\n[1/8] Carregando DE PARA ANOME.xlsx...');
  const wbAnome = XLSX.readFile(path.join(ONE_DRIVE_DIR, 'DE PARA ANOME.xlsx'), { cellStyles: false, cellFormulas: false });
  const rowsAnome = XLSX.utils.sheet_to_json(wbAnome.Sheets[wbAnome.SheetNames[0]]);
  
  const mapAnomeVol = {}; // 'MAI/26' -> '202605'
  const mapAnomeHC = {};  // '46143' -> '202605'
  rowsAnome.forEach(r => {
    const geral = String(r['ANOMES GERAL']).trim();
    if (r['ANO MÊS VOLUME']) mapAnomeVol[String(r['ANO MÊS VOLUME']).trim().toUpperCase()] = geral;
    if (r['ANO MÊS HC']) mapAnomeHC[String(r['ANO MÊS HC']).trim()] = geral;
  });
  log(`  ✓ Mapeamentos de datas carregados. Meses válidos mapeados: ${Object.keys(mapAnomeVol).length} vol, ${Object.keys(mapAnomeHC).length} hc`);

  // Janela móvel oficial: 4 últimos meses disponíveis
  const ultimos4 = ['202605', '202606', '202607', '202608'];
  const periodoAnterior4 = ['202601', '202602', '202603', '202604'];
  log(`  ✓ Janela móvel configurada: ${ultimos4.join(', ')}`);

  // 2. CARREGAR DE PARA SETOR & DE PARA HC & REGRA CAL PROD
  log('\n[2/8] Carregando De/Para de Setores, HC e Regras...');
  
  // Setores de Volume: Coligada + Departamento + Secao -> PARA
  const wbDeParaSetor = XLSX.readFile(path.join(ONE_DRIVE_DIR, 'DE PARA SETOR.xlsx'), { cellStyles: false, cellFormulas: false });
  const rowsSetor = XLSX.utils.sheet_to_json(wbDeParaSetor.Sheets[wbDeParaSetor.SheetNames[0]]);
  const mapSetorVol = new Map();
  rowsSetor.forEach(r => {
    const coligada = normalizeKey(r['Coligada']);
    const dep = normalizeKey(r['Departamento']);
    const sec = normalizeKey(r['Secao']);
    const para = cleanStr(r['PARA']);
    if (para) {
      mapSetorVol.set(`${coligada}::${dep}::${sec}`, para);
      // Fallback sem departamento
      mapSetorVol.set(`${coligada}::*::${sec}`, para);
    }
  });
  log(`  ✓ ${mapSetorVol.size} regras de padronização de Setor Volume carregadas`);

  // Setores de HC: Investida + D. C. Custo -> PARA
  const wbDeParaHC = XLSX.readFile(path.join(ONE_DRIVE_DIR, 'DE PARA HC.xlsx'), { cellStyles: false, cellFormulas: false });
  const rowsDeParaHC = XLSX.utils.sheet_to_json(wbDeParaHC.Sheets[wbDeParaHC.SheetNames[0]]);
  const mapCCParaSetorHC = new Map();
  rowsDeParaHC.forEach(r => {
    const inv = normalizeKey(r['Investida']);
    const cc = normalizeKey(r['D. C. Custo']);
    const para = cleanStr(r['PARA']);
    if (para) {
      mapCCParaSetorHC.set(`${inv}::${cc}`, para);
      mapCCParaSetorHC.set(`*::${cc}`, para);
    }
  });
  log(`  ✓ ${mapCCParaSetorHC.size} regras de padronização de Setor HC carregadas`);

  // Regras de Driver de Produtividade (REGRA CAL PROD)
  const wbRegras = XLSX.readFile(path.join(ONE_DRIVE_DIR, 'REGRA CAL PROD.xlsx'), { cellStyles: false, cellFormulas: false });
  const rowsRegras = XLSX.utils.sheet_to_json(wbRegras.Sheets[wbRegras.SheetNames[0]]);
  const mapRegraProd = {};
  rowsRegras.forEach(r => {
    const hcSetor = cleanStr(r['Tabela_HC_FTE']);
    const volSetor = cleanStr(r['Tabela_VOLUME_VENDA']);
    if (hcSetor) {
      const vTrim = volSetor ? volSetor.trim() : 'TOTAL';
      mapRegraProd[hcSetor] = (vTrim === 'TOTAL' || vTrim === '') ? ' TOTAL' : vTrim;
    }
  });
  log(`  ✓ Drivers de produtividade definidos: ${Object.keys(mapRegraProd).length} setores`);

  // 3. CARREGAR ÁREA DE VENDAS & LOJAS
  log('\n[3/8] Carregando ÁREA DE VENDAS.xlsx e DE PARA INVESTIDA E LOJA.xlsx...');
  const wbArea = XLSX.readFile(path.join(ONE_DRIVE_DIR, 'AREA VENDA.xlsx'), { cellStyles: false, cellFormulas: false });
  const rowsArea = XLSX.utils.sheet_to_json(wbArea.Sheets[wbArea.SheetNames[0]]);
  
  // DE PARA COD AVE
  const wbCodAve = XLSX.readFile(path.join(ONE_DRIVE_DIR, 'DE PARA COD AVE.xlsx'), { cellStyles: false, cellFormulas: false });
  const rowsCodAve = XLSX.utils.sheet_to_json(wbCodAve.Sheets[wbCodAve.SheetNames[0]], { header: 1 });
  const mapAveFilial = new Map();
  for (let i = 1; i < rowsCodAve.length; i++) {
    const r = rowsCodAve[i];
    if (!r) continue;
    const codA = cleanNum(r[0]);
    const codB = cleanNum(r[1]);
    if (codA && codB) {
      mapAveFilial.set(codA, codB);
      mapAveFilial.set(codB, codB);
    }
  }

  // DE PARA INVESTIDA E LOJA
  const wbDeParaLoja = XLSX.readFile(path.join(ONE_DRIVE_DIR, 'DE PARA INVESTIDA E LOJA.xlsx'), { cellStyles: false, cellFormulas: false });
  const rowsDeParaLoja = XLSX.utils.sheet_to_json(wbDeParaLoja.Sheets[wbDeParaLoja.SheetNames[0]], { header: 1 });
  // Map (Investida/Coligada + filial) -> Loja - Nome e Mapa Filial -> Nome
  const mapFilialParaLoja = new Map();
  const mapLojaParaNumero = new Map();
  for (let i = 1; i < rowsDeParaLoja.length; i++) {
    const r = rowsDeParaLoja[i];
    if (!r) continue;
    const colig = cleanStr(r[0]);
    const lojaNome = cleanStr(r[2]);
    const filial = cleanNum(r[3]);
    if (lojaNome && filial !== null) {
      mapLojaParaNumero.set(lojaNome, filial);
      if (colig) mapFilialParaLoja.set(`${colig}::${filial}`, lojaNome);
      mapFilialParaLoja.set(`*::${filial}`, lojaNome);
    }
  }

  // Mapear lojas válidas da ÁREA DE VENDAS (excluindo SPO e lojas com área <= 0)
  const catalogoLojas = new Map();
  rowsArea.forEach(r => {
    const coligada = cleanStr(r['Coligada']);
    const investida = cleanStr(r['Investida']);
    const lojaNome = cleanStr(r['Loja - Nome']);
    const codLoja = cleanNum(r['Código Loja']);
    const areaVenda = cleanNum(r['m² área de venda']);

    if (!lojaNome || coligada === 'SPO' || investida === '2' || investida === 2) return;
    if (catalogoLojas.has(lojaNome)) return;

    catalogoLojas.set(lojaNome, {
      lojaNome,
      coligada: coligada || 'OUTROS',
      investida: coligada || 'OUTROS',
      codigoLoja: codLoja,
      areaVenda: areaVenda && areaVenda > 0 ? areaVenda : null,
      bandeira: coligada || 'OUTROS',
      classificacao: 'SSS', // Padrão, será atualizado com BASE VOLUME
      volumes: {}, // setor -> { m202605, m202606, ... }
      hc: {},      // setor -> { m202605, m202606, ... }
    });

    if (coligada && codLoja !== null) {
      mapFilialParaLoja.set(`${coligada}::${codLoja}`, lojaNome);
    }
  });
  log(`  ✓ ${catalogoLojas.size} lojas ativas catalogadas (sem SPO)`);

  // 4. PROCESSAR BASE VOLUME.xlsx (Coluna N: QTD)
  log('\n[4/8] Processando BASE VOLUME.xlsx (Estritamente Coluna N - Quantidade Vendida)...');
  console.time('Leitura BASE VOLUME');
  const wbVol = XLSX.readFile(path.join(ONE_DRIVE_DIR, 'BASE VOLUME.xlsx'), {
    cellStyles: false,
    cellFormulas: false,
    cellHTML: false
  });
  console.timeEnd('Leitura BASE VOLUME');

  const volData = XLSX.utils.sheet_to_json(wbVol.Sheets[wbVol.SheetNames[0]], { header: 1, defval: null });
  log(`  Total de linhas em BASE VOLUME: ${volData.length}`);

  // Header row = volData[0]
  // A: Coligada (0), B: Loja - Nome (1), C: Bandeira (2), D: Grupo/Subgrupo (3), E: SSS (4), F: ANO MÊS (5), G: Departamento (6), H: Secao (7), N: QTD (13)
  const vColColigada = 0;
  const vColLojaNome = 1;
  const vColBandeira = 2;
  const vColSSS      = 4;
  const vColAnoMes   = 5;
  const vColDep      = 6;
  const vColSecao    = 7;
  const vColQtd      = 13; // Coluna N

  // Agregação de volume por (Loja x SetorVolume x AnoMes)
  const volAgg = {}; // `${lojaNome}::${setorVolume}::${anomes}` -> soma QTD
  const volTotalLojaMes = {}; // `${lojaNome}::${anomes}` -> soma QTD todos os setores
  const sssStatusMap = {}; // lojaNome -> 'SSS' ou 'NOVA'
  const bandeiraMap = {};  // lojaNome -> Bandeira

  let linhasVolProcessadas = 0;

  for (let i = 1; i < volData.length; i++) {
    const r = volData[i];
    if (!r) continue;
    const colig = cleanStr(r[vColColigada]);
    if (colig === 'SPO') continue;

    const lojaNome = cleanStr(r[vColLojaNome]);
    if (!lojaNome || !catalogoLojas.has(lojaNome)) continue;

    const rawAnoMes = cleanStr(r[vColAnoMes]);
    const anomes = mapAnomeVol[rawAnoMes ? rawAnoMes.toUpperCase() : ''] || rawAnoMes;
    if (!anomes || (!ultimos4.includes(anomes) && !periodoAnterior4.includes(anomes))) continue;

    const qtd = cleanNum(r[vColQtd]) || 0;
    const sssRaw = cleanStr(r[vColSSS]);
    const bandeira = cleanStr(r[vColBandeira]);

    if (bandeira && !bandeiraMap[lojaNome]) bandeiraMap[lojaNome] = bandeira;
    if (sssRaw && !sssStatusMap[lojaNome]) {
      sssStatusMap[lojaNome] = (sssRaw.toUpperCase().includes('SIM') || sssRaw.toUpperCase() === 'SSS') ? 'SSS' : 'NOVA';
    }

    // Identificar Setor Volume via DE PARA SETOR
    const depKey = normalizeKey(r[vColDep]);
    const secKey = normalizeKey(r[vColSecao]);
    const coligKey = normalizeKey(colig);

    let setorVol = mapSetorVol.get(`${coligKey}::${depKey}::${secKey}`)
                || mapSetorVol.get(`${coligKey}::*::${secKey}`)
                || mapSetorVol.get(`*::*::${secKey}`);

    if (!setorVol) {
      // Setor não mapeado ou não considerado
      setorVol = 'OUTROS';
    }

    if (setorVol === 'NÃO CONTA') continue;

    // Agregar volume do setor
    const kSetor = `${lojaNome}::${setorVol}::${anomes}`;
    volAgg[kSetor] = (volAgg[kSetor] || 0) + qtd;

    // Agregar volume Total da Loja (driver para CAIXA, FISCAL, etc.)
    const kTotal = `${lojaNome}:: TOTAL::${anomes}`;
    volTotalLojaMes[kTotal] = (volTotalLojaMes[kTotal] || 0) + qtd;

    linhasVolProcessadas++;
  }
  log(`  ✓ ${linhasVolProcessadas} registros de volume processados e agregados por setor`);

  // 5. PROCESSAR BASE HC.xlsx (Horas ÷ 220 = FTE)
  log('\n[5/8] Processando BASE HC.xlsx (FTE = Horas Trabalhadas ÷ 220)...');
  console.time('Leitura BASE HC');
  const wbHC = XLSX.readFile(path.join(ONE_DRIVE_DIR, 'BASE HC.xlsx'), {
    cellStyles: false,
    cellFormulas: false,
    cellHTML: false
  });
  console.timeEnd('Leitura BASE HC');

  const hcData = XLSX.utils.sheet_to_json(wbHC.Sheets[wbHC.SheetNames[0]], { header: 1, defval: null });
  log(`  Total de linhas em BASE HC: ${hcData.length}`);

  // Headers BASE HC:
  // Origem (0), Investida (1), Mês (2), C. Evento (3), D. Evento (4), Matricula (5), Colaborador (6), Filial (7), C. C. Custo (8), D. C. Custo (9), Referência/Horas (10)
  const hColInvestida   = 1;
  const hColMes         = 2;
  const hColMatricula   = 5;
  const hColColaborador = 6;
  const hColFilial      = 7;
  const hColCC          = 9;  // D. C. Custo
  const hColHoras       = 10; // Referência

  const hcAgg = {}; // `${lojaNome}::${setorHC}::${anomes}` -> soma horas
  const hcCargosAgg = {}; // `${lojaNome}::${setorHC}::${cargo}` -> horas, fte
  let linhasHCProcessadas = 0;

  for (let i = 1; i < hcData.length; i++) {
    const r = hcData[i];
    if (!r) continue;

    const inv = cleanStr(r[hColInvestida]);
    if (inv === 'SPO') continue;

    const rawMes = String(r[hColMes] || '').trim();
    const anomes = mapAnomeHC[rawMes] || mapAnomeVol[rawMes.toUpperCase()] || rawMes;
    if (!anomes || (!ultimos4.includes(anomes) && !periodoAnterior4.includes(anomes))) continue;

    const filial = cleanNum(r[hColFilial]);
    let lojaNome = mapFilialParaLoja.get(`${inv}::${filial}`);

    if (!lojaNome && inv === 'AVE' && filial) {
      const filialTraduzida = mapAveFilial.get(filial) || filial;
      lojaNome = mapFilialParaLoja.get(`AVE::${filialTraduzida}`);
    }

    if (!lojaNome || !catalogoLojas.has(lojaNome)) continue;

    const cc = cleanStr(r[hColCC]);
    const invKey = normalizeKey(inv);
    const ccKey = normalizeKey(cc);

    let setorHC = mapCCParaSetorHC.get(`${invKey}::${ccKey}`)
               || mapCCParaSetorHC.get(`*::${ccKey}`);

    if (!setorHC) setorHC = 'OUTROS';
    if (setorHC === 'NÃO CONTA') continue;

    const horas = cleanNum(r[hColHoras]) || 0;
    if (horas <= 0) continue;

    const kHC = `${lojaNome}::${setorHC}::${anomes}`;
    hcAgg[kHC] = (hcAgg[kHC] || 0) + horas;

    // Acumular detalhamento por Centro de Custo/Cargo para memória de cálculo
    const colab = cleanStr(r[hColColaborador]) || 'Colaborador';
    const mat = cleanStr(r[hColMatricula]) || '';
    const kCargo = `${lojaNome}::${setorHC}::${cc || 'Geral'}`;
    if (!hcCargosAgg[kCargo]) {
      hcCargosAgg[kCargo] = {
        investida: inv,
        lojaNome,
        setorHC,
        cargo: cc || 'Geral',
        horasTotal4M: 0,
        horasMeses: { '202605': 0, '202606': 0, '202607': 0, '202608': 0 },
        colaboradores: new Set()
      };
    }
    if (ultimos4.includes(anomes)) {
      hcCargosAgg[kCargo].horasTotal4M += horas;
      hcCargosAgg[kCargo].horasMeses[anomes] = (hcCargosAgg[kCargo].horasMeses[anomes] || 0) + horas;
      if (mat) hcCargosAgg[kCargo].colaboradores.add(mat);
    }

    linhasHCProcessadas++;
  }
  log(`  ✓ ${linhasHCProcessadas} registros de horas processados e convertidos em FTE`);

  // 6. ESTRUTURAÇÃO DAS BASES CONSOLIDADAS: DIN VOL, DIN HC, LOJAS
  log('\n[6/8] Estruturando bases setoriais e calculando Venda/m² para clusterização...');

  const dinVol = [];
  const dinHc = [];
  const lojasList = [];

  // Setores operacionais padrão
  const SETORES_OPERACIONAIS = [
    'OPERADOR DE CAIXA',
    'AÇOUGUE / PEIXARIA',
    'PADARIA',
    'P.A.S.',
    'F.L.V',
    'EMPACOTADOR',
    'REPOSITOR',
    'ROTISSERIA',
    'DEPÓSITO',
    'LIMPEZA',
    'GERÊNCIA DE LOJA',
    'E-COMMERCE',
    'ENCARREGADO DE LOJA',
    'FISCAL CAIXA'
  ];

  // Pisos mínimos homologados
  const QUADROS_MINIMOS = {
    'OPERADOR DE CAIXA':  3,
    'AÇOUGUE / PEIXARIA': 6,
    'PADARIA':            5,
    'P.A.S.':             5,
    'F.L.V':              4,
    'DEPÓSITO':           4,
    'REPOSITOR':          6,
    'FISCAL CAIXA':       2,
    'ROTISSERIA':         0,
    'EMPACOTADOR':        0,
    'LIMPEZA':            0,
    'GERÊNCIA DE LOJA':   0,
    'E-COMMERCE':         0,
    'ENCARREGADO DE LOJA':0
  };

  // Montar lojas consolidadas
  catalogoLojas.forEach(loja => {
    const { lojaNome, coligada, codigoLoja, areaVenda } = loja;
    const bandeira = bandeiraMap[lojaNome] || coligada;
    const classificacao = sssStatusMap[lojaNome] || 'SSS';

    // 1. Volume dos 4 meses para TOTAL
    let volTotalAtual = 0;
    const volTotalMeses = {};
    ultimos4.forEach(m => {
      const v = volTotalLojaMes[`${lojaNome}:: TOTAL::${m}`] || 0;
      volTotalMeses[m] = round2(v);
      volTotalAtual += v;
    });

    let volTotalAnterior = 0;
    periodoAnterior4.forEach(m => {
      volTotalAnterior += (volTotalLojaMes[`${lojaNome}:: TOTAL::${m}`] || 0);
    });

    const volMedioAtual = volTotalAtual / 4;
    const volMedioAnterior = volTotalAnterior > 0 ? (volTotalAnterior / 4) : volMedioAtual;
    const taxaCrescimento = volMedioAnterior > 0 ? ((volMedioAtual - volMedioAnterior) / volMedioAnterior) : 0;
    
    // Projeção Volume Loja: SSS usa taxa sobre 4 meses; NOVA usa último mês x 4
    let volProjetadoTotal = 0;
    if (classificacao === 'SSS') {
      volProjetadoTotal = volTotalAtual * (1 + taxaCrescimento);
    } else {
      const ultMes = volTotalMeses['202608'] || (volTotalAtual / 4);
      volProjetadoTotal = ultMes * 4;
    }

    // Venda por metro quadrado (QTD Total ÷ Área de Venda em m²)
    const vendaPorM2 = (areaVenda && areaVenda > 0 && volTotalAtual > 0)
      ? round2(volTotalAtual / areaVenda)
      : null;

    // Calcular HC total da loja nos 4 meses
    let hcTotalHoras = 0;
    ultimos4.forEach(m => {
      SETORES_OPERACIONAIS.forEach(s => {
        hcTotalHoras += (hcAgg[`${lojaNome}::${s}::${m}`] || 0);
      });
    });
    // FTE mensal médio = (Horas totais / 4) / 220 = Horas totais / 880
    const hcTotalLojaFTE = round2(hcTotalHoras / 880);

    const lojaObj = {
      chave: `${coligada}${lojaNome}`,
      investida: coligada,
      lojaNome,
      codigoLoja: codigoLoja ?? mapLojaParaNumero.get(lojaNome) ?? null,
      numeroLoja: codigoLoja ?? mapLojaParaNumero.get(lojaNome) ?? null,
      bandeira,
      coligada,
      areaVenda,
      classificacao,
      volAnterior: round2(volTotalAtual),
      volProjetado: round2(volProjetadoTotal),
      hcAnterior: hcTotalLojaFTE,
      vendaPorM2,
      cluster: 'B', // Será calculado na clusterização abaixo
      clusterBandeira: `${bandeira}-B`,
      metaProdutividade: null,
      hcTotalLoja: hcTotalLojaFTE,
      setores: []
    };

    // Montar registros de cada setor para a loja
    SETORES_OPERACIONAIS.forEach(setor => {
      const driverVol = mapRegraProd[setor] || ' TOTAL';
      const isDriverTotal = (driverVol === ' TOTAL' || driverVol === 'TOTAL' || driverVol.trim() === 'TOTAL');

      // Coletar volumes do setor nos 4 meses
      let vSetorTot = 0;
      const vMeses = {};
      ultimos4.forEach(m => {
        const v = isDriverTotal
          ? (volTotalLojaMes[`${lojaNome}:: TOTAL::${m}`] || 0)
          : (volAgg[`${lojaNome}::${driverVol}::${m}`] || 0);
        vMeses[m] = round2(v);
        vSetorTot += v;
      });

      let vSetorAnt = 0;
      periodoAnterior4.forEach(m => {
        vSetorAnt += isDriverTotal
          ? (volTotalLojaMes[`${lojaNome}:: TOTAL::${m}`] || 0)
          : (volAgg[`${lojaNome}::${driverVol}::${m}`] || 0);
      });

      const txCrescSetor = vSetorAnt > 0 ? ((vSetorTot - vSetorAnt) / vSetorAnt) : taxaCrescimento;
      let vProjSetor = 0;
      if (classificacao === 'SSS') {
        vProjSetor = vSetorTot * (1 + txCrescSetor);
      } else {
        const ultM = vMeses['202608'] || (vSetorTot / 4);
        vProjSetor = ultM * 4;
      }

      // Coletar horas HC do setor nos 4 meses e converter para FTE
      let hTotHoras = 0;
      const hMesesFTE = {};
      ultimos4.forEach(m => {
        const h = hcAgg[`${lojaNome}::${setor}::${m}`] || 0;
        hTotHoras += h;
        hMesesFTE[m] = round2(h / 220); // FTE do mês
      });

      const hcMedioFTE = round2((hTotHoras / 4) / 220); // FTE médio mensal
      const prodAtual = (vSetorTot > 0 && hcMedioFTE > 0) ? round2((vSetorTot / 4) / hcMedioFTE) : null;

      // Status preliminar do setor
      let temDados = true;
      let aviso = null;
      let statusOperacional = '⚪ Sem Dimensionamento';

      if (vSetorTot === 0 && hcMedioFTE === 0) {
        temDados = false;
        aviso = `A loja ${lojaNome} não possui essa seção na base de dados.`;
      } else if (hcMedioFTE === 0) {
        temDados = false;
        aviso = 'Não foi possível concluir o dimensionamento deste setor devido à ausência de HC válido.';
      } else if (vSetorTot === 0) {
        temDados = false;
        aviso = 'Não foi possível concluir a sugestão deste setor devido à ausência de dados necessários.';
      }

      const setorObj = {
        setor,
        driverVolume: driverVol,
        hcAtual: hcMedioFTE,
        hcTotalHoras: round2(hTotHoras),
        volAtual: round2(vSetorTot),
        volProjetado: round2(vProjSetor),
        produtividade: prodAtual,
        temDados,
        aviso,
        volumeMensal: vMeses,
        hcMensal: hMesesFTE
      };

      lojaObj.setores.push(setorObj);

      // Inserir nos arrays DIN VOL e DIN HC
      dinVol.push({
        chave: `${coligada}${lojaNome}`,
        lojaNome,
        coligada,
        setorConsiderado: isDriverTotal ? ' TOTAL' : driverVol,
        isTotalLoja: isDriverTotal,
        classificacao,
        periodoAtual: round2(vSetorTot),
        periodoAnterior: round2(vSetorAnt),
        projecaoM4: round2(vProjSetor),
        volumeMensal: vMeses,
        volMedioAtual: round2(vSetorTot / 4)
      });

      dinHc.push({
        chave: `${coligada}${lojaNome}`,
        lojaNome,
        investida: coligada,
        setorConsiderado: setor,
        hcAtual: hcMedioFTE,
        periodoAtual: round2(hcMedioFTE * 4),
        mediaFTE: hcMedioFTE,
        hcMensal: hMesesFTE
      });
    });

    lojasList.push(lojaObj);
  });

  // 7. CLUSTERIZAÇÃO OFICIAL POR VENDA/M² (Sem misturar Investidas nem Bandeiras)
  log('\n[7/8] Executando clusterização oficial por Venda/m²...');

  // Agrupar lojas por bandeira
  const porBandeira = {};
  lojasList.forEach(l => {
    if (!porBandeira[l.bandeira]) porBandeira[l.bandeira] = [];
    porBandeira[l.bandeira].push(l);
  });

  const clustersSet = new Set();

  Object.keys(porBandeira).forEach(band => {
    const lojas = porBandeira[band];
    if (lojas.length < 8) {
      // Bandeira com menos de 8 lojas: Cluster Único por loja
      lojas.forEach(l => {
        l.cluster = `ÚNICO - ${l.lojaNome}`;
        l.clusterBandeira = `${band}-ÚNICO - ${l.lojaNome}`;
        clustersSet.add(l.clusterBandeira);
      });
    } else {
      // Ordenar por Venda por m² (apenas lojas com vendaPorM2 válido)
      const comVendaM2 = lojas.filter(l => l.vendaPorM2 !== null && l.vendaPorM2 > 0)
                              .sort((a, b) => a.vendaPorM2 - b.vendaPorM2);
      
      const n = comVendaM2.length;
      comVendaM2.forEach((l, idx) => {
        const pct = n > 1 ? (idx / (n - 1)) : 0.5;
        let cLetter = 'D';
        if (pct >= 0.75) cLetter = 'A';
        else if (pct >= 0.50) cLetter = 'B';
        else if (pct >= 0.25) cLetter = 'C';

        l.cluster = cLetter;
        l.clusterBandeira = `${band}-${cLetter}`;
        clustersSet.add(l.clusterBandeira);
      });

      // Lojas sem venda por m² recebem quartil D por padrão
      lojas.filter(l => !l.vendaPorM2 || l.vendaPorM2 <= 0).forEach(l => {
        l.cluster = 'D';
        l.clusterBandeira = `${band}-D`;
        clustersSet.add(l.clusterBandeira);
      });
    }
  });

  log(`  ✓ ${lojasList.length} lojas clusterizadas em ${clustersSet.size} clusters oficiais`);

  // 8. SALVAR BASES JSON OFICIAIS EM data/
  log('\n[8/8] Gravando bases JSON limpas e otimizadas em data/...');

  // Detalhe de cargos e FTE para memória de cálculo
  const cargosFteList = Object.keys(hcCargosAgg).map(k => {
    const item = hcCargosAgg[k];
    const horasMedia = item.horasTotal4M / 4;
    const fteIndividual = round2(horasMedia / 220);
    return {
      investida: item.investida,
      lojaNome: item.lojaNome,
      setorConsiderado: item.setorHC,
      cargo: item.cargo,
      horasTotal4M: round2(item.horasTotal4M),
      horasMediaMensal: round2(horasMedia),
      cargaPadraoMensal: 220,
      fteIndividual,
      colaboradoresCount: item.colaboradores.size,
      formulaDemonstracao: `${round1(horasMedia)} horas / 220 = ${fteIndividual} FTE`
    };
  }).sort((a, b) => a.lojaNome.localeCompare(b.lojaNome) || a.setorConsiderado.localeCompare(b.setorConsiderado));

  // Setores resumo com estatísticas
  const setoresResumo = SETORES_OPERACIONAIS.map(setor => {
    let totHc = 0;
    let totVol = 0;
    lojasList.forEach(l => {
      const s = l.setores.find(st => st.setor === setor);
      if (s) {
        totHc += (s.hcAtual || 0);
        totVol += (s.volAtual || 0);
      }
    });
    return {
      setor,
      totalHc: round1(totHc),
      totalVolume: round0(totVol),
      quadroMinimo: QUADROS_MINIMOS[setor] || 0,
      driverVolume: mapRegraProd[setor] || ' TOTAL'
    };
  });

  // Config geral
  const config = {
    version: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    totalLojas: lojasList.length,
    totalHcRede: round1(lojasList.reduce((acc, l) => acc + (l.hcTotalLoja || 0), 0)),
    investidas: Array.from(new Set(lojasList.map(l => l.investida))).sort(),
    bandeiras: Array.from(new Set(lojasList.map(l => l.bandeira))).sort(),
    clusters: Array.from(clustersSet).sort(),
    listaSetores: SETORES_OPERACIONAIS,
    setoresOperacionais: SETORES_OPERACIONAIS,
    nMesesPeriodo: 4,
    periodoAtual: ultimos4,
    periodoAnterior: periodoAnterior4,
    quadrosMinimos: QUADROS_MINIMOS,
    driversVolume: mapRegraProd
  };

  fs.writeFileSync(path.join(DATA_DIR, 'lojas.json'), JSON.stringify(lojasList, null, 2), 'utf8');
  fs.writeFileSync(path.join(DATA_DIR, 'din_vol.json'), JSON.stringify(dinVol, null, 2), 'utf8');
  fs.writeFileSync(path.join(DATA_DIR, 'din_hc.json'), JSON.stringify(dinHc, null, 2), 'utf8');
  fs.writeFileSync(path.join(DATA_DIR, 'config.json'), JSON.stringify(config, null, 2), 'utf8');
  fs.writeFileSync(path.join(DATA_DIR, 'setores_resumo.json'), JSON.stringify(setoresResumo, null, 2), 'utf8');
  fs.writeFileSync(path.join(DATA_DIR, 'hc_cargos_fte.json'), JSON.stringify(cargosFteList, null, 2), 'utf8');

  // Gerar regras.json
  const regras = {
    quadroMinimoPorSetor: QUADROS_MINIMOS,
    setorVolParaHc: mapRegraProd,
    setoresOperacionais: SETORES_OPERACIONAIS,
    cargaHorariaPadraoFTE: 220,
    janelaMovelMeses: 4
  };
  fs.writeFileSync(path.join(DATA_DIR, 'regras.json'), JSON.stringify(regras, null, 2), 'utf8');

  // Criar caixa_oficial de compatibilidade para conciliação
  const caixaOficial = lojasList.map((l, idx) => {
    const sCaixa = l.setores.find(s => s.setor === 'OPERADOR DE CAIXA');
    return {
      linhaExcel: idx + 5,
      chave: l.chave,
      investida: l.investida,
      lojaNome: l.lojaNome,
      bandeira: l.bandeira,
      areaVenda: l.areaVenda,
      volAnterior: sCaixa ? sCaixa.volAtual : l.volAnterior,
      volProjetado: sCaixa ? sCaixa.volProjetado : l.volProjetado,
      hcAnterior: sCaixa ? sCaixa.hcAtual : 0,
      produtividade: sCaixa ? sCaixa.produtividade : null,
      vendaPorM2: l.vendaPorM2,
      cluster: l.cluster,
      clusterBandeira: l.clusterBandeira,
      metaProdutividade: null,
      hcSugerido: null,
      hcSugeridoMinimo: null
    };
  });
  fs.writeFileSync(path.join(DATA_DIR, 'caixa_oficial.json'), JSON.stringify(caixaOficial, null, 2), 'utf8');

  log('  ✓ lojas.json gravado');
  log('  ✓ din_vol.json gravado');
  log('  ✓ din_hc.json gravado');
  log('  ✓ config.json gravado');
  log('  ✓ setores_resumo.json gravado');
  log('  ✓ hc_cargos_fte.json gravado');
  log('  ✓ regras.json gravado');
  log('  ✓ caixa_oficial.json gravado');

  log('\n===============================================================');
  log('EXTRAÇÃO CONCLUÍDA COM SUCESSO! 100% ADERENTE À BASE ONEDRIVE');
  log(`Total de Lojas: ${lojasList.length} | HC Total Rede: ${config.totalHcRede} FTE`);
  log('===============================================================');
  return { ok: true, totalLojas: lojasList.length, totalHcRede: config.totalHcRede };
}

if (require.main === module) {
  runExtraction();
}

module.exports = { runExtraction, processXlsx: (input, log) => runExtraction(log) };
