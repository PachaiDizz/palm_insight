import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { SITE_NAME } from "@/lib/site";

export const runtime = "nodejs";
export const alt = `${SITE_NAME} — Palm Oil Plantation Tracker`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const fontData = await readFile(
    join(process.cwd(), "src/app/fonts/CabinetGrotesk-Bold.woff2")
  );

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          padding: "72px",
          backgroundColor: "#0b0d13",
          backgroundImage:
            "linear-gradient(135deg, #1a1d2b 0%, #0f172a 55%, #241a08 100%)",
          color: "white",
          fontFamily: "CabinetGrotesk",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "14px",
              backgroundColor: "#f59e0b",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "32px",
            }}
          >
            🌴
          </div>
          <div style={{ fontSize: "34px", fontWeight: 700, letterSpacing: "-0.02em" }}>
            PalmInsight
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: "64px",
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              maxWidth: "900px",
            }}
          >
            Track Your Harvest.
            <br />
            Manage Your Teams.
          </div>
          <div style={{ fontSize: "28px", marginTop: "20px", color: "#f59e0b" }}>
            Grow Smarter — Palm Oil Plantation Productivity
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: "CabinetGrotesk", data: fontData, weight: 700, style: "normal" }],
    }
  );
}
