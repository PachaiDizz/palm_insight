"use client";
import { useEffect } from "react";

/**
 * Handles mobile viewport height issues on orientation change.
 * Uses CSS custom property with dvh fallback for mobile browsers.
 */
export function OrientationHandler() {
  useEffect(() => {
    // Set CSS custom property for dynamic viewport height
    const updateViewportHeight = () => {
      if (window.visualViewport) {
        document.documentElement.style.setProperty(
          "--app-height",
          `${window.visualViewport.height}px`
        );
      } else {
        document.documentElement.style.setProperty(
          "--app-height",
          `${window.innerHeight}px`
        );
      }
    };

    updateViewportHeight();

    window.visualViewport?.addEventListener("resize", updateViewportHeight);
    window.addEventListener("orientationchange", () => {
      // Small delay to let browser settle after orientation change
      setTimeout(updateViewportHeight, 150);
    });

    return () => {
      window.visualViewport?.removeEventListener("resize", updateViewportHeight);
    };
  }, []);
  return null;
}
