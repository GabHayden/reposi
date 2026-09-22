const fs = require('fs');

const appPath = 'js/app.js';
let content = fs.readFileSync(appPath, 'utf8');

// 1. Chamar setupThemeToggle no init()
content = content.replace(
  'setupUploadExcel();',
  'setupUploadExcel();\n    setupThemeToggle();'
);

// 2. Adicionar a função setupThemeToggle logo antes de setupTabNavigation
const themeFn = `  // ─── Alternador de Tema: Claro (Boa - Principal) & Escuro ──────────────────
  function setupThemeToggle() {
    const btn = document.getElementById('btn-toggle-theme');
    const icon = document.getElementById('theme-toggle-icon');
    const text = document.getElementById('theme-toggle-text');

    // O tema principal e padrão é 'light' (Boa Supermercados)
    const savedTheme = localStorage.getItem('plurix_theme') || 'light';

    function applyTheme(theme) {
      if (theme === 'dark') {
        document.body.classList.add('theme-dark');
        document.body.classList.remove('theme-light');
        if (icon) icon.textContent = '☀️';
        if (text) text.textContent = 'Modo Claro (Boa)';
      } else {
        document.body.classList.remove('theme-dark');
        document.body.classList.add('theme-light');
        if (icon) icon.textContent = '🌙';
        if (text) text.textContent = 'Modo Escuro';
      }
      localStorage.setItem('plurix_theme', theme);
    }

    applyTheme(savedTheme);

    if (btn) {
      btn.addEventListener('click', () => {
        const isDark = document.body.classList.contains('theme-dark');
        applyTheme(isDark ? 'light' : 'dark');
      });
    }
  }

`;

content = content.replace('  // ─── Navegação de Abas Superiores ──────────────────────────────────────────', themeFn + '  // ─── Navegação de Abas Superiores ──────────────────────────────────────────');

fs.writeFileSync(appPath, content, 'utf8');
console.log('js/app.js atualizado com setupThemeToggle!');
