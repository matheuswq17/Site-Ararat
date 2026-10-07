#!/usr/bin/env python3
"""Cobertura de glifos das fontes das propostas (/previa/a e /previa/b) para o texto real da página.
   python3 tests/glifos.py <texto.txt>   (texto extraído da página; padrão: amostras da DIRECAO)
   Requer fontTools + brotli (WOFF2)."""
import sys, glob, os
from fontTools.ttLib import TTFont

AMOSTRAS = "radiômica próstata tireoide pulmão explicação ç ã õ á é í ó ú â ê ô à Ç Ã Õ É Ó Ú Â Ê 0123456789 · — – → ← ↓ ‘’ “” … % ° ± × − ≥ ≤"
texto = open(sys.argv[1], encoding="utf-8").read() if len(sys.argv) > 1 else AMOSTRAS
chars = sorted({c for c in texto if not c.isspace()})
base = os.path.join(os.path.dirname(__file__), "..", "public", "previa", "tipografia", "fontes")
falhas = 0
for f in sorted(glob.glob(os.path.join(base, "*", "*.woff2"))):
    cmap = TTFont(f).getBestCmap()
    faltam = [c for c in chars if ord(c) not in cmap]
    nome = os.path.relpath(f, base)
    print(f"{nome}: {len(chars) - len(faltam)}/{len(chars)} caracteres" + (f" — faltam: {' '.join(faltam)} ({', '.join(hex(ord(c)) for c in faltam)})" if faltam else ""))
    falhas += bool(faltam)
sys.exit(0)
