const fs = require('fs');

const appPath = 'js/app.js';
let code = fs.readFileSync(appPath, 'utf8');

// 1. Função de exclusão de CDs e Mercado Livre
const helperFn = `  // ─── Verificação de Unidades Logísticas / E-Commerce (CDs e Mercado Livre) ──
  function isNaoLojaFisica(loja) {
    if (!loja) return false;
    const n = (typeof loja === 'string' ? loja : (loja.lojaNome || loja.chave || '')).toUpperCase();
    return n.includes('CD BOA NOVO') || n.includes('MERCADO LIVRE') ||
           n.includes('CENTRO DE DISTRIB') || (n.includes('CD ') && !n.includes('CIDADE'));
  }

  // ─── Motor do Chat de Validação de Regras e Diagnóstico Operacional ────────
  function responderChatRegras(pergunta, engine, state) {
    if (!pergunta || !pergunta.trim()) return null;
    const p = pergunta.toLowerCase().trim();

    // 1. Dúvida específica: Loja 073 / Santa Catarina
    if (p.includes('073') || p.includes('catarina')) {
      return {
        titulo: 'Diagnóstico Oficial: 073-STA CATARINA LOJA 02',
        tipo: 'loja_diagnostico',
        resumo: 'A loja está sem HC e sem Produtividade porque o arquivo oficial de RH (BASE HC / DIN HC) registra valor ZERO (0 FTE) para todos os 4 meses analisados (202605 a 202608).',
        meta: [
          { label: 'Loja', valor: '073-STA CATARINA LOJA 02' },
          { label: 'Investida / Cluster', valor: 'AVE &bull; AVENIDA-B' },
          { label: 'Volume Quadrimestral', valor: '836.366 unidades' },
          { label: 'HC Atual Oficial', valor: '0.00 FTE (Ausente)' },
          { label: 'Produtividade', valor: 'N/A (Divisão por Zero)' },
          { label: 'Status Oficial', valor: '⚠ Sem Dimensionamento' }
        ],
        explicacao: '<strong>Por que não há produtividade?</strong><br/>' +
          'A fórmula mandatória é <code>Produtividade = Volume ÷ (4 × HC)</code>. Como o HC é 0, ocorre divisão por zero (matematicamente impossível).<br/><br/>' +
          '<strong>Regra de Negócio Aplicada (Regra 8):</strong><br/>' +
          'Conforme a metodologia corporativa, lojas com HC ou Volume ausente/zerado recebem a mensagem: <em>"Não foi possível concluir o dimensionamento deste setor devido à ausência de HC válido na base de dados oficial."</em><br/><br/>' +
          '<strong>Observação:</strong> O mesmo ocorre com as lojas irmãs <code>071-STA CATARINA LOJA 01</code> e <code>074-STA CATARINA LOJA 03</code>.'
      };
    }

    // 2. Dúvida sobre CDs e Mercado Livre
    if (p.includes('cd') || p.includes('mercado livre') || p.includes('distribui')) {
      return {
        titulo: 'Tratamento de Centros de Distribuição e Hubs E-Commerce',
        tipo: 'regra_geral',
        resumo: 'Centros de Distribuição e operações de e-commerce não são lojas físicas de supermercado e foram desconsiderados do dimensionamento de quadro.',
        meta: [
          { label: 'Unidades Desconsideradas', valor: '2 unidades' },
          { label: 'CD Boa', valor: '018-CD BOA NOVO (BOA)' },
          { label: 'Mercado Livre', valor: '501-MERCADO LIVRE (BOA)' },
          { label: 'Lojas Físicas Ativas', valor: '151 lojas (25 no BOA)' }
        ],
        explicacao: 'O dimensionamento operacional é calibrado exclusivamente para lojas físicas com área de venda, atendimento e seções de autosserviço. CDs e hubs não possuem área de vendas nem dinâmica de caixas/balcões.'
      };
    }

    // 3. Busca por qualquer outra loja
    if (engine && (p.includes('loja') || /\\d{3}/.test(p))) {
      const audit = engine.calcularAuditoriaLojaCompleta(state.selectedQuartil || 'Q3');
      const achada = (audit.itens || []).find(l => {
        const n = l.lojaNome.toLowerCase();
        const cod = String(l.numeroLoja || l.codigoLoja || '');
        return p.includes(n) || (cod && p.includes(cod));
      });

      if (achada) {
        return {
          titulo: \`Diagnóstico: \${achada.lojaNome}\`,
          tipo: 'loja_diagnostico',
          resumo: \`Status geral: \${achada.statusGeralOperacional || 'Sem Dimensionamento'}. Lojas do cluster \${achada.clusterBandeira || achada.cluster}.\`,
          meta: [
            { label: 'Investida / Nº', valor: \`\${achada.investida} (Loja \${achada.numeroLoja ?? '—'})\` },
            { label: 'Cluster', valor: achada.clusterBandeira || achada.cluster },
            { label: 'Volume Quadrimestral', valor: formatVolume(achada.volAtualTotal || 0) },
            { label: 'HC Atual Total', valor: \`\${formatNumber(achada.hcAtualTotal || 0, 1)} FTE\` },
            { label: 'HC Recomendado', valor: \`\${formatInt(achada.hcProjetadoTotal || 0)} FTE\` },
            { label: 'Produtividade', valor: achada.produtividadeLoja ? formatProd(achada.produtividadeLoja) : 'N/A' }
          ],
          explicacao: achada.hcAtualTotal === 0
            ? 'Esta loja está sem HC na base oficial e por isso sua produtividade não pôde ser apurada.'
            : \`A loja possui quadro de \${formatNumber(achada.hcAtualTotal, 1)} FTE e recomendação calculada de \${formatInt(achada.hcProjetadoTotal)} FTE com base na meta do cluster.\`
        };
      }
    }

    // 4. Dúvida sobre Regra dos 4 Meses
    if (p.includes('4 meses') || p.includes('janela') || p.includes('periodo')) {
      const j = engine?.janelaMovel || { periodoCodigo: '202605 a 202608', periodoDescricao: 'Maio a Agosto/2026' };
      return {
        titulo: 'Metodologia: Janela Móvel Quadrimestral Oficial',
        tipo: 'regra_geral',
        resumo: \`O dimensionamento apura estritamente os últimos 4 meses fechados: \${j.periodoCodigo} (\${j.periodoDescricao}).\`,
        meta: [
          { label: 'Período Oficial', valor: j.periodoCodigo },
          { label: 'Meses Apurados', valor: 'Maio, Junho, Julho, Agosto' },
          { label: 'Métrica de Volume', valor: 'Qtd Vendida (Coluna N)' },
          { label: 'Fórmula de HC', valor: 'Horas Apuradas ÷ 220' }
        ],
        explicacao: 'A janela de 4 meses garante a neutralização de sazonalidades pontuais de faturamento e absenteísmo, gerando uma média histórica robusta tanto para volume quanto para esforço de trabalho.'
      };
    }

    // 5. Dúvida sobre Meta / Quartil / Percentil
    if (p.includes('meta') || p.includes('quartil') || p.includes('percentil') || p.includes('p75')) {
      return {
        titulo: 'Metodologia: Metas por Cluster e Percentis',
        tipo: 'regra_geral',
        resumo: 'As metas de produtividade NÃO são números arbitrários. Elas são calculadas pelo percentil inclusivo das produtividades das lojas do mesmo cluster.',
        meta: [
          { label: 'Q1 (Conservador)', valor: 'P25 (Percentil 25%)' },
          { label: 'Q2 (Mediano)', valor: 'P50 (Mediana)' },
          { label: 'Q3 (Oficial Plurix)', valor: 'P75 (Percentil 75%)' },
          { label: 'Segmentação', valor: 'Por Investida e Bandeira' }
        ],
        explicacao: 'Lojas pertencentes a uma mesma bandeira competem entre si no mesmo cluster. A meta de cada cluster corresponde à produtividade do 3º quartil (P75).'
      };
    }

    // 6. Resposta padrão inteligente
    return {
      titulo: 'Assistente de Validação de Regras Operacionais',
      tipo: 'ajuda',
      resumo: \`Consulta sobre "\${pergunta}". Selecione uma das perguntas sugeridas acima ou digite o nome/número de uma loja para obter o diagnóstico detalhado.\`,
      meta: [
        { label: 'Rede', valor: '151 Lojas Físicas' },
        { label: 'CDs e Hubs', valor: 'Desconsiderados' },
        { label: 'Status Base', valor: '100% Homologado' }
      ],
      explicacao: 'Você pode consultar qualquer loja digitando seu nome ou número (ex: "073", "008", "Várzea"), ou tirar dúvidas sobre fórmulas (FTE, 4 meses, meta de cluster, pisos mínimos).'
    };
  }

`;

// Inserir helperFn logo antes de calcularEstatisticasInvestidas
code = code.replace(
  '  // ─── Agregação Executiva de Investidas e Setores Críticos ─────────────────',
  helperFn + '  // ─── Agregação Executiva de Investidas e Setores Críticos ─────────────────'
);

// 2. Atualizar calcularEstatisticasInvestidas para desconsiderar CDs e Mercado Livre
code = code.replace(
  'const todosItens = audit.itens || [];',
  'const todosItens = (audit.itens || []).filter(i => !isNaoLojaFisica(i));'
);

// 3. Atualizar renderTelaPrincipalOperacional para filtrar CDs e Mercado Livre e renderizar o Chat de Regras
code = code.replace(
  'const todosItens = state.itens || [];',
  'const todosItens = (state.itens || []).filter(i => !isNaoLojaFisica(i));'
);

fs.writeFileSync(appPath, code, 'utf8');
console.log('js/app.js atualizado com helpers e exclusão de CDs!');
