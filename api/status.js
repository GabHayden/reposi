'use strict';

const fs = require('fs');
const path = require('path');
const { DimEngine } = require('../js/engine.js');

module.exports = (req, res) => {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    const lojas = JSON.parse(fs.readFileSync(path.join(dataDir, 'lojas.json'), 'utf8'));
    const caixaOficial = JSON.parse(fs.readFileSync(path.join(dataDir, 'caixa_oficial.json'), 'utf8'));
    const config = JSON.parse(fs.readFileSync(path.join(dataDir, 'config.json'), 'utf8'));
    const setoresResumo = JSON.parse(fs.readFileSync(path.join(dataDir, 'setores_resumo.json'), 'utf8'));

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    res.status(200).json({
      ok: true,
      updatedAt: config.updatedAt || config.version || null,
      totalLojas: lojas.length,
      lojasComCaixaOficial: caixaOficial.length,
      totalHcRede: config.totalHcRede,
      totalSetores: setoresResumo.length,
      investidas: config.investidas || [],
      bandeiras: config.bandeiras || [],
      listaSetores: config.listaSetores || [],
      setoresConfig: DimEngine.SETORES_CONFIG,
      quartisConfig: DimEngine.QUARTIS_CONFIG
    });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};
