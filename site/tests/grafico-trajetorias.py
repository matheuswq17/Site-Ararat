# Gráfico das trajetórias medidas (tests/record-entrada.mjs → trajetorias.json) contra a curva
# 3t²−2t³ de 1000 ms.   python3 tests/grafico-trajetorias.py <pasta com trajetorias.json>
import json, sys
import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt
d = sys.argv[1] if len(sys.argv) > 1 else "screenshots/previa-refinada/entrada"
traj = json.load(open(f"{d}/trajetorias.json"))
fig, ax = plt.subplots(figsize=(9, 5.2), dpi=130)
xs = [i / 100 for i in range(101)]
ax.plot([x * 1000 for x in xs], [3 * x * x - 2 * x ** 3 for x in xs], color="#D4AF37", lw=6, alpha=.35, label="ideal 3t²−2t³ · 1000 ms")
for k, f in traj.items():
    f = [p for p in f if p[0] >= 0]
    if not f: continue
    y0 = f[0][1]; y1 = max(p[1] for p in f)
    if y1 == y0: continue
    t_arr = next((p[0] for p in f if p[1] >= y1), None)
    ax.plot([p[0] for p in f], [(p[1] - y0) / (y1 - y0) for p in f], lw=1.3, label=f"{k} · destino {y1}px · chegada {t_arr} ms")
ax.set_xlim(-30, 1500); ax.set_xlabel("ms desde o clique"); ax.set_ylabel("fração do percurso")
ax.set_title("Entrada na jornada — trajetória durante a gravação de vídeo (Chromium headless)\nquadros espaçados pela gravação: chegada = 1º quadro no destino; duração de referência em tests/navegacao.mjs", fontsize=10)
ax.grid(alpha=.25); ax.legend(fontsize=8, loc="lower right")
fig.tight_layout(); fig.savefig(f"{d}/trajetorias.png"); print("ok")
