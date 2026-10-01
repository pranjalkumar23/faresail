"use client";

import { CrtBackground } from "@/src/shaders/crt/CrtBackground";
import "@/src/shaders/threeui.css";

export function Scene() {
  return (
    <div className="shader-frame">
      <CrtBackground
        variant="nintendo"
        speed={1.0}
        motion={1.0}
        hue={0}
        saturation={1.0}
        brightness={1.0}
        opacity={1.0}
      />
    </div>
  );
}
