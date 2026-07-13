"""
Extract lot boundaries and coordinates from SAHABAT 5.pdf (Global Mapper GeoPDF).

Global Mapper embeds geospatial data in PDF streams using custom operators.
This script uses multiple strategies:
1. PyMuPDF for stream extraction
2. Pattern matching for coordinate data
3. Heuristic detection of polygon boundaries

Usage:
    pip install pymupdf pypdf
    python scripts/extract_lot_boundaries.py

Output: scripts/lot_boundaries.json
"""

import re
import sys
import os
import json
from typing import List, Tuple, Dict, Any

def extract_from_global_mapper_pdf(pdf_path: str) -> Dict[str, Any]:
    """Extract geospatial data from Global Mapper GeoPDF."""
    results = {
        "lot_boundaries": [],
        "coordinate_streams": [],
        "raw_numbers": [],
        "piece_info": None,
        "geo_metadata": {},
        "errors": []
    }

    try:
        import fitz  # PyMuPDF
    except ImportError:
        results["errors"].append("pymupdf not installed")
        return results

    try:
        doc = fitz.open(pdf_path)

        for page_num in range(len(doc)):
            page = doc[page_num]

            # Get page metadata
            results["geo_metadata"]["page_size"] = {
                "width": page.rect.width,
                "height": page.rect.height
            }

            # Extract text content
            try:
                text = page.get_text("text")
                if text:
                    results["geo_metadata"]["text_content"] = text[:5000]

                    # Look for lot/block identifiers
                    lot_patterns = [
                        r'LOT\s+(\d+)',
                        r'BLOCK\s+(\d+)',
                        r'PLU\s+(\d+)',
                        r'(?:Area|Area)\s*[:=]\s*([\d.]+)',
                    ]
                    for pattern in lot_patterns:
                        matches = re.findall(pattern, text, re.IGNORECASE)
                        if matches:
                            results["geo_metadata"][f"found_{pattern.split('(')[0].strip().lower()}"] = matches
            except Exception as e:
                results["errors"].append(f"Text extraction error: {e}")

            # Extract annotations (sometimes contain coordinate data)
            try:
                annots = list(page.annots()) if page.annots() else []
                for annot in annots:
                    try:
                        info = annot.info
                        if info:
                            results["geo_metadata"].setdefault("annotations", []).append({
                                "type": annot.type[0] if annot.type else "unknown",
                                "content": str(info.get("content", ""))[:200]
                            })
                    except:
                        pass
            except Exception as e:
                results["errors"].append(f"Annotation extraction error: {e}")

            # Try to extract XObject streams (Global Mapper stores geo data here)
            try:
                xref = page.xref
                # Get page resources
                resources = page.get_contents()
                for content_xref in resources:
                    try:
                        stream_data = doc.xref_stream(content_xref)
                        if stream_data:
                            # Look for coordinate patterns
                            # Global Mapper often uses CTM (Current Transformation Matrix)
                            # and custom coordinate operators
                            text = stream_data.decode('latin-1', errors='ignore')

                            # Look for CTM matrices
                            ctm_matches = re.findall(r'([\d.e+-]+)\s+([\d.e+-]+)\s+([\d.e+-]+)\s+([\d.e+-]+)\s+([\d.e+-]+)\s+([\d.e+-]+)\s+cm', text)
                            if ctm_matches:
                                results["coordinate_streams"].append({
                                    "type": "CTM",
                                    "values": ctm_matches[:10]
                                })

                            # Look for coordinate sequences (numbers that look like lat/lng)
                            # Sabah area: lat ~5.0-5.2, lng ~119.0-119.2
                            coord_pattern = r'(?:5\.\d{4,6}|119\.\d{4,6})'
                            coords = re.findall(coord_pattern, text)
                            if coords:
                                results["raw_numbers"].extend(coords[:200])

                            # Look for polygon drawing commands
                            # PDF operators: m (moveto), l (lineto), c (curveto), h (close)
                            path_commands = re.findall(r'([0-9.\s]+)\s+[mlc]\s', text)
                            if path_commands:
                                results["coordinate_streams"].append({
                                    "type": "path_commands",
                                    "count": len(path_commands)
                                })
                    except Exception as e:
                        results["errors"].append(f"Stream extraction error on xref {content_xref}: {e}")

            except Exception as e:
                results["errors"].append(f"Content extraction error: {e}")

            # Try to find PieceInfo (GeoPDF standard)
            try:
                page_dict = page.get_contents()
                # Check for GeoPDF metadata in page dictionary
                for key in page.keys():
                    if "PieceInfo" in str(key) or "Geo" in str(key):
                        results["geo_metadata"][str(key)] = str(page[key])[:500]
            except:
                pass

        doc.close()

    except Exception as e:
        results["errors"].append(f"General error: {e}")

    return results


def analyze_lot_patterns(data: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Analyze extracted data to identify potential lot boundaries."""
    lots = []

    # Group raw numbers into potential coordinate pairs
    raw_numbers = data.get("raw_numbers", [])
    if raw_numbers:
        # Filter for coordinates in Sabah region
        sabah_coords = []
        for num_str in raw_numbers:
            try:
                num = float(num_str)
                if 5.0 <= num <= 5.2:  # Latitude range for Sabah
                    sabah_coords.append(("lat", num))
                elif 119.0 <= num <= 119.2:  # Longitude range
                    sabah_coords.append(("lng", num))
            except:
                pass

        # Try to pair them up
        lats = [c[1] for c in sabah_coords if c[0] == "lat"]
        lngs = [c[1] for c in sabah_coords if c[0] == "lng"]

        if lats and lngs:
            # Create a sample lot with the min/max coordinates
            lots.append({
                "name": "EXTRACTED_AREA",
                "block": "00",
                "coordinates": [
                    [min(lats), min(lngs)],
                    [min(lats), max(lngs)],
                    [max(lats), max(lngs)],
                    [max(lats), min(lngs)],
                ],
                "source": "auto_extracted",
                "confidence": "low"
            })

    return lots


if __name__ == "__main__":
    pdf_path = r"C:\Users\PachaiDizzer\palm-insight\SAHABAT 5.pdf"

    if not os.path.exists(pdf_path):
        print(f"ERROR: PDF not found at {pdf_path}")
        sys.exit(1)

    print(f"Extracting lot boundaries from: {pdf_path}")
    print("=" * 60)

    data = extract_from_global_mapper_pdf(pdf_path)

    # Analyze patterns
    lots = analyze_lot_patterns(data)
    data["lot_boundaries"] = lots

    # Save results
    output_path = os.path.join(os.path.dirname(__file__), "lot_boundaries.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False, default=str)

    print(f"Results saved to: {output_path}")
    print("\nSummary:")
    print(f"  - Coordinate streams found: {len(data['coordinate_streams'])}")
    print(f"  - Raw numbers extracted: {len(data['raw_numbers'])}")
    print(f"  - Potential lots identified: {len(data['lot_boundaries'])}")
    print(f"  - Errors: {len(data['errors'])}")

    if data["errors"]:
        print("\nErrors encountered:")
        for err in data["errors"][:5]:
            print(f"  - {err}")

    if data["raw_numbers"]:
        print(f"\nSample raw numbers: {data['raw_numbers'][:20]}")
