import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { readMotionPackage, readMriSource } from "@/lib/motion-manifest.server";
import { BridgeHarness } from "./BridgeHarness";

export const metadata: Metadata = { title: "Teste da ponte de motion", robots: { index: false } };

/**
 * Harness de teste (montar/desmontar a jornada). Só existe quando o build é
 * feito com ARARAT_HARNESS=1; em qualquer outro build responde 404.
 */
export default function BridgeTestPage() {
  if (process.env.ARARAT_HARNESS !== "1") notFound();
  return <BridgeHarness motionPackage={readMotionPackage()} mri={readMriSource()} />;
}
