#!/bin/sh
set -e

echo "=== VALIDACAO FIDELES CONFEITARIA ==="

echo "a) Verificando proibidos (#1f2937, #161922, etc.)..."
git grep -rniE "#1f2937|#161922|#111827|#374151|#0b0d13|bg-(gray|slate|zinc|neutral)-" css/ index.html && { echo "ERRO: Proibidos encontrados!"; exit 1; } || echo "OK: Zero cores/classes proibidas."

echo "b) Verificando fontes proibidas..."
git grep -rniE "fonts\.googleapis|Oswald|Bebas|Barlow|Cormorant|Jakarta|Alex Brush|Agbalumo|\bInter\b|Poppins|Montserrat|Arial|Roboto" css/ index.html && { echo "ERRO: Fontes proibidas encontradas!"; exit 1; } || echo "OK: Zero fontes proibidas."

echo "c) Verificando tags/pills na hero e tag-badge..."
node -e "
const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
if ((html.match(/tag-badge/g) || []).length > 0) { console.error('ERRO: tag-badge encontrado!'); process.exit(1); }
const idx = html.indexOf('hero-section');
const snippet = html.substring(idx, idx + 1800);
if (/\b(badge|pill|chip|selo)\b/i.test(snippet)) { console.error('ERRO: Pill/badge/selo na hero!'); process.exit(1); }
console.log('OK: Zero tag-badge e zero pill/selo na hero.');
"

echo "d) Verificando WhatsApp..."
node -e "
const fs = require('fs');
const html = fs.readFileSync('index.html', 'utf8');
const nums = Array.from(new Set(html.match(/wa\.me\/[0-9]+/g)));
if (nums.length !== 1 || nums[0] !== 'wa.me/5531973113229') { console.error('ERRO WhatsApp:', nums); process.exit(1); }
if ((html.match(/whatsapp-float-btn/g) || []).length < 1) { console.error('ERRO: Botao flutuante ausente!'); process.exit(1); }
console.log('OK: WhatsApp wa.me/5531973113229 preservado e botao flutuante presente.');
"

echo "e) Verificando UTF-8 e caminhos locais..."
node -e "
const fs = require('fs');
['index.html', 'css/main.css', 'js/main.js'].forEach(f => {
  const c = fs.readFileSync(f, 'utf8');
  if (c.includes('\uFFFD')) { console.error('ERRO UTF-8 em ' + f); process.exit(1); }
  if (/C:\\\\Users|file:\/\/\//i.test(c)) { console.error('ERRO: Caminho local em ' + f); process.exit(1); }
});
console.log('OK: UTF-8 integro e zero caminhos locais.');
"

echo "f) Verificando sintaxe JS..."
node --check js/main.js
node --check js/three-hero.js
node --check js/gallery3d.js
echo "OK: Sintaxe JS 100% valida."

echo "g) Verificando motor de scroll e lacos continuos..."
node -e "
const fs = require('fs');
let locoCount = 0;
fs.readdirSync('js').filter(f => f.endsWith('.js')).forEach(f => {
  locoCount += (fs.readFileSync('js/' + f, 'utf8').match(/new LocomotiveScroll/g) || []).length;
});
if (locoCount !== 1) { console.error('ERRO: LocomotiveScroll count = ' + locoCount); process.exit(1); }

const css = fs.readFileSync('css/main.css', 'utf8');
const loops = (css.match(/animation:[^;]*infinite/g) || []).length;
if (loops > 3) { console.error('ERRO: Mais de 3 lacos infinitos no CSS: ' + loops); process.exit(1); }
console.log('OK: 1 motor de scroll (Locomotive) e ' + loops + ' lacos continuos no CSS.');
"

echo "=== TODAS AS VERIFICACOES PASSARAM COM SUCESSO ==="
