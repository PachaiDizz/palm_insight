"""
Convert SAHABAT 5.pdf to PNG for map overlay.

Applies:
  1. Crops to neatline bounds (excludes white PDF margins)
  2. NO flip — PyMuPDF already renders in screen orientation

Usage:
    pip install pymupdf Pillow
    python scripts/convert_pdf_to_png.py

Output: public/maps/sahabat5_map.png
"""

import os
import sys

def convert_pdf_to_png():
    try:
        import fitz  # PyMuPDF
    except ImportError:
        print("ERROR: pymupdf not installed. Run: pip install pymupdf")
        sys.exit(1)

    try:
        from PIL import Image
    except ImportError:
        print("ERROR: Pillow not installed. Run: pip install Pillow")
        sys.exit(1)

    pdf_path = os.path.join(os.path.dirname(__file__), "..", "SAHABAT 5.pdf")
    output_dir = os.path.join(os.path.dirname(__file__), "..", "public", "maps")
    output_path = os.path.join(output_dir, "sahabat5_map.png")

    if not os.path.exists(pdf_path):
        pdf_path = r"C:\Users\PachaiDizzer\palm-insight\SAHABAT 5.pdf"

    if not os.path.exists(pdf_path):
        print(f"ERROR: PDF not found at {pdf_path}")
        sys.exit(1)

    os.makedirs(output_dir, exist_ok=True)

    zoom = 3  # 3x for good quality

    # Neatline in PDF points (excludes white margins)
    neatline_x1 = 54.72   # left
    neatline_y1 = 54.72   # bottom (PDF coords)
    neatline_x2 = 557.28  # right
    neatline_y2 = 737.28  # top (PDF coords)
    page_height = 792      # PDF page height in points

    print(f"Converting: {pdf_path}")
    print(f"Zoom: {zoom}x")
    print(f"Neatline: ({neatline_x1}, {neatline_y1}) → ({neatline_x2}, {neatline_y2})")

    doc = fitz.open(pdf_path)
    page = doc[0]

    # Check page rotation
    rotation = page.rotation
    print(f"Page rotation: {rotation}°")

    # Render at 3x zoom — PyMuPDF handles rotation and Y-axis automatically
    mat = fitz.Matrix(zoom, zoom)
    pix = page.get_pixmap(matrix=mat, alpha=False)

    # Save temporary full image
    temp_path = output_path + ".full.png"
    pix.save(temp_path)
    doc.close()

    # Load with Pillow
    img = Image.open(temp_path)
    w, h = img.size
    print(f"Full render size: {w} x {h} px")

    # NO FLIP — PyMuPDF already renders in screen orientation (Y=0 at top)
    # Crop to neatline bounds using screen-space coordinates
    # PDF bottom (neatline_y1) → screen top, PDF top (neatline_y2) → screen bottom
    crop_left = int(neatline_x1 * zoom)                          # 164
    crop_top = int((page_height - neatline_y2) * zoom)           # 164 (screen top)
    crop_right = int(neatline_x2 * zoom)                         # 1671
    crop_bottom = int((page_height - neatline_y1) * zoom)        # 2212 (screen bottom)

    crop_box = (crop_left, crop_top, crop_right, crop_bottom)
    print(f"Crop box (px): left={crop_box[0]}, top={crop_box[1]}, right={crop_box[2]}, bottom={crop_box[3]}")

    cropped = img.crop(crop_box)
    cropped.save(output_path)

    # Cleanup temp file
    os.remove(temp_path)

    print(f"\nDone! Saved cropped map to {output_path}")
    print(f"Final image size: {cropped.size[0]} x {cropped.size[1]} px")

if __name__ == "__main__":
    convert_pdf_to_png()
