const fs = require('fs');

// ─── 1. Atualizar CSS com estilos mais enxutos e estilos do Chat de Regras ───
const stylePath = 'css/style.css';
let css = fs.readFileSync(stylePath, 'utf8');

const compactAndChatStyles = `
/* ============================================================
   LAYOUT ENXUTO & CHAT DE VALIDAÇÃO DE REGRAS NO TOPO
   ============================================================ */

/* ─── Ajustes para Layout Mais Enxuto ─────────────────────── */
.sidebar-investidas {
  width: 220px !important;
  min-width: 220px !important;
  padding: 14px 10px !important;
  gap: 8px !important;
}

.investida-card {
  padding: 10px 12px !important;
  gap: 4px !important;
}

.investida-card-title {
  font-size: 13px !important;
}

.investida-card-lojas {
  font-size: 11px !important;
}

.badge-criticas {
  font-size: 10px !important;
  padding: 1px 6px !important;
}

.main-container {
  padding: 14px 20px 32px !important;
}

.exec-breadcrumb {
  margin-bottom: 10px !important;
  font-size: 11px !important;
}

.kpi-exec-container {
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)) !important;
  gap: 10px !important;
  margin-bottom: 12px !important;
}

.kpi-exec-box {
  padding: 10px 14px !important;
}

.kpi-exec-title {
  font-size: 10px !important;
}

.kpi-exec-value {
  font-size: 20px !important;
  margin: 4px 0 1px !important;
}

.kpi-exec-desc {
  font-size: 10px !important;
}

.critical-sectors-bar {
  padding: 10px 14px !important;
  margin-bottom: 14px !important;
  gap: 8px !important;
}

.sector-chip {
  padding: 4px 10px !important;
  font-size: 11px !important;
  gap: 6px !important;
}

.cluster-cards-section {
  margin-bottom: 14px !important;
}

.cluster-section-title {
  font-size: 12px !important;
  margin-bottom: 8px !important;
}

.cluster-cards-grid {
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)) !important;
  gap: 8px !important;
}

.cluster-card {
  padding: 10px 12px !important;
  gap: 4px !important;
}

.cluster-card-name {
  font-size: 13px !important;
}

.cluster-card-stats {
  padding-top: 6px !important;
  font-size: 10px !important;
}

.corp-table th {
  padding: 8px 10px !important;
  font-size: 11px !important;
}

.corp-table td {
  padding: 7px 10px !important;
  font-size: 12px !important;
}

/* ─── Chat Executivo de Validação de Regras no Topo ────────── */
.rule-chat-panel {
  background: var(--bg-surface);
  border: 1.5px solid var(--border-subtle);
  border-radius: var(--radius-md);
  padding: 12px 16px;
  margin-bottom: 14px;
  box-shadow: var(--shadow-sm);
  transition: all 0.2s ease;
}

.rule-chat-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  user-select: none;
}

.rule-chat-header-left {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rule-chat-header-title {
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.6px;
  color: var(--text-main);
  display: flex;
  align-items: center;
  gap: 6px;
}

.rule-chat-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 6px;
  background: rgba(37, 99, 235, 0.1);
  color: var(--brand-blue-lt);
  border: 1px solid rgba(37, 99, 235, 0.25);
}

body:not(.theme-dark) .rule-chat-badge {
  background: rgba(234, 88, 12, 0.1);
  color: #ea580c;
  border-color: rgba(234, 88, 12, 0.3);
}

.rule-chat-toggle-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 13px;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
}

.rule-chat-body {
  margin-top: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.rule-chat-input-row {
  display: flex;
  gap: 8px;
  align-items: center;
}

.rule-chat-input {
  flex: 1;
  padding: 8px 12px;
  font-size: 12px;
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  background: var(--bg-card);
  color: var(--text-main);
  font-family: inherit;
  outline: none;
  transition: all 0.15s ease;
}

.rule-chat-input:focus {
  border-color: var(--brand-blue);
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2);
}

body:not(.theme-dark) .rule-chat-input:focus {
  border-color: #ea580c;
  box-shadow: 0 0 0 2px rgba(234, 88, 12, 0.2);
}

.rule-chat-send-btn {
  background: var(--brand-blue);
  color: #fff;
  border: none;
  border-radius: var(--radius-sm);
  padding: 8px 14px;
  font-size: 12px;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.rule-chat-send-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

body:not(.theme-dark) .rule-chat-send-btn {
  background: #ea580c;
}

.rule-chat-suggestions {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.rule-chat-chip {
  background: var(--bg-card-hover);
  border: 1px solid var(--border-subtle);
  border-radius: 12px;
  padding: 3px 9px;
  font-size: 11px;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 0.15s ease;
  user-select: none;
}

.rule-chat-chip:hover {
  border-color: var(--brand-blue);
  color: var(--text-main);
  background: var(--bg-card);
}

body:not(.theme-dark) .rule-chat-chip:hover {
  border-color: #ea580c;
  color: #ea580c;
  background: #fff7ed;
}

.rule-chat-response {
  background: var(--bg-card);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  padding: 12px 14px;
  font-size: 12px;
  line-height: 1.6;
  color: var(--text-main);
  animation: fadeIn 0.15s ease;
}

body:not(.theme-dark) .rule-chat-response {
  background: #f8fafc;
  border-color: #e2e8f0;
}

.rule-chat-response h5 {
  font-size: 12px;
  font-weight: 800;
  color: var(--brand-blue-lt);
  margin-bottom: 6px;
  display: flex;
  align-items: center;
  gap: 6px;
}

body:not(.theme-dark) .rule-chat-response h5 {
  color: #ea580c;
}

.rule-chat-response-meta {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 8px;
  margin: 8px 0;
  padding: 8px;
  background: rgba(0, 0, 0, 0.15);
  border-radius: var(--radius-sm);
}

body:not(.theme-dark) .rule-chat-response-meta {
  background: #ffffff;
  border: 1px solid #e2e8f0;
}

.meta-box-label {
  font-size: 10px;
  color: var(--text-subtle);
  text-transform: uppercase;
  font-weight: 700;
}

.meta-box-val {
  font-size: 13px;
  font-weight: 800;
  color: var(--text-main);
  margin-top: 2px;
}
`;

css += '\n' + compactAndChatStyles;
fs.writeFileSync(stylePath, css, 'utf8');
console.log('css/style.css atualizado com estilos enxutos e regras do chat!');
