const fs = require('fs');

const appPath = 'js/app.js';
let code = fs.readFileSync(appPath, 'utf8');

// 1. Adicionar propriedades de estado do chat e exclusão de CDs no início do state
code = code.replace(
  "selectedLojaExpanded: null, // Loja atualmente expandida para visão de todos os setores",
  `selectedLojaExpanded: null, // Loja atualmente expandida para visão de todos os setores
    desconsiderarCDs: true,     // Desconsiderar CDs e hubs de e-commerce
    chatAberto: true,           // Chat de validação de regras aberto por padrão
    chatPergunta: 'Por que a loja 073-STA CATARINA LOJA 02 está sem HC e produtividade?',
    chatResposta: null,`
);

// 2. Pré-carregar a resposta da loja 073 logo após instanciar o engine em loadData
const loadDataPatch = `        recalcularVisaoAtiva();
        if (!state.chatResposta && state.chatPergunta) {
          state.chatResposta = responderChatRegras(state.chatPergunta, state.engine, state);
        }`;

code = code.replace('recalcularVisaoAtiva();\n        renderLoading(false);', loadDataPatch + '\n        renderLoading(false);');

// 3. Inserir o bloco HTML do Chat no topo de renderTelaPrincipalOperacional (antes do BREADCRUMB)
const chatHtml = `      <!-- ─── CHAT DE VALIDAÇÃO DE REGRAS NO TOPO (ASSISTENTE OPERACIONAL) ─── -->
      <div class="rule-chat-panel" id="rule-chat-panel">
        <div class="rule-chat-header" id="rule-chat-header">
          <div class="rule-chat-header-left">
            <span class="rule-chat-header-title">💬 Chat de Validação de Regras &bull; Assistente Operacional</span>
            <span class="rule-chat-badge">Validador Oficial</span>
            <span style="font-size:11px; color:var(--text-muted); margin-left:6px;">(CDs e Mercado Livre desconsiderados)</span>
          </div>
          <button class="rule-chat-toggle-btn" id="btn-toggle-chat" title="Recolher / Expandir Chat">
            \${state.chatAberto !== false ? '▲ Minimizar' : '▼ Expandir'}
          </button>
        </div>

        \${state.chatAberto !== false ? \`
          <div class="rule-chat-body">
            <!-- Linha de Entrada -->
            <div class="rule-chat-input-row">
              <input
                type="text"
                id="input-chat-regra"
                class="rule-chat-input"
                placeholder="Pergunte sobre qualquer loja ou regra (ex: Por que a loja 073 está sem HC?)..."
                value="\${state.chatPergunta || ''}"
              />
              <button class="rule-chat-send-btn" id="btn-enviar-chat">
                <span>Perguntar</span> ➔
              </button>
              \${state.chatResposta ? \`
                <button class="btn-corp btn-corp-outline" id="btn-limpar-chat" style="padding:6px 10px; font-size:11px;">
                  Limpar
                </button>
              \` : ''}
            </div>

            <!-- Chips de Perguntas Rápidas Sugeridas -->
            <div class="rule-chat-suggestions">
              <span style="font-size:10px; color:var(--text-subtle); text-transform:uppercase; font-weight:700; align-self:center;">Exemplos rápidos:</span>
              <button class="rule-chat-chip" data-chat-quick="Por que a loja 073-STA CATARINA LOJA 02 está sem HC e produtividade?">
                ❓ Por que a loja 073 está sem HC?
              </button>
              <button class="rule-chat-chip" data-chat-quick="Quais lojas são CDs e Mercado Livre e por que foram desconsideradas?">
                ❓ Tratamento de CDs e Mercado Livre
              </button>
              <button class="rule-chat-chip" data-chat-quick="Como funciona a regra dos 4 meses móveis?">
                ❓ Regra dos 4 meses móveis
              </button>
              <button class="rule-chat-chip" data-chat-quick="Como é calculada a meta de produtividade do cluster?">
                ❓ Cálculo da Meta do Cluster (P75)
              </button>
            </div>

            <!-- Caixa de Resposta Conversacional -->
            \${state.chatResposta ? \`
              <div class="rule-chat-response">
                <h5>📌 \${state.chatResposta.titulo}</h5>
                <p style="margin-bottom:6px; font-weight:600;">\${state.chatResposta.resumo}</p>
                \${state.chatResposta.meta ? \`
                  <div class="rule-chat-response-meta">
                    \${state.chatResposta.meta.map(m => \`
                      <div>
                        <div class="meta-box-label">\${m.label}</div>
                        <div class="meta-box-val">\${m.valor}</div>
                      </div>
                    \`).join('')}
                  </div>
                \` : ''}
                <div style="font-size:11px; color:var(--text-muted); line-height:1.5;">
                  \${state.chatResposta.explicacao}
                </div>
              </div>
            \` : ''}
          </div>
        \` : ''}
      </div>

`;

code = code.replace(
  '      <!-- ─── BREADCRUMB EXECUTIVO DE HIERARQUIA ─── -->',
  chatHtml + '      <!-- ─── BREADCRUMB EXECUTIVO DE HIERARQUIA ─── -->'
);

// 4. Adicionar listeners do Chat em setupEventosTelaOperacional
const chatListeners = `    // ─── Eventos do Chat de Validação de Regras ───
    const btnToggleChat = container.querySelector('#btn-toggle-chat');
    const headerChat = container.querySelector('#rule-chat-header');
    if (btnToggleChat) {
      btnToggleChat.addEventListener('click', (e) => {
        e.stopPropagation();
        state.chatAberto = state.chatAberto === false;
        renderTelaPrincipalOperacional(container);
      });
    }

    const inpChat = container.querySelector('#input-chat-regra');
    const btnEnviarChat = container.querySelector('#btn-enviar-chat');
    const btnLimparChat = container.querySelector('#btn-limpar-chat');

    function submeterPerguntaChat(pergunta) {
      if (!pergunta || !pergunta.trim()) return;
      state.chatPergunta = pergunta.trim();
      state.chatResposta = responderChatRegras(state.chatPergunta, state.engine, state);
      state.chatAberto = true;
      renderTelaPrincipalOperacional(container);
    }

    if (btnEnviarChat && inpChat) {
      btnEnviarChat.addEventListener('click', () => submeterPerguntaChat(inpChat.value));
      inpChat.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') submeterPerguntaChat(inpChat.value);
      });
    }

    if (btnLimparChat) {
      btnLimparChat.addEventListener('click', () => {
        state.chatPergunta = '';
        state.chatResposta = null;
        renderTelaPrincipalOperacional(container);
      });
    }

    container.querySelectorAll('[data-chat-quick]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const p = e.currentTarget.getAttribute('data-chat-quick');
        submeterPerguntaChat(p);
      });
    });

`;

code = code.replace(
  '  function setupEventosTelaOperacional(container) {',
  '  function setupEventosTelaOperacional(container) {\n' + chatListeners
);

fs.writeFileSync(appPath, code, 'utf8');
console.log('js/app.js atualizado com sucesso com Chat de Validação de Regras e exclusão de CDs!');
