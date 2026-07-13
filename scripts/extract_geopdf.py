"""
Extract geospatial data from a GeoPDF file (SAHABAT 5.pdf).

Usage:
    python scripts/extract_geopdf.py

Requirements:
    pip install pypdf pdfplumber

This script extracts:
1. Page dimensions and media box
2. Any embedded geospatial metadata (GeoJSON, coordinates, CRS info)
3. Text content (lot names, block numbers, area sizes)
4. Vector path data (potential polygon boundaries)

Output is saved to scripts/geopdf_extracted_data.json
"""

import json
import sys
import os

def extract_geopdf(pdf_path):
    results = {
        "file": pdf_path,
        "pages": [],
        "metadata": {},
        "text_content": [],
        "geospatial_hints": [],
    }

    # --- pypdf extraction ---
    try:
        from pypdf import PdfReader
        reader = PdfReader(pdf_path)
        results["metadata"] = dict(reader.metadata) if reader.metadata else {}
        results["page_count"] = len(reader.pages)

        for i, page in enumerate(reader.pages):
            page_info = {"page": i + 1}

            # Media box (page dimensions)
            if page.mediabox:
                mb = page.mediabox
                page_info["media_box"] = {
                    "x": float(mb.x),
                    "y": float(mb.y),
                    "width": float(mb.width),
                    "height": float(mb.height),
                }

            # Extract text
            text = page.extract_text()
            if text:
                page_info["text"] = text.strip()

            # Check for embedded files / streams with geospatial data
            if "/Names" in page:
                page_info["has_names"] = True

            results["pages"].append(page_info)

        # Check document-level names for geospatial layers
        if "/Names" in reader.trailer.get("/Root", {}):
            results["geospatial_hints"].append("Document has named objects (possible layers)")

    except ImportError:
        results["error"] = "pypdf not installed. Run: pip install pypdf"
    except Exception as e:
        results["pypdf_error"] = str(e)

    # --- pdfplumber extraction (better for tables/coordinates) ---
    try:
        import pdfplumber
        with pdfplumber.open(pdf_path) as pdf:
            for i, page in enumerate(pdf.pages):
                # Extract tables
                tables = page.extract_tables()
                if tables:
                    results["pages"][i]["tables"] = tables

                # Extract words with positions (useful for coordinate detection)
                words = page.extract_words()
                coord_words = []
                for word in words:
                    text = word.get("text", "")
                    # Look for coordinate-like patterns
                    if any(c.isdigit() for c in text):
                        coord_words.append({
                            "text": text,
                            "x": word.get("x0"),
                            "y": word.get("top"),
                        })
                if coord_words:
                    results["pages"][i]["positioned_text"] = coord_words[:50]  # Limit

                # Check for images (GeoPDF often has raster basemaps)
                images = page.images
                if images:
                    results["pages"][i]["image_count"] = len(images)

    except ImportError:
        results["pdfplumber_note"] = "pdfplumber not installed. Run: pip install pdfplumber"
    except Exception as e:
        results["pdfplumber_error"] = str(e)

    return results


if __name__ == "__main__":
    pdf_path = os.path.join(os.path.dirname(__file__), "..", "SAHABAT 5.pdf")
    if not os.path.exists(pdf_path):
        # Try absolute path
        pdf_path = r"C:\Users\PachaiDizzer\palm-insight\SAHABAT 5.pdf"

    if not os.path.exists(pdf_path):
        print(f"ERROR: PDF not found at {pdf_path}")
        sys.exit(1)

    print(f"Extracting data from: {pdf_path}")
    data = extract_geopdf(pdf_path)

    # Save results
    output_path = os.path.join(os.path.dirname(__file__), "geopdf_extracted_data.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False, default=str)

    print(f"\nResults saved to: {output_path}")
    print(f"\nPages found: {data.get('page_count', 'unknown')}")

    # Print text content summary
    for page in data.get("pages", []):
        if page.get("text"):
            print(f"\n--- Page {page['page']} text (first 500 chars) ---")
            print(page["text"][:500])

    print("\nDone!")
