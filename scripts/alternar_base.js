/**
 * scripts/alternar_base.js
 * Utilitário seguro para alternar entre a base REAL e a base FICTÍCIA
 * para deploy no Vercel / GitHub sem vazar dados reais.
 * 
 * Uso:
 *   node scripts/alternar_base.js status
 *   node scripts/alternar_base.js ficticio   (prepara para Vercel/GitHub com dados fictícios)
 *   node scripts/alternar_base.js real       (restaura os dados reais)
 */

const fs = require('fs');
const path = require('path');

const DIR_DATA = path.join(__dirname, '..', 'data');
const DIR_REAL = path.join(__dirname, '..', 'data_real');
const DIR_FICTICIO = path.join(__dirname, '..', 'data_ficticio');

const cmd = (process.argv[2] || 'status').toLowerCase();

function copiarArquivos(origem, destino) {
  if (!fs.existsSync(origem)) {
    console.error(`❌ Pasta de origem não encontrada: ${origem}`);
    process.exit(1);
  }
  if (!fs.existsSync(destino)) {
    fs.mkdirSync(destino, { recursive: true });
  }

  const arquivos = fs.readdirSync(origem).filter(f => f.endsWith('.json'));
  for (const arq of arquivos) {
    fs.copyFileSync(path.join(origem, arq), path.join(destino, arq));
  }
  console.log(`✓ ${arquivos.length} arquivos JSON copiados de ${path.basename(origem)}/ para ${path.basename(destino)}/`);
}

function identificarBaseAtual() {
  const configPath = path.join(DIR_DATA, 'config.json');
  if (!fs.existsSync(configPath)) return 'Desconhecida';
  try {
    const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (cfg.isMockData || cfg.ambiente === 'DEMO / VERCEL / GITHUB') {
      return 'FICTÍCIA (Mock / Demonstração Pública)';
    }
    return 'REAL (Produção / Dados Reais)';
  } catch {
    return 'Indefinida';
  }
}

if (cmd === 'status') {
  console.log('=== STATUS DAS BASES DE DADOS ===');
  console.log(`Base ativa em data/: [ ${identificarBaseAtual()} ]`);
  console.log(`Pasta data_real existe? ${fs.existsSync(DIR_REAL) ? 'SIM (Backup real protegido)' : 'NÃO'}`);
  console.log(`Pasta data_ficticio existe? ${fs.existsSync(DIR_FICTICIO) ? 'SIM (Pronta para Vercel)' : 'NÃO'}`);
  console.log('\nComandos disponíveis:');
  console.log('  node scripts/alternar_base.js ficticio  -> Ativa os dados fictícios em data/');
  console.log('  node scripts/alternar_base.js real      -> Restaura os dados reais em data/');
  process.exit(0);
}

if (cmd === 'ficticio' || cmd === 'mock' || cmd === 'demo') {
  console.log('=== ATIVANDO BASE FICTÍCIA PARA VERCEL / GITHUB ===');

  // 1. Garantir backup da base real em data_real antes de qualquer alteração
  const baseAtual = identificarBaseAtual();
  if (baseAtual.includes('REAL')) {
    console.log('Criando backup de segurança da base REAL em data_real/...');
    copiarArquivos(DIR_DATA, DIR_REAL);
  }

  // 2. Copiar os dados fictícios para data/
  console.log('Aplicando dados fictícios em data/...');
  copiarArquivos(DIR_FICTICIO, DIR_DATA);

  console.log('\n🎉 SUCESSO: A pasta data/ agora contém exclusivamente dados fictícios!');
  console.log('👉 Você pode commitar e subir para o GitHub / Vercel com total segurança.');
  console.log('🔒 Seus dados reais estão protegidos na pasta data_real/ (adicione-a ao .gitignore).');
  process.exit(0);
}

if (cmd === 'real' || cmd === 'producao') {
  console.log('=== RESTAURANDO BASE REAL ===');
  if (!fs.existsSync(DIR_REAL)) {
    console.error('❌ A pasta data_real/ não foi encontrada. O backup não pôde ser restaurado.');
    process.exit(1);
  }

  copiarArquivos(DIR_REAL, DIR_DATA);
  console.log('\n🎉 SUCESSO: A base REAL foi restaurada com sucesso em data/!');
  process.exit(0);
}

console.log(`Comando desconhecido: "${cmd}". Use: status | ficticio | real`);
