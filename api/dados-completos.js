'use strict';

const fs = require('fs');
const path = require('path');
const { DimEngine } = require('../js/engine.js');

module.exports = (req, res) => {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    const lojas = JSON.parse(fs.readFileSync(path.join(dataDir, 'lojas.json'), 'utf8'));
    const dinVol = JSON.parse(fs.readFileSync(path.join(dataDir, 'din_vol.json'), 'utf8'));
    const dinHc = JSON.parse(fs.readFileSync(path.join(dataDir, 'din_hc.json'), 'utf8'));
    const hcCargosFtePath = path.join(dataDir, 'hc_cargos_fte.json');
    const hcCargosFte = fs.existsSync(hcCargosFtePath) ? JSON.parse(fs.readFileSync(hcCargosFtePath, 'utf8')) : [];
    const caixaOficial = JSON.parse(fs.readFileSync(path.join(dataDir, 'caixa_oficial.json'), 'utf8'));
    const regras = JSON.parse(fs.readFileSync(path.join(dataDir, 'regras.json'), 'utf8'));
    const config = JSON.parse(fs.readFileSync(path.join(dataDir, 'config.json'), 'utf8'));
    const setoresResumo = JSON.parse(fs.readFileSync(path.join(dataDir, 'setores_resumo.json'), 'utf8'));

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate');
    res.status(200).json({
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
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
};
