import type { Metadata } from "next";
import { Scene } from "./Scene";

export const metadata: Metadata = {
  title: "CRT — Raster Run",
  description: "ThreeUI CrtBackground (nintendo variant) rendered on a curved CRT shader.",
};

export default function CrtPage() {
  return <Scene />;
}
