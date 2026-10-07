import { ridgeLines } from "./topo";

const W = 1440;
const H = 300;
const lines = ridgeLines(26, W, H);

/** Paisagem topográfica — assinatura da montanha em linguagem de curvas de nível. */
export function TopoLandscape() {
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMax slice"
      aria-hidden="true"
      focusable="false"
      style={{ display: "block", width: "100%", height: "100%" }}
    >
      {lines.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="#415A77" strokeOpacity={0.18 + (i / lines.length) * 0.4} strokeWidth={1} />
      ))}
      <path
        d={lines[13]}
        fill="none"
        stroke="#D4AF37"
        strokeWidth={1.8}
      />
    </svg>
  );
}
