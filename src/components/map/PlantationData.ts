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

// Map zoom settings
export const DEFAULT_MAP_ZOOM = 13;
export const MAX_ZOOM = 18;
export const MIN_ZOOM = 11;

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

// Lot boundaries — populate with real data from the GeoPDF
// Use Global Mapper's Digitizer tool to extract lot polygon coordinates
export const LOT_BOUNDARIES: LotBoundary[] = [
  // Example — replace with real lot data from SAHABAT 5.pdf:
  //
  // {
  //   name: "LOT 747",
  //   block: "04",
  //   coordinates: [
  //     [5.100, 119.080],  // NW corner
  //     [5.100, 119.095],  // NE corner
  //     [5.090, 119.095],  // SE corner
  //     [5.090, 119.080],  // SW corner
  //   ],
  // },
];
