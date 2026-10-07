"use client";

import { useState } from "react";
import { Journey } from "@/components/journey/Journey";
import type { MotionPackageInfo } from "@/lib/motion-contract";
import type { MriSource } from "@/lib/mri";

export function BridgeHarness({ motionPackage, mri }: { motionPackage: MotionPackageInfo | null; mri: MriSource }) {
  const [mounted, setMounted] = useState(true);
  return (
    <main>
      <button type="button" id="toggle-journey" onClick={() => setMounted((v) => !v)}>
        {mounted ? "Desmontar jornada" : "Montar jornada"}
      </button>
      {mounted && <Journey motionPackage={motionPackage} mri={mri} />}
    </main>
  );
}
