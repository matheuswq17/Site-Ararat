#!/usr/bin/env bash
# Integração da montanha do Motion no fechamento da Ciência (/previa/refinada) — passos mecânicos.
# Uso (na raiz do site): bash scripts/integrar-montanha.sh <pasta-do-pacote-do-Motion> <versão>
#   ex.: bash scripts/integrar-montanha.sh ../motion/proposta/topo-revisao 0.2.0
#
# 1. Copia o pacote SEM ALTERAÇÃO para public/refinada/topo-revisao-<versão>/ (módulo + geometria + README).
# 2. Confere md5 origem × cópia.
# 3. Valida a geometria contra o enquadramento combinado (tests/validar-montanha.mjs).
# O registro em lib/topo-paisagens.ts (import da geometria + VERSAO_PADRAO) e a validação na página real
# (tests/refinada.mjs, tests/comparar-paisagens.mjs, gravações) são feitos em seguida, à mão, conferindo o
# contrato publicado pelo Motion.
set -euo pipefail
ORIG="${1:?pasta do pacote}"
VER="${2:?versão}"
DEST="public/refinada/topo-revisao-$VER"
[ -e "$DEST" ] && { echo "já existe: $DEST (versões publicadas não são sobrescritas)"; exit 1; }
mkdir -p "$DEST"
# módulo do renderer: src/topo-revisao.js (layout da 0.1.0) ou na raiz
MOD=$(ls "$ORIG"/src/topo-revisao*.js "$ORIG"/topo-revisao*.js 2>/dev/null | head -1 || true)
GEO=$(ls "$ORIG"/src/*geometria*.json "$ORIG"/*geometria*.json "$ORIG"/src/*geometry*.json "$ORIG"/*geometry*.json 2>/dev/null | head -1 || true)
[ -n "$MOD" ] || { echo "módulo não encontrado em $ORIG"; exit 1; }
[ -n "$GEO" ] || { echo "geometria (JSON) não encontrada em $ORIG"; exit 1; }
cp -p "$MOD" "$DEST/"
cp -p "$GEO" "$DEST/"
[ -f "$ORIG/README.md" ] && cp -p "$ORIG/README.md" "$DEST/README.md"
for f in "$MOD" "$GEO"; do
  a=$(md5sum < "$f" | cut -d' ' -f1); b=$(md5sum < "$DEST/$(basename "$f")" | cut -d' ' -f1)
  [ "$a" = "$b" ] || { echo "md5 difere: $f"; exit 1; }
  echo "copiado sem alteração: $(basename "$f") $a"
done
node tests/validar-montanha.mjs "$DEST/$(basename "$GEO")" "screenshots/ciencia-montanha/validacao-$VER"
