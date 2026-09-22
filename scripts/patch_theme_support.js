const fs = require('fs');

// 1. Atualizar css/style.css com suporte a Tema Claro (Boa Supermercados) e Tema Escuro
const stylePath = 'css/style.css';
let styleContent = fs.readFileSync(stylePath, 'utf8');

const themeVariables = `/* ============================================================
   PLURIX — Dimensionamento de Quadro de Colaboradores
   SISTEMA DE TEMAS: CLARO (BOA SUPERMERCADOS - PRINCIPAL) & ESCURO
   ============================================================ */

@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

/* ─── TEMA CLARO (BOA SUPERMERCADOS - TEMA PRINCIPAL) ─────── */
:root,
body,
body.theme-light {
  /* Paleta Institucional Boa Supermercados */
  --bg-app:        #f1f5f9;
  --bg-surface:    #ffffff;
  --bg-card:       #ffffff;
  --bg-card-hover: #f8fafc;
  --bg-input:      #ffffff;
  
  --border-subtle: #e2e8f0;
  --border-focus:  #ea580c;
  
  /* Cores Oficiais Boa: Laranja Institucional + Azul Marinho */
  --brand-blue:    #ea580c; /* Laranja Boa */
  --brand-blue-lt: #f97316;
  --brand-navy:    #0f3b7a; /* Azul Marinho Boa */
  --brand-cyan:    #0284c7;
  
  /* Status Operacionais no Tema Claro (Alta Legibilidade) */
  --status-red:      #dc2626;
  --status-red-bg:   rgba(220, 38, 38, 0.08);
  --status-red-bdr:  rgba(220, 38, 38, 0.28);
  
  --status-blue:     #0284c7;
  --status-blue-bg:  rgba(2, 132, 199, 0.08);
  --status-blue-bdr: rgba(2, 132, 199, 0.28);
  
  --status-green:    #16a34a;
  --status-green-bg: rgba(22, 163, 74, 0.08);
  --status-green-bdr:rgba(22, 163, 74, 0.28);
  
  /* Tipografia no Fundo Claro */
  --text-main:     #0f172a;
  --text-muted:    #475569;
  --text-subtle:   #64748b;
  
  /* Geometria e Sombras */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  
  --shadow-sm: 0 1px 3px rgba(15, 23, 42, 0.06);
  --shadow-md: 0 4px 14px rgba(15, 23, 42, 0.08);
}

/* ─── TEMA ESCURO (PRESERVANDO AS CORES ORIGINAIS) ─────────── */
body.theme-dark {
  --bg-app:        #090d16;
  --bg-surface:    #111827;
  --bg-card:       #182234;
  --bg-card-hover: #1e2c42;
  --bg-input:      #0d1424;
  
  --border-subtle: #223048;
  --border-focus:  #3b82f6;
  
  --brand-blue:    #2563eb;
  --brand-blue-lt: #60a5fa;
  --brand-navy:    #1d4ed8;
  --brand-cyan:    #0ea5e9;
  
  --status-red:      #f43f5e;
  --status-red-bg:   rgba(244, 63, 94, 0.12);
  --status-red-bdr:  rgba(244, 63, 94, 0.35);
  
  --status-blue:     #38bdf8;
  --status-blue-bg:  rgba(56, 189, 248, 0.12);
  --status-blue-bdr: rgba(56, 189, 248, 0.35);
  
  --status-green:    #10b981;
  --status-green-bg: rgba(16, 185, 129, 0.12);
  --status-green-bdr:rgba(16, 185, 129, 0.35);
  
  --text-main:     #f8fafc;
  --text-muted:    #94a3b8;
  --text-subtle:   #64748b;
  
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.3);
  --shadow-md: 0 4px 12px rgba(0,0,0,0.35);
}`;

// Substituir o início de style.css (do import até a linha 50)
const oldStartIdx = styleContent.indexOf(':root {');
const oldEndIdx = styleContent.indexOf('* {\n  box-sizing: border-box;');

if (oldStartIdx !== -1 && oldEndIdx !== -1) {
  const before = styleContent.substring(0, styleContent.indexOf('/* ============================================================'));
  const after = styleContent.substring(oldEndIdx);
  styleContent = themeVariables + '\n\n' + after;
}

// Regras complementares para tema claro (Boa Supermercados)
const complementaryStyles = `
/* ─── REGRAS VISUAIS ESPECÍFICAS DO TEMA CLARO (BOA) ───────── */
body:not(.theme-dark) .logo-badge {
  background: linear-gradient(135deg, #ea580c 0%, #0f3b7a 100%);
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(234, 88, 12, 0.35);
}

body:not(.theme-dark) .app-header h1 {
  color: #0f172a;
}

body:not(.theme-dark) .btn-theme-toggle {
  background: rgba(234, 88, 12, 0.08);
  border-color: rgba(234, 88, 12, 0.35);
  color: #ea580c;
  font-weight: 700;
}

body:not(.theme-dark) .btn-theme-toggle:hover {
  background: rgba(234, 88, 12, 0.16);
  border-color: #ea580c;
  color: #c2410c;
}

body:not(.theme-dark) .investida-card {
  background-color: #ffffff;
  border-color: #e2e8f0;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05);
}

body:not(.theme-dark) .investida-card:hover {
  background-color: #fff7ed;
  border-color: #ea580c;
  box-shadow: 0 4px 12px rgba(234, 88, 12, 0.12);
}

body:not(.theme-dark) .investida-card.active {
  background: linear-gradient(135deg, rgba(234, 88, 12, 0.09) 0%, #ffffff 100%);
  border-color: #ea580c;
  box-shadow: 0 4px 14px rgba(234, 88, 12, 0.18);
}

body:not(.theme-dark) .investida-card.active::before {
  background: linear-gradient(180deg, #ea580c, #c2410c);
}

body:not(.theme-dark) .investida-card-title {
  color: #0f172a;
}

body:not(.theme-dark) .kpi-exec-box {
  background: #ffffff;
  border-color: #e2e8f0;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05);
}

body:not(.theme-dark) .kpi-exec-value {
  color: #0f172a;
}

body:not(.theme-dark) .critical-sectors-bar {
  background-color: #ffffff;
  border-color: #e2e8f0;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05);
}

body:not(.theme-dark) .critical-sectors-headline h4 {
  color: #0f172a;
}

body:not(.theme-dark) .sector-chip {
  background-color: #f8fafc;
  border-color: #e2e8f0;
  color: #0f172a;
}

body:not(.theme-dark) .sector-chip:hover {
  background-color: #fff7ed;
  border-color: #ea580c;
}

body:not(.theme-dark) .sector-chip.active {
  background-color: rgba(234, 88, 12, 0.12);
  border-color: #ea580c;
  color: #c2410c;
}

body:not(.theme-dark) .cluster-section-title {
  color: #0f172a;
}

body:not(.theme-dark) .cluster-card {
  background-color: #ffffff;
  border-color: #e2e8f0;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05);
}

body:not(.theme-dark) .cluster-card:hover {
  background-color: #fff7ed;
  border-color: #ea580c;
  box-shadow: 0 4px 12px rgba(234, 88, 12, 0.12);
}

body:not(.theme-dark) .cluster-card.active {
  background: linear-gradient(135deg, rgba(234, 88, 12, 0.09) 0%, #ffffff 100%);
  border-color: #ea580c;
  box-shadow: 0 4px 14px rgba(234, 88, 12, 0.18);
}

body:not(.theme-dark) .cluster-card-name {
  color: #0f172a;
}

body:not(.theme-dark) .cluster-card-stats {
  border-top-color: #e2e8f0;
}

body:not(.theme-dark) .panel-card {
  background: #ffffff;
  border-color: #e2e8f0;
  box-shadow: 0 1px 3px rgba(15, 23, 42, 0.05);
}

body:not(.theme-dark) .panel-card h3 {
  color: #0f172a;
}

body:not(.theme-dark) .corp-table th {
  background-color: #f8fafc;
  color: #475569;
  border-bottom-color: #e2e8f0;
}

body:not(.theme-dark) .corp-table td {
  color: #0f172a;
  border-bottom-color: #f1f5f9;
}

body:not(.theme-dark) .corp-table tr:hover td {
  background-color: #f8fafc;
}

body:not(.theme-dark) .corp-table tfoot tr {
  background-color: rgba(234, 88, 12, 0.06) !important;
  border-top: 2px solid #ea580c !important;
}

body:not(.theme-dark) .corp-input {
  background-color: #ffffff;
  border-color: #cbd5e1;
  color: #0f172a;
}

body:not(.theme-dark) .corp-input:focus {
  border-color: #ea580c;
  box-shadow: 0 0 0 2px rgba(234, 88, 12, 0.2);
}

body:not(.theme-dark) .select-quartil-loja {
  background-color: rgba(234, 88, 12, 0.08);
  border-color: rgba(234, 88, 12, 0.35);
  color: #ea580c;
}

body:not(.theme-dark) .select-quartil-loja option {
  background-color: #ffffff;
  color: #0f172a;
}

body:not(.theme-dark) .store-detail-panel {
  background-color: #ffffff;
  border-color: rgba(234, 88, 12, 0.45);
  box-shadow: 0 8px 24px rgba(234, 88, 12, 0.09);
}

body:not(.theme-dark) .store-detail-title-group h3 {
  color: #0f172a;
}

body:not(.theme-dark) .store-detail-header {
  border-bottom-color: #e2e8f0;
}

body:not(.theme-dark) .store-sectors-table th {
  background-color: #f8fafc;
  color: #475569;
  border-bottom-color: #e2e8f0;
}

body:not(.theme-dark) .store-sectors-table td {
  color: #0f172a;
  border-bottom-color: #f1f5f9;
}

body:not(.theme-dark) .store-sectors-table tr:hover td {
  background-color: #f8fafc;
}

body:not(.theme-dark) .modal-dialog {
  background-color: #ffffff;
  border-color: #cbd5e1;
  box-shadow: 0 20px 40px rgba(15, 23, 42, 0.2);
}

body:not(.theme-dark) .modal-header h2 {
  color: #0f172a;
}

body:not(.theme-dark) .periodo-banner {
  background: linear-gradient(90deg, rgba(234, 88, 12, 0.08), rgba(15, 59, 122, 0.05)) !important;
  border-color: rgba(234, 88, 12, 0.25) !important;
}

body:not(.theme-dark) .periodo-banner strong,
body:not(.theme-dark) .periodo-banner span {
  color: #0f172a !important;
}

body:not(.theme-dark) .btn-corp-primary {
  background-color: #ea580c;
  border-color: #ea580c;
  color: #ffffff;
}

body:not(.theme-dark) .btn-corp-primary:hover {
  background-color: #c2410c;
  border-color: #c2410c;
}

body:not(.theme-dark) .btn-ver-auditoria {
  background: linear-gradient(135deg, #ea580c, #c2410c);
  color: #ffffff;
  box-shadow: 0 2px 8px rgba(234, 88, 12, 0.3);
}

body:not(.theme-dark) .badge-investida {
  background: rgba(234, 88, 12, 0.09);
  color: #ea580c;
  border: 1px solid rgba(234, 88, 12, 0.3);
}

body:not(.theme-dark) .tab-btn.active {
  color: #ea580c;
  border-bottom-color: #ea580c;
}

body:not(.theme-dark) .tab-btn.active .tab-badge {
  background-color: rgba(234, 88, 12, 0.12);
  color: #ea580c;
}
`;

styleContent = styleContent + '\n' + complementaryStyles;
fs.writeFileSync(stylePath, styleContent, 'utf8');
console.log('css/style.css atualizado com sucesso com suporte aos temas Claro (Boa) e Escuro!');
