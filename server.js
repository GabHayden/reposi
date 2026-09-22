'use strict';

const http   = require('http');
const fs     = require('fs');
const path   = require('path');

const PORT    = 3333;
const ROOT    = __dirname;
const dataDir = path.join(ROOT, 'data');

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

// ─── Cache e Instância do Motor em Memória ──────────────────────────────────
let engineInstance = null;
let rawDataPackage = null;

let cache = {
  dimensionamento: null,
  inconsistencias: null,
  status: null,
  setores: null
};

function refreshCache() {
  try {
    const { DimEngine } = require('./js/engine.js');
    const lojas        = JSON.parse(fs.readFileSync(path.join(dataDir, 'lojas.json'), 'utf8'));
    const dinVol       = JSON.parse(fs.readFileSync(path.join(dataDir, 'din_vol.json'), 'utf8'));
    const dinHc        = JSON.parse(fs.readFileSync(path.join(dataDir, 'din_hc.json'), 'utf8'));
    const hcCargosFtePath = path.join(dataDir, 'hc_cargos_fte.json');
    const hcCargosFte  = fs.existsSync(hcCargosFtePath) ? JSON.parse(fs.readFileSync(hcCargosFtePath, 'utf8')) : [];
    const caixaOficial = JSON.parse(fs.readFileSync(path.join(dataDir, 'caixa_oficial.json'), 'utf8'));
    const regras       = JSON.parse(fs.readFileSync(path.join(dataDir, 'regras.json'), 'utf8'));
    const config       = JSON.parse(fs.readFileSync(path.join(dataDir, 'config.json'), 'utf8'));
    const setoresResumo= JSON.parse(fs.readFileSync(path.join(dataDir, 'setores_resumo.json'), 'utf8'));

    engineInstance = new DimEngine({ lojas, dinVol, dinHc, hcCargosFte, caixaOficial, regras, config });
    const resultados = engineInstance.calcularTodosCaixa();
    const totais     = engineInstance.getTotaisConsolidados();
    const relatorio  = engineInstance.getInconsistencias();

    rawDataPackage = JSON.stringify({
      ok: true,
      lojas,
      dinVol,
      dinHc,
      hcCargosFte,
      caixaOficial,
      regras,
      config,
      setoresResumo,
      setoresConfig: DimEngine.SETORES_CONFIG,
      quartisConfig: DimEngine.QUARTIS_CONFIG
    });

    cache.dimensionamento = JSON.stringify({ ok: true, totais, itens: resultados });
    cache.setores         = JSON.stringify({ ok: true, setores: setoresResumo, totalHcRede: config.totalHcRede });
    cache.inconsistencias = JSON.stringify({ ok: true, relatorio });
    cache.status = JSON.stringify({
      ok:                   true,
      updatedAt:            config.updatedAt || config.version || null,
      totalLojas:           resultados.length,
      lojasComCaixaOficial: caixaOficial.length,
      totalHcRede:          config.totalHcRede,
      totalSetores:         setoresResumo.length,
      investidas:           config.investidas || [],
      bandeiras:            config.bandeiras || [],
      listaSetores:         config.listaSetores || [],
      setoresConfig:        DimEngine.SETORES_CONFIG,
      quartisConfig:        DimEngine.QUARTIS_CONFIG
    });
    console.log(`Cache atualizado com sucesso: ${resultados.length} lojas carregadas.`);
  } catch (err) {
    console.error('Erro ao atualizar cache no server.js:', err.message);
  }
}

// Inicializar cache ao iniciar
refreshCache();

// ─── Roteador ─────────────────────────────────────────────────────────────────
const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, 'http://localhost:3333');
  const url       = parsedUrl.pathname;
  const method    = req.method.toUpperCase();

  // ── GET /api/status ─────────────────────────────────────────────────────────
  if (method === 'GET' && url === '/api/status') {
    if (!cache.status) refreshCache();
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
    res.end(cache.status || JSON.stringify({ ok: false, totalLojas: 0 }));
    return;
  }

  // ── GET /api/dados-completos ────────────────────────────────────────────────
  if (method === 'GET' && url === '/api/dados-completos') {
    if (!rawDataPackage) refreshCache();
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
    res.end(rawDataPackage || JSON.stringify({ ok: false, error: 'Dados indisponíveis' }));
    return;
  }

  // ── GET /api/dimensionar ────────────────────────────────────────────────────
  if (method === 'GET' && (url === '/api/dimensionar' || (url === '/api/dimensionamento' && (parsedUrl.searchParams.has('setor') || parsedUrl.searchParams.has('quartil'))))) {
    if (!engineInstance) refreshCache();
    const setor = parsedUrl.searchParams.get('setor') || 'OPERADOR DE CAIXA';
    const quartil = parsedUrl.searchParams.get('quartil') || 'Q3';
    try {
      const calculo = engineInstance.calcularSetor(setor, quartil);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify({ ok: true, ...calculo }));
    } catch (errCalc) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify({ ok: false, error: errCalc.message }));
    }
    return;
  }

  // ── GET /api/dimensionamento (padrão) ───────────────────────────────────────
  if (method === 'GET' && url === '/api/dimensionamento') {
    if (!cache.dimensionamento) refreshCache();
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
    res.end(cache.dimensionamento || JSON.stringify({ ok: false, error: 'Cache indisponível' }));
    return;
  }

  // ── GET /api/setores ────────────────────────────────────────────────────────
  if (method === 'GET' && url === '/api/setores') {
    if (!cache.setores) refreshCache();
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
    res.end(cache.setores || JSON.stringify({ ok: false, error: 'Cache de setores indisponível' }));
    return;
  }

  // ── GET /api/inconsistencias ────────────────────────────────────────────────
  if (method === 'GET' && url === '/api/inconsistencias') {
    if (!cache.inconsistencias) refreshCache();
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
    res.end(cache.inconsistencias || JSON.stringify({ ok: false, error: 'Cache indisponível' }));
    return;
  }

  // ── GET /api/auditoria ──────────────────────────────────────────────────────
  if (method === 'GET' && url === '/api/auditoria') {
    if (!engineInstance) refreshCache();
    const setor = parsedUrl.searchParams.get('setor') || 'OPERADOR DE CAIXA';
    const quartil = parsedUrl.searchParams.get('quartil') || 'Q3';
    try {
      const audit = engineInstance.validarTodasLojas(setor, quartil);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify({ ok: true, ...audit }));
    } catch (errAudit) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify({ ok: false, error: errAudit.message }));
    }
    return;
  }

  // ── GET /api/auditoria-loja-completa ────────────────────────────────────────
  if (method === 'GET' && url === '/api/auditoria-loja-completa') {
    if (!engineInstance) refreshCache();
    const quartil = parsedUrl.searchParams.get('quartil') || 'Q3';
    try {
      const auditLoja = engineInstance.calcularAuditoriaLojaCompleta(quartil);
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify({ ok: true, ...auditLoja }));
    } catch (errAuditLoja) {
      res.writeHead(500, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify({ ok: false, error: errAuditLoja.message }));
    }
    return;
  }

  // ── GET /api/hc-cargos-fte ───────────────────────────────────────────────────
  if (method === 'GET' && url.startsWith('/api/hc-cargos-fte')) {
    const filePath = path.join(dataDir, 'hc_cargos_fte.json');
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
      res.end(content);
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json; charset=utf-8', 'Access-Control-Allow-Origin': '*' });
      res.end(JSON.stringify({ ok: false, error: 'Arquivo hc_cargos_fte.json não encontrado' }));
    }
    return;
  }

  // ── POST /api/upload-xlsx ───────────────────────────────────────────────────
  if (method === 'POST' && url === '/api/upload-xlsx') {
    // Server-Sent Events para transmitir logs ao cliente em tempo real
    res.writeHead(200, {
      'Content-Type':      'text/event-stream; charset=utf-8',
      'Cache-Control':     'no-cache',
      'Access-Control-Allow-Origin': '*',
    });

    const send = (type, data) => {
      try { res.write(`data: ${JSON.stringify({ type, data })}\n\n`); } catch {}
    };

    const log = (msg) => {
      console.log(msg);
      send('log', String(msg));
    };

    // Coletar body (buffer binário do xlsx)
    const chunks = [];
    req.on('data', chunk => chunks.push(chunk));
    req.on('error', err => { send('error', err.message); res.end(); });
    req.on('end', () => {
      const rawBody = Buffer.concat(chunks);

      // Extrair o boundary e o buffer do arquivo do multipart/form-data
      let fileBuffer = null;
      const contentType = req.headers['content-type'] || '';
      const boundaryMatch = contentType.match(/boundary=(.+)$/);

      if (boundaryMatch) {
        // Parse multipart/form-data manual (sem dependências externas)
        const boundary = Buffer.from('--' + boundaryMatch[1].trim());
        const parts    = splitBuffer(rawBody, boundary);

        for (const part of parts) {
          // Separar header e body da parte
          const headerEnd = indexOfCRLFCRLF(part);
          if (headerEnd === -1) continue;
          const headerStr = part.slice(0, headerEnd).toString('utf8');
          if (!headerStr.includes('filename=')) continue; // apenas partes com arquivo
          const bodyStart = headerEnd + 4; // \r\n\r\n
          const bodyEnd   = part.length - 2; // remover \r\n final
          fileBuffer = part.slice(bodyStart, bodyEnd > bodyStart ? bodyEnd : part.length);
          break;
        }
      } else {
        // Fallback: body puro (sem multipart)
        fileBuffer = rawBody;
      }

      if (!fileBuffer || fileBuffer.length < 100) {
        send('error', 'Arquivo não encontrado no upload. Verifique o envio.');
        res.end();
        return;
      }

      log(`Arquivo recebido: ${(fileBuffer.length / 1024 / 1024).toFixed(2)} MB`);

      // Processar de forma assíncrona para não bloquear o event loop
      setImmediate(() => {
        try {
          const { processXlsx } = require('./scripts/extract_data.js');
          const stats = processXlsx(fileBuffer, log);
          refreshCache();
          send('done', stats);
          log('✅ Base atualizada e cache em memória renovado com sucesso!');
        } catch (err) {
          console.error('Erro ao processar xlsx:', err);
          send('error', err.message);
        } finally {
          res.end();
        }
      });
    });
    return;
  }

  // ── Arquivos estáticos ──────────────────────────────────────────────────────
  let urlPath = url;
  if (urlPath === '/') urlPath = '/index.html';

  const filePath    = path.join(ROOT, urlPath);
  const ext         = path.extname(filePath);
  const contentType = MIME[ext] || 'text/plain';

  try {
    const data = fs.readFileSync(filePath);
    res.writeHead(200, { 
      'Content-Type': contentType,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    });
    res.end(data);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found: ' + urlPath);
  }
});

// ─── Helpers para parse de multipart ──────────────────────────────────────────
function splitBuffer(buf, delimiter) {
  const parts = [];
  let start = 0;
  let idx   = bufIndexOf(buf, delimiter, start);
  while (idx !== -1) {
    if (idx > start) parts.push(buf.slice(start, idx));
    start = idx + delimiter.length;
    // pular \r\n após boundary
    if (buf[start] === 0x0d && buf[start + 1] === 0x0a) start += 2;
    idx = bufIndexOf(buf, delimiter, start);
  }
  if (start < buf.length) parts.push(buf.slice(start));
  return parts.filter(p => p.length > 4);
}

function bufIndexOf(buf, search, offset = 0) {
  outer: for (let i = offset; i <= buf.length - search.length; i++) {
    for (let j = 0; j < search.length; j++) {
      if (buf[i + j] !== search[j]) continue outer;
    }
    return i;
  }
  return -1;
}

function indexOfCRLFCRLF(buf) {
  for (let i = 0; i < buf.length - 3; i++) {
    if (buf[i] === 0x0d && buf[i+1] === 0x0a && buf[i+2] === 0x0d && buf[i+3] === 0x0a) return i;
  }
  return -1;
}

// ─── Start ────────────────────────────────────────────────────────────────────
server.on('error', (err) => {
  console.error('SERVER ERROR:', err);
});

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('UNHANDLED REJECTION:', reason);
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('╔══════════════════════════════════════════════╗');
  console.log('║  Dimensionamento de Quadro · Plurix          ║');
  console.log(`║  Servidor: http://localhost:${PORT}             ║`);
  console.log('║  Ctrl+C para parar                           ║');
  console.log('╚══════════════════════════════════════════════╝');
});

