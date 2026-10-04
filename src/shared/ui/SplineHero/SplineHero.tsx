import { createElement, useEffect } from "react";
import type { CSSProperties } from "react";
type Props = { style?: CSSProperties; className?: string; url?: string };
export function SplineHero({ style, className }: Props) {
  useEffect(() => {
    void import("@splinetool/viewer");
  }, []);
  return createElement("spline-viewer", {
    url: `${import.meta.env.BASE_URL}original-external/spline/scene.splinecode`,
    className,
    style: {
      position: "absolute",
      left: "50%",
      top: "52%",
      transform: "translate(-50%, -50%)",
      width: "80vw",
      height: "80vh",
      zIndex: 0,
      pointerEvents: "auto",
      ...style,
    },
    "aria-label": "Original interactive Spline artwork",
  });
}
