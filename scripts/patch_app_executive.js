const fs = require('fs');

const appJsPath = 'js/app.js';
let content = fs.readFileSync(appJsPath, 'utf8');

// Bloco de código do novo layout executivo
const newExecutiveCode = `  // ─── Agregação Executiva de Investidas e Setores Críticos ─────────────────
  function calcularEstatisticasInvestidas(engine, quartilRef) {
    if (!engine) return [];
    const audit = engine.calcularAuditoriaLojaCompleta(quartilRef || 'Q3');
    const todosItens = audit.itens || [];

    const invConfigs = [
      { id: 'TODAS', nome: 'REDE TOTAL', icon: '🌐' },
      { id: 'AMG', nome: 'AMIGÃO', icon: '🛒' },
      { id: 'AVE', nome: 'AVENIDA', icon: '🏬' },
      { id: 'BOA', nome: 'BOA', icon: '🛍️' },
      { id: 'PRN', nome: 'PARANÁ', icon: '🏪' },
    ];

    return invConfigs.map(cfg => {
      const lojas = cfg.id === 'TODAS' ? todosItens : todosItens.filter(i => i.investida === cfg.id);
      const totalLojas = lojas.length;

      let lojasCriticas = 0;
      const setorAbaixoCount = {};

      lojas.forEach(l => {
        let temSetorAbaixo = false;
        (l.detalheSetores || []).forEach(s => {
          if (s.status === 'abaixo_meta' || (s.statusOperacional && s.statusOperacional.includes('Abaixo'))) {
            temSetorAbaixo = true;
            setorAbaixoCount[s.setorId] = (setorAbaixoCount[s.setorId] || 0) + 1;
          }
        });
        if (temSetorAbaixo || l.statusGeralSimples === 'abaixo_meta') {
          lojasCriticas++;
        }
      });

      const totalHcAtual = lojas.reduce((acc, l) => acc + (l.hcAtualTotal || 0), 0);
      const totalHcRecomendado = lojas.reduce((acc, l) => acc + (l.hcProjetadoTotal || 0), 0);
      const totalVolAtual = lojas.reduce((acc, l) => acc + (l.volAtualTotal || 0), 0);
      const totalVolProjetado = lojas.reduce((acc, l) => acc + (l.volProjetadoTotal || 0), 0);
      const prodMedia = (totalVolAtual > 0 && totalHcAtual > 0) ? (totalVolAtual / (4 * totalHcAtual)) : 0;

      return {
        id: cfg.id,
        nome: cfg.nome,
        icon: cfg.icon,
        totalLojas,
        lojasCriticas,
        totalHcAtual,
        totalHcRecomendado,
        totalVolAtual,
        totalVolProjetado,
        prodMedia,
        setorAbaixoCount
      };
    });
  }

  // ─── Renderização da Sidebar de Investidas ─────────────────────────────────
  function renderSidebarInvestidas() {
    const sidebar = document.getElementById('sidebar-investidas');
    if (!sidebar || !state.engine) return;

    const stats = calcularEstatisticasInvestidas(state.engine, state.selectedQuartil);

    sidebar.innerHTML = \`
      <div class="sidebar-title">
        <span>🏢 Investidas Plurix</span>
        <span style="font-size:10px; color:var(--text-muted); font-weight:700;">Painel Executivo</span>
      </div>
      \${stats.map(inv => \`
        <div class="investida-card \${state.selectedInvestida === inv.id ? 'active' : ''}" data-investida="\${inv.id}">
          <div class="investida-card-header">
            <span class="investida-card-title">\${inv.nome}</span>
            <span style="font-size:13px;">\${inv.icon}</span>
          </div>
          <div class="investida-card-footer">
            <span class="investida-card-lojas">\${inv.totalLojas} lojas</span>
            <span class="badge-criticas \${inv.lojasCriticas > 0 ? 'critica' : 'ok'}">
              \${inv.lojasCriticas > 0 ? \`\${inv.lojasCriticas} críticas 🔴\` : '0 críticas 🟢'}
            </span>
          </div>
        </div>
      \`).join('')}
    \`;

    sidebar.querySelectorAll('.investida-card').forEach(card => {
      card.addEventListener('click', () => {
        const invId = card.getAttribute('data-investida');
        if (invId && invId !== state.selectedInvestida) {
          state.selectedInvestida = invId;
          state.selectedCluster = 'TODOS';
          state.selectedLojaExpanded = null;
          recalcularVisaoAtiva();
          renderSidebarInvestidas();
          renderCurrentTab();
        }
      });
    });
  }

  // ════════════════════════════════════════════════════════════════════════════
  // 1. TELA PRINCIPAL (VISÃO EXECUTIVA EM MENOS DE 30 SEGUNDOS)
  // ════════════════════════════════════════════════════════════════════════════
  function renderTelaPrincipalOperacional(container) {
    if (!state.engine) {
      container.innerHTML = \`<div class="panel-card" style="padding:40px; text-align:center;">Carregando motor de cálculo...</div>\`;
      return;
    }

    // Sincroniza a Sidebar lateral
    renderSidebarInvestidas();

    recalcularVisaoAtiva();

    const listaSetores = DimEngine.SETORES_CONFIG || [];
    const setorAtivoCfg = listaSetores.find(s => s.id === state.selectedSetor) || listaSetores[0];
    const quartilAtivoCfg = DimEngine.QUARTIS_CONFIG.find(q => q.id === state.selectedQuartil) || DimEngine.QUARTIS_CONFIG[2];

    const todosItens = state.itens || [];

    // Lojas pertencentes à investida ativa
    const lojasInvestida = state.selectedInvestida === 'TODAS'
      ? todosItens
      : todosItens.filter(i => i.investida === state.selectedInvestida);

    // Clusters da investida ativa
    const clustersDisponiveis = Array.from(new Set(
      lojasInvestida.map(i => i.clusterBandeira || i.cluster).filter(Boolean)
    )).sort();

    // Pipeline de Filtragem da Lista de Lojas
    let lojasFiltradas = [...lojasInvestida];

    if (state.selectedCluster !== 'TODOS') {
      lojasFiltradas = lojasFiltradas.filter(i => (i.clusterBandeira || i.cluster) === state.selectedCluster);
    }

    if (state.selectedStatus !== 'todos') {
      if (state.selectedStatus === 'acima') {
        lojasFiltradas = lojasFiltradas.filter(i => i.statusSimples === 'acima_meta' || i.statusOperacional?.includes('Acima'));
      } else if (state.selectedStatus === 'proximo') {
        lojasFiltradas = lojasFiltradas.filter(i => i.statusSimples === 'proximo_meta' || i.statusOperacional?.includes('Próximo'));
      } else if (state.selectedStatus === 'abaixo') {
        lojasFiltradas = lojasFiltradas.filter(i => i.statusSimples === 'abaixo_meta' || i.statusOperacional?.includes('Abaixo'));
      } else if (state.selectedStatus === 'insuficiente') {
        lojasFiltradas = lojasFiltradas.filter(i => i.statusSimples === 'dados_insuficientes' || i.statusOperacional?.includes('Insuficientes'));
      } else if (state.selectedStatus === 'sem_dim') {
        lojasFiltradas = lojasFiltradas.filter(i => i.statusSimples === 'sem_dimensionamento' || i.statusOperacional?.includes('Sem Dimensionamento'));
      }
    }

    if (state.filtroBusca) {
      const q = state.filtroBusca.toLowerCase().trim();
      lojasFiltradas = lojasFiltradas.filter(i =>
        (i.lojaNome && i.lojaNome.toLowerCase().includes(q)) ||
        (i.numeroLoja && String(i.numeroLoja).includes(q)) ||
        (i.codigoLoja && String(i.codigoLoja).includes(q)) ||
        (i.bandeira && i.bandeira.toLowerCase().includes(q))
      );
    }

    // Totais dos filtros ativos
    const totalVolAtual = lojasFiltradas.reduce((a, b) => a + (b.volAtual || b.volAnterior || 0), 0);
    const totalVolProj = lojasFiltradas.reduce((a, b) => a + (b.volProjetado || 0), 0);
    const totalHcAtual = lojasFiltradas.reduce((a, b) => a + (b.hcAtual || b.hcAnterior || 0), 0);
    const totalHcRec = lojasFiltradas.reduce((a, b) => a + (b.hcRecomendado || 0), 0);
    const prodMediaFiltro = (totalVolAtual > 0 && totalHcAtual > 0) ? (totalVolAtual / (4 * totalHcAtual)) : 0;

    // Estatísticas Operacionais da Visão
    const countTotal = lojasFiltradas.length;
    const countAcima = lojasFiltradas.filter(i => i.statusSimples === 'acima_meta' || i.statusOperacional?.includes('Acima')).length;
    const countProximo = lojasFiltradas.filter(i => i.statusSimples === 'proximo_meta' || i.statusOperacional?.includes('Próximo')).length;
    const countAbaixo = lojasFiltradas.filter(i => i.statusSimples === 'abaixo_meta' || i.statusOperacional?.includes('Abaixo')).length;
    const countInsuf = lojasFiltradas.filter(i => i.statusSimples === 'dados_insuficientes' || i.statusOperacional?.includes('Insuficientes')).length;
    const countSemDim = lojasFiltradas.filter(i => i.statusSimples === 'sem_dimensionamento' || i.statusOperacional?.includes('Sem Dimensionamento')).length;

    // Cálculo da Criticidade dos Setores da Investida Ativa (Chips de Sinalização no Topo)
    const audit = state.engine.calcularAuditoriaLojaCompleta(state.selectedQuartil || 'Q3');
    const lojasAuditInvestida = state.selectedInvestida === 'TODAS'
      ? audit.itens
      : audit.itens.filter(i => i.investida === state.selectedInvestida);

    const setoresSinalizacao = listaSetores.filter(s => s.id !== 'QUADRO_TOTAL').map(s => {
      let abaixo = 0;
      let proximo = 0;
      let acima = 0;
      let totalComSetor = 0;

      lojasAuditInvestida.forEach(l => {
        const itemSetor = (l.detalheSetores || []).find(ds => ds.setorId === s.id);
        if (itemSetor && itemSetor.temSetor) {
          totalComSetor++;
          if (itemSetor.status === 'abaixo_meta' || (itemSetor.statusOperacional && itemSetor.statusOperacional.includes('Abaixo'))) {
            abaixo++;
          } else if (itemSetor.status === 'proximo_meta' || (itemSetor.statusOperacional && itemSetor.statusOperacional.includes('Próximo'))) {
            proximo++;
          } else if (itemSetor.status === 'acima_meta' || (itemSetor.statusOperacional && itemSetor.statusOperacional.includes('Acima'))) {
            acima++;
          }
        }
      });

      let statusSinalizador = '🟢';
      let classeSinalizador = 'badge-status-acima';
      if (totalComSetor > 0) {
        const percAbaixo = abaixo / totalComSetor;
        const percProximo = proximo / totalComSetor;
        if (percAbaixo >= 0.25 || abaixo >= 4) {
          statusSinalizador = '🔴';
          classeSinalizador = 'badge-status-abaixo';
        } else if (percProximo >= 0.25 || percAbaixo >= 0.15) {
          statusSinalizador = '🟡';
          classeSinalizador = 'badge-status-proximo';
        }
      }

      return {
        id: s.id,
        nome: s.nome,
        icone: s.icone || '📦',
        abaixo,
        proximo,
        acima,
        statusSinalizador,
        classeSinalizador
      };
    });

    const setoresCriticosCount = setoresSinalizacao.filter(s => s.statusSinalizador === '🔴').length;

    // Nome amigável da investida para exibição
    const nomeInvestidaAmigavel = state.selectedInvestida === 'TODAS'
      ? 'Rede Consolidada (Todas as Investidas)'
      : (state.selectedInvestida === 'AMG' ? 'Investida Amigão'
      : state.selectedInvestida === 'AVE' ? 'Investida Avenida'
      : state.selectedInvestida === 'BOA' ? 'Investida Boa Supermercados'
      : 'Investida Paraná Supermercados');

    // Dados da Loja Expandida (se houver clique em uma loja)
    let lojaExpandidaObj = null;
    if (state.selectedLojaExpanded) {
      lojaExpandidaObj = audit.itens.find(i => i.lojaNome === state.selectedLojaExpanded);
    }

    container.innerHTML = \`
      \${renderPeriodoBaseBannerHTML()}

      <!-- ─── BREADCRUMB EXECUTIVO DE HIERARQUIA ─── -->
      <div class="exec-breadcrumb">
        <div class="exec-breadcrumb-item \${state.selectedInvestida === 'TODAS' ? 'active' : ''}">
          🏢 <span>\${nomeInvestidaAmigavel}</span>
        </div>
        <span class="exec-breadcrumb-sep">/</span>
        <div class="exec-breadcrumb-item \${state.selectedCluster !== 'TODOS' ? 'active' : ''}">
          🎯 <span>Cluster: \${state.selectedCluster === 'TODOS' ? 'Todos os Clusters' : state.selectedCluster}</span>
        </div>
        \${state.selectedLojaExpanded ? \`
          <span class="exec-breadcrumb-sep">/</span>
          <div class="exec-breadcrumb-item active" style="color:var(--brand-blue-lt);">
            🏬 <span>Loja: \${state.selectedLojaExpanded}</span>
          </div>
        \` : ''}
      </div>

      <!-- ─── TOP KPIS EXECUTIVOS (POWER BI STYLE) ─── -->
      <div class="kpi-exec-container">
        <div class="kpi-exec-box" style="border-left: 3px solid #3b82f6;">
          <div class="kpi-exec-title">
            <span>Lojas Ativas</span>
            <span>🏬</span>
          </div>
          <div class="kpi-exec-value">\${countTotal}</div>
          <div class="kpi-exec-desc">de \${lojasInvestida.length} lojas da regional</div>
        </div>

        <div class="kpi-exec-box" style="border-left: 3px solid #60a5fa;">
          <div class="kpi-exec-title">
            <span>HC Atual Total</span>
            <span>👥</span>
          </div>
          <div class="kpi-exec-value">\${formatNumber(totalHcAtual, 1)}</div>
          <div class="kpi-exec-desc">FTE consolidado (Horas &divide; 220)</div>
        </div>

        <div class="kpi-exec-box" style="border-left: 3px solid #10b981;">
          <div class="kpi-exec-title">
            <span>HC Recomendado</span>
            <span>🎯</span>
          </div>
          <div class="kpi-exec-value" style="color:#34d399;">\${formatInt(totalHcRec)}</div>
          <div class="kpi-exec-desc">Meta operacional \${quartilAtivoCfg.rotulo}</div>
        </div>

        <div class="kpi-exec-box" style="border-left: 3px solid #f59e0b;">
          <div class="kpi-exec-title">
            <span>Produtividade Média</span>
            <span>⚡</span>
          </div>
          <div class="kpi-exec-value" style="color:#fbbf24;">\${prodMediaFiltro > 0 ? formatProd(prodMediaFiltro) : '—'}</div>
          <div class="kpi-exec-desc">Volume apurado &divide; (4 &times; HC)</div>
        </div>

        <div class="kpi-exec-box" style="border-left: 3px solid #f43f5e;">
          <div class="kpi-exec-title">
            <span>Setores Críticos</span>
            <span>🚨</span>
          </div>
          <div class="kpi-exec-value" style="color:#fb7185;">\${setoresCriticosCount}</div>
          <div class="kpi-exec-desc">Setores demandando atenção</div>
        </div>
      </div>

      <!-- ─── BARRA DE SINALIZAÇÃO DE SETORES CRÍTICOS DA INVESTIDA ─── -->
      <div class="critical-sectors-bar">
        <div class="critical-sectors-headline">
          <h4>📍 Criticidade dos Setores na Investida &bull; Clique no setor para alternar foco</h4>
          <span style="font-size:11px; color:var(--text-muted);">
            Ativo agora: <strong style="color:#fff;">\${setorAtivoCfg.nome}</strong>
          </span>
        </div>
        <div class="sector-chips-wrap">
          \${setoresSinalizacao.map(s => \`
            <div class="sector-chip \${state.selectedSetor === s.id ? 'active' : ''}" data-setor-chip="\${s.id}" title="Clique para focar no setor \${s.nome} (\${s.abaixo} lojas abaixo da meta)">
              <span>\${s.icone}</span>
              <span>\${s.nome}</span>
              <span class="sector-chip-badge">\${s.statusSinalizador}</span>
            </div>
          \`).join('')}
        </div>
      </div>

      <!-- ─── VISÃO POR CLUSTER: CARDS DE CLUSTERS DA INVESTIDA ─── -->
      <div class="cluster-cards-section">
        <div class="cluster-section-title">
          <span>🏷️ Clusters da Investida (\${clustersDisponiveis.length})</span>
          \${state.selectedCluster !== 'TODOS' ? \`
            <button id="btn-limpar-cluster" class="btn-corp btn-corp-outline" style="padding:3px 10px; font-size:11px; font-weight:700;">
              ✕ Ver Todos os Clusters (\${lojasInvestida.length} lojas)
            </button>
          \` : ''}
        </div>
        <div class="cluster-cards-grid">
          <div class="cluster-card \${state.selectedCluster === 'TODOS' ? 'active' : ''}" data-cluster-card="TODOS">
            <div class="cluster-card-top">
              <span class="cluster-card-name">Todos os Clusters</span>
              <span style="font-size:12px;">🌐</span>
            </div>
            <div style="font-size:12px; color:var(--text-muted);">\${lojasInvestida.length} lojas na investida</div>
            <div class="cluster-card-stats">
              <span>Status Global</span>
              <span style="color:#34d399; font-weight:700;">\${Math.round((countAcima / (lojasInvestida.length || 1)) * 100)}% aderente</span>
            </div>
          </div>

          \${clustersDisponiveis.map(c => {
            const lojasC = lojasInvestida.filter(i => (i.clusterBandeira || i.cluster) === c);
            const criticasC = lojasC.filter(i => i.statusSimples === 'abaixo_meta' || (i.statusOperacional && i.statusOperacional.includes('Abaixo'))).length;
            const isAtivo = state.selectedCluster === c;

            return \`
              <div class="cluster-card \${isAtivo ? 'active' : ''}" data-cluster-card="\${c}">
                <div class="cluster-card-top">
                  <span class="cluster-card-name">\${c}</span>
                  <span style="font-size:11px; font-weight:700; color:var(--brand-blue-lt);">\${lojasC.length} lojas</span>
                </div>
                <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">
                  \${criticasC > 0 ? \`<span style="color:#fb7185; font-weight:700;">🔴 \${criticasC} em atenção</span>\` : \`<span style="color:#34d399; font-weight:700;">🟢 No padrão</span>\`}
                </div>
                <div class="cluster-card-stats">
                  <span>Meta: \${quartilAtivoCfg.rotulo}</span>
                  <span style="font-weight:700; color:#fff;">Clique p/ filtrar</span>
                </div>
              </div>
            \`;
          }).join('')}
        </div>
      </div>

      <!-- ─── BARRA DE FERRAMENTAS & FILTROS OPERACIONAIS DE LOJAS ─── -->
      <div class="panel-card" style="margin-bottom:16px;">
        <div class="panel-toolbar" style="flex-wrap:wrap; gap:14px; align-items:center;">
          
          <!-- Busca Rápida por Loja -->
          <div style="display:flex; flex-direction:column; gap:4px; flex:1; min-width:240px;">
            <label style="font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase;">🔍 Localizar Loja:</label>
            <input
              type="text"
              id="busca-loja-operacional"
              class="corp-input"
              placeholder="Digite o nome ou número da loja..."
              value="\${state.filtroBusca}"
              style="padding:7px 12px; font-size:13px;"
            />
          </div>

          <!-- Seletor Discreto de Meta (Quartil) -->
          <div style="display:flex; flex-direction:column; gap:4px;">
            <div style="display:flex; align-items:center; gap:6px;">
              <label style="font-size:11px; font-weight:700; color:var(--text-muted); text-transform:uppercase;">Meta do Cluster:</label>
              \${Object.keys(state.lojaQuartilOverrides || {}).length > 0 ? \`
                <button id="btn-limpar-overrides-quartil" class="btn-corp btn-corp-outline" style="padding:2px 6px; font-size:10px; font-weight:700; color:#f59e0b; border-color:rgba(245,158,11,0.5); background-color:rgba(245,158,11,0.12);" title="Restaurar todas as lojas para o quartil geral (\${state.selectedQuartil})">
                  ↺ Restaurar Geral (\${Object.keys(state.lojaQuartilOverrides).length})
                </button>
              \` : ''}
            </div>
            <div style="display:flex; gap:4px;">
              \${DimEngine.QUARTIS_CONFIG.slice(0, 3).map(q => \`
                <button class="btn-corp btn-corp-outline btn-meta-quartil \${state.selectedQuartil === q.id ? 'btn-corp-primary' : ''}" data-quartil="\${q.id}" style="padding:6px 10px; font-size:11px; font-weight:700;" title="\${q.descricao}">
                  \${q.rotulo}
                </button>
              \`).join('')}
            </div>
          </div>
        </div>

        <!-- Pills de Filtro Rápido por Status -->
        <div style="display:flex; gap:8px; align-items:center; margin-top:14px; padding-top:12px; border-top:1px solid rgba(255,255,255,0.06); flex-wrap:wrap;">
          <span style="font-size:11px; font-weight:700; color:var(--text-subtle); text-transform:uppercase;">Status:</span>
          <button class="status-pill \${state.selectedStatus === 'todos' ? 'active' : ''}" data-status-btn="todos">Todas (\${countTotal})</button>
          <button class="status-pill success \${state.selectedStatus === 'acima' ? 'active' : ''}" data-status-btn="acima">🟢 Acima da Meta (\${countAcima})</button>
          <button class="status-pill warning \${state.selectedStatus === 'proximo' ? 'active' : ''}" data-status-btn="proximo">🟡 Próximo da Meta (\${countProximo})</button>
          <button class="status-pill danger \${state.selectedStatus === 'abaixo' ? 'active' : ''}" data-status-btn="abaixo">🔴 Abaixo da Meta (\${countAbaixo})</button>
          \${countInsuf > 0 ? \`<button class="status-pill info \${state.selectedStatus === 'insuficiente' ? 'active' : ''}" data-status-btn="insuficiente">⚠ Dados Insuficientes (\${countInsuf})</button>\` : ''}
          \${countSemDim > 0 ? \`<button class="status-pill neutral \${state.selectedStatus === 'sem_dim' ? 'active' : ''}" data-status-btn="sem_dim">⚪ Sem Dimensionamento (\${countSemDim})</button>\` : ''}
        </div>
      </div>

      <!-- ─── PAINEL DETALHADO EXPANSÍVEL DA LOJA (TODOS OS SETORES) ─── -->
      \${lojaExpandidaObj ? \`
        <div class="store-detail-panel" id="store-detail-active">
          <div class="store-detail-header">
            <div class="store-detail-title-group">
              <h3>
                <span>🏬 \${lojaExpandidaObj.lojaNome}</span>
                <span class="badge-corp badge-cluster" style="font-size:11px;">\${lojaExpandidaObj.clusterBandeira || lojaExpandidaObj.cluster}</span>
                <span class="badge-corp \${lojaExpandidaObj.statusGeralBadgeClasse || 'badge-status-proximo'}" style="font-size:12px;">
                  \${lojaExpandidaObj.statusGeralOperacional || '🟡 Próximo da Meta'}
                </span>
              </h3>
              <p>
                Nº Loja: <strong>\${lojaExpandidaObj.numeroLoja ?? '—'}</strong> &bull; Investida: <strong>\${lojaExpandidaObj.investida}</strong> &bull; Bandeira: <strong>\${lojaExpandidaObj.bandeira || lojaExpandidaObj.investida}</strong> &bull; HC Consolidado: <strong>\${lojaExpandidaObj.hcAtualTotal} FTE Atual</strong> vs <strong>\${lojaExpandidaObj.hcProjetadoTotal} FTE Recomendado</strong>
              </p>
            </div>
            <div class="store-detail-actions">
              <button class="btn-ver-auditoria" id="btn-abrir-auditoria-loja" data-loja="\${lojaExpandidaObj.lojaNome}" data-setor="\${setorAtivoCfg.id}">
                📐 Ver Auditoria e Memória de Cálculo
              </button>
              <button class="btn-corp btn-corp-outline" id="btn-fechar-detalhe-loja" style="padding:7px 12px; font-size:12px;">
                ✕ Fechar Setores
              </button>
            </div>
          </div>

          <div style="overflow-x:auto;">
            <table class="store-sectors-table">
              <thead>
                <tr>
                  <th>Setor</th>
                  <th class="text-right">Volume Atual</th>
                  <th class="text-right">Volume Projetado</th>
                  <th class="text-center">HC Atual</th>
                  <th class="text-center">HC Recomendado</th>
                  <th class="text-right">Produtividade</th>
                  <th class="text-right">Meta do Cluster</th>
                  <th class="text-center" style="min-width:170px;">Status</th>
                  <th class="text-center" style="width:60px;">Auditoria</th>
                </tr>
              </thead>
              <tbody>
                \${(lojaExpandidaObj.detalheSetores || []).map(ds => {
                  const temSetor = ds.temSetor !== false;
                  const temDim = ds.temDimensionamento === true;
                  const temHc = ds.hcAtual !== null && ds.hcAtual > 0;
                  const temVol = ds.volAnterior !== null && ds.volAnterior > 0;

                  let volAtu = 'N/A';
                  let volProj = 'N/A';
                  let hcAtu = 'N/A';
                  let hcRec = 'N/A';
                  let prod = 'N/A';
                  let meta = 'N/A';

                  if (temSetor && temDim) {
                    volAtu = ds.volAnterior ? formatVolume(ds.volAnterior) : '0';
                    volProj = ds.volProjetado ? formatVolume(ds.volProjetado) : '0';
                    hcAtu = ds.hcAtual ? \`\${formatNumber(ds.hcAtual, 1)} FTE\` : '0 FTE';
                    hcRec = ds.hcRecomendado ? \`\${formatInt(ds.hcRecomendado)} FTE\` : '0 FTE';
                    prod = ds.produtividade ? formatProd(ds.produtividade) : '—';
                    meta = ds.metaProdutividade ? formatProd(ds.metaProdutividade) : '—';
                  } else if (temSetor && temHc && !temDim) {
                    volAtu = ds.volAnterior ? formatVolume(ds.volAnterior) : '0';
                    hcAtu = \`\${formatNumber(ds.hcAtual, 1)} FTE\`;
                  }

                  return \`
                    <tr>
                      <td>
                        <strong>\${ds.setorNome}</strong>
                        \${!temSetor ? \`
                          <div class="sector-inexistente-box">
                            A loja \${lojaExpandidaObj.lojaNome} não possui essa seção na base de dados.
                          </div>
                        \` : (!temDim && ds.mensagemObrigatoria ? \`
                          <div class="sector-warning-box">
                            Não foi possível concluir a sugestão deste setor devido à ausência de dados suficientes.
                          </div>
                        \` : '')}
                      </td>
                      <td class="text-right" style="font-weight:600;">\${volAtu}</td>
                      <td class="text-right" style="font-weight:600;">\${volProj}</td>
                      <td class="text-center" style="font-weight:700; color:#fff;">\${hcAtu}</td>
                      <td class="text-center" style="font-weight:800; color:var(--brand-blue-lt);">\${hcRec}</td>
                      <td class="text-right" style="color:#34d399; font-weight:700;">\${prod}</td>
                      <td class="text-right" style="color:var(--brand-blue-lt); font-weight:700;">\${meta}</td>
                      <td class="text-center">
                        <span class="badge-corp \${ds.statusBadgeClasse || 'badge-status-semdim'}" style="font-size:11px; font-weight:700;">
                          \${ds.statusOperacional || '⚪ Sem Dimensionamento'}
                        </span>
                      </td>
                      <td class="text-center">
                        <button class="btn-corp btn-corp-outline btn-ver-memoria" data-loja="\${lojaExpandidaObj.lojaNome}" data-setor="\${ds.setorId}" style="padding:3px 7px; font-size:11px;" title="Ver memória de cálculo do setor \${ds.setorNome}">
                          📋
                        </button>
                      </td>
                    </tr>
                  \`;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      \` : ''}

      <!-- ─── TABELA PRINCIPAL OPERACIONAL (VISÃO EXECUTIVA DE LOJAS) ─── -->
      <div class="panel-card">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; flex-wrap:wrap; gap:8px;">
          <div>
            <h3 style="font-size:15px; font-weight:700; color:#fff;">
              Lojas da Regional &bull; Setor em Foco: <span style="color:var(--brand-blue-lt);">\${setorAtivoCfg.nome}</span>
            </h3>
            <span style="font-size:12px; color:var(--text-muted);">
              Exibindo <strong>\${lojasFiltradas.length}</strong> de \${lojasInvestida.length} lojas &bull; Clique em <strong>Ver Setores</strong> para expandir a loja inteira
            </span>
          </div>
          <div style="font-size:11px; color:var(--text-muted);">
            Meta Geral: <strong>\${quartilAtivoCfg.rotulo}</strong> &bull; Respeita Piso Estrutural
          </div>
        </div>

        <div class="table-container">
          <table class="corp-table">
            <thead>
              <tr>
                <th class="text-center" style="width:65px;">Investida</th>
                <th>Loja</th>
                <th class="text-center" style="width:75px;">Nº Loja</th>
                <th>Cluster</th>
                <th class="text-right">Volume Atual</th>
                <th class="text-right">Volume Projetado</th>
                <th class="text-center">HC Atual</th>
                <th class="text-center">HC Recomendado</th>
                <th class="text-right">Produtividade Atual</th>
                <th class="text-center" style="width:125px;">Quartil</th>
                <th class="text-right">Meta</th>
                <th class="text-center" style="min-width:170px;">Status</th>
                <th class="text-center" style="width:130px;">Ações</th>
              </tr>
            </thead>
            <tbody>
              \${lojasFiltradas.length === 0 ? \`
                <tr>
                  <td colspan="13" class="text-center" style="padding:40px; color:var(--text-muted);">
                    Nenhuma loja encontrada para os filtros selecionados.
                  </td>
                </tr>
              \` : lojasFiltradas.map(l => {
                const temSetor = l.temSetor !== false;
                const temHcValido = temSetor && l.hcAnterior !== null && l.hcAnterior > 0;
                const temVolValido = temSetor && l.volAnterior !== null && l.volAnterior > 0;
                const temDim = l.temDimensionamento === true;

                let volAtuStr = 'N/A';
                let volProjStr = 'N/A';
                let hcAtuStr = 'N/A';
                let hcRecStr = 'N/A';
                let prodStr = 'N/A';
                let metaStr = 'N/A';
                let statusBadge = l.statusOperacional || '⚪ Sem Dimensionamento';
                let badgeClass = l.statusBadgeClasse || 'badge-status-semdim';

                if (temSetor && temDim) {
                  volAtuStr = l.volAtual ? formatVolume(l.volAtual) : '0';
                  volProjStr = l.volProjetado ? formatVolume(l.volProjetado) : '0';
                  hcAtuStr = \`\${formatNumber(l.hcAtual, 1)} FTE\`;
                  hcRecStr = \`\${formatInt(l.hcRecomendado)} FTE\`;
                  prodStr = l.produtividade ? formatProd(l.produtividade) : '—';
                  metaStr = l.metaProdutividade ? formatProd(l.metaProdutividade) : '—';
                } else if (temSetor && temHcValido && !temDim) {
                  volAtuStr = l.volAtual ? formatVolume(l.volAtual) : '0';
                  hcAtuStr = \`\${formatNumber(l.hcAtual, 1)} FTE\`;
                }

                const isExpanded = state.selectedLojaExpanded === l.lojaNome;

                return \`
                  <tr class="\${isExpanded ? 'row-expanded' : ''}">
                    <!-- 1. Investida -->
                    <td class="text-center">
                      <span class="badge-corp badge-investida">\${l.investida}</span>
                    </td>

                    <!-- 2. Loja -->
                    <td>
                      <strong>\${l.lojaNome}</strong>
                      <div style="font-size:11px; color:var(--text-muted); margin-top:2px;">\${l.bandeira || l.coligada}</div>
                    </td>

                    <!-- 3. Número da Loja -->
                    <td class="text-center" style="font-weight:700; color:#fff;">
                      \${l.numeroLoja ?? l.codigoLoja ?? '—'}
                    </td>

                    <!-- 4. Cluster -->
                    <td>
                      <span class="badge-corp badge-cluster" style="font-size:11px;">\${l.clusterBandeira || l.cluster}</span>
                    </td>

                    <!-- 5. Volume Atual -->
                    <td class="text-right" style="font-weight:600;">
                      \${volAtuStr}
                    </td>

                    <!-- 6. Volume Projetado -->
                    <td class="text-right" style="font-weight:600;">
                      \${volProjStr}
                    </td>

                    <!-- 7. HC Atual -->
                    <td class="text-center" style="font-weight:700; color:#fff;">
                      \${hcAtuStr}
                    </td>

                    <!-- 8. HC Recomendado -->
                    <td class="text-center" style="font-weight:800; color:var(--brand-blue-lt); font-size:13px;">
                      \${hcRecStr}
                    </td>

                    <!-- 9. Produtividade Atual -->
                    <td class="text-right" style="color:#34d399; font-weight:700;">
                      \${prodStr}
                    </td>

                    <!-- 10. Quartil Selecionável por Loja -->
                    <td class="text-center">
                      \${temSetor && temHcValido && temVolValido ? \`
                        <div style="display:inline-flex; align-items:center; justify-content:center; gap:4px;">
                          <select class="select-quartil-loja \${l.isQuartilOverride ? 'quartil-override-ativo' : ''}" 
                                  data-loja="\${l.lojaNome}" 
                                  title="\${l.isQuartilOverride ? \`Quartil personalizado para esta loja (\${l.quartilSelecionado})\` : \`Seguindo quartil geral do cluster (\${state.selectedQuartil})\`}">
                            <option value="Q1" \${(l.quartilSelecionado || state.selectedQuartil) === 'Q1' ? 'selected' : ''}>Q1 · 25%</option>
                            <option value="Q2" \${(l.quartilSelecionado || state.selectedQuartil) === 'Q2' ? 'selected' : ''}>Q2 · 50%</option>
                            <option value="Q3" \${(l.quartilSelecionado || state.selectedQuartil) === 'Q3' ? 'selected' : ''}>Q3 · 75%</option>
                          </select>
                          \${l.isQuartilOverride ? \`
                            <button class="btn-reset-quartil-loja" data-loja="\${l.lojaNome}" title="Restaurar esta loja para o quartil geral (\${state.selectedQuartil})">
                              ↺
                            </button>
                          \` : ''}
                        </div>
                      \` : \`<span style="font-size:11px; color:var(--text-muted); opacity:0.5;">—</span>\`}
                    </td>

                    <!-- 11. Meta de Produtividade -->
                    <td class="text-right" style="color:var(--brand-blue-lt); font-weight:700;">
                      \${metaStr}
                    </td>

                    <!-- 12. Status Operacional -->
                    <td class="text-center">
                      <span class="badge-corp \${badgeClass}" style="font-size:11px; font-weight:700;">
                        \${statusBadge}
                      </span>
                    </td>

                    <!-- Ações: Ver Setores da Loja & Memória -->
                    <td class="text-center">
                      <div style="display:inline-flex; align-items:center; gap:4px;">
                        <button class="btn-corp btn-corp-outline btn-expandir-loja" data-loja="\${l.lojaNome}" style="padding:4px 8px; font-size:11px; font-weight:700;" title="Abrir todos os setores desta loja">
                          \${isExpanded ? '▲ Recolher' : '👁‍🗨 Setores'}
                        </button>
                        <button class="btn-corp btn-corp-outline btn-ver-memoria" data-loja="\${l.lojaNome}" data-setor="\${setorAtivoCfg.id}" style="padding:4px 7px; font-size:11px;" title="Ver memória de cálculo do setor \${setorAtivoCfg.nome}">
                          📋
                        </button>
                      </div>
                    </td>
                  </tr>
                \`;
              }).join('')}
            </tbody>
            <tfoot>
              <tr style="background-color:rgba(37,99,235,0.12); font-weight:800; border-top:2px solid var(--brand-blue);">
                <td colspan="4">
                  TOTAL CONSOLIDADO (\${lojasFiltradas.length} LOJAS)
                </td>
                <td class="text-right">\${formatVolume(totalVolAtual)}</td>
                <td class="text-right">\${formatVolume(totalVolProj)}</td>
                <td class="text-center" style="color:#fff;">\${formatNumber(totalHcAtual, 1)} FTE</td>
                <td class="text-center" style="color:var(--brand-blue-lt); font-size:14px;">\${formatInt(totalHcRec)} FTE</td>
                <td class="text-right" style="color:#34d399;">\${prodMediaFiltro > 0 ? formatProd(prodMediaFiltro) : '—'}</td>
                <td class="text-center" style="font-size:11px; color:var(--text-muted); font-weight:600;">—</td>
                <td class="text-right" style="color:var(--brand-blue-lt);">—</td>
                <td class="text-center" style="font-size:11px; color:var(--text-muted);" colspan="2">
                  \${countAcima} acima &bull; \${countProximo} próx. &bull; \${countAbaixo} abaixo
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    \`;

    // Conectar Eventos Executivos
    setupEventosTelaOperacional(container);
  }

  // ─── Eventos da Tela Operacional Executiva ─────────────────────────────────
  function setupEventosTelaOperacional(container) {
    // Chips de Setores no Topo
    container.querySelectorAll('[data-setor-chip]').forEach(chip => {
      chip.addEventListener('click', (e) => {
        const sId = e.currentTarget.getAttribute('data-setor-chip');
        if (sId && sId !== state.selectedSetor) {
          state.selectedSetor = sId;
          recalcularVisaoAtiva();
          renderTelaPrincipalOperacional(container);
        }
      });
    });

    // Cards de Clusters
    container.querySelectorAll('[data-cluster-card]').forEach(card => {
      card.addEventListener('click', (e) => {
        const cVal = e.currentTarget.getAttribute('data-cluster-card');
        state.selectedCluster = (state.selectedCluster === cVal && cVal !== 'TODOS') ? 'TODOS' : cVal;
        renderTelaPrincipalOperacional(container);
      });
    });

    // Botão Limpar Cluster
    const btnLimparClust = container.querySelector('#btn-limpar-cluster');
    if (btnLimparClust) {
      btnLimparClust.addEventListener('click', () => {
        state.selectedCluster = 'TODOS';
        renderTelaPrincipalOperacional(container);
      });
    }

    // Botão Expandir / Recolher Loja (Todos os Setores)
    container.querySelectorAll('.btn-expandir-loja').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const loja = e.currentTarget.getAttribute('data-loja');
        state.selectedLojaExpanded = state.selectedLojaExpanded === loja ? null : loja;
        renderTelaPrincipalOperacional(container);
        if (state.selectedLojaExpanded) {
          const painel = document.getElementById('store-detail-active');
          if (painel) {
            painel.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      });
    });

    // Botão Fechar Detalhe da Loja
    const btnFecharDet = container.querySelector('#btn-fechar-detalhe-loja');
    if (btnFecharDet) {
      btnFecharDet.addEventListener('click', () => {
        state.selectedLojaExpanded = null;
        renderTelaPrincipalOperacional(container);
      });
    }

    // Botão Ver Auditoria da Loja
    const btnAudLoja = container.querySelector('#btn-abrir-auditoria-loja');
    if (btnAudLoja) {
      btnAudLoja.addEventListener('click', (e) => {
        const loja = e.currentTarget.getAttribute('data-loja');
        const setor = e.currentTarget.getAttribute('data-setor') || 'OPERADOR DE CAIXA';
        abrirModalMemoriaCalculo(loja, setor);
      });
    }

    // Seletor de Quartil da Meta Geral
    container.querySelectorAll('.btn-meta-quartil').forEach(btn => {
      btn.addEventListener('click', (e) => {
        state.selectedQuartil = e.currentTarget.getAttribute('data-quartil');
        recalcularVisaoAtiva();
        renderTelaPrincipalOperacional(container);
      });
    });

    // Seletor de Quartil Individual da Loja na Linha da Tabela
    container.querySelectorAll('.select-quartil-loja').forEach(sel => {
      sel.addEventListener('change', (e) => {
        const lojaNome = e.target.getAttribute('data-loja');
        const novoQuartil = e.target.value;
        if (!state.lojaQuartilOverrides) state.lojaQuartilOverrides = {};

        if (novoQuartil === state.selectedQuartil) {
          delete state.lojaQuartilOverrides[lojaNome];
        } else {
          state.lojaQuartilOverrides[lojaNome] = novoQuartil;
        }

        const scrollY = window.scrollY;
        recalcularVisaoAtiva();
        renderTelaPrincipalOperacional(container);
        window.scrollTo(0, scrollY);
      });
    });

    // Botão de Reset Individual de Quartil da Loja
    container.querySelectorAll('.btn-reset-quartil-loja').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const lojaNome = e.currentTarget.getAttribute('data-loja');
        if (state.lojaQuartilOverrides) {
          delete state.lojaQuartilOverrides[lojaNome];
        }
        const scrollY = window.scrollY;
        recalcularVisaoAtiva();
        renderTelaPrincipalOperacional(container);
        window.scrollTo(0, scrollY);
      });
    });

    // Botão de Limpar Todos os Overrides
    const btnLimparOverrides = container.querySelector('#btn-limpar-overrides-quartil');
    if (btnLimparOverrides) {
      btnLimparOverrides.addEventListener('click', () => {
        state.lojaQuartilOverrides = {};
        const scrollY = window.scrollY;
        recalcularVisaoAtiva();
        renderTelaPrincipalOperacional(container);
        window.scrollTo(0, scrollY);
      });
    }

    // Busca Rápida por Loja
    const inpBusca = container.querySelector('#busca-loja-operacional');
    if (inpBusca) {
      inpBusca.addEventListener('input', (e) => {
        state.filtroBusca = e.target.value;
        renderTelaPrincipalOperacional(container);
        const ref = container.querySelector('#busca-loja-operacional');
        if (ref) {
          ref.focus();
          ref.selectionStart = ref.selectionEnd = ref.value.length;
        }
      });
    }

    // Pills de Status
    container.querySelectorAll('[data-status-btn]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        state.selectedStatus = e.currentTarget.getAttribute('data-status-btn');
        renderTelaPrincipalOperacional(container);
      });
    });

    // Botão Ver Memória de Cálculo Individual
    container.querySelectorAll('.btn-ver-memoria').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const loja = e.currentTarget.getAttribute('data-loja');
        const setor = e.currentTarget.getAttribute('data-setor');
        abrirModalMemoriaCalculo(loja, setor);
      });
    });
  }`;

// Localiza o início e fim exatos
const startMarker = '  // ════════════════════════════════════════════════════════════════════════════\n  // 1. TELA PRINCIPAL (VISÃO OPERACIONAL EM MENOS DE 30 SEGUNDOS)';
const endMarker = '  // ════════════════════════════════════════════════════════════════════════════\n  // 2. AUDITORIA DA LOJA INTEIRA (CONSOLIDAÇÃO VIA DIN HC E DIN VOL)';

const startIdx = content.indexOf(startMarker);
const endIdx = content.indexOf(endMarker);

if (startIdx === -1 || endIdx === -1) {
  console.error('Marcadores não encontrados!', { startIdx, endIdx });
  process.exit(1);
}

const before = content.substring(0, startIdx);
const after = content.substring(endIdx);

const updatedContent = before + newExecutiveCode + '\n\n' + after;
fs.writeFileSync(appJsPath, updatedContent, 'utf8');
console.log('js/app.js atualizado com sucesso!');
