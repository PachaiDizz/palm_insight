#!/usr/bin/env python3
"""
Extract lot boundaries from SAHABAT 5.pdf using OCR.

The PDF is a rasterized image (Global Mapper GeoPDF), so we need OCR
to read the lot labels. This script uses PyMuPDF + Tesseract.

Requirements:
  pip install pymupdf pytesseract Pillow
  Install Tesseract: https://github.com/tesseract-ocr/tesseract

Run: python scripts/extract_lot_boundaries.py

CTM Transformation (PDF → WGS84):
  lng = 0.000075792249 * x_pdf + 119.067071738726
  lat = 0.000075807892 * y_pdf + 5.072123187189
"""

import fitz  # PyMuPDF
import json
import re
import sys
from pathlib import Path

try:
    import pytesseract
    from PIL import Image
    HAS_OCR = True
except ImportError:
    HAS_OCR = False
    print("Warning: pytesseract not installed. Using alternative method.")


# CTM transformation matrix (PDF → WGS84)
CTM_A = 0.000075792249  # x scale
CTM_D = 0.000075807892  # y scale
CTM_E = 119.067071738726  # x offset (longitude)
CTM_F = 5.072123187189  # y offset (latitude)

# PDF image bounds (in PDF points)
PDF_X_MIN = 36
PDF_X_MAX = 576
PDF_Y_MIN = 36
PDF_Y_MAX = 756

# Image dimensions
IMG_WIDTH = 540  # pixels
IMG_HEIGHT = 720  # pixels


def pdf_to_wgs84(x_pdf: float, y_pdf: float) -> tuple[float, float]:
    """Convert PDF coordinates to WGS84 (lat, lng)."""
    lng = CTM_A * x_pdf + CTM_E
    lat = CTM_D * y_pdf + CTM_F
    return (lat, lng)


def pixel_to_wgs84(px: int, py: int) -> tuple[float, float]:
    """Convert image pixel coordinates to WGS84 (lat, lng)."""
    # Map pixel to PDF coords
    x_pdf = PDF_X_MIN + px
    y_pdf = PDF_Y_MAX - py  # PDF y is flipped (increases upward)
    return pdf_to_wgs84(x_pdf, y_pdf)


def extract_with_ocr(pdf_path: str) -> list[dict]:
    """Extract lot labels using OCR."""
    if not HAS_OCR:
        print("ERROR: pytesseract not installed")
        print("Install: pip install pytesseract Pillow")
        print("Also install Tesseract: https://github.com/tesseract-ocr/tesseract")
        return []
    
    doc = fitz.open(pdf_path)
    page = doc[0]
    
    # Render PDF to image at high resolution
    mat = fitz.Matrix(2, 2)  # 2x zoom for better OCR
    pix = page.get_pixmap(matrix=mat)
    
    # Convert to PIL Image
    img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
    
    # Run OCR with lot number detection
    # Use whitelist for lot numbers
    custom_config = r'--oem 3 --psm 6 -c tessedit_char_whitelist=0123456789LOTlot '
    
    print(f"Running OCR on {pix.width}x{pix.height} image...")
    ocr_data = pytesseract.image_to_data(img, config=custom_config, output_type=pytesseract.Output.DICT)
    
    lots = []
    n_boxes = len(ocr_data['text'])
    
    for i in range(n_boxes):
        text = ocr_data['text'][i].strip()
        if not text:
            continue
        
        # Check if this is a LOT label
        lot_match = re.search(r'(?:LOT|lot)\s*(\d+)', text)
        if lot_match:
            lot_num = int(lot_match.group(1))
            
            # Get bounding box in image pixels
            x = ocr_data['left'][i]
            y = ocr_data['top'][i]
            w = ocr_data['width'][i]
            h = ocr_data['height'][i]
            
            # Convert to WGS84
            center_px = x + w // 2
            center_py = y + h // 2
            lat, lng = pixel_to_wgs84(center_px, center_py)
            
            lots.append({
                "lot": f"LOT {lot_num}",
                "lot_num": lot_num,
                "pixel_bbox": [x, y, x + w, y + h],
                "wgs84_center": [lat, lng],
                "confidence": ocr_data['conf'][i]
            })
            print(f"  Found {lot_num} at pixel ({center_px}, {center_py}) → ({lat:.6f}, {lng:.6f})")
    
    doc.close()
    return lots


def extract_with_alternative(pdf_path: str) -> list[dict]:
    """
    Alternative method: Extract lot positions from the JPEG map image
    using the known lot layout from the image analysis.
    
    This method uses the visual layout of lots seen in the map image
    and creates approximate boundaries based on grid positioning.
    """
    print("Using alternative method based on image analysis...")
    print("Note: This creates approximate boundaries.")
    
    # Based on analysis of the map image:
    # - Southern section (LOT 31-80): bottom ~40% of image
    # - Northern section (LOT 689-834): top ~60% of image
    # - Lots are arranged in rows and columns
    
    lots = []
    
    # Helper to create lot at estimated position
    def add_lot(lot_num: int, row: int, col: int, section: str = "north"):
        """Add a lot based on grid position."""
        if section == "south":
            # Southern section: rows 0-8 from bottom, cols 0-10 from left
            base_lat = 5.078  # Bottom of southern section
            base_lng = 119.072  # Left of southern section
            lat_step = 0.0015  # ~150m between rows
            lng_step = 0.0018  # ~180m between cols
            
            lat = base_lat + row * lat_step
            lng = base_lng + col * lng_step
        else:
            # Northern section: rows 0-20 from top, cols 0-15 from left
            base_lat = 5.122  # Top of northern section
            base_lng = 119.085  # Left of northern section
            lat_step = -0.0012  # Going down
            lng_step = 0.0015  # Going right
            
            lat = base_lat + row * lat_step
            lng = base_lng + col * lng_step
        
        lots.append({
            "lot": f"LOT {lot_num}",
            "lot_num": lot_num,
            "wgs84_center": [lat, lng],
            "source": "estimated_grid"
        })
    
    # Southern section lots (LOT 31-80) - approximate grid positions
    # These are arranged roughly in rows from bottom-left
    south_lots = [
        # Row 0 (bottom): 31, 32
        (31, 0, 0), (32, 0, 1),
        # Row 1: 33, 34, 38, 39
        (33, 1, 0), (34, 1, 1), (38, 1, 2), (39, 1, 3),
        # Row 2: 35, 36, 37, 40, 41, 42
        (35, 2, 0), (36, 2, 1), (37, 2, 2), (40, 2, 3), (41, 2, 4), (42, 2, 5),
        # Row 3: 43, 44, 45, 46, 47, 48, 49, 50
        (43, 3, 0), (44, 3, 1), (45, 3, 2), (46, 3, 3),
        (47, 3, 4), (48, 3, 5), (49, 3, 6), (50, 3, 7),
        # Row 4: 51, 52, 53, 54, 55, 56
        (51, 4, 0), (52, 4, 1), (53, 4, 2), (54, 4, 3), (55, 4, 4), (56, 4, 5),
        # Row 5: 57, 58, 59, 60, 61, 62
        (57, 5, 0), (58, 5, 1), (59, 5, 2), (60, 5, 3), (61, 5, 4), (62, 5, 5),
        # Row 6: 63, 64, 65, 66, 67, 68
        (63, 6, 0), (64, 6, 1), (65, 6, 2), (66, 6, 3), (67, 6, 4), (68, 6, 5),
        # Row 7: 69, 70, 71, 72, 73, 74
        (69, 7, 0), (70, 7, 1), (71, 7, 2), (72, 7, 3), (73, 7, 4), (74, 7, 5),
        # Row 8: 75, 76, 77, 78, 79, 80
        (75, 8, 0), (76, 8, 1), (77, 8, 2), (78, 8, 3), (79, 8, 4), (80, 8, 5),
    ]
    
    for lot_num, row, col in south_lots:
        add_lot(lot_num, row, col, "south")
    
    # Northern section lots (LOT 689-834) - approximate grid positions
    # These are arranged in rows from top-right
    north_lots = [
        # Top row (right side): 691, 697, 831
        (691, 0, 10), (697, 0, 11), (831, 0, 12),
        # Row 1: 692, 698, 832
        (692, 1, 10), (698, 1, 11), (832, 1, 12),
        # Row 2: 693, 699, 833
        (693, 2, 10), (699, 2, 11), (833, 2, 12),
        # Row 3: 694, 700, 689
        (694, 3, 10), (700, 3, 11), (689, 3, 12),
        # Row 4: 695, 701, 690
        (695, 4, 10), (701, 4, 11), (690, 4, 12),
        # Row 5: 696
        (696, 5, 12),
        # Row 6: 705, 706, 707
        (705, 6, 7), (706, 6, 8), (707, 6, 9),
        # Row 7: 708, 709
        (708, 7, 8), (709, 7, 9),
        # Row 8: 710, 743
        (710, 8, 8), (743, 8, 9),
        # Row 9: 711, 744
        (711, 9, 8), (744, 9, 9),
        # Row 10: 712, 742, 741
        (712, 10, 8), (742, 10, 9), (741, 10, 10),
        # Row 11: 713, 740
        (713, 11, 8), (740, 11, 10),
        # Row 12: 702, 703
        (702, 12, 8), (703, 12, 9),
        # Row 13: 704
        (704, 13, 9),
        # Row 14: 720, 715
        (720, 14, 9), (715, 14, 10),
        # Row 15: 745, 746
        (745, 15, 7), (746, 15, 8),
        # Row 16: 747, 748
        (747, 16, 7), (748, 16, 8),
        # Row 17: 749, 750
        (749, 17, 8), (750, 17, 9),
        # Row 18: 756, 757, 755, 754
        (756, 18, 5), (757, 18, 6), (755, 18, 7), (754, 18, 8),
        # Row 19: 758, 759, 751
        (758, 19, 5), (759, 19, 6), (751, 19, 8),
        # Row 20: 760, 752, 753
        (760, 20, 5), (752, 20, 7), (753, 20, 8),
        # Row 21: 765, 761, 762, 737
        (765, 21, 4), (761, 21, 5), (762, 21, 6), (737, 21, 9),
        # Row 22: 794, 792, 791, 766, 767, 736
        (794, 22, 2), (792, 22, 3), (791, 22, 4), (766, 22, 5), (767, 22, 6), (736, 22, 9),
        # Row 23: 797, 798, 799, 796, 763, 735
        (797, 23, 1), (798, 23, 2), (799, 23, 3), (796, 23, 4), (763, 23, 5), (735, 23, 8),
        # Row 24: 800, 801, 802, 803, 768, 734
        (800, 24, 1), (801, 24, 2), (802, 24, 3), (803, 24, 4), (768, 24, 6), (734, 24, 8),
        # Row 25: 804, 805, 788, 779, 764, 733
        (804, 25, 1), (805, 25, 2), (788, 25, 4), (779, 25, 5), (764, 25, 6), (733, 25, 8),
        # Row 26: 806, 787, 786, 780, 769, 732
        (806, 26, 1), (787, 26, 3), (786, 26, 4), (780, 26, 5), (769, 26, 6), (732, 26, 8),
        # Row 27: 807, 785, 781, 775, 770, 731
        (807, 27, 1), (785, 27, 3), (781, 27, 4), (775, 27, 5), (770, 27, 6), (731, 27, 8),
        # Row 28: 808, 784, 776, 773, 771
        (808, 28, 2), (784, 28, 3), (776, 28, 4), (773, 28, 5), (771, 28, 6),
        # Row 29: 809, 783, 782, 777, 774
        (809, 29, 2), (783, 29, 3), (782, 29, 4), (777, 29, 5), (774, 29, 6),
        # Row 30: 810, 778
        (810, 30, 2), (778, 30, 5),
        # Additional lots on right side
        (721, 10, 11), (716, 11, 11), (722, 12, 11),
        (717, 13, 11), (723, 14, 11), (718, 15, 11),
        (724, 16, 11), (719, 17, 11), (725, 18, 11),
        (726, 19, 11), (727, 20, 11), (730, 21, 11),
        (729, 22, 11), (728, 23, 11), (834, 24, 11),
        (76, 25, 11), (77, 26, 11), (78, 27, 11), (79, 28, 11),
    ]
    
    for lot_num, row, col in north_lots:
        add_lot(lot_num, row, col, "north")
    
    return lots


def estimate_lot_boundaries(lots: list[dict]) -> list[dict]:
    """Create rectangular boundaries around lot centers."""
    boundaries = []
    
    # Default lot size (in degrees)
    lot_size_lat = 0.0012  # ~130m
    lot_size_lng = 0.0015  # ~165m
    
    for lot in lots:
        lat, lng = lot["wgs84_center"]
        lot_num = lot["lot_num"]
        
        # Determine block based on lot number
        if lot_num >= 689 or lot_num <= 80:
            block = "04" if lot_num >= 689 else "01"
        else:
            block = "04"
        
        # Adjust size for edge lots
        half_lat = lot_size_lat / 2
        half_lng = lot_size_lng / 2
        
        boundary = {
            "name": lot["lot"],
            "block": block,
            "coordinates": [
                [lat + half_lat, lng - half_lng],  # NW
                [lat + half_lat, lng + half_lng],  # NE
                [lat - half_lat, lng + half_lng],  # SE
                [lat - half_lat, lng - half_lng],  # SW
            ]
        }
        boundaries.append(boundary)
    
    return boundaries


def generate_typescript(boundaries: list[dict]) -> str:
    """Generate TypeScript code for LOT_BOUNDARIES."""
    lines = []
    
    for b in boundaries:
        coords = ",\n      ".join(
            f"[{c[0]:.4f}, {c[1]:.4f}]" for c in b["coordinates"]
        )
        lines.append(f"""  {{
    name: "{b['name']}",
    block: "{b['block']}",
    coordinates: [
      {coords}
    ],
  }}""")
    
    return "[\n" + ",\n".join(lines) + "\n];"


def main():
    pdf_path = Path(__file__).parent.parent / "SAHABAT 5.pdf"
    
    if not pdf_path.exists():
        print(f"Error: {pdf_path} not found")
        print("Please place SAHABAT 5.pdf in the project root")
        sys.exit(1)
    
    print(f"Extracting lot boundaries from {pdf_path}...")
    
    # Try OCR first, fall back to alternative method
    lots = []
    if HAS_OCR:
        print("\nAttempting OCR extraction...")
        lots = extract_with_ocr(str(pdf_path))
    
    if not lots:
        print("\nUsing alternative method (image analysis)...")
        lots = extract_with_alternative(str(pdf_path))
    
    print(f"\nFound {len(lots)} lots")
    
    if lots:
        # Sort by lot number
        lots.sort(key=lambda x: x["lot_num"])
        
        # Generate boundaries
        boundaries = estimate_lot_boundaries(lots)
        
        # Save JSON
        json_path = Path(__file__).parent.parent / "lot_boundaries.json"
        with open(json_path, "w") as f:
            json.dump(boundaries, f, indent=2)
        print(f"Saved JSON to {json_path}")
        
        # Generate TypeScript
        ts_code = generate_typescript(boundaries)
        ts_path = Path(__file__).parent.parent / "lot_boundaries.ts"
        with open(ts_path, "w") as f:
            f.write("// Auto-generated from SAHABAT 5.pdf\n")
            f.write("// Run: python scripts/extract_lot_boundaries.py\n\n")
            f.write("export const LOT_BOUNDARIES = ")
            f.write(ts_code)
            f.write("\n")
        print(f"Saved TypeScript to {ts_path}")
        
        # Print summary
        lot_nums = [l["lot_num"] for l in lots]
        print(f"\nLot numbers: {min(lot_nums)}-{max(lot_nums)}")
        print(f"\nFirst 5 lots:")
        for lot in lots[:5]:
            print(f"  {lot['lot']}: ({lot['wgs84_center'][0]:.6f}, {lot['wgs84_center'][1]:.6f})")
        print(f"\nLast 5 lots:")
        for lot in lots[-5:]:
            print(f"  {lot['lot']}: ({lot['wgs84_center'][0]:.6f}, {lot['wgs84_center'][1]:.6f})")
    else:
        print("No lots found!")


if __name__ == "__main__":
    main()
