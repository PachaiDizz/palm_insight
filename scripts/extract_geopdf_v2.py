"""
Extract GeoPDF geospatial metadata from Global Mapper exports.

Usage:
    pip install pypdf
    python scripts/extract_geopdf_v2.py

Global Mapper embeds coordinates in the PDF's internal streams.
This script searches for bounding boxes, coordinate transforms,
and any readable text/numbers in the raw PDF objects.
"""

import re
import sys
import os
import json

def extract_from_pdf(pdf_path):
    results = {"bounding_boxes": [], "coordinate_strings": [], "text_fragments": [], "raw_numbers": []}

    try:
        from pypdf import PdfReader
        reader = PdfReader(pdf_path)

        # Get page dimensions
        for i, page in enumerate(reader.pages):
            try:
                mb = page.mediabox
                results["page_mediabox"] = {
                    "x": float(mb[0]), "y": float(mb[1]),
                    "width": float(mb[2]) - float(mb[0]),
                    "height": float(mb[3]) - float(mb[1]),
                }
            except:
                pass

            # Try to extract any text
            try:
                text = page.extract_text()
                if text and text.strip():
                    results["text_fragments"].append(text.strip()[:2000])
            except:
                pass

            # Walk through page resources for embedded streams
            try:
                if "/Contents" in page:
                    contents = page["/Contents"]
                    if hasattr(contents, "get_object"):
                        obj = contents.get_object()
                        if hasattr(obj, "get_data"):
                            data = obj.get_data()
                            if isinstance(data, bytes):
                                text = data.decode("latin-1", errors="ignore")
                                # Look for coordinate patterns
                                coords = re.findall(r'[-+]?\d+\.\d{4,}', text)
                                if coords:
                                    results["raw_numbers"].extend(coords[:100])
                                # Look for GeoJSON-like structures
                                if "bbox" in text.lower() or "bounds" in text.lower():
                                    results["coordinate_strings"].append(text[:500])
            except:
                pass

        # Walk the entire PDF object tree for geo metadata
        try:
            root = reader.trailer["/Root"]
            if hasattr(root, "get_object"):
                root_obj = root.get_object()
                # Check for MarkInfo, StructTreeRoot, etc.
                for key in root_obj:
                    try:
                        val = root_obj[key]
                        if hasattr(val, "get_object"):
                            val_obj = val.get_object()
                            # Look for bounding box info
                            if "/MediaBox" in str(val_obj) or "/BBox" in str(val_obj):
                                results["bounding_boxes"].append(str(val_obj)[:500])
                    except:
                        pass
        except:
            pass

        # Try to find the piece info (GeoPDF stores geo info here)
        try:
            for page in reader.pages:
                page_obj = page.get_object() if hasattr(page, "get_object") else page
                if "/PieceInfo" in page_obj:
                    piece = page_obj["/PieceInfo"]
                    if hasattr(piece, "get_object"):
                        piece_obj = piece.get_object()
                        results["piece_info"] = str(piece_obj)[:2000]
                if "/LastModified" in page_obj:
                    results["last_modified"] = str(page_obj["/LastModified"])
        except:
            pass

    except Exception as e:
        results["error"] = str(e)

    return results


if __name__ == "__main__":
    pdf_path = r"C:\Users\PachaiDizzer\palm-insight\SAHABAT 5.pdf"

    if not os.path.exists(pdf_path):
        print(f"ERROR: PDF not found at {pdf_path}")
        sys.exit(1)

    print(f"Extracting GeoPDF metadata from: {pdf_path}")
    data = extract_from_pdf(pdf_path)

    output_path = os.path.join(os.path.dirname(__file__), "geopdf_v2_results.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False, default=str)

    print(f"Results saved to: {output_path}")
    print(json.dumps(data, indent=2, default=str))
