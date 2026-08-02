// Plantation boundary data for SAHABAT 5
// Source: SAHABAT 5.pdf (Global Mapper GeoPDF, WGS84)
//
// Coordinate System: GEODETIC (WGS84), Datum NAR
// Location: Sabah, Malaysia (near Lahad Datu)
//
// Bounds computed from neatline coordinates via CTM transform:
//   CTM: [0.000075792249, 0, 0, 0.000075807892, 119.067071738726, 5.072123187189]
//   Neatline: x1=54.72, y1=54.72 → x2=557.28, y2=737.28 (PDF points)

export interface LotBoundary {
  name: string;
  block: string;
  coordinates: [number, number][]; // [lat, lng] pairs forming a closed polygon
}

// =====================================================================
// ACTUAL IMAGE COORDINATES (extracted from PDF transform matrix)
// =====================================================================

// PDF content stream: "540 0 0 720 36 36 cm" → image at PDF coords (36,36)-(576,756)
// CTM: [0.000075792249, 0, 0, 0.000075807892, 119.067071738726, 5.072123187189]

// Plantation bounds (actual image position in WGS84)
export const PLANTATION_BOUNDS = {
  sw: [5.074852, 119.069800] as [number, number],
  ne: [5.129434, 119.110728] as [number, number],
};

// Center of the plantation (image center)
export const DEFAULT_MAP_CENTER: [number, number] = [
  (5.074852 + 5.129434) / 2,  // 5.102143
  (119.069800 + 119.110728) / 2,  // 119.090264
];

// Map zoom settings — restricted to plantation area only
export const DEFAULT_MAP_ZOOM = 14;
export const MAX_ZOOM = 16;
export const MIN_ZOOM = 14;

// Max bounds — slightly wider than plantation to prevent panning to world view
export const MAX_BOUNDS: [[number, number], [number, number]] = [
  [5.060000, 119.050000],  // SW
  [5.145000, 119.125000],  // NE
];

// PDF overlay image path (extracted plantation map)
export const PDF_OVERLAY_URL = "/maps/sahabat5_map.jpg";

// ImageOverlay bounds — actual image position in WGS84
export const PDF_OVERLAY_BOUNDS: [[number, number], [number, number]] = [
  [5.074852, 119.069800], // SW
  [5.129434, 119.110728], // NE
];

// Mirror a [lat, lng] vertically about the plantation center (top-bottom
// flip) so markers/boundaries stay aligned with the mirrored PDF overlay.
export function flipCoordinate(lat: number, lng: number): [number, number] {
  return [
    2 * DEFAULT_MAP_CENTER[0] - lat,
    lng,
  ];
}

// =====================================================================
// LOT BOUNDARIES
// =====================================================================
//
// CRITICAL: Do NOT guess coordinates. They will be wrong.
//
// The map image is 2209x3000 pixels covering:
//   SW: [5.074852, 119.069800]
//   NE: [5.129434, 119.110728]
//
// To extract REAL lot boundaries, you MUST use GIS software:
//
// Option 1: Global Mapper (Recommended - easiest)
//   1. Download Global Mapper (free trial: https://www.bluemarblegeo.com/products/global-mapper.php)
//   2. File > Open > select SAHABAT 5.pdf
//   3. The PDF will auto-georeference using embedded CTM
//   4. Use Vector > Digitizer Tool to trace each lot polygon
//   5. Right-click polygon > Edit Feature Attributes > set name (e.g., "LOT 747")
//   6. Export: Vector > Export > Export Vector/Lidar Format
//   7. Choose CSV or GeoJSON, WGS84 projection
//   8. Convert exported coordinates to [lat, lng] format
//
// Option 2: QGIS (Free)
//   1. Install QGIS from https://qgis.org
//   2. Layer > Add Layer > Add Raster Layer
//   3. Select SAHABAT 5.pdf (should auto-georeference)
//   4. Use Sketching tools to trace lot polygons
//   5. Export as GeoJSON
//
// Option 3: Manual with pixel coordinates
//   Image pixel (px, py) → WGS84:
//     lng = 0.000075792249 * (36 + px/2209 * 540) + 119.067071738726
//     lat = 0.000075807892 * (756 - py/3000 * 720) + 5.072123187189
//

export const LOT_BOUNDARIES: LotBoundary[] = [
  // Add extracted lot boundaries here
  // Format: { name: "LOT 747", block: "04", coordinates: [[lat, lng], ...] }
];
