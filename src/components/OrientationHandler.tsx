"use client";
import { useEffect } from "react";

export function OrientationHandler() {
  useEffect(() => {
    const handleOrientationChange = () => {
      // Force layout recalculation after orientation change
      document.documentElement.style.height = `${window.innerHeight}px`;
      setTimeout(() => {
        document.documentElement.style.height = "";
      }, 100);
    };

    window.addEventListener("orientationchange", handleOrientationChange);
    window.addEventListener("resize", handleOrientationChange);
    return () => {
      window.removeEventListener("orientationchange", handleOrientationChange);
      window.removeEventListener("resize", handleOrientationChange);
    };
  }, []);
  return null;
}
